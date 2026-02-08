"use client";

import { useState } from "react";
import { getPresignedUploadUrl } from "@/app/actions/storage";
import { addDocument } from "@/services/firestore";

interface FileUploaderProps {
    subjectId: string;
    section: 'notes' | 'assignments' | 'practical';
    onUploadComplete: () => void;
    awsConfig: { bucket: string; region: string };
}

export default function FileUploader({ subjectId, section, onUploadComplete, awsConfig }: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            // 1. Get Presigned URL
            const fileKey = `documents/${subjectId}/${section}/${Date.now()}-${file.name}`;
            const presignedData = await getPresignedUploadUrl(fileKey, file.type);

            if (!presignedData.success || !presignedData.url) {
                throw new Error(presignedData.error || "Failed to get upload URL");
            }

            // 2. Upload to S3
            const uploadRes = await fetch(presignedData.url, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            if (!uploadRes.ok) {
                console.error("Upload response:", uploadRes.status, uploadRes.statusText);
                // Sometimes S3 returns XML error details
                const errorText = await uploadRes.text().catch(() => "");
                throw new Error(`Failed to upload file to storage: ${uploadRes.status} ${uploadRes.statusText} ${errorText}`);
            }

            // 3. Save Metadata to Firestore
            const bucketName = awsConfig.bucket;
            const region = awsConfig.region;
            const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;

            await addDocument({
                subjectId,
                section,
                title: file.name,
                s3Key: fileKey,
                fileUrl: publicUrl,
                mimeType: file.type,
                size: file.size,
                uploadedBy: "admin", // Should get from context, but only admin uses this
            });

            setFile(null);
            onUploadComplete();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mt-4 p-4 border rounded-md bg-gray-50">
            <h4 className="text-sm font-bold mb-2">Upload New Document</h4>
            <form onSubmit={handleUpload}>
                <div className="mb-2">
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
                <button
                    type="submit"
                    disabled={!file || uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                >
                    {uploading ? "Uploading..." : "Upload"}
                </button>
            </form>
        </div>
    );
}
