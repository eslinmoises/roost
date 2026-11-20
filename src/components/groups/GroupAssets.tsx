import { formatNumber } from '@/lib/locale';
import { activeLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { useState, useEffect, useCallback } from 'react';
import { Upload, Download, Trash2, FileText, File, Image, Video, Loader2, Eye } from 'lucide-react';
import { getGroupAssets, deleteGroupAsset } from '@/services/group';
import type { GroupRole } from '@/types';
import UploadAssetsModal from './UploadAssetsModal';
import MarkdownPreviewModal from './MarkdownPreviewModal';
import { getSignedDownloadUrl } from '@/services/s3';

interface GroupAssetsProps {
    groupId: string;
    userRole: GroupRole | null;
}

export default function GroupAssets({ groupId, userRole }: GroupAssetsProps) {
    useTranslation();
    const [assets, setAssets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

    const canUpload = userRole && (userRole === 'admin' || userRole === 'moderator');

    const openAsset = async (url: string, name: string, preview: boolean) => {
        try {
            const resolved = await getSignedDownloadUrl(url);
            if (preview) setPreviewFile({ url: resolved, name });
            else window.open(resolved, '_blank', 'noopener,noreferrer');
        } catch {
            window.alert(t("groups:thisFileIsUnavailableOrYouNoLongerHave"));
        }
    };

    const loadAssets = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getGroupAssets(groupId);
            // Filter out any items where the asset relation is null (RLS issue)
            setAssets(data.filter((item) => item.asset !== null));
        } catch (error) {
            console.error('Error loading assets:', error);
        } finally {
            setIsLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        void loadAssets();
    }, [loadAssets]);

    const handleDelete = async (assetId: string) => {
        if (!confirm(t("groups:areYouSureYouWantToDeleteThisAsset"))) return;

        try {
            setDeletingId(assetId);
            await deleteGroupAsset(assetId);
            setAssets((prev) => prev.filter((a) => a.id !== assetId));
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert(t("groups:failedToDeleteAsset"));
        } finally {
            setDeletingId(null);
        }
    };

    const getFileIcon = (assetType: string) => {
        switch (assetType) {
            case 'image':
                return <Image className="w-5 h-5 text-blue-500" />;
            case 'video':
                return <Video className="w-5 h-5 text-purple-500" />;
            case 'document':
                return <FileText className="w-5 h-5 text-red-500" />;
            default:
                return <File className="w-5 h-5 text-surface-500" />;
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return t("groups:kB", { value1: formatNumber((bytes / 1024), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
        return t("groups:mB", { value1: formatNumber((bytes / (1024 * 1024)), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(activeLanguage(), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const isMarkdownFile = (mimeType: string, filename: string) => {
        return (
            mimeType === 'text/markdown' ||
            mimeType === 'text/x-markdown' ||
            filename.toLowerCase().endsWith('.md')
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="p-2 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-50">{t("groups:courseMaterials")}</h2>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{t("groups:uploaded", { count: assets.length })}</p>
                </div>
                {canUpload && (
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        {t("groups:uploadFiles")}</button>
                )}
            </div>

            {/* Assets Table */}
            {assets.length === 0 ? (
                <div className="text-center py-12 bg-surface-50 dark:bg-surface-900 rounded-lg border-2 border-dashed border-surface-200 dark:border-surface-700">
                    <FileText className="w-12 h-12 mx-auto text-surface-400 dark:text-surface-500 mb-3" />
                    <h3 className="text-lg font-medium text-surface-900 dark:text-surface-50 mb-1">{t("groups:noMaterialsYet")}</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                        {canUpload
                            ? t("groups:uploadCourseMaterialsPDFsDocumentsAndResourcesForStudents")
                            : t("groups:courseMaterialsWillAppearHereWhenUploadedByInstructors")}
                    </p>
                    {canUpload && (
                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-800 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            {t("groups:uploadYourFirstFile")}</button>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                        {t("groups:name")}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                        {t("groups:type")}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                        {t("groups:size")}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                        {t("groups:date")}</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">
                                        {t("groups:actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-200 dark:divide-surface-700">
                                {assets.map((item) => (
                                    <tr key={item.id} className="hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                                        <td className="px-2 py-4">
                                            <div className="flex items-center gap-3 max-w-64">
                                                {getFileIcon(item.asset.asset_type)}
                                                <span className="text-xs font-medium text-surface-900 dark:text-surface-100">
                                                    {item.asset.filename}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-2 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 capitalize">
                                                {item.asset.asset_type}
                                            </span>
                                        </td>
                                        <td className="px-2 py-4 text-xs text-surface-600 dark:text-surface-400">
                                            {formatFileSize(item.asset.file_size)}
                                        </td>
                                        <td className="px-2 py-4 text-xs text-surface-600 dark:text-surface-400">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="px-2 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {isMarkdownFile(item.asset.mime_type, item.asset.filename) && (
                                                    <button
                                                        onClick={() => openAsset(item.asset.file_url, item.asset.filename, true)}
                                                        className="p-2 text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                        title={t("groups:preview")}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openAsset(item.asset.file_url, item.asset.filename, false)}
                                                    className="p-2 text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                    title={t("groups:download")}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                {canUpload && (
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={deletingId === item.id}
                                                        className="p-2 text-surface-500 dark:text-surface-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                        title={t("groups:delete")}
                                                    >
                                                        {deletingId === item.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            <UploadAssetsModal
                isOpen={showUploadModal}
                groupId={groupId}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => {
                    loadAssets();
                    setShowUploadModal(false);
                }}
            />

            {/* Markdown Preview Modal */}
            <MarkdownPreviewModal
                isOpen={!!previewFile}
                fileUrl={previewFile?.url || ''}
                fileName={previewFile?.name || ''}
                onClose={() => setPreviewFile(null)}
            />
        </div>
    );
}
