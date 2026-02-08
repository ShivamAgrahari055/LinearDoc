"use client";

import { DocumentData, deleteDocument } from "@/services/firestore";
import { deleteFileFromS3 } from "@/app/actions/storage";
import { Trash2, Download, FileText, Loader2, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";

interface DocumentListProps {
    documents: DocumentData[];
    isAdmin: boolean;
    onRefresh: () => void;
    awsConfig: { bucket: string; region: string };
}

export default function DocumentList({ documents, isAdmin, onRefresh, awsConfig }: DocumentListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadedIds, setDownloadedIds] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("downloadedDocs");
        if (stored) {
            setDownloadedIds(JSON.parse(stored));
        }
    }, []);

    const markAsDownloaded = (id: string) => {
        if (!downloadedIds.includes(id)) {
            const updated = [...downloadedIds, id];
            setDownloadedIds(updated);
            localStorage.setItem("downloadedDocs", JSON.stringify(updated));
        }
    };

    const handleDelete = async (doc: DocumentData) => {
        if (!confirm(`Delete ${doc.title}?`)) return;
        if (!doc.id) return;

        setDeletingId(doc.id);
        try {
            await deleteFileFromS3(doc.s3Key);
            await deleteDocument(doc.id);
            onRefresh(); // Trigger parent refresh
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete document");
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = (doc: DocumentData) => {
        let downloadUrl = doc.fileUrl;

        // Critical Fix: If the stored URL is broken...
        if (!downloadUrl || downloadUrl.includes("undefined.s3") || downloadUrl.includes("s3.undefined")) {
            const bucket = awsConfig.bucket;
            const region = awsConfig.region;
            if (bucket && region && doc.s3Key) {
                downloadUrl = `https://${bucket}.s3.${region}.amazonaws.com/${doc.s3Key}`;
            }
        }

        if (downloadUrl) {
            if (doc.id) markAsDownloaded(doc.id);
            window.open(downloadUrl, '_blank');
        } else {
            alert("File URL configuration missing.");
        }
    };

    return (
        <ul className="divide-y divide-gray-200">
            {documents.map((doc) => {
                const isDownloaded = doc.id && downloadedIds.includes(doc.id);
                return (
                    <li key={doc.id} className="py-4 flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                            <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                            <div className="truncate">
                                <p className="text-sm font-medium text-gray-900 truncate flex items-center">
                                    {doc.title}
                                    {isDownloaded && <CheckCircle className="h-4 w-4 text-green-500 ml-2" aria-label="Downloaded" />}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} • {doc.createdAt ? new Date(doc.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                            <button
                                onClick={() => handleDownload(doc)}
                                disabled={downloadingId === doc.id}
                                className={clsx(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center",
                                    isDownloaded
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                )}
                                title={isDownloaded ? "Open File" : "Download File"}
                            >
                                {downloadingId === doc.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isDownloaded ? (
                                    <>Open</>
                                ) : (
                                    <>
                                        <Download className="h-4 w-4 mr-1" /> Download
                                    </>
                                )}
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => handleDelete(doc)}
                                    disabled={deletingId === doc.id}
                                    className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50"
                                    title="Delete"
                                >
                                    {deletingId === doc.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                </button>
                            )}
                        </div>
                    </li>
                );
            })}
            {documents.length === 0 && (
                <li className="py-4 text-center text-sm text-gray-500">No documents in this section.</li>
            )}
        </ul>
    );
}
