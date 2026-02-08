export const getPublicUrl = (s3Key: string) => {
    const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
    const region = process.env.NEXT_PUBLIC_AWS_REGION;
    // Note: We need to expose these vars to client if we construct URL on client.
    // Or we construct it on server.
    // Let's assume we update .env.local to have NEXT_PUBLIC_ prefixes for these too?
    // Or just hardcode the format if we pass the bucket/region from server props?
    // Easier: Just return the format if vars exist.
    if (!bucket || !region) return "";
    return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;
};
