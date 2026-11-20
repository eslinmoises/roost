import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

type Feature = 'live_room' | 'activations' | 'roadmap' | 'showcase';

export default function FeatureRoute({ feature, children }: { feature: Feature; children: ReactNode }) {
    useTranslation();
    const { isPremium } = useAuth();
    const { isFeatureEnabled, isLoading } = useSiteSettings();
    if (isLoading) return <div className="p-8 text-center">{t("auth:loading")}</div>;
    if (!isFeatureEnabled(feature, isPremium)) return <Navigate to={isPremium ? "/" : "/upgrade"} replace />;
    return children;
}
