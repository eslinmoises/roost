import { t } from '@/i18n';
import { Home, Users, BookOpen, Calendar, Trophy, HelpCircle, MessageSquare, Rocket, Key, Lightbulb, Compass, Radio, type LucideIcon } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import type { FeatureAccess } from '@/contexts/SiteSettingsContext';

type FeatureKey = 'live_room' | 'activations' | 'roadmap' | 'showcase';
interface NavItem {
    name: string;
    href: string;
    icon: LucideIcon;
    premiumOnly?: boolean;
    featureKey?: FeatureKey;
}

const items: NavItem[] = [
    { get name() { return t("nav:home"); }, href: '/', icon: Home },
    { get name() { return t("nav:explore"); }, href: '/explore', icon: Compass },
    { get name() { return t("nav:classrooms"); }, href: '/classrooms', icon: BookOpen },
    { get name() { return t("nav:showcase"); }, href: '/showcase', icon: Rocket, featureKey: 'showcase' },
    { get name() { return t("nav:calendar"); }, href: '/calendar', icon: Calendar, premiumOnly: true },
    { get name() { return t("nav:members"); }, href: '/members', icon: Users },
    { get name() { return t("nav:leaderboard"); }, href: '/leaderboard', icon: Trophy },
    { get name() { return t("nav:messages"); }, href: '/messages', icon: MessageSquare, premiumOnly: true },
    { get name() { return t("nav:liveRoom"); }, href: '/live', icon: Radio, premiumOnly: true, featureKey: 'live_room' },
    { get name() { return t("nav:activations"); }, href: '/activations', icon: Key, premiumOnly: true, featureKey: 'activations' },
    { get name() { return t("nav:roadmapIssues"); }, href: '/roadmap', icon: Lightbulb, featureKey: 'roadmap' },
    { get name() { return t("nav:guide"); }, href: '/guide', icon: HelpCircle },
];

// Both menus use the same feature and membership rules, without changing the source items.
export function getNavigationItems(getFeatureAccess: (feature: FeatureKey) => FeatureAccess): NavItem[] {
    return items.flatMap(item => {
        if (item.href === '/leaderboard' && !APP_CONFIG.features.leaderboard) return [];
        if (!item.featureKey) return [{ ...item }];
        const access = getFeatureAccess(item.featureKey);
        return access === 'disabled' ? [] : [{ ...item, premiumOnly: access === 'premium_only' }];
    });
}
