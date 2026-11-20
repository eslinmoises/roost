import { t } from '@/i18n';
import type {
    Profile,
    Showcase,
    ShowcaseImage,
    ShowcaseTag,
    ShowcaseReview,
    ShowcaseCategory,
    ShowcaseStatus,
} from './database';

// Showcase with author and related data
export interface ShowcaseWithDetails extends Showcase {
    author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
    images: ShowcaseImage[];
    tags: ShowcaseTag[];
    user_has_voted?: boolean;
    user_review?: ShowcaseReviewWithAuthor | null;
}

// Review with author profile
export interface ShowcaseReviewWithAuthor extends ShowcaseReview {
    author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

// Showcase card display (lighter version for lists)
export interface ShowcaseCardData {
    id: string;
    title: string;
    tagline: string;
    thumbnail_url: string | null;
    category: ShowcaseCategory;
    vote_count: number;
    review_count: number;
    average_rating: number;
    launch_date: string | null;
    is_featured: boolean;
    author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
    tags: Pick<ShowcaseTag, 'id' | 'name' | 'slug' | 'color'>[];
    user_has_voted?: boolean;
}

// Filter options for showcase listing
export interface ShowcaseFilters {
    category?: ShowcaseCategory;
    tagIds?: string[];
    sortBy?: 'newest' | 'votes' | 'rating' | 'featured';
    search?: string;
}

// Pagination options
export interface ShowcasePaginationOptions {
    page?: number;
    pageSize?: number;
}

// Admin moderation view
export interface ShowcaseForModeration extends Showcase {
    author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
    moderator?: Pick<Profile, 'id' | 'username' | 'display_name'> | null;
}

// Create/Update form data
export interface ShowcaseFormData {
    title: string;
    tagline: string;
    description: string;
    url: string;
    category: ShowcaseCategory;
    tech_stack: string[];
    tagIds: string[];
    thumbnailUrl?: string;
    imageUrls?: string[];
}

// Showcase stats for admin dashboard
export interface ShowcaseStats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    featured: number;
    thisMonth: number;
}

// Category display info
export const SHOWCASE_CATEGORY_INFO: Record<ShowcaseCategory, { label: string; icon: string; color: string }> = {
    web_app: { get label() { return t("common:metaWebApp"); }, icon: 'Globe', color: '#3B82F6' },
    mobile_app: { get label() { return t("common:metaMobileApp"); }, icon: 'Smartphone', color: '#8B5CF6' },
    saas: { get label() { return t("common:metaSaaS"); }, icon: 'Cloud', color: '#06B6D4' },
    tool: { get label() { return t("common:metaTool"); }, icon: 'Wrench', color: '#F59E0B' },
    api: { get label() { return t("common:metaAPI"); }, icon: 'Code', color: '#10B981' },
    website: { get label() { return t("common:metaWebsite"); }, icon: 'Layout', color: '#EC4899' },
    game: { get label() { return t("common:metaGame"); }, icon: 'Gamepad2', color: '#EF4444' },
    extension: { get label() { return t("common:metaExtension"); }, icon: 'Puzzle', color: '#84CC16' },
    other: { get label() { return t("common:metaOther"); }, icon: 'Package', color: '#6B7280' },
};

// Status display info
export const SHOWCASE_STATUS_INFO: Record<ShowcaseStatus, { label: string; color: string; bgColor: string }> = {
    pending: { get label() { return t("common:metaPendingReview"); }, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    approved: { get label() { return t("common:metaApproved"); }, color: 'text-green-600', bgColor: 'bg-green-100' },
    rejected: { get label() { return t("common:metaRejected"); }, color: 'text-red-600', bgColor: 'bg-red-100' },
    featured: { get label() { return t("common:metaFeatured"); }, color: 'text-purple-600', bgColor: 'bg-purple-100' },
};
