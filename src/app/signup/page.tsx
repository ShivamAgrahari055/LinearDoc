"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const collegeDomain = process.env.NEXT_PUBLIC_COLLEGE_EMAIL_DOMAIN;
        if (collegeDomain && !email.endsWith(collegeDomain)) {
            setError(`Please use your college email ending with ${collegeDomain}`);
            return;
        }

        try {
            if (!auth || !db) {
                setError("Firebase not initialized");
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Create user doc in Firestore
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: email,
                role: "student", // Default role
                createdAt: new Date(),
            });
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
                <h2 className="text-2xl font-bold text-center">Sign Up</h2>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                        Sign Up
                    </button>
                </form>
                <p className="text-sm text-center">
                    Already have an account? <Link href="/login" className="text-blue-600">Login</Link>
                </p>
            </div>
        </div>
    );
}
