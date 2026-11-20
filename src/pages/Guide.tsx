import { Trans } from 'react-i18next';
import { formatNumber } from '@/lib/locale';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { useState } from 'react';
import { APP_CONFIG } from '@/config/app';
import {
    BookOpen,
    Home,
    Users,
    MessageSquare,
    Calendar,
    Trophy,
    Settings,
    Bell,
    PenSquare,
    ChevronRight,
    CheckCircle,
    Sparkles,
    ZoomIn,
    X,
} from 'lucide-react';

// Step type with optional screenshot
interface GuideStep {
    title: string;
    description: string;
    tips: string[];
    screenshot?: {
        src: string;
        alt: string;
    };
}

interface GuideSection {
    id: string;
    title: string;
    icon: typeof Home;
    description: string;
    steps: GuideStep[];
}

// Guide section data with screenshots embedded in relevant steps


// Feature card component
function FeatureCard({ icon: Icon, title, description }: { icon: typeof Home; title: string; description: string }) {
    useTranslation();
    
    return (
        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-2">{title}</h3>
            <p className="text-sm text-surface-600 dark:text-surface-400">{description}</p>
        </div>
    );
}

// Screenshot lightbox state manager
function useScreenshotLightbox() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    return { selectedImage, setSelectedImage };
}

// Inline screenshot component
function InlineScreenshot({
    screenshot,
    onZoom
}: {
    screenshot: { src: string; alt: string };
    onZoom: (src: string) => void;
}) {
    useTranslation();
    return (
        <button
            onClick={() => onZoom(screenshot.src)}
            className="group relative w-full mt-4 rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all hover:shadow-lg"
        >
            <img
                src={screenshot.src}
                alt={screenshot.alt}
                className="w-full h-auto"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-surface-800 rounded-full p-3 shadow-lg">
                    <ZoomIn className="w-5 h-5 text-surface-700 dark:text-surface-300" />
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-sm font-medium">{screenshot.alt}</p>
            </div>
        </button>
    );
}

// Step card component with integrated screenshot
function StepCard({
    step,
    index,
    onZoom
}: {
    step: GuideStep;
    index: number;
    onZoom: (src: string) => void;
}) {
    useTranslation();
    return (
        <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-6 border border-surface-200 dark:border-surface-700">
            <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">{formatNumber(index + 1)}</span>
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-2">{step.title}</h4>
                    <p className="text-surface-600 dark:text-surface-400 text-sm mb-4">{step.description}</p>
                    <div className="space-y-2">
                        {step.tips.map((tip, tipIndex) => (
                            <div key={tipIndex} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-surface-600 dark:text-surface-400">{tip}</span>
                            </div>
                        ))}
                    </div>

                    {/* Inline screenshot for this step */}
                    {step.screenshot && (
                        <InlineScreenshot screenshot={step.screenshot} onZoom={onZoom} />
                    )}
                </div>
            </div>
        </div>
    );
}

