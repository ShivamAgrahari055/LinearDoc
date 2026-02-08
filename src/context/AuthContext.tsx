"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserProfile } from "@/types";

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("Auth State Changed:", firebaseUser?.email);
            if (firebaseUser) {
                try {
                    // Fetch user role from Firestore
                    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as UserProfile;
                        setUser({ ...userData, uid: firebaseUser.uid, email: firebaseUser.email });
                    } else {
                        // Fallback if user doc doesn't exist yet
                        console.warn("User document not found in Firestore, using default student role.");
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: 'student',
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user role from Firestore:", error);
                    // Critical: Still set the user even if Fetch fails, so they are logged in.
                    // This handles permission errors or network issues gracefully.
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        role: 'student', // Default fallback
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
