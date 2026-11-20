import { emojiPickerLabels } from '@/i18n/emoji';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import DOMPurify, { type Config } from 'dompurify';
import type { EmojiClickData } from 'emoji-picker-react';
import { Theme } from 'emoji-picker-react';
import { Bold, Italic, Link, List, ListOrdered, Smile, Underline } from 'lucide-react';

const EmojiPicker = lazy(() => import('emoji-picker-react'));

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    initialValue?: string;
}

const SANITIZE_OPTIONS: Config = {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'style', 'class'],
};

export default function RichTextEditor({ value, onChange, placeholder, className = '', initialValue }: RichTextEditorProps) {
    useTranslation();
    const editorRef = useRef<HTMLDivElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        if (!editorRef.current) return;
        const next = DOMPurify.sanitize(initialValue || value || '', SANITIZE_OPTIONS);
        if (editorRef.current.innerHTML !== next) editorRef.current.innerHTML = next;
    }, [initialValue, value]);

    const emitChange = () => {
        if (!editorRef.current) return;
        const sanitized = DOMPurify.sanitize(editorRef.current.innerHTML, SANITIZE_OPTIONS);
        if (editorRef.current.innerHTML !== sanitized) editorRef.current.innerHTML = sanitized;
        onChange(sanitized);
    };

    const runCommand = (command: string, commandValue?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, commandValue);
        emitChange();
    };

    const addLink = () => {
        const url = window.prompt(t("posts:enterAnHTTPSURL"));
        if (!url) return;
        try {
            const parsed = new URL(url);
            if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error();
            runCommand('createLink', parsed.toString());
        } catch {
            window.alert(t("posts:pleaseEnterAValidHTTPOrHTTPSURL"));
        }
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        editorRef.current?.focus();
        document.execCommand('insertText', false, emojiData.emoji);
        emitChange();
        setShowEmojiPicker(false);
    };

    const tools = [
        { label: t("posts:bold"), icon: Bold, action: () => runCommand('bold') },
        { label: t("posts:italic"), icon: Italic, action: () => runCommand('italic') },
        { label: t("posts:underline"), icon: Underline, action: () => runCommand('underline') },
        { label: t("posts:bulletedList"), icon: List, action: () => runCommand('insertUnorderedList') },
        { label: t("posts:numberedList"), icon: ListOrdered, action: () => runCommand('insertOrderedList') },
        { label: t("posts:link"), icon: Link, action: addLink },
    ];

    return (
        <div className={`rich-text-editor ${className} relative rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden`}>
            <div className="flex items-center gap-1 p-2 pr-12 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                {tools.map(({ label, icon: Icon, action }) => (
                    <button key={label} type="button" onClick={action} className="p-2 rounded hover:bg-surface-200 dark:hover:bg-surface-700" title={label} aria-label={label}>
                        <Icon className="w-4 h-4" />
                    </button>
                ))}
            </div>
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute top-2 right-2 z-10 p-2 rounded hover:bg-surface-200 dark:hover:bg-surface-700" title={t("posts:addEmoji")} aria-label={t("posts:addEmoji")}>
                <Smile className="w-5 h-5 text-surface-500 dark:text-surface-400" />
            </button>
            {showEmojiPicker && (
                <>
                    <button type="button" aria-label={t("posts:closeEmojiPicker")} className="fixed inset-0 z-20 cursor-default" onClick={() => setShowEmojiPicker(false)} />
                    <div className="absolute top-12 right-2 z-30">
                        <Suspense fallback={<div className="w-[350px] h-[400px] animate-pulse bg-surface-100 dark:bg-surface-800 rounded-lg" />}>
                            <EmojiPicker {...emojiPickerLabels()} onEmojiClick={handleEmojiClick} autoFocusSearch={false} theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT} />
                        </Suspense>
                    </div>
                </>
            )}
            <div ref={editorRef} contentEditable role="textbox" aria-multiline="true" aria-label={placeholder || t("posts:postContent")} data-placeholder={placeholder}
                onInput={emitChange} onBlur={emitChange}
                className="min-h-[200px] p-4 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-surface-400"
                suppressContentEditableWarning />
        </div>
    );
}
