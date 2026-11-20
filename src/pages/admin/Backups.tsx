import { formatNumber } from '@/lib/locale';
import { localizeError } from '@/i18n/errors';
import { activeLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { useState, useEffect, useCallback } from 'react';
import { backupService, BackupInfo, BackupResult } from '@/services/backup';
import {
    RefreshCw,
    Database,
    HardDrive,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Play,
    FileArchive,
    Download,
} from 'lucide-react';

export default function AdminBackups() {
    useTranslation();
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [backupResult, setBackupResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [lastBackupDetails, setLastBackupDetails] = useState<BackupResult | null>(null);

    const fetchBackups = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await backupService.listBackups();
            setBackups(data.backups);
        } catch (error) {
            console.error('Error fetching backups:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBackups();
    }, [fetchBackups]);

    const handleTriggerBackup = async () => {
        try {
            setIsBackingUp(true);
            setBackupResult(null);
            setLastBackupDetails(null);

            const result = await backupService.triggerBackup();

            if (result.success) {
                setBackupResult({
                    type: 'success',
                    message: t("admin:backupCompletedSuccessfullyInS", { value1: formatNumber(result.duration, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }),
                });
                setLastBackupDetails(result);
                await fetchBackups();
            } else {
                setBackupResult({
                    type: 'error',
                    message: result.error || t("admin:backupFailed"),
                });
            }
        } catch (error) {
            setBackupResult({
                type: 'error',
                message: error instanceof Error ? localizeError(error.message) : t("admin:failedToTriggerBackup"),
            });
        } finally {
            setIsBackingUp(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString(activeLanguage(), {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTimeSince = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return t("admin:minutesAgo", { value1: diffMins });
        if (diffHours < 24) return t("admin:hoursAgo", { value1: diffHours });
        return t("admin:daysAgo", { value1: diffDays });
    };

    const handleDownload = async (filename: string) => {
        try {
            setDownloadingFile(filename);
            await backupService.downloadBackup(filename);
        } catch (error) {
            console.error('Download error:', error);
            setBackupResult({
                type: 'error',
                message: error instanceof Error ? localizeError(error.message) : t("admin:failedToDownloadBackup"),
            });
        } finally {
            setDownloadingFile(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const latestBackup = backups[0];
    const totalSize = backups.reduce((sum, b) => sum + parseFloat(b.sizeMB), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{t("admin:databaseBackups")}</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        {t("admin:manageDatabaseBackupsStoredInS3")}</p>
                </div>
                <button
                    onClick={fetchBackups}
                    className="flex items-center gap-2 px-4 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg text-surface-700 dark:text-surface-300 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    {t("admin:refresh")}</button>
            </div>

            {/* Backup Result Message */}
            {backupResult && (
                <div
                    className={`p-4 rounded-lg flex items-center gap-3 ${
                        backupResult.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}
                >
                    {backupResult.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                        <p className="font-medium">{backupResult.message}</p>
                        {lastBackupDetails && (
                            <p className="text-sm mt-1 opacity-80">{t("admin:fileMB", { value1: lastBackupDetails.filename, value2: formatNumber(((lastBackupDetails.size || 0) / (1024 * 1024)), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{formatNumber(backups.length)}</p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">{t("admin:totalBackups")}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <HardDrive className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{t("admin:mB", { value1: formatNumber(totalSize, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}</p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">{t("admin:totalStorageUsed")}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                                {latestBackup ? getTimeSince(latestBackup.createdAt) : t("common:uiNever")}
                            </p>
                            <p className="text-sm text-surface-500 dark:text-surface-400">{t("admin:lastBackup")}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trigger Backup */}
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">{t("admin:createBackup")}</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                        onClick={handleTriggerBackup}
                        disabled={isBackingUp}
                        className="flex min-w-[300px] items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 transition-colors font-medium"
                    >
                        {isBackingUp ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                {t("admin:creatingBackup")}</>
                        ) : (
                            <>
                                <Play className="w-5 h-5" />
                                {t("admin:createBackupNow")}</>
                        )}
                    </button>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                        {t("admin:createsACompressedSQLDumpOfTheDatabaseAnd")}</p>
                </div>

                {/* Auto-backup info */}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                            <p className="font-medium">{t("admin:automaticBackups")}</p>
                            <p className="mt-1 opacity-80">
                                {t("admin:configureTheDeploymentBackupHookOrAScheduledJob")}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Backup List */}
            <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 p-6">
                <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">{t("admin:backupHistory")}</h2>

                {backups.length === 0 ? (
                    <div className="text-center py-12">
                        <FileArchive className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
                        <p className="text-surface-500 dark:text-surface-400">{t("admin:noBackupsFound")}</p>
                        <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">
                            {t("admin:createYourFirstBackupUsingTheButtonAbove")}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">
                                        {t("admin:filename")}</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">
                                        {t("admin:size")}</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">
                                        {t("admin:created2")}</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">
                                        {t("admin:age")}</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-surface-500 dark:text-surface-400">
                                        {t("admin:actions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {backups.map((backup, index) => (
                                    <tr
                                        key={backup.filename}
                                        className={`border-b border-surface-100 dark:border-surface-800 ${
                                            index === 0 ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                                        }`}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <FileArchive className="w-4 h-4 text-surface-400" />
                                                <code className="text-sm text-surface-700 dark:text-surface-300 font-mono">
                                                    {backup.filename}
                                                </code>
                                                {index === 0 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                        {t("admin:latest")}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-surface-600 dark:text-surface-400">{t("admin:mB", { value1: backup.sizeMB })}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-surface-600 dark:text-surface-400">
                                                {formatDate(backup.createdAt)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-surface-500 dark:text-surface-500">
                                                {getTimeSince(backup.createdAt)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => handleDownload(backup.filename)}
                                                disabled={downloadingFile === backup.filename}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                title={t("admin:downloadBackup")}
                                            >
                                                {downloadingFile === backup.filename ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                                {t("admin:download")}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
