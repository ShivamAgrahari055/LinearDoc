"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Navbar() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
        }
        router.push("/login");
    };

    if (loading) return null;

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-gray-800">ClassDocs</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <span className="text-gray-700 text-sm hidden sm:block">
                                    {user.email} ({user.role})
                                </span>
                                {user.role === 'admin' && (
                                    <Link href="/admin/subjects" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                                        Manage Subjects
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="text-red-600 hover:text-red-900 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                                    Login
                                </Link>
                                <Link href="/signup" className="text-blue-600 hover:text-blue-900 px-3 py-2 rounded-md text-sm font-medium">
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
