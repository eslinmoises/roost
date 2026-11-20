import { formatNumber } from '@/lib/locale';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { APP_CONFIG } from '@/config/app';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
    Search,
    Plus,
    Loader2,
    Lightbulb,
    ChevronDown,
    ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getFeatureRequests,
    toggleFeatureRequestVote,
    getUserVotesForRequests,
} from '@/services/feature-request';
import FeatureRequestRow from '@/components/feature-requests/FeatureRequestRow';
import SubmitRequestModal from '@/components/feature-requests/SubmitRequestModal';
import type { FeatureRequestCardData, FeatureRequestFilters } from '@/types/feature-request';
import type { FeatureRequestStatus, FeatureRequestType } from '@/types/database';

const PAGE_SIZE = 20;

const STATUS_TABS: { value: FeatureRequestStatus | ''; label: string }[] = [
    { value: '', get label() { return t("roadmap:all"); } },
    { value: 'under_review', get label() { return t("roadmap:underReview"); } },
    { value: 'planned', get label() { return t("roadmap:planned"); } },
    { value: 'in_progress', get label() { return t("roadmap:inProgress"); } },
    { value: 'released', get label() { return t("roadmap:released"); } },
    { value: 'declined', get label() { return t("roadmap:declined"); } },
];

const SORT_OPTIONS = [
    { value: 'most_votes', get label() { return t("roadmap:mostVoted"); } },
    { value: 'newest', get label() { return t("roadmap:latest"); } },
    { value: 'oldest', get label() { return t("roadmap:oldest"); } },
    { value: 'most_comments', get label() { return t("roadmap:mostDiscussed"); } },
] as const;

const TYPE_FILTER_OPTIONS: { value: string; label: string }[] = [
    { value: '', get label() { return t("roadmap:allTypes"); } },
    { value: 'feature_request', get label() { return t("roadmap:featureRequest"); } },
    { value: 'bug_report', get label() { return t("roadmap:bugReport"); } },
    { value: 'improvement', get label() { return t("roadmap:improvement"); } },
];

