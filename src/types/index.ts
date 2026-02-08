export interface UserProfile {
    uid: string;
    email: string | null;
    role: 'admin' | 'student';
    displayName?: string;
}
