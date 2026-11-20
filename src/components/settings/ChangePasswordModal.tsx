import { localizeError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { useState } from 'react';
import { X, Eye, EyeOff, Loader2, Check, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '@/services/supabase';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleClose = () => {
        if (!isLoading) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError(null);
            setSuccess(false);
            onClose();
        }
    };

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return t("settings:passwordMustBeAtLeast8Characters");
        }
        if (!/[A-Z]/.test(password)) {
            return t("settings:passwordMustContainAtLeastOneUppercaseLetter");
        }
        if (!/[a-z]/.test(password)) {
            return t("settings:passwordMustContainAtLeastOneLowercaseLetter");
        }
        if (!/[0-9]/.test(password)) {
            return t("settings:passwordMustContainAtLeastOneNumber");
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!currentPassword) {
            setError(t("settings:currentPasswordIsRequired"));
            return;
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t("settings:newPasswordsDoNotMatch"));
            return;
        }

        if (currentPassword === newPassword) {
            setError(t("settings:newPasswordMustBeDifferentFromCurrentPassword"));
            return;
        }

        setIsLoading(true);

        try {
            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error(t("settings:youMustBeLoggedInToChangeYourPassword"));
            }

            // Call backend to verify current password and change it
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t("settings:failedToChangePassword"));
            }

            setSuccess(true);

            // Auto-close after success
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? localizeError(err.message) : t("settings:failedToChangePassword"));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 dark:bg-black/70"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-white dark:bg-surface-900 rounded-xl shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                            <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100">
                            {t("settings:changePassword")}</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="p-2 text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Success message */}
                    {success && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-3">
                            <Check className="w-5 h-5 flex-shrink-0" />
                            <span>{t("settings:passwordChangedSuccessfully")}</span>
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{localizeError(error)}</span>
                        </div>
                    )}

                    {!success && (
                        <>
                            {/* Current Password */}
                            <div>
                                <label htmlFor="currentPassword" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    {t("settings:currentPassword")}</label>
                                <div className="relative">
                                    <input
                                        id="currentPassword"
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder={t("settings:enterYourCurrentPassword")}
                                        className="input pr-10"
                                        disabled={isLoading}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    {t("settings:newPassword")}</label>
                                <div className="relative">
                                    <input
                                        id="newPassword"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder={t("settings:enterYourNewPassword")}
                                        className="input pr-10"
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1.5">
                                    {t("settings:atLeast8CharactersWithUppercaseLowercaseAndA")}</p>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    {t("settings:confirmNewPassword")}</label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={t("settings:confirmYourNewPassword")}
                                        className="input pr-10"
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg font-medium hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors disabled:opacity-50"
                                >
                                    {t("settings:cancel")}</button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{t("settings:changing")}</span>
                                        </>
                                    ) : (
                                        <span>{t("settings:changePassword")}</span>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
