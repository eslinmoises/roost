import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    FileText,
    Tag,
    Megaphone,
    ChevronLeft,
    Shield,
    CreditCard,
    Rocket,
    Database,
    Key,
    Radio,
    Settings,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type NavItem = {
    path: string;
    label: string;
    icon: typeof LayoutDashboard;
    end?: boolean;
    moderatorAccess?: boolean; // true = moderators can see this item
};

const navItems: NavItem[] = [
    { path: '/admin', get label() { return t("admin:dashboard"); }, icon: LayoutDashboard, end: true },
    { path: '/admin/users', get label() { return t("admin:users"); }, icon: Users },
    { path: '/admin/content', get label() { return t("admin:content"); }, icon: FileText, moderatorAccess: true },
    { path: '/admin/categories', get label() { return t("admin:categories"); }, icon: Tag },
    { path: '/admin/announcements', get label() { return t("admin:announcements"); }, icon: Megaphone },
    { path: '/admin/subscriptions', get label() { return t("admin:subscriptions"); }, icon: CreditCard },
    { path: '/admin/activations', get label() { return t("admin:activations"); }, icon: Key, moderatorAccess: true },
    { path: '/admin/showcases', get label() { return t("admin:showcases"); }, icon: Rocket, moderatorAccess: true },
    { path: '/admin/live-room', get label() { return t("admin:liveRoom"); }, icon: Radio },
    { path: '/admin/backups', get label() { return t("admin:backups"); }, icon: Database },
    { path: '/admin/site-settings', get label() { return t("admin:siteSettings"); }, icon: Settings },
];

export default function AdminLayout() {
    useTranslation();
    const [collapsed, setCollapsed] = useState(false);
    const { isPlatformAdmin, profile } = useAuth();
    const isModerator = profile?.role === 'moderator';

    // Filter nav items based on role
    const visibleNavItems = isModerator
        ? navItems.filter((item) => item.moderatorAccess)
        : navItems;

    // Moderators landing on /admin should redirect to their first allowed page
    if (isModerator && window.location.pathname === '/admin') {
        return <Navigate to="/admin/content" replace />;
    }

    return (
        <div className="h-screen bg-gray-50 dark:bg-surface-950 flex overflow-hidden">
            {/* Sidebar - Fixed height with sticky positioning */}
            <aside
                className={`bg-gray-900 dark:bg-surface-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
                    } flex flex-col h-screen sticky top-0 flex-shrink-0`}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700 dark:border-surface-700 flex-shrink-0">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-primary-400" />
                            <span className="font-semibold">{isPlatformAdmin ? t("admin:adminPanel") : t("admin:modPanel")}</span>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title={collapsed ? t("admin:expandSidebar") : t("admin:collapseSidebar")}
                    >
                        <ChevronLeft
                            className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
                        />
                    </button>
                </div>

                {/* Navigation - Scrollable if needed */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    <ul className="space-y-1 px-2">
                        {visibleNavItems.map(({ path, label, icon: Icon, end }) => (
                            <li key={path}>
                                <NavLink
                                    to={path}
                                    end={end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                            ? 'bg-primary-500 text-white'
                                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        }`
                                    }
                                    title={collapsed ? label : undefined}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {!collapsed && <span>{label}</span>}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Back to site - Always visible at bottom */}
                <div className="p-2 border-t border-gray-700 dark:border-surface-700 flex-shrink-0">
                    <NavLink
                        to="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        title={collapsed ? t("admin:backToSite") : undefined}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        {!collapsed && <span>{t("admin:backToSite")}</span>}
                    </NavLink>
                </div>
            </aside>

            {/* Main content - Scrollable independently */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