// Lightbox component
function Lightbox({
    selectedImage,
    onClose
}: {
    selectedImage: string | null;
    onClose: () => void;
}) {
    useTranslation();
    if (!selectedImage) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
                <X className="w-6 h-6 text-white" />
            </button>
            <img
                src={selectedImage}
                alt={t("guide:screenshotPreview")}
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

// Navigation sidebar for guide sections
function GuideSidebar({
    sections,
    activeSection,
    onSectionClick
}: {
    sections: GuideSection[];
    activeSection: string;
    onSectionClick: (id: string) => void;
}) {
    useTranslation();
    return (
        <nav className="space-y-1">
            {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                    <button
                        key={section.id}
                        onClick={() => onSectionClick(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                            isActive
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
                        }`}
                    >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-surface-400'}`} />
                        <span className="font-medium">{section.title}</span>
                        <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${isActive ? 'rotate-90' : ''}`} />
                    </button>
                );
            })}
        </nav>
    );
}

export default function Guide() {
    const guideSections: GuideSection[] = [
    {
        id: 'getting-started',
        get title() { return t("guide:gettingStarted"); },
        icon: Sparkles,
        get description() { return t("guide:learnTheBasicsOfNavigatingAndUsingThePlatform"); },
        steps: [
            {
                get title() { return t("guide:setUpYourProfile"); },
                get description() { return t("guide:afterSigningInClickOnYourAvatarInThe"); },
                tips: [t("guide:useARecognizablePhoto"), t("guide:writeABriefBioAboutYourInterests"), t("guide:addYourLocationToConnectWithNearbyMembers")],
                screenshot: { src: '/guide-screenshots/settings.png', alt: t("guide:profileSettingsPage") },
            },
            {
                get title() { return t("guide:exploreTheHomeFeed"); },
                get description() { return t("guide:theHomeFeedShowsAllCommunityPostsYouCan"); },
                tips: [t("guide:useCategoryFiltersToFindRelevantContent"), t("guide:checkTheSidebarForTopContributors"), t("guide:clickOnMemberAvatarsToViewTheirProfiles")],
                screenshot: { src: '/guide-screenshots/home-feed.png', alt: t("guide:homeFeed") },
            },
            {
                get title() { return t("guide:joinClassrooms"); },
                get description() { return t("guide:classroomsAreSpecializedGroupsFocusedOnSpecificTopicsBrowse"); },
                tips: [t("guide:eachClassroomHasItsOwnFeedAndEvents"), t("guide:someClassroomsMayRequireApprovalToJoin"), t("guide:youCanLeaveAClassroomAnytimeFromItsSettings")],
                screenshot: { src: '/guide-screenshots/classrooms.png', alt: t("guide:classroomsPage") },
            },
        ],
    },
    {
        id: 'creating-posts',
        get title() { return t("guide:creatingPosts"); },
        icon: PenSquare,
        get description() { return t("guide:shareYourThoughtsQuestionsAndAchievementsWithTheCommunity"); },
        steps: [
            {
                get title() { return t("guide:startANewPost"); },
                get description() { return t("guide:clickTheCreatePostButtonOrThePostComposer"); },
                tips: [t("guide:chooseTheRightCategoryForBetterVisibility"), t("guide:descriptiveTitlesAttractMoreEngagement"), t("guide:youCanPostToTheMainFeedOrA")],
                screenshot: { src: '/guide-screenshots/home-feed.png', alt: t("guide:postComposerOnHomeFeed") },
            },
            {
                get title() { return t("guide:addRichContent"); },
                get description() { return t("guide:useTheRichTextEditorToFormatYourPost"); },
                tips: [t("guide:dragAndDropImagesDirectlyIntoTheEditor"), t("guide:youTubeAndVimeoLinksAreAutomaticallyEmbedded"), t("guide:useCodeBlocksForSharingCodeSnippets")],
            },
            {
                get title() { return t("guide:engageWithComments"); },
                get description() { return t("guide:afterPostingStayEngagedByRespondingToCommentsThis"); },
                tips: [t("guide:replyToCommentsToKeepTheConversationGoing"), t("guide:useMentionsToNotifySpecificMembers"), t("guide:pinImportantCommentsAsThePostAuthor")],
            },
        ],
    },
    {
        id: 'messaging',
        get title() { return t("guide:directMessaging"); },
        icon: MessageSquare,
        get description() { return t("guide:connectPrivatelyWithOtherCommunityMembers"); },
        steps: [
            {
                get title() { return t("guide:startAConversation"); },
                get description() { return t("guide:clickTheMessagesIconInTheNavigationBarTo"); },
                tips: [t("guide:yourRecentConversationsAppearInTheSidebar"), t("guide:unreadMessagesShowANotificationBadge"), t("guide:youCanSendTextImagesAndFiles")],
                screenshot: { src: '/guide-screenshots/messages.png', alt: t("guide:messagesPage") },
            },
            {
                get title() { return t("guide:messageFeatures"); },
                get description() { return t("guide:messagesSupportRealTimeDeliveryWithReadReceiptsYou"); },
                tips: [t("guide:blueCheckmarksIndicateReadMessages"), t("guide:pressEnterToSendShiftEnterForNewLine"), t("guide:attachFilesUsingThePaperclipIcon")],
            },
        ],
    },
    {
        id: 'events-calendar',
        get title() { return t("guide:eventsCalendar"); },
        icon: Calendar,
        get description() { return t("guide:discoverAndParticipateInCommunityEvents"); },
        steps: [
            {
                get title() { return t("guide:browseEvents"); },
                get description() { return t("guide:accessTheCalendarFromTheNavigationBarToSee"); },
                tips: [t("guide:clickOnADateToSeeEventsForThat"), t("guide:filterByClassroomToSeeSpecificEvents"), t("guide:upcomingEventsAlsoAppearInTheSidebar")],
                screenshot: { src: '/guide-screenshots/calendar.png', alt: t("guide:calendarView") },
            },
            {
                get title() { return t("guide:rSVPToEvents"); },
                get description() { return t("guide:clickOnAnEventToSeeItsDetailsIncluding"); },
                tips: [t("guide:youLlReceiveRemindersForEventsYouVeRSVP"), t("guide:seeWhoElseIsAttending"), t("guide:addEventsToYourPersonalCalendar")],
            },
            {
                get title() { return t("guide:createEventsModerators"); },
                get description() { return t("guide:ifYouReAClassroomModeratorOrAdminYou"); },
                tips: [t("guide:setClearTitlesAndDescriptions"), t("guide:includeAllRelevantDetailsLikeLinksOrLocation"), t("guide:eventsCanBeRecurringOrOneTime")],
            },
        ],
    },
    {
        id: 'leaderboard',
        get title() { return t("guide:leaderboardPoints"); },
        icon: Trophy,
        get description() { return t("guide:trackYourContributionsAndCompeteWithOtherMembers"); },
        steps: [
            {
                get title() { return t("guide:earningPoints"); },
                get description() { return t("guide:youEarnPointsForVariousActivitiesInTheCommunity"); },
                tips: [t("guide:creatingPosts10Points"), t("guide:comments5Points"), t("guide:receivingReactions12Points"), t("guide:hostingEvents15Points")],
            },
            {
                get title() { return t("guide:climbingTheLeaderboard"); },
                get description() { return t("guide:theLeaderboardShowsTopContributorsForThePast30"); },
                tips: [t("guide:checkYourCurrentRankOnYourProfile"), t("guide:viewTheFullLeaderboardFromTheSidebar"), t("guide:eachClassroomHasItsOwnLeaderboard")],
                screenshot: { src: '/guide-screenshots/leaderboard.png', alt: t("guide:leaderboardPage") },
            },
        ],
    },
    {
        id: 'notifications',
        get title() { return t("guide:notifications"); },
        icon: Bell,
        get description() { return t("guide:stayUpdatedOnActivityThatMattersToYou"); },
        steps: [
            {
                get title() { return t("guide:notificationTypes"); },
                get description() { return t("guide:youLlReceiveNotificationsForVariousActivitiesIncludingReplies"); },
                tips: [t("guide:clickTheBellIconToSeeAllNotifications"), t("guide:unreadNotificationsShowARedBadge"), t("guide:clickANotificationToGoDirectlyToTheContent")],
            },
            {
                get title() { return t("guide:managingNotifications"); },
                get description() { return t("guide:markNotificationsAsReadIndividuallyOrMarkAllAs"); },
                tips: [t("guide:swipeOrClickToMarkAsRead"), t("guide:useMarkAllReadToClearTheBadge"), 'Adjust preferences in Settings > Notifications'],
                screenshot: { src: '/guide-screenshots/settings.png', alt: t("guide:settingsPageForNotificationPreferences") },
            },
        ],
    },
    {
        id: 'members',
        get title() { return t("guide:memberDirectory"); },
        icon: Users,
        get description() { return t("guide:discoverAndConnectWithCommunityMembers"); },
        steps: [
            {
                get title() { return t("guide:browseMembers"); },
                get description() { return t("guide:accessTheMembersDirectoryFromTheNavigationBarBrowse"); },
                tips: [t("guide:greenDotIndicatesOnlineMembers"), t("guide:useSearchToFindSpecificMembers"), t("guide:filterByOnlineStatus")],
                screenshot: { src: '/guide-screenshots/members.png', alt: t("guide:membersDirectory") },
            },
            {
                get title() { return t("guide:memberProfiles"); },
                get description() { return t("guide:clickOnAnyMemberToViewTheirFullProfile"); },
                tips: [t("guide:seeTheirRecentPostsAndComments"), t("guide:viewTheirPointsAndRank"), t("guide:quickActionsForMessaging")],
                screenshot: { src: '/guide-screenshots/profile.png', alt: t("guide:memberProfilePage") },
            },
        ],
    },
];
    useTranslation();
    const [activeSection, setActiveSection] = useState('getting-started');
    const { selectedImage, setSelectedImage } = useScreenshotLightbox();

    const currentSection = guideSections.find((s) => s.id === activeSection) || guideSections[0];
    const Icon = currentSection.icon;

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        // Scroll to top of content on mobile
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-4">
                    <BookOpen className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-3">
                    {t("guide:platformGuide")}</h1>
                <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">{t("guide:everythingYouNeedToKnowToGetTheMost", { value1: APP_CONFIG.name })}</p>
            </div>

            {/* Quick Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                <FeatureCard
                    icon={Home}
                    title={t("guide:communityFeed")}
                    description={t("guide:shareAndDiscoverPostsFromMembers")}
                />
                <FeatureCard
                    icon={Users}
                    title={t("guide:classrooms")}
                    description={t("guide:joinTopicFocusedGroups")}
                />
                <FeatureCard
                    icon={MessageSquare}
                    title={t("guide:directMessages")}
                    description={t("guide:privateConversationsWithMembers")}
                />
                <FeatureCard
                    icon={Calendar}
                    title={t("guide:events")}
                    description={t("guide:discoverAndJoinCommunityEvents")}
                />
            </div>

            {/* Main Content with Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <h2 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-4 px-4">
                            {t("guide:guideSections")}</h2>
                        <GuideSidebar
                            sections={guideSections}
                            activeSection={activeSection}
                            onSectionClick={scrollToSection}
                        />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                        {/* Section Header */}
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-white">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{currentSection.title}</h2>
                                    <p className="text-primary-100 mt-1">{currentSection.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Steps with inline screenshots */}
                        <div className="p-8 space-y-6">
                            {currentSection.steps.map((step, index) => (
                                <StepCard
                                    key={index}
                                    step={step}
                                    index={index}
                                    onZoom={setSelectedImage}
                                />
                            ))}
                        </div>

                        {/* Navigation Footer */}
                        <div className="border-t border-surface-200 dark:border-surface-700 p-6 flex justify-between">
                            {guideSections.findIndex((s) => s.id === activeSection) > 0 ? (
                                <button
                                    onClick={() => {
                                        const currentIndex = guideSections.findIndex((s) => s.id === activeSection);
                                        if (currentIndex > 0) {
                                            scrollToSection(guideSections[currentIndex - 1].id);
                                        }
                                    }}
                                    className="flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                    {t("guide:previousSection")}</button>
                            ) : (
                                <div />
                            )}
                            {guideSections.findIndex((s) => s.id === activeSection) < guideSections.length - 1 ? (
                                <button
                                    onClick={() => {
                                        const currentIndex = guideSections.findIndex((s) => s.id === activeSection);
                                        if (currentIndex < guideSections.length - 1) {
                                            scrollToSection(guideSections[currentIndex + 1].id);
                                        }
                                    }}
                                    className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium"
                                >
                                    {t("guide:nextSection")}<ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <div />
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-8 bg-gradient-to-r from-surface-100 to-surface-50 dark:from-surface-800 dark:to-surface-900 rounded-2xl p-8 border border-surface-200 dark:border-surface-700">
                        <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
                            {t("guide:quickActions")}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <a
                                href="/"
                                className="flex items-center gap-3 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                            >
                                <Home className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <span className="font-medium text-surface-900 dark:text-surface-100">{t("guide:goToFeed")}</span>
                            </a>
                            <a
                                href="/classrooms"
                                className="flex items-center gap-3 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                            >
                                <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <span className="font-medium text-surface-900 dark:text-surface-100">{t("guide:browseClassrooms")}</span>
                            </a>
                            <a
                                href="/settings"
                                className="flex items-center gap-3 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                            >
                                <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <span className="font-medium text-surface-900 dark:text-surface-100">{t("guide:editSettings")}</span>
                            </a>
                        </div>
                    </div>

                    {/* Need Help */}
                    <div className="mt-6 text-center">
                        <p className="text-surface-500 dark:text-surface-400"><Trans i18nKey="guide:sentence15" components={{ part0: <a href="/messages" className="text-primary-600 dark:text-primary-400 hover:underline" /> }} values={{ value0: ' ', value1: ' ' }} /></p>
                    </div>
                </div>
            </div>

            {/* Lightbox for zoomed screenshots */}
            <Lightbox selectedImage={selectedImage} onClose={() => setSelectedImage(null)} />
        </div>
    );
}
