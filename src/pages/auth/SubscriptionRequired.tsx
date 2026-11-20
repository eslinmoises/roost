import { Trans } from 'react-i18next';
import { localizeError } from '@/i18n/errors';
import { activeLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionService, SubscriptionStatus } from '@/services/subscription';
import { CreditCard, LogOut, Clock, AlertCircle, RefreshCw, Loader2, Settings } from 'lucide-react';

export default function SubscriptionRequired() {
    useTranslation();
    const { isAuthenticated, signOut, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch subscription status
    const fetchSubscription = useCallback(async () => {
        try {
            const status = await subscriptionService.getStatus();
            setSubscription(status);

            // If subscription is now active, redirect to home
            if (status.isActive) {
                navigate('/', { replace: true });
            }
        } catch (err) {
            console.error('Error fetching subscription:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                navigate('/login', { replace: true });
            } else {
                void fetchSubscription();
            }
        }
    }, [isAuthenticated, authLoading, navigate, fetchSubscription]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login', { replace: true });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchSubscription();
    };

    const handleCheckout = async () => {
        setIsCheckoutLoading(true);
        setError(null);
        try {
            const url = await subscriptionService.createCheckoutSession();
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? localizeError(err.message) : t("auth:failedToStartCheckout"));
            setIsCheckoutLoading(false);
        }
    };

    const handleManageSubscription = async () => {
        setIsPortalLoading(true);
        setError(null);
        try {
            const url = await subscriptionService.createPortalSession();
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? localizeError(err.message) : t("auth:failedToOpenSubscriptionManagement"));
            setIsPortalLoading(false);
        }
    };

    // Format date nicely
    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat(activeLanguage(), {
            dateStyle: 'long',
        }).format(new Date(dateString));
    };

    // Calculate time remaining for grace period
    const getTimeRemaining = (endsAt: string) => {
        const now = new Date();
        const end = new Date(endsAt);
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) return t('billing:expired');

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return t("auth:dayRemaining", { count: days });
        if (hours > 0) return t("auth:hourRemaining", { count: hours });
        return t("auth:lessThanAnHourRemaining");
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
                <p className="text-surface-500 dark:text-surface-400">{t("auth:loading2")}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-surface-900 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
                            <CreditCard className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">{t("auth:subscriptionRequired")}</h1>
                        <p className="text-primary-100 mt-2">{t("auth:accessToTheCommunityRequiresAnActiveSubscription")}</p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Grace Period Notice */}
                        {subscription?.inGracePeriod && subscription.currentPeriodEnd && (
                            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t("auth:gracePeriodActive")}</p>
                                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1"><Trans i18nKey="auth:sentence12" components={{ part0: <strong /> }} values={{ value0: ' ', value1: formatDate(subscription.currentPeriodEnd) }} /></p>
                                        <p className="text-sm text-amber-600 dark:text-amber-500 mt-1 font-medium">
                                            {getTimeRemaining(subscription.currentPeriodEnd)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Subscription Notice */}
                        {!subscription?.hasSubscription && (
                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-surface-400 dark:text-surface-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{t("auth:noActiveSubscription")}</p>
                                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                            {t("auth:youDonTHaveAnActiveSubscriptionPurchaseA")}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Expired Subscription */}
                        {subscription?.status === 'expired' && (
                            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{t("auth:subscriptionExpired")}</p>
                                        <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                                            {t("auth:yourSubscriptionHasExpiredRenewToContinueAccessingThe")}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Failed Payment */}
                        {subscription?.status === 'failed_payment' && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800 dark:text-red-300">{t("auth:paymentFailed")}</p>
                                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                                            {t("auth:thereWasAnIssueProcessingYourPaymentPleaseUpdate")}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-red-600 dark:text-red-400 text-center">{localizeError(error)}</p>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {/* Purchase/Renew Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={isCheckoutLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isCheckoutLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t("auth:redirecting")}</>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4" />
                                        {subscription?.hasSubscription ? t("auth:renewSubscription") : t("auth:getMembership")}
                                    </>
                                )}
                            </button>

                            {/* Manage Subscription (for existing customers) */}
                            {subscription?.hasSubscription && (
                                <button
                                    onClick={handleManageSubscription}
                                    disabled={isPortalLoading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {isPortalLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t("auth:opening")}</>
                                    ) : (
                                        <>
                                            <Settings className="w-4 h-4" />
                                            {t("auth:manageSubscription")}</>
                                    )}
                                </button>
                            )}

                            {/* Refresh Status */}
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                {isRefreshing ? t("common:uiChecking") : t("auth:checkSubscriptionStatus")}
                            </button>
                        </div>

                        {/* Help text */}
                        <p className="text-sm text-surface-500 dark:text-surface-400 text-center">
                            {t("auth:alreadyPurchasedClickCheckSubscriptionStatusToRefreshIf")}</p>

                        {/* Divider */}
                        <div className="border-t border-surface-200 dark:border-surface-700" />

                        {/* Sign out button */}
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 rounded-lg font-medium transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            {t("auth:signOut")}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
