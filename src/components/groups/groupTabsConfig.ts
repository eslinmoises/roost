import { t } from '@/i18n';
import { BookOpen, FileText, Video } from 'lucide-react';
import type { TabValue } from './GroupTabs';

export interface Tab {
    value: TabValue;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

export const groupTabs: Tab[] = [
    { value: 'feed', get label() { return t("groups:feed"); }, icon: BookOpen },
    { value: 'assets', get label() { return t("groups:assets"); }, icon: FileText },
    { value: 'recordings', get label() { return t("groups:recordings"); }, icon: Video },
];
