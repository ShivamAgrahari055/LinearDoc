"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import SubjectCard from "@/components/SubjectCard";
import { addSubject, getSubjects, deleteSubject, Subject } from "@/services/firestore";

export default function AdminSubjects() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [newCode, setNewCode] = useState("");
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const data = await getSubjects();
            setSubjects(data);
        } catch (error) {
            console.error("Failed to fetch subjects", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newCode) return;
        setCreating(true);
        try {
            await addSubject(newName, newCode);
            setNewName("");
            setNewCode("");
            fetchSubjects(); // Refresh list
        } catch (error) {
            console.error("Failed to create subject", error);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this subject and all its documents?")) return;
        // Note: This only deletes the subject doc, dealing with orphaned documents is a separate concern (or use batch delete)
        // Ideally we should delete all sub-documents and S3 files.
        // For now, let's delete the subject.
        try {
            await deleteSubject(id);
            setSubjects(subjects.filter(s => s.id !== id));
        } catch (error) {
            console.error("Failed to delete subject", error);
        }
    };

    return (
        <ProtectedAdminRoute>
            <main className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                    <div className="md:flex md:items-center md:justify-between mb-8">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                                Manage Subjects
                            </h2>
                        </div>
                    </div>

                    {/* Create Form */}
                    <div className="bg-white shadow sm:rounded-lg mb-8 p-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Add New Subject</h3>
                        <form onSubmit={handleCreate} className="space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
                            <div className="flex-1">
                                <label htmlFor="name" className="sr-only">Subject Name</label>
                                <input
                                    type="text"
                                    placeholder="Subject Name (e.g. Physics)"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md p-2 border"
                                    required
                                />
                            </div>
                            <div className="w-full sm:w-48">
                                <label htmlFor="code" className="sr-only">Subject Code</label>
                                <input
                                    type="text"
                                    placeholder="Code (e.g. PHY101)"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                    className="block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md p-2 border"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full sm:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {creating ? 'Adding...' : 'Add Subject'}
                            </button>
                        </form>
                    </div>

                    {/* List */}
                    {loading ? (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {subjects.map((subject) => (
                                <SubjectCard
                                    key={subject.id}
                                    subject={subject}
                                    isAdmin={true}
                                    onDelete={handleDelete}
                                />
                            ))}
                            {subjects.length === 0 && (
                                <p className="text-gray-500 col-span-full text-center py-10">No subjects found. Add one above.</p>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </ProtectedAdminRoute>
    );
}
