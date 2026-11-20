import { localizeError } from '@/i18n/errors';
import { useTranslation } from 'react-i18next';
import { t } from '@/i18n';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { Mail, Loader2, Eye, EyeOff, Shield, CheckCircle, RefreshCw } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';

type LoginStep = 'credentials' | '2fa' | 'email-not-confirmed';

export default function Login() {
    useTranslation();
    const navigate = useNavigate();

    // Form state
    const [email, setEmail] = useState(APP_CONFIG.demo.enabled ? APP_CONFIG.demo.email : '');
    const [password, setPassword] = useState(APP_CONFIG.demo.enabled ? APP_CONFIG.demo.password : '');
    const [showPassword, setShowPassword] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [mfaFactorId, setMfaFactorId] = useState('');

    // UI state
    const [step, setStep] = useState<LoginStep>('credentials');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [unconfirmedEmail, setUnconfirmedEmail] = useState<string>('');

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
                if (signInError.message.toLowerCase().includes('email not confirmed')) {
                    setUnconfirmedEmail(email);
                    setStep('email-not-confirmed');
                    return;
                }
                throw signInError;
            }

            const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
                supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
                supabase.auth.mfa.listFactors(),
            ]);
            if (assuranceError) throw assuranceError;
            if (factorsError) throw factorsError;

            if (assurance.nextLevel === 'aal2' && assurance.currentLevel !== 'aal2') {
                const verifiedFactor = factors.totp.find((factor) => factor.status === 'verified');
                if (!verifiedFactor) throw new Error(t("auth:yourTwoFactorConfigurationIsIncompleteContactSupport"));
                setMfaFactorId(verifiedFactor.id);
                setStep('2fa');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err instanceof Error ? localizeError(err.message) : t("auth:failedToSignIn"));
        } finally {
            setIsLoading(false);
        }
    };

    const handle2FASubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (!mfaFactorId) throw new Error(t("auth:noVerifiedAuthenticatorWasFoundSignInAgain"));
            const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
                factorId: mfaFactorId,
                code: twoFactorCode,
            });
            if (verifyError) throw verifyError;
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? localizeError(err.message) : t("auth:failedToVerifyCode"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToCredentials = () => {
        setStep('credentials');
        setTwoFactorCode('');
        setMfaFactorId('');
        setError(null);
        setResendStatus('idle');
    };

    const handleResendConfirmation = async () => {
        if (!unconfirmedEmail) return;

        setResendStatus('sending');
        setError(null);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: unconfirmedEmail,
            });

            if (error) {
                throw error;
            }

            setResendStatus('sent');
        } catch (err) {
            console.error('Error resending confirmation email:', err);
            setResendStatus('error');
            setError(err instanceof Error ? localizeError(err.message) : t("auth:failedToResendConfirmationEmail"));
        }
    };

    // Tab toggle component
    const TabToggle = ({ active }: { active: 'login' | 'signup' }) => (
        <div className="flex bg-surface-100 dark:bg-surface-800 rounded-xl p-1 mb-8">
            <Link
                to="/login"
                className={`flex-1 py-2.5 text-center text-sm font-medium rounded-lg transition-all duration-200 ${
                    active === 'login'
                        ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
                        : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                }`}
            >
                {t("auth:login")}</Link>
            {APP_CONFIG.features.signup && (
                <Link
                    to="/signup"
                    className={`flex-1 py-2.5 text-center text-sm font-medium rounded-lg transition-all duration-200 ${
                        active === 'signup'
                            ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-sm'
                            : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300'
                    }`}
                >
                    {t("auth:signUp")}</Link>
            )}
        </div>
    );

    // Email not confirmed step
    if (step === 'email-not-confirmed') {
        return (
            <div className="animate-fade-in">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                        {t("auth:emailNotConfirmed")}</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm">
                        {t("auth:pleaseConfirmYourEmailAddressToContinue")}</p>
                </div>

                {/* Email display */}
                <div className="bg-surface-100 dark:bg-surface-800 rounded-lg px-4 py-3 mb-6 text-center">
                    <p className="font-medium text-surface-900 dark:text-white text-sm">
                        {unconfirmedEmail}
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-surface-50 dark:bg-surface-800/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                        {t("auth:weVeSentAConfirmationLinkToYourEmail")}</p>
                    <ol className="text-sm text-surface-600 dark:text-surface-400 space-y-2 list-decimal list-inside">
                        <li>{t("auth:checkYourInboxAndSpamFolder")}</li>
                        <li>{t("auth:clickTheConfirmationLink")}</li>
                        <li>{t("auth:returnHereAndTryLoggingInAgain")}</li>
                    </ol>
                </div>

                {/* Resend status messages */}
                {resendStatus === 'sent' && (
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-4">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">{t("auth:confirmationEmailSent")}</span>
                    </div>
                )}

                {error && resendStatus === 'error' && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                        {localizeError(error)}
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={handleResendConfirmation}
                        disabled={resendStatus === 'sending' || resendStatus === 'sent'}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                        {resendStatus === 'sending' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t("auth:sending")}</>
                        ) : resendStatus === 'sent' ? (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                {t("auth:emailSent")}</>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                {t("auth:resendConfirmationEmail")}</>
                        )}
                    </button>

                    <button
                        onClick={handleBackToCredentials}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg font-medium transition-colors text-sm"
                    >
                        {t("auth:backToLogin2")}</button>
                </div>

                {/* Help text */}
                <p className="text-xs text-surface-500 mt-6 text-center">
                    {t("auth:didnTReceiveTheEmailCheckYourSpamFolder")}</p>
            </div>
        );
    }

    // Credentials step
    if (step === 'credentials') {
        return (
            <div className="animate-fade-in">
                {/* Tab Toggle */}
                <TabToggle active="login" />

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{APP_CONFIG.demo.enabled ? t("auth:exploreRoost") : t("auth:welcomeBack")}</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1 text-sm">{APP_CONFIG.demo.enabled ? t("auth:aSampleCommunityReadyForYouToExplore") : t("auth:signInToYourAccountToContinue")}</p>
                </div>

                {APP_CONFIG.demo.enabled && <p className="mb-6 rounded-xl bg-primary-50 p-4 text-sm text-primary-800 dark:bg-primary-900/30 dark:text-primary-200">{t("auth:useThePrefilledSharedLoginBelowThisDemoIs")}</p>}

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                        {localizeError(error)}
                    </div>
                )}

                {/* Login form */}
                <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                    {/* Email field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-surface-900 dark:text-surface-200 mb-1.5">
                            {t("auth:email")}</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t("auth:youExampleCom")}
                            required
                            className="input w-full"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Password field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-surface-900 dark:text-surface-200 mb-1.5">
                            {t("auth:password")}</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t("auth:enterYourPassword")}
                                required
                                className="input w-full pr-10"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Forgot password link */}
                    {!APP_CONFIG.demo.enabled && <div className="flex justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                        >
                            {t("auth:forgotPassword")}</Link>
                    </div>}

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-2.5"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{t("auth:signingIn")}</span>
                            </>
                        ) : (
                            <span>{APP_CONFIG.demo.enabled ? t("auth:exploreTheDemo") : t("auth:signIn")}</span>
                        )}
                    </button>
                </form>
            </div>
        );
    }

    // 2FA step
    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                    {t("auth:twoFactorAuthentication")}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-2 text-sm">
                    {t("auth:enterThe6DigitCodeFromYourAuthenticatorApp")}</p>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                    {localizeError(error)}
                </div>
            )}

            {/* 2FA form */}
            <form onSubmit={handle2FASubmit} className="space-y-5">
                <div>
                        <label htmlFor="twoFactorCode" className="block text-sm font-medium text-surface-900 dark:text-surface-200 mb-1.5">
                            {t("auth:verificationCode")}</label>
                        <input
                            id="twoFactorCode"
                            type="text"
                            value={twoFactorCode}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setTwoFactorCode(value);
                            }}
                            placeholder="000000"
                            required
                            maxLength={6}
                            className="input w-full text-center text-2xl tracking-widest font-mono"
                            disabled={isLoading}
                            autoFocus
                        />
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isLoading || twoFactorCode.length !== 6}
                    className="btn-primary w-full py-2.5"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t("auth:verifying")}</span>
                        </>
                    ) : (
                        <span>{t("auth:verifySignIn")}</span>
                    )}
                </button>
            </form>

            {/* Back to login */}
            <div className="mt-6 text-center">
                <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
                >
                    {t("auth:backToLogin3")}</button>
            </div>
        </div>
    );
}
