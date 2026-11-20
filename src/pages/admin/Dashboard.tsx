import { formatNumber } from '@/lib/locale';
import { localizeError } from '@/i18n/errors';
import { activeLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { useEffect, useState } from 'react';
import {
    Users,
    FileText,
    MessageSquare,
    Calendar,
    TrendingUp,
    Award,
    Megaphone,
    RefreshCw,
} from 'lucide-react';
import { StatsCard } from '../../components/admin';
import {
    getDashboardStats,
    getUserGrowth,
    getActivityStats,
    getTopContributors,
} from '../../services';
import type { AdminStats, UserGrowthData, ActivityStatsData } from '../../services';
import { MemberAvatar } from '../../components/common/MemberAvatar';

export default function AdminDashboard() {
    useTranslation();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
    const [activityStats, setActivityStats] = useState<ActivityStatsData[]>([]);
    const [topContributors, setTopContributors] = useState<Awaited<ReturnType<typeof getTopContributors>>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsData, growth, activity, contributors] = await Promise.all([
                getDashboardStats(),
                getUserGrowth(30),
                getActivityStats(30),
                getTopContributors(5),
            ]);
            setStats(statsData);
            setUserGrowth(growth);
            setActivityStats(activity);
            setTopContributors(contributors);
        } catch (err) {
            setError(err instanceof Error ? localizeError(err.message) : t("admin:failedToLoadDashboardData"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
                <p className="font-medium">{t("admin:errorLoadingDashboard")}</p>
                <p className="text-sm mt-1">{localizeError(error)}</p>
                <button
                    onClick={loadData}
                    className="mt-3 text-sm font-medium underline hover:no-underline"
                >
                    {t("admin:tryAgain")}</button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("admin:dashboard")}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t("admin:overviewOfYourCommunity")}</p>
                </div>
                <button
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-800 border border-gray-200 dark:border-surface-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    {t("admin:refresh")}</button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title={t("admin:totalMembers")}
                    value={stats?.total_members || 0}
                    icon={Users}
                    color="blue"
                    trend={{
                        value: stats?.new_members_30d || 0,
                        label: t("admin:newThisMonth"),
                        isPositive: true,
                    }}
                />
                <StatsCard
                    title={t("admin:totalPosts")}
                    value={stats?.total_posts || 0}
                    icon={FileText}
                    color="purple"
                    trend={{
                        value: stats?.posts_30d || 0,
                        label: t("admin:thisMonth2"),
                        isPositive: true,
                    }}
                />
                <StatsCard
                    title={t("admin:totalComments")}
                    value={stats?.total_comments || 0}
                    icon={MessageSquare}
                    color="green"
                    trend={{
                        value: stats?.comments_30d || 0,
                        label: t("admin:thisMonth2"),
                        isPositive: true,
                    }}
                />
                <StatsCard
                    title={t("admin:upcomingEvents")}
                    value={stats?.upcoming_events || 0}
                    icon={Calendar}
                    color="orange"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    title={t("admin:activeGroups")}
                    value={`${stats?.active_groups || 0} / ${stats?.total_groups || 0}`}
                    icon={TrendingUp}
                    color="indigo"
                />
                <StatsCard
                    title={t("admin:activeAnnouncements")}
                    value={stats?.active_announcements || 0}
                    icon={Megaphone}
                    color="orange"
                />
                <StatsCard
                    title={t("admin:bannedUsers")}
                    value={stats?.banned_members || 0}
                    icon={Users}
                    color="red"
                />
            </div>

            {/* Charts and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Chart Placeholder */}
                <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-gray-100 dark:border-surface-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("admin:activityLast30Days")}</h3>
                    <div className="space-y-3">
                        {activityStats.slice(-7).map((day) => (
                            <div key={day.date} className="flex items-center gap-4">
                                <span className="text-sm text-gray-500 dark:text-gray-400 w-24">
                                    {new Date(day.date).toLocaleDateString(activeLanguage(), { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <div className="flex-1 flex gap-2">
                                    <div
                                        className="h-6 bg-primary-500 rounded"
                                        style={{ width: `${Math.min(day.posts * 10, 100)}%` }}
                                        title={t("admin:posts", { count: day.posts })}
                                    />
                                    <div
                                        className="h-6 bg-green-500 rounded"
                                        style={{ width: `${Math.min(day.comments * 5, 100)}%` }}
                                        title={t("admin:comments", { count: day.comments })}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="flex gap-4 text-sm mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-primary-500 rounded" />
                                <span className="text-gray-600 dark:text-gray-400">{t("admin:posts2")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded" />
                                <span className="text-gray-600 dark:text-gray-400">{t("admin:comments2")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Contributors */}
                <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-gray-100 dark:border-surface-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("admin:topContributors")}</h3>
                    </div>
                    <div className="space-y-4">
                        {topContributors.map((contributor, index) => (
                            <div key={`${contributor.user.id}-${index}`} className="flex items-center gap-3">
                                <span className="text-lg font-bold text-gray-400 dark:text-gray-500 w-6">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                </span>
                                <MemberAvatar src={contributor.user.avatar_url} name={contributor.user.display_name} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {contributor.user.display_name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">@{contributor.user.username}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-primary-600 dark:text-primary-400">{formatNumber(contributor.total_points)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("admin:points")}</p>
                                </div>
                            </div>
                        ))}
                        {topContributors.length === 0 && (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t("admin:noContributorsYet")}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* User Growth */}
            <div className="bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-gray-100 dark:border-surface-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("admin:newMembersLast30Days")}</h3>
                <div className="flex items-end gap-1 h-32">
                    {userGrowth.map((day) => {
                        const maxCount = Math.max(...userGrowth.map((d) => d.count), 1);
                        const height = (day.count / maxCount) * 100;
                        return (
                            <div
                                key={day.date}
                                className="flex-1 bg-primary-500 rounded-t hover:bg-primary-600 transition-colors cursor-pointer"
                                style={{ height: `${Math.max(height, 4)}%` }}
                                title={t("admin:newMembers", { value1: new Date(day.date).toLocaleDateString(activeLanguage()), count: day.count })}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{t("admin:30DaysAgo")}</span>
                    <span>{t("admin:today")}</span>
                </div>
            </div>
        </div>
    );
}
