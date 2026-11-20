import english from './en.json';
import spanish from './es.json';
import { emailText } from './index.js';

type NoticeKey = Extract<keyof typeof english, `notice_${string}`>;
const titleKeys: Record<string, NoticeKey[]> = {
  new_comment: ['notice_systemComment'], comment_reply: ['notice_systemReply'],
  new_reaction: ['notice_systemReactionPost', 'notice_systemReactionComment', 'notice_systemReactionShowcase'],
  new_message: ['notice_systemMessage', 'notice_subscriptionCancelled', 'notice_subscriptionExpired', 'notice_paymentFailed'],
  mention: ['notice_systemMention', 'notice_newMention'], new_follower: ['notice_systemFollower'],
};
const bodyKeys: Partial<Record<NoticeKey, NoticeKey>> = {
  notice_newMention: 'notice_mentionedYouInAComment',
  notice_subscriptionCancelled: 'notice_subscriptionCancelledBody',
  notice_subscriptionExpired: 'notice_subscriptionExpiredBody',
  notice_paymentFailed: 'notice_paymentFailedBody',
};

function translateStored(key: NoticeKey, text: string): string | undefined {
  for (const dictionary of [english, spanish]) {
    const template = dictionary[key];
    const variable = template.match(/\{\{(\w+)\}\}/);
    if (!variable) { if (template === text) return emailText(key); continue; }
    const [before, after] = template.split(variable[0]);
    if (!text.startsWith(before) || !text.endsWith(after)) continue;
    const value = text.slice(before.length, after ? -after.length : undefined);
    if (value) return emailText(key, { [variable[1]]: value });
  }
}

// Recognize only typed stock copy. Never translate member names or free-form excerpts.
export function notificationCopy(type: string, title: string, message?: string) {
  for (const key of titleKeys[type] ?? []) {
    const displayTitle = translateStored(key, title);
    if (displayTitle === undefined) continue;
    const bodyKey = bodyKeys[key];
    return { title: displayTitle, message: bodyKey && message ? translateStored(bodyKey, message) ?? message : message };
  }
  return { title, message };
}
