"use client";

import { useState } from "react";
import { getPresignedUploadUrl } from "@/app/actions/storage";
import { addSubmission } from "@/services/firestore";
import { useAuth } from "@/context/AuthContext";

interface AssignmentUploaderProps {
    subjectId: string;
    onUploadComplete: () => void;
    awsConfig: { bucket: string; region: string };
}

export default function AssignmentUploader({ subjectId, onUploadComplete, awsConfig }: AssignmentUploaderProps) {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [studentName, setStudentName] = useState("");
    const [regNo, setRegNo] = useState("");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !user) return;

        setUploading(true);
        setError("");
        setSuccess(false);

        try {
            // 1. Get Presigned URL
            // Folder structure: submissions/{subjectId}/{regNo}-{filename}
            const fileKey = `submissions/${subjectId}/${regNo}-${Date.now()}-${file.name}`;
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
                const errorText = await uploadRes.text().catch(() => "");
                throw new Error(`Failed to upload file to storage: ${uploadRes.status} ${uploadRes.statusText} ${errorText}`);
            }

            // 3. Save Metadata to Firestore
            const bucketName = awsConfig.bucket;
            const region = awsConfig.region;
            const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;

            await addSubmission({
                subjectId,
                studentId: user.uid,
                studentName,
                registrationNumber: regNo,
                fileUrl: publicUrl,
                s3Key: fileKey,
                fileName: file.name,
            });

            setFile(null);
            setStudentName("");
            setRegNo("");
            setSuccess(true);
            onUploadComplete();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mt-6 p-6 border rounded-lg bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Submit Assignment</h3>
            <form onSubmit={handleUpload} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                    <input
                        type="text"
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Assignment File</label>
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="mt-1 block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                        required
                    />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}
                {success && <p className="text-green-600 text-sm">Assignment submitted successfully!</p>}

                <button
                    type="submit"
                    disabled={!file || uploading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {uploading ? "Submitting..." : "Submit Assignment"}
                </button>
            </form>
        </div>
    );
}
