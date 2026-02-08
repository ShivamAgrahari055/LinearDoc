"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    getDocumentsBySubject,
    getSubmissionsBySubject,
    DocumentData,
    SubmissionData
} from "@/services/firestore";
import FileUploader from "@/components/FileUploader";
import DocumentList from "@/components/DocumentList";
import AssignmentUploader from "@/components/AssignmentUploader";
import SubmissionList from "@/components/SubmissionList";
import clsx from "clsx";

interface Subject {
    id: string;
    name: string;
    code: string;
}

interface SubjectDetailClientProps {
    id: string;
    awsConfig: { bucket: string; region: string };
}

export default function SubjectDetailClient({ id, awsConfig }: SubjectDetailClientProps) {
    const { user } = useAuth();

    const [subject, setSubject] = useState<Subject | null>(null);
    const [documents, setDocuments] = useState<DocumentData[]>([]);
    const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
    const [activeTab, setActiveTab] = useState<'notes' | 'assignments' | 'practical' | 'submit' | 'submissions'>('notes');
    const [loading, setLoading] = useState(true);

    const fetchSubject = async () => {
        if (!id || !db) return;
        try {
            const docRef = doc(db, "subjects", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSubject({ id: docSnap.id, ...docSnap.data() } as Subject);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchDocuments = async () => {
        if (!id || !db) return;
        try {
            const docs = await getDocumentsBySubject(id);
            setDocuments(docs);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSubmissions = async () => {
        if (!id || user?.role !== 'admin' || !db) return;
        try {
            const subs = await getSubmissionsBySubject(id);
            setSubmissions(subs);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        const promises = [fetchSubject(), fetchDocuments()];
        if (user?.role === 'admin') {
            promises.push(fetchSubmissions());
        }
        Promise.all(promises).finally(() => setLoading(false));
    }, [id, user]);

    const filteredDocs = documents.filter(d => d.section === activeTab);
    const isAdmin = user?.role === 'admin';

    // Tabs configuration
    const tabs = ['notes', 'assignments', 'practical'];
    if (isAdmin) {
        tabs.push('submissions');
    } else {
        tabs.push('submit');
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!subject) {
        return (
            <main className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">Subject not found.</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
                    <p className="text-gray-500">{subject.code}</p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={clsx(
                                    activeTab === tab
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                                    "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize"
                                )}
                            >
                                {tab === 'submit' ? 'Submit Assignment' : tab === 'submissions' ? 'View Submissions' : tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-900 capitalize">
                            {activeTab === 'submit' ? 'Submit Assignment' : activeTab === 'submissions' ? 'Submitted Assignments' : activeTab}
                        </h2>
                    </div>

                    {/* Standard Sections */}
                    {(activeTab === 'notes' || activeTab === 'assignments' || activeTab === 'practical') && (
                        <>
                            {isAdmin && (
                                <div className="mb-6">
                                    <FileUploader
                                        subjectId={id}
                                        section={activeTab}
                                        onUploadComplete={fetchDocuments}
                                        awsConfig={awsConfig}
                                    />
                                </div>
                            )}
                            <DocumentList
                                documents={filteredDocs}
                                isAdmin={isAdmin}
                                onRefresh={fetchDocuments}
                                awsConfig={awsConfig}
                            />
                        </>
                    )}

                    {/* Submit Assignment Tab (Student) */}
                    {activeTab === 'submit' && (
                        <AssignmentUploader
                            subjectId={id}
                            onUploadComplete={() => alert("Assignment Submitted Successfully!")}
                            awsConfig={awsConfig}
                        />
                    )}

                    {/* View Submissions Tab (Admin) */}
                    {activeTab === 'submissions' && isAdmin && (
                        <SubmissionList
                            submissions={submissions}
                            onRefresh={fetchSubmissions}
                            subjectId={id}
                        />
                    )}
                </div>

            </div>
        </main>
    );
}
