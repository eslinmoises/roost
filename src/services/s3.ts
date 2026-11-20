import { t } from '@/i18n';
import { getCurrentSession } from './supabase';

// Backend API URL for pre-signed URL generation
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// File type configurations
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown', 'text/x-markdown'];
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// File upload result type
export interface UploadResult {
    key: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
}

// Get auth token for API requests
async function getAuthToken(): Promise<string> {
    const session = await getCurrentSession();
    if (!session?.access_token) {
        throw new Error(t("errors:authenticationRequiredForFileUploads"));
    }
    return session.access_token;
}

// Upload through the authenticated API so internal MinIO hostnames and storage
// credentials are never exposed to browsers.
async function uploadViaPresignedUrl(file: File, folder: string): Promise<UploadResult> {
    const token = await getAuthToken();
    const body = new FormData();
    body.append('folder', folder);
    body.append('file', file, file.name);
    const response = await fetch(`${API_URL}/api/upload/file`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: t("errors:uploadFailed") }));
        throw new Error(error.error || t("errors:failedToUploadFile"));
    }

    const { key, publicUrl } = await response.json();

    return {
        key,
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
    };
}

// Upload file to S3 via backend pre-signed URL
export async function uploadFile(
    file: File,
    folder: string = 'uploads'
): Promise<UploadResult> {
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(t("errors:fileSizeExceedsMaximumAllowedMB", { value1: MAX_FILE_SIZE / 1024 / 1024 }));
    }

    return uploadViaPresignedUrl(file, folder);
}

// Upload image with validation
export async function uploadImage(file: File): Promise<UploadResult> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error(t("errors:invalidImageTypeAllowedTypesJPEGPNGGIFWebP"));
    }

    if (file.size > MAX_IMAGE_SIZE) {
        throw new Error(t("errors:imageSizeExceedsMaximumAllowedMB", { value1: MAX_IMAGE_SIZE / 1024 / 1024 }));
    }

    return uploadViaPresignedUrl(file, 'images');
}

// Upload avatar with validation
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error(t("errors:invalidImageTypeAllowedTypesJPEGPNGGIFWebP"));
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error(t("errors:avatarSizeExceedsMaximumAllowed5MB"));
    }

    return uploadViaPresignedUrl(file, `avatars/${userId}`);
}

// Upload video
export async function uploadVideo(file: File): Promise<UploadResult> {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        throw new Error(t("errors:invalidVideoTypeAllowedTypesMP4WebMMOV"));
    }

    return uploadViaPresignedUrl(file, 'videos');
}

// Upload document
export async function uploadDocument(file: File): Promise<UploadResult> {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
        throw new Error(t("errors:invalidDocumentTypeAllowedTypesPDFDOCDOCX"));
    }

    return uploadViaPresignedUrl(file, 'documents');
}

// Delete file from S3 via backend
export async function deleteFile(key: string): Promise<void> {
    const token = await getAuthToken();

    const response = await fetch(`${API_URL}/api/upload/delete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ key }),
    });

    if (!response.ok) {
        throw new Error(t("errors:failedToDeleteFile"));
    }
}

// Fetch an authorized private object and return a short-lived local blob URL.
export async function getSignedDownloadUrl(keyOrUrl: string, _expiresIn: number = 3600): Promise<string> {
    if (!keyOrUrl.startsWith('private:')) return keyOrUrl;
    const token = await getAuthToken();
    const key = keyOrUrl.slice('private:'.length);
    const encodedKey = btoa(String.fromCharCode(...new TextEncoder().encode(key)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const response = await fetch(`${API_URL}/api/upload/content/${encodedKey}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(t("errors:fileAccessDenied"));
    return URL.createObjectURL(await response.blob());
}

// Determine asset type from mime type
export function getAssetType(mimeType: string): 'image' | 'video' | 'document' | 'other' {
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image';
    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
    if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document';
    return 'other';
}

export default {
    uploadFile,
    uploadImage,
    uploadAvatar,
    uploadVideo,
    uploadDocument,
    deleteFile,
    getSignedDownloadUrl,
    getAssetType,
};
