import { localizeError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, CheckCircle, MessageSquare, Users, Calendar, Star, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { APP_CONFIG } from '@/config/app';
import { subscriptionService } from '@/services/subscription';

export default function Upgrade() {
    useTranslation();
    const { profile, isPremium } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCheckout = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const url = await subscriptionService.createCheckoutSession();
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? localizeError(err.message) : t("billing:failedToStartCheckout"));
            setIsLoading(false);
        }
    };

    const premiumFeatures = [
        {
            icon: MessageSquare,
            title: t("billing:directMessaging"),
            description: t("billing:sendPrivateMessagesToAnyCommunityMember"),
        },
        {
            icon: Users,
            title: t("billing:premiumGroups"),
            description: t("billing:accessExclusivePremiumOnlyClassroomsAndContent"),
        },
        {
            icon: Calendar,
            title: t("billing:priorityEvents"),
            description: t("billing:earlyAccessToEventsAndExclusiveWorkshops"),
        },
        {
            icon: Star,
            title: t("billing:premiumBadge"),
            description: t("billing:standOutWithAPremiumBadgeOnYourProfile"),
        },
    ];

    const benefits = [
        t("billing:unlimitedDirectMessaging"),
        t("billing:accessToAllPremiumClassrooms"),
        t("billing:prioritySupportFromTheTeam"),
        t("billing:exclusiveContentAndResources"),
        t("billing:earlyAccessToNewFeatures"),
        t("billing:premiumProfileBadge"),
    ];

    // If user is already premium, show a different message
    if (isPremium) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="card p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Crown className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                        {t("billing:youReAlreadyPremium")}</h1>
                    <p className="text-surface-500 dark:text-surface-400 mb-6">
                        {t("billing:thankYouForBeingAPremiumMemberYouHave")}</p>
                    <Link
                        to="/"
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t("billing:backToCommunity")}</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Crown className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-surface-900 dark:text-surface-100 mb-3">
                    {t("billing:upgradeToPremium")}</h1>
                <p className="text-lg text-surface-500 dark:text-surface-400 max-w-xl mx-auto">{t("billing:unlockAllFeaturesAndGetTheMostOutOf", { value1: APP_CONFIG.name })}</p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
                {premiumFeatures.map((feature, index) => (
                    <div
                        key={index}
                        className="card p-6"
                    >
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-4">
                            <feature.icon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                            {feature.title}
                        </h3>
                        <p className="text-surface-500 dark:text-surface-400">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* CTA Card */}
            <div className="card p-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Benefits List */}
                    <div>
                        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-4">
                            {t("billing:everythingYouGetWithPremium")}</h2>
                        <ul className="space-y-3">
                            {benefits.map((benefit, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                    <span className="text-surface-700 dark:text-surface-300">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Upgrade CTA */}
                    <div className="text-center">
                        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
                            <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
                                {t("billing:premiumMembership")}</p>
                            <div className="mb-4">
                                <span className="text-4xl font-bold text-surface-900 dark:text-surface-100">
                                    {t("billing:joinNow")}</span>
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                                    {localizeError(error)}
                                </p>
                            )}

                            <button
                                onClick={handleCheckout}
                                disabled={isLoading}
                                className="w-full py-4 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{t("billing:redirectingToCheckout")}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t("billing:getPremiumAccess")}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                            <p className="text-xs text-surface-400 dark:text-surface-500 mt-4">
                                {t("billing:secureCheckoutViaStripe")}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Info */}
            {profile && (
                <div className="mt-8 text-center">
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                        {t("billing:signedInAs")} <span className="font-medium">{profile.display_name}</span>
                    </p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                        {t("billing:yourAccountWillBeAutomaticallyUpgradedAfterPurchase")}</p>
                </div>
            )}

            {/* Back Link */}
            <div className="mt-8 text-center">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{t("billing:backToCommunity")}</span>
                </Link>
            </div>
        </div>
    );
}
