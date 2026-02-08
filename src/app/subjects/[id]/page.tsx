import SubjectDetailClient from "@/components/SubjectDetailClient";

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Server-side environment variables (securely accessible here)
    // We pass them to the client component.
    // Ensure we send empty string instead of undefined to avoid serialization errors if missing.
    const awsConfig = {
        bucket: process.env.AWS_S3_BUCKET_NAME || process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || "",
        region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || "",
    };

    return <SubjectDetailClient id={id} awsConfig={awsConfig} />;
}
