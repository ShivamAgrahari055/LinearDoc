"use server";

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function getPresignedUploadUrl(fileKey: string, contentType: string) {
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
        console.error("Missing AWS Environment Variables");
        return { success: false, error: "Server Configuration Error: Missing AWS Credentials" };
    }

    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            ContentType: contentType,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return { success: true, url: signedUrl };
    } catch (error: any) {
        console.error("Error generating presigned upload URL:", error);
        return { success: false, error: error.message || "Failed to generate upload URL" };
    }
}

export async function getPresignedDownloadUrl(fileKey: string) {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return { success: true, url: signedUrl };
    } catch (error) {
        console.error("Error generating download URL:", error);
        return { success: false, error: "Failed to generate download URL" };
    }
}

export async function deleteFileFromS3(fileKey: string) {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
        });

        await s3Client.send(command);
        return { success: true };
    } catch (error) {
        console.error("Error deleting file from S3:", error);
        return { success: false, error: "Failed to delete file" };
    }
}
