import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    where,
    Timestamp,
    serverTimestamp
} from "firebase/firestore";

export interface Subject {
    id?: string;
    name: string;
    code: string;
}

export interface DocumentData {
    id?: string;
    subjectId: string;
    section: 'notes' | 'assignments' | 'practical';
    title: string;
    s3Key: string;
    fileUrl: string; // The public URL or presigned GET url (if private)
    // For this app, let's assume public read or long-lived presigned, 
    // but better to store key and generate GET url on fly?
    // User asked "others can download once and use the they do not need to download it again".
    // PWA caching handles "not download again".
    // Let's store the S3 Key and a public URL if bucket is public, or we generate signed URL on view.
    // For simplicity, let's assume we use signed URLs for access control?
    // Or just store the key and have a component fetch the URL.
    uploadedBy: string;
    createdAt: any;
    size: number;
    mimeType: string;
}

// Subjects
export const addSubject = async (name: string, code: string) => {
    if (!db) throw new Error("Firestore not initialized");
    return await addDoc(collection(db, "subjects"), { name, code });
};

export const getSubjects = async () => {
    if (!db) throw new Error("Firestore not initialized");
    const q = query(collection(db, "subjects"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
};

export const deleteSubject = async (id: string) => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, "subjects", id));
};

// Documents
export const addDocument = async (data: Omit<DocumentData, "id" | "createdAt">) => {
    if (!db) throw new Error("Firestore not initialized");
    return await addDoc(collection(db, "documents"), {
        ...data,
        createdAt: serverTimestamp()
    });
};

export const getDocumentsBySubject = async (subjectId: string) => {
    if (!db) throw new Error("Firestore not initialized");
    const q = query(collection(db, "documents"), where("subjectId", "==", subjectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentData));
};

export interface SubmissionData {
    id?: string;
    subjectId: string;
    studentId: string;
    studentName: string;
    registrationNumber: string;
    fileUrl: string;
    s3Key: string;
    submittedAt: any;
    fileName: string;
}

// ... existing code ...

export const deleteDocument = async (id: string) => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, "documents", id));
};

// Submissions
export const addSubmission = async (data: Omit<SubmissionData, "id" | "submittedAt">) => {
    if (!db) throw new Error("Firestore not initialized");
    return await addDoc(collection(db, "submissions"), {
        ...data,
        submittedAt: serverTimestamp()
    });
};

export const getSubmissionsBySubject = async (subjectId: string) => {
    if (!db) throw new Error("Firestore not initialized");
    const q = query(collection(db, "submissions"), where("subjectId", "==", subjectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubmissionData));
};

export const deleteSubmission = async (id: string) => {
    if (!db) throw new Error("Firestore not initialized");
    await deleteDoc(doc(db, "submissions", id));
};

export const deleteSubmissionsBySubject = async (subjectId: string) => {
    if (!db) throw new Error("Firestore not initialized");
    const firestore = db;
    const q = query(collection(firestore, "submissions"), where("subjectId", "==", subjectId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(firestore, "submissions", docSnap.id)));
    await Promise.all(deletePromises);
};

