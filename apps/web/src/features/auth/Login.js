import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@metro-fix/core-types';
import { BrandLogo } from '@metro-fix/ui';
import { API_BASE_URL } from '../../lib/api';
export function Login({ onSuccess }) {
    const [authError, setAuthError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });
    const onSubmit = async (values) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Invalid email address or password.');
            }
            const data = await response.json();
            // data: { accessToken: string, user: User }
            onSuccess(data);
        }
        catch (err) {
            setAuthError(err.message || 'Unable to connect to authentication server.');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit(onSubmit), style: styles.form, noValidate: true, children: [_jsx("div", { style: styles.logoWrapper, children: _jsx("img", { src: BrandLogo, alt: "Metro-Fix Logo", style: styles.logo }) }), _jsxs("div", { style: styles.headerGroup, children: [_jsx("h2", { style: styles.formTitle, children: "Sign In" }), _jsx("p", { style: styles.formSubtitle, children: "Access your METRO-FIX facility control center" })] }), authError && (_jsx("div", { style: styles.errorBanner, children: _jsxs("span", { children: ["\u26A0\uFE0F ", authError] }) })), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "login-email", children: "Email Address" }), _jsx("input", { id: "login-email", type: "email", autoComplete: "email", ...register('email'), style: {
                            ...styles.input,
                            ...(errors.email ? styles.inputError : undefined),
                        }, placeholder: "admin@metro-fix.com" }), errors.email && _jsx("span", { style: styles.errorText, children: errors.email.message })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "login-password", children: "Password" }), _jsx("input", { id: "login-password", type: "password", autoComplete: "current-password", ...register('password'), style: {
                            ...styles.input,
                            ...(errors.password ? styles.inputError : undefined),
                        }, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), errors.password && _jsx("span", { style: styles.errorText, children: errors.password.message })] }), _jsx("button", { type: "submit", disabled: isLoading, style: styles.submitButton, children: isLoading ? 'Signing In...' : 'Sign In' }), _jsxs("div", { style: styles.quickAccessBlock, children: [_jsx("div", { style: styles.quickAccessTitle, children: "Demo Credentials (Password: Password123!)" }), _jsxs("div", { style: styles.quickAccessBadges, children: [_jsxs("div", { style: styles.badgeItem, children: [_jsx("span", { style: styles.badgeRole, children: "Admin:" }), _jsx("code", { style: styles.code, children: "admin@metro-fix.com" })] }), _jsxs("div", { style: styles.badgeItem, children: [_jsx("span", { style: styles.badgeRole, children: "Dispatcher:" }), _jsx("code", { style: styles.code, children: "dispatch@metro-fix.com" })] })] })] })] }));
}
const styles = {
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
    },
    logoWrapper: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '4px',
    },
    logo: {
        display: 'block',
        maxHeight: '40px',
        width: 'auto',
    },
    headerGroup: {
        textAlign: 'center',
        marginBottom: '4px',
    },
    formTitle: {
        margin: '0 0 4px',
        fontSize: '1.35rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
    },
    formSubtitle: {
        margin: 0,
        fontSize: '0.84rem',
        color: 'var(--text-secondary)',
    },
    errorBanner: {
        padding: '10px 14px',
        background: '#8b0000',
        color: '#ffffff',
        borderRadius: '10px',
        fontSize: '0.85rem',
        fontWeight: 600,
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontSize: '0.84rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
    },
    input: {
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface)',
        color: 'var(--text-primary)',
        borderRadius: '12px',
        padding: '12px 14px',
        outline: 'none',
        fontSize: '0.92rem',
    },
    inputError: {
        borderColor: '#e53e3e',
        boxShadow: '0 0 0 1px #e53e3e',
    },
    errorText: {
        color: '#e53e3e',
        fontSize: '0.82rem',
        fontWeight: 500,
        marginTop: '2px',
    },
    submitButton: {
        border: 'none',
        borderRadius: '12px',
        padding: '13px 18px',
        background: '#f38808',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: '0.95rem',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(243, 136, 8, 0.35)',
        marginTop: '6px',
    },
    quickAccessBlock: {
        marginTop: '10px',
        padding: '12px',
        borderRadius: '12px',
        background: 'var(--surface-strong)',
        border: '1px solid var(--border-subtle)',
    },
    quickAccessTitle: {
        fontSize: '0.76rem',
        fontWeight: 700,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '6px',
    },
    quickAccessBadges: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    badgeItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.82rem',
    },
    badgeRole: {
        color: 'var(--text-secondary)',
        fontWeight: 600,
    },
    code: {
        background: '#2b435f',
        color: '#ffffff',
        padding: '2px 8px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
    },
};
export default Login;
