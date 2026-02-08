"use client";

import Link from "next/link";
import { Subject } from "@/services/firestore";

interface SubjectCardProps {
    subject: Subject;
    isAdmin?: boolean;
    onDelete?: (id: string) => void;
}

export default function SubjectCard({ subject, isAdmin, onDelete }: SubjectCardProps) {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 truncate">
                    {subject.name}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Code: {subject.code}
                </p>
                <div className="mt-4 flex space-x-3">
                    <Link
                        href={`/subjects/${subject.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none"
                    >
                        View Resources
                    </Link>
                    {isAdmin && onDelete && subject.id && (
                        <button
                            onClick={() => onDelete(subject.id!)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
