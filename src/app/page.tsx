"use client";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getSubjects, Subject } from "@/services/firestore";
import SubjectCard from "@/components/SubjectCard";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getSubjects().then(setSubjects).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Class Document Manager
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Access your class notes, assignments, and practicals in one place.
          </p>
        </div>

        {authLoading ? (
          <div className="flex justify-center mt-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !user ? (
          <div className="flex justify-center mt-8">
            <Link
              href="/login"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="mt-8">
            <div className="bg-white overflow-hidden shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Your Subjects</h2>
              <p className="text-gray-500 mb-6">
                {user.role === 'admin'
                  ? "Admin Dashboard: Manage your subjects and documents here."
                  : "Welcome student! Select a subject to view its documents."}
              </p>

              {loading ? (
                <div className="flex justify-center p-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {subjects.map(subject => (
                    <SubjectCard key={subject.id} subject={subject} />
                  ))}
                  {subjects.length === 0 && (
                    <div className="col-span-full border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center h-32 text-gray-400">
                      <p>No subjects available.</p>
                      {user.role === 'admin' && (
                        <Link href="/admin/subjects" className="mt-2 text-blue-600 hover:underline">
                          Create a subject
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
