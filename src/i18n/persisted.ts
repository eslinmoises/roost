import i18n, { t } from './index';

function templateValues(template: string, text: string): Record<string, string> | undefined {
  const variable = template.match(/\{\{(\w+)\}\}/);
  if (!variable) return template === text ? {} : undefined;
  const [before, after] = template.split(variable[0]);
  if (!text.startsWith(before) || !text.endsWith(after)) return undefined;
  const value = text.slice(before.length, after ? -after.length : undefined);
  return value ? { [variable[1]]: value } : undefined;
}

function translateStored(namespace: string, key: string, text: string): string | undefined {
  for (const language of ['en', 'es']) {
    const template = i18n.getResource(language, namespace, key) as string | undefined;
    if (!template) continue;
    const values = templateValues(template, text);
    if (values) return t(`${namespace}:${key}`, values);
  }
}

const titleKeys: Record<string, string[]> = {
  new_comment: ['systemComment'], comment_reply: ['systemReply'],
  new_reaction: ['systemReactionPost', 'systemReactionComment', 'systemReactionShowcase'],
  new_message: ['systemMessage', 'subscriptionCancelled', 'subscriptionExpired', 'paymentFailed'],
  mention: ['systemMention', 'newMention'], new_follower: ['systemFollower'],
};

export function notificationCopy(type: string, title: string, message?: string | null) {
  let displayTitle = title;
  let displayMessage = message;
  for (const key of titleKeys[type] ?? []) {
    const translated = translateStored('notifications', key, title);
    if (translated === undefined) continue;
    displayTitle = translated;
    // Only these system producers write stock messages. Other messages are user excerpts.
    const bodyKey = key === 'newMention' ? 'mentionedYouInAComment'
      : ['subscriptionCancelled', 'subscriptionExpired', 'paymentFailed'].includes(key) ? `${key}Body` : undefined;
    if (bodyKey && message) displayMessage = translateStored('notifications', bodyKey, message) ?? message;
    break;
  }
  return { title: displayTitle, message: displayMessage };
}

const activityKeys: Record<string, string> = {
  post_created: 'storedPost', comment_created: 'storedComment', reaction_given: 'storedReactionGiven',
  reaction_received: 'storedReactionReceived', event_attended: 'storedEvent', showcase_approved: 'storedShowcase',
};
export function pointActivityDescription(type: string, description: string | null | undefined, fallback: string) {
  if (!description) return fallback;
  const key = activityKeys[type];
  return key ? translateStored('leaderboard', key, description) ?? description : description;
}

export function cleanupMessage(message: string) {
  const empty = translateStored('admin', 'cleanupEmpty', message);
  if (empty !== undefined) return empty;
  const source = i18n.getResource('en', 'admin', 'cleanupProcessed_other') as string;
  const values = templateValues(source, message);
  return values && /^\d+$/.test(values.count) ? t('admin:cleanupProcessed', { count: Number(values.count) }) : message;
}
