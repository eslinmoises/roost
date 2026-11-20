import { localizeError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ResetPassword() {
    useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

    // Password requirements
    const passwordRequirements = [
        { label: t("auth:atLeast8Characters"), test: (p: string) => p.length >= 8 },
        { label: t("auth:containsANumber"), test: (p: string) => /\d/.test(p) },
        { label: t("auth:containsALetter"), test: (p: string) => /[a-zA-Z]/.test(p) },
    ];

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsValidToken(false);
                setIsValidating(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/auth/validate-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();
                setIsValidToken(data.valid === true);
            } catch (err) {
                console.error('Error validating token:', err);
                setIsValidToken(false);
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError(t("auth:passwordsDoNotMatch"));
            return;
        }

        // Validate password requirements
        const allRequirementsMet = passwordRequirements.every((req) =>
            req.test(password)
        );
        if (!allRequirementsMet) {
            setError(t("auth:passwordDoesNotMeetAllRequirements"));
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || t("auth:failedToResetPassword"));
            }

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? localizeError(err.message) : t("auth:failedToResetPassword"));
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state while validating token
    if (isValidating) {
        return (
            <div className="card p-8 animate-fade-in text-center max-w-md w-full mx-auto">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                <p className="text-surface-500 dark:text-surface-400">{t("auth:verifyingResetLink")}</p>
            </div>
        );
    }

    // Invalid or expired token
    if (isValidToken === false) {
        return (
            <div className="card p-8 animate-fade-in text-center max-w-md w-full mx-auto">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">{t("auth:invalidOrExpiredLink")}</h1>
                <p className="text-surface-500 dark:text-surface-400 mb-6">
                    {t("auth:thisPasswordResetLinkIsInvalidOrHasExpired")}</p>
                <Link to="/forgot-password" className="btn-primary w-full py-2.5">
                    {t("auth:requestNewLink")}</Link>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="card p-8 animate-fade-in text-center max-w-md w-full mx-auto">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">{t("auth:passwordReset")}</h1>
                <p className="text-surface-500 dark:text-surface-400 mb-6">
                    {t("auth:yourPasswordHasBeenSuccessfullyResetRedirectingYouTo")}</p>
                <Link to="/login" className="btn-primary w-full py-2.5">
                    {t("auth:goToLogin")}</Link>
            </div>
        );
    }

    return (
        <div className="card p-8 animate-fade-in max-w-md w-full mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{t("auth:resetPassword2")}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-2">{t("auth:enterYourNewPasswordBelow")}</p>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{localizeError(error)}</span>
                </div>
            )}

            {/* Reset form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password field */}
                <div>
                    <label htmlFor="password" className="label">
                        {t("auth:newPassword")}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t("auth:enterNewPassword")}
                            required
                            className="input pl-10 pr-10"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {/* Password requirements */}
                    <div className="mt-2 space-y-1">
                        {passwordRequirements.map((req, index) => {
                            const isMet = req.test(password);
                            return (
                                <div
                                    key={index}
                                    className={`flex items-center gap-2 text-xs ${isMet ? 'text-green-600 dark:text-green-400' : 'text-surface-400 dark:text-surface-500'
                                        }`}
                                >
                                    <div
                                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isMet ? 'bg-green-600 border-green-600' : 'border-surface-300 dark:border-surface-600'
                                            }`}
                                    >
                                        {isMet && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <span>{req.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Confirm Password field */}
                <div>
                    <label htmlFor="confirmPassword" className="label">
                        {t("auth:confirmNewPassword")}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t("auth:confirmNewPassword2")}
                            required
                            className="input pl-10"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full py-2.5"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t("auth:resetting")}</span>
                        </>
                    ) : (
                        <span>{t("auth:resetPassword2")}</span>
                    )}
                </button>
            </form>
        </div>
    );
}
