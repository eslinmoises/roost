import { formatNumber } from '@/lib/locale';
import { activeLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Loader2,
    Search,
    CheckCircle,
    XCircle,
    Star,
    ExternalLink,
    Eye,
    ChevronUp,
    MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getShowcasesForModeration,
    getShowcaseStats,
    approveShowcase,
    rejectShowcase,
    featureShowcase,
    unfeatureShowcase,
} from '@/services/showcase';
import type { ShowcaseForModeration, ShowcaseStats } from '@/types/showcase';
import type { ShowcaseStatus } from '@/types/database';
import { SHOWCASE_CATEGORY_INFO, SHOWCASE_STATUS_INFO } from '@/types/showcase';

const TABS: { value: ShowcaseStatus | 'all'; label: string }[] = [
    { value: 'pending', get label() { return t("admin:pending"); } },
    { value: 'approved', get label() { return t("admin:approved"); } },
    { value: 'featured', get label() { return t("admin:featured"); } },
    { value: 'rejected', get label() { return t("admin:rejected"); } },
    { value: 'all', get label() { return t("admin:all"); } },
];

export default function AdminShowcases() {
    useTranslation();
    const { user } = useAuth();
    const [showcases, setShowcases] = useState<ShowcaseForModeration[]>([]);
    const [stats, setStats] = useState<ShowcaseStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ShowcaseStatus | 'all'>('pending');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal state
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingShowcaseId, setRejectingShowcaseId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Fetch data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [showcasesData, statsData] = await Promise.all([
                getShowcasesForModeration(activeTab === 'all' ? undefined : activeTab, search || undefined),
                getShowcaseStats(),
            ]);
            setShowcases(showcasesData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching showcases:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, search]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Debounced search
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (search !== '') {
                fetchData();
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, fetchData]);

    // Action handlers
    const handleApprove = async (showcaseId: string) => {
        if (!user) return;
        setActionLoading(showcaseId);
        try {
            await approveShowcase(showcaseId, user.id);
            fetchData();
        } catch (error) {
            console.error('Error approving showcase:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!user || !rejectingShowcaseId || !rejectReason.trim()) return;
        setActionLoading(rejectingShowcaseId);
        try {
            await rejectShowcase(rejectingShowcaseId, user.id, rejectReason);
            setRejectModalOpen(false);
            setRejectingShowcaseId(null);
            setRejectReason('');
            fetchData();
        } catch (error) {
            console.error('Error rejecting showcase:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleFeature = async (showcaseId: string) => {
        if (!user) return;
        setActionLoading(showcaseId);
        try {
            await featureShowcase(showcaseId, user.id);
            fetchData();
        } catch (error) {
            console.error('Error featuring showcase:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnfeature = async (showcaseId: string) => {
        setActionLoading(showcaseId);
        try {
            await unfeatureShowcase(showcaseId);
            fetchData();
        } catch (error) {
            console.error('Error unfeaturing showcase:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const openRejectModal = (showcaseId: string) => {
        setRejectingShowcaseId(showcaseId);
        setRejectModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                    {t("admin:showcaseModeration")}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    {t("admin:reviewAndManageShowcaseSubmissions")}</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="card shadow-none p-4">
                        <p className="text-sm text-surface-500 dark:text-surface-400">{t("admin:total")}</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{formatNumber(stats.total)}</p>
                    </div>
                    <div className="card shadow-none p-4">
                        <p className="text-sm text-yellow-600">{t("admin:pending")}</p>
                        <p className="text-2xl font-bold text-yellow-600">{formatNumber(stats.pending)}</p>
                    </div>
                    <div className="card shadow-none p-4">
                        <p className="text-sm text-green-600">{t("admin:approved")}</p>
                        <p className="text-2xl font-bold text-green-600">{formatNumber(stats.approved)}</p>
                    </div>
                    <div className="card shadow-none p-4">
                        <p className="text-sm text-purple-600">{t("admin:featured")}</p>
                        <p className="text-2xl font-bold text-purple-600">{formatNumber(stats.featured)}</p>
                    </div>
                    <div className="card shadow-none p-4">
                        <p className="text-sm text-red-600">{t("admin:rejected")}</p>
                        <p className="text-2xl font-bold text-red-600">{formatNumber(stats.rejected)}</p>
                    </div>
                    <div className="card shadow-none p-4">
                        <p className="text-sm text-surface-500 dark:text-surface-400">{t("admin:thisMonth")}</p>
                        <p className="text-2xl font-bold text-surface-900 dark:text-surface-50">{formatNumber(stats.thisMonth)}</p>
                    </div>
                </div>
            )}

            {/* Tabs and Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-1 overflow-x-auto pb-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                                ${activeTab === tab.value
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
                                }
                            `}
                        >
                            {tab.label}
                            {tab.value === 'pending' && stats?.pending ? (
                                <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                                    {formatNumber(stats.pending)}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input
                        type="text"
                        placeholder={t("admin:searchShowcases")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* Showcases List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            ) : showcases.length === 0 ? (
                <div className="text-center py-12 text-surface-500 dark:text-surface-400">
                    {t("admin:noShowcasesFound")}</div>
            ) : (
                <div className="card shadow-none overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-50 dark:bg-surface-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                        {t("admin:project")}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                        {t("admin:author")}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                        {t("admin:category")}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                        {t("admin:status")}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                        {t("admin:stats")}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                        {t("admin:submitted")}</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">
                                        {t("admin:actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                                {showcases.map((showcase) => {
                                    const categoryInfo = SHOWCASE_CATEGORY_INFO[showcase.category];
                                    const statusInfo = SHOWCASE_STATUS_INFO[showcase.status ?? 'pending'];
                                    const isActionLoading = actionLoading === showcase.id;

                                    return (
                                        <tr key={showcase.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    {showcase.thumbnail_url && (
                                                        <img
                                                            src={showcase.thumbnail_url}
                                                            alt=""
                                                            className="w-12 h-12 rounded-lg object-cover"
                                                        />
                                                    )}
                                                    <Link
                                                        to={`/showcase/${showcase.id}`}
                                                        className="font-medium text-surface-900 dark:text-surface-100 hover:text-primary-600"
                                                    >
                                                        {showcase.title}
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Link
                                                    to={`/profile/${showcase.author.username}`}
                                                    className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600"
                                                >
                                                    {showcase.author.avatar_url ? (
                                                        <img
                                                            src={showcase.author.avatar_url}
                                                            alt=""
                                                            className="w-6 h-6 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-700" />
                                                    )}
                                                    {showcase.author.username}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                                    style={{ backgroundColor: `${categoryInfo.color}20`, color: categoryInfo.color }}
                                                >
                                                    {categoryInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3 text-sm text-surface-500">
                                                    <span className="flex items-center gap-1">
                                                        <ChevronUp className="w-4 h-4" />
                                                        {formatNumber(showcase.vote_count)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="w-4 h-4" />
                                                        {formatNumber(showcase.review_count)}
                                                    </span>
                                                    {(showcase.average_rating ?? 0) > 0 && (
                                                        <span className="flex items-center gap-1 text-amber-500">
                                                            <Star className="w-4 h-4 fill-current" />
                                                            {formatNumber((showcase.average_rating ?? 0), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-surface-500">
                                                {new Date(showcase.created_at ?? Date.now()).toLocaleDateString(activeLanguage())}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <a
                                                        href={showcase.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
                                                        title={t("admin:visitProject")}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                    <Link
                                                        to={`/showcase/${showcase.id}`}
                                                        className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
                                                        title={t("admin:viewDetails")}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>

                                                    {showcase.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(showcase.id)}
                                                                disabled={isActionLoading}
                                                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50"
                                                                title={t("admin:approve")}
                                                            >
                                                                {isActionLoading ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => openRejectModal(showcase.id)}
                                                                disabled={isActionLoading}
                                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                                                                title={t("admin:reject")}
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}

                                                    {showcase.status === 'approved' && (
                                                        <button
                                                            onClick={() => handleFeature(showcase.id)}
                                                            disabled={isActionLoading}
                                                            className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg disabled:opacity-50"
                                                            title={t("admin:feature")}
                                                        >
                                                            {isActionLoading ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Star className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}

                                                    {showcase.status === 'featured' && (
                                                        <button
                                                            onClick={() => handleUnfeature(showcase.id)}
                                                            disabled={isActionLoading}
                                                            className="p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg disabled:opacity-50"
                                                            title={t("admin:unfeature")}
                                                        >
                                                            {isActionLoading ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Star className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-surface-900 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
                            {t("admin:rejectShowcase")}</h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
                            {t("admin:pleaseProvideAReasonForRejectionThisWillBe")}</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder={t("admin:reasonForRejection")}
                            rows={4}
                            className="w-full px-4 py-3 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setRejectModalOpen(false);
                                    setRejectingShowcaseId(null);
                                    setRejectReason('');
                                }}
                                className="px-4 py-2 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg"
                            >
                                {t("admin:cancel")}</button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || actionLoading !== null}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {t("admin:reject")}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
