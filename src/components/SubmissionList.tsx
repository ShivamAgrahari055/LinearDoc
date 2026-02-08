"use client";

import { SubmissionData, deleteSubmission, deleteSubmissionsBySubject } from "@/services/firestore";
import { Download, FileText, User, CheckCircle, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { deleteFileFromS3 } from "@/app/actions/storage";
import clsx from "clsx";

interface SubmissionListProps {
    submissions: SubmissionData[];
    onRefresh: () => void;
    subjectId: string;
}

export default function SubmissionList({ submissions, onRefresh, subjectId }: SubmissionListProps) {
    const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("downloadedSubmissions");
        if (stored) {
            setDownloadedIds(JSON.parse(stored));
        }
    }, []);

    const markAsDownloaded = (id: string) => {
        if (!downloadedIds.includes(id)) {
            const updated = [...downloadedIds, id];
            setDownloadedIds(updated);
            localStorage.setItem("downloadedSubmissions", JSON.stringify(updated));
        }
    };

    const handleDelete = async (submission: SubmissionData) => {
        if (!confirm(`Delete submission from ${submission.studentName}?`)) return;
        if (!submission.id || !submission.s3Key) return;

        setDeletingId(submission.id);
        try {
            await deleteFileFromS3(submission.s3Key);
            await deleteSubmission(submission.id);
            onRefresh();
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete submission");
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm("Are you sure you want to delete ALL submissions for this subject? This cannot be undone.")) return;

        setIsDeletingAll(true);
        try {
            // 1. Delete all files from S3 first
            // We do this individually because S3 batch delete is not implemented in our current helper
            const s3Promises = submissions.map(s => s.s3Key ? deleteFileFromS3(s.s3Key) : Promise.resolve());
            await Promise.all(s3Promises);

            // 2. Delete all records from Firestore
            await deleteSubmissionsBySubject(subjectId);
            onRefresh();
        } catch (error) {
            console.error("Failed to delete all", error);
            alert("Failed to delete all submissions");
        } finally {
            setIsDeletingAll(false);
        }
    };

    if (submissions.length === 0) {
        return <div className="text-center py-8 text-gray-500">No assignments submitted yet.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button
                    onClick={handleDeleteAll}
                    disabled={isDeletingAll}
                    className="flex items-center text-xs font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                >
                    {isDeletingAll ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    Remove All Submissions
                </button>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student Details
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                File
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Submitted At
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map((submission) => {
                            const isDownloaded = submission.id && downloadedIds.includes(submission.id);
                            return (
                                <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center">
                                                <User className="h-4 w-4 text-gray-500" />
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">{submission.studentName}</div>
                                                <div className="text-xs text-gray-500 font-mono uppercase">{submission.registrationNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                            <span className="text-sm text-gray-900 truncate max-w-[150px] sm:max-w-xs flex items-center">
                                                {submission.fileName}
                                                {isDownloaded && <CheckCircle className="h-3 w-3 text-green-500 ml-2" aria-label="Downloaded" />}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                        {submission.submittedAt ? new Date(submission.submittedAt.seconds * 1000).toLocaleString() : 'Just now'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-3">
                                            <a
                                                href={submission.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => submission.id && markAsDownloaded(submission.id)}
                                                className={clsx(
                                                    "flex items-center transition-colors text-xs font-medium",
                                                    isDownloaded ? "text-green-600 hover:text-green-800" : "text-blue-600 hover:text-blue-800"
                                                )}
                                            >
                                                {isDownloaded ? (
                                                    <>
                                                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Open
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="h-3.5 w-3.5 mr-1" /> Download
                                                    </>
                                                )}
                                            </a>
                                            <button
                                                onClick={() => handleDelete(submission)}
                                                disabled={deletingId === submission.id}
                                                className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                title="Delete"
                                            >
                                                {deletingId === submission.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