export default function FeatureRequestList() {
    useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [requests, setRequests] = useState<FeatureRequestCardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [votingRequestId, setVotingRequestId] = useState<string | null>(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    // Status counts for tab badges
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    // Filters from URL params
    const initialStatus = (searchParams.get('status') || '') as FeatureRequestStatus | '';
    const [activeStatus, setActiveStatus] = useState<FeatureRequestStatus | ''>(initialStatus);
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState<FeatureRequestFilters>({
        sortBy: 'most_votes',
        status: initialStatus || undefined,
    });

    const observerTarget = useRef<HTMLDivElement>(null);
    const requestVersion = useRef(0);

    // Load status counts (fetch all without pagination to count)
    useEffect(() => {
        const loadCounts = async () => {
            try {
                const allRequests = await getFeatureRequests({});
                const counts: Record<string, number> = { '': allRequests.length };
                allRequests.forEach((r) => {
                    counts[r.status] = (counts[r.status] || 0) + 1;
                });
                setStatusCounts(counts);
            } catch (err) {
                console.error('Error loading status counts:', err);
            }
        };
        loadCounts();
    }, []);

    const fetchRequests = useCallback(async (reset = false, currentOffset = 0) => {
        const version = ++requestVersion.current;
        try {
            if (reset) {
                setIsLoading(true);
                setOffset(0);
                setRequests([]);
            }

            const data = await getFeatureRequests(filters, {
                limit: PAGE_SIZE,
                offset: currentOffset,
            });

            // Batch check user votes
            if (user && data.length > 0) {
                const votedIds = await getUserVotesForRequests(
                    user.id,
                    data.map((r) => r.id)
                );
                data.forEach((r) => {
                    r.user_has_voted = votedIds.has(r.id);
                });
            }

            if (version !== requestVersion.current) return;

            if (reset) {
                setRequests(data);
            } else {
                setRequests((prev) => [...prev, ...data]);
            }
            setHasMore(data.length >= PAGE_SIZE);
        } catch (err) {
            console.error('Error fetching feature requests:', err);
        } finally {
            if (version === requestVersion.current) {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        }
    }, [filters, user]);

    // Reset and reload when filters change
    useEffect(() => {
        void fetchRequests(true);
    }, [fetchRequests]);

    // Debounced search
    useEffect(() => {
        const timeout = setTimeout(() => {
            const searchValue = searchInput.trim() || undefined;
            if (searchValue !== filters.search) {
                setFilters((prev) => ({ ...prev, search: searchValue }));
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchInput, filters.search]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
                    setIsLoadingMore(true);
                    const newOffset = offset + PAGE_SIZE;
                    setOffset(newOffset);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, isLoading, offset]);

    // Load more when offset changes (from scroll)
    useEffect(() => {
        if (offset > 0 && isLoadingMore) {
            void fetchRequests(false, offset);
        }
    }, [offset, isLoadingMore, fetchRequests]);

    const handleStatusTab = (status: FeatureRequestStatus | '') => {
        setActiveStatus(status);
        setFilters((prev) => ({
            ...prev,
            status: status || undefined,
        }));
        // Update URL
        if (status) {
            setSearchParams({ status });
        } else {
            setSearchParams({});
        }
    };

    const handleVote = async (requestId: string) => {
        if (!user || votingRequestId) return;
        setVotingRequestId(requestId);

        // Optimistic update
        setRequests((prev) =>
            prev.map((r) => {
                if (r.id === requestId) {
                    const wasVoted = r.user_has_voted;
                    return {
                        ...r,
                        user_has_voted: !wasVoted,
                        vote_count: wasVoted ? r.vote_count - 1 : r.vote_count + 1,
                    };
                }
                return r;
            })
        );

        try {
            await toggleFeatureRequestVote(requestId, user.id);
        } catch (err) {
            console.error('Error voting:', err);
            fetchRequests(true);
        } finally {
            setVotingRequestId(null);
        }
    };

    const handleCardClick = (requestId: string) => {
        navigate(`/roadmap/${requestId}`);
    };

    const handleSubmitSuccess = () => {
        fetchRequests(true);
        // Reload counts
        getFeatureRequests({}).then((allRequests) => {
            const counts: Record<string, number> = { '': allRequests.length };
            allRequests.forEach((r) => {
                counts[r.status] = (counts[r.status] || 0) + 1;
            });
            setStatusCounts(counts);
        });
    };

    return (
        <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    to="/roadmap"
                    className="inline-flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("roadmap:backToRoadmap")}</Link>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
                    {t("roadmap:allFeatureRequests")}</h1>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {t("roadmap:browseFilterAndVoteOnAllFeatureRequestsBug")}</p>
            </div>

            {/* Status Tabs */}
            <div className="border-b border-surface-200 dark:border-surface-700 mb-4">
                <div className="flex gap-0 -mb-px overflow-x-auto">
                    {STATUS_TABS.map((tab) => {
                        const count = statusCounts[tab.value] || 0;
                        const isActive = activeStatus === tab.value;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => handleStatusTab(tab.value)}
                                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                    isActive
                                        ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                                        : 'border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:border-surface-300 dark:hover:border-surface-600'
                                }`}
                            >
                                {tab.label}
                                {count > 0 && (
                                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                        isActive
                                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                            : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400'
                                    }`}>
                                        {formatNumber(count)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder={t("roadmap:searchRequests")}
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder-surface-400 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                </div>

                {/* Type filter */}
                <div className="relative">
                    <select
                        value={filters.type || ''}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                type: (e.target.value || undefined) as FeatureRequestType | undefined,
                            }))
                        }
                        className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                    >
                        {TYPE_FILTER_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                </div>

                {/* Sort */}
                <div className="relative">
                    <select
                        value={filters.sortBy || 'most_votes'}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                sortBy: e.target.value as FeatureRequestFilters['sortBy'],
                            }))
                        }
                        className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                </div>

                <div className="flex-1" />

                {/* Submit button */}
                <button
                    disabled={APP_CONFIG.demo.enabled}
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">{t("roadmap:submitRequest")}</span>
                    <span className="sm:hidden">{t("roadmap:submit")}</span>
                </button>
            </div>

            {/* Request List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20">
                    <Lightbulb className="w-16 h-16 mx-auto text-surface-300 dark:text-surface-600 mb-4" />
                    <h3 className="text-lg font-medium text-surface-900 dark:text-surface-100 mb-2">
                        {t("roadmap:noRequestsFound")}</h3>
                    <p className="text-surface-500 dark:text-surface-400 mb-6">
                        {filters.search || filters.type || filters.status
                            ? t("roadmap:tryAdjustingYourFiltersOrSearchTerm")
                            : t("roadmap:beTheFirstToSubmitAFeatureRequestOr")}
                    </p>
                    {!filters.search && !filters.type && !filters.status && (
                        <button
                            disabled={APP_CONFIG.demo.enabled}
                            onClick={() => setShowSubmitModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {t("roadmap:submitRequest")}</button>
                    )}
                </div>
            ) : (
                <div className="card overflow-hidden divide-y divide-surface-100 dark:divide-surface-800">
                    {requests.map((request) => (
                        <FeatureRequestRow
                            key={request.id}
                            request={request}
                            onVote={handleVote}
                            isVoting={votingRequestId === request.id}
                            onClick={handleCardClick}
                        />
                    ))}
                </div>
            )}

            {/* Infinite scroll trigger */}
            {hasMore && !isLoading && requests.length > 0 && (
                <div ref={observerTarget} className="py-6 text-center">
                    {isLoadingMore ? (
                        <div className="flex items-center justify-center gap-2 text-surface-500 dark:text-surface-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">{t("roadmap:loadingMore")}</span>
                        </div>
                    ) : (
                        <span className="text-sm text-surface-400 dark:text-surface-500">
                            {t("roadmap:scrollForMore")}</span>
                    )}
                </div>
            )}

            {/* Submit modal */}
            <SubmitRequestModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                onSuccess={handleSubmitSuccess}
            />
        </div>
    );
}
