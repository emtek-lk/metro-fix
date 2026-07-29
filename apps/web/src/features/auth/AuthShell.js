import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Role } from '@metro-fix/core-types';
import { Login } from './Login';
import { Register } from './Register';
import { useMediaQuery } from '@metro-fix/ui';
import ThemeToggle from '../../theme/ThemeToggle';
export function AuthShell({ onAuthenticated }) {
    const [mode, setMode] = useState('login');
    const isCompact = useMediaQuery('(max-width: 820px)');
    const handleLoginSuccess = (data) => {
        const { accessToken, user } = data;
        const targetPath = user.role === Role.ADMIN ? '/admin' : '/dispatch';
        try {
            localStorage.setItem('metrofix_token', accessToken);
            localStorage.setItem('metrofix_user', JSON.stringify(user));
        }
        catch {
            // Storage fallback
        }
        onAuthenticated(user, accessToken, targetPath);
    };
    const handleRegistrationSuccess = (values) => {
        const role = values.role || Role.CUSTOMER;
        const targetPath = role === Role.ADMIN ? '/admin' : '/dispatch';
        const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const user = {
            id: `usr_${Date.now()}`,
            fullName: values.fullName,
            email: values.email,
            role: role,
            phoneNumber: values.phoneNumber || undefined,
            createdAt: new Date().toISOString(),
        };
        try {
            localStorage.setItem('metrofix_token', mockToken);
            localStorage.setItem('metrofix_user', JSON.stringify(user));
        }
        catch {
            // Storage fallback
        }
        onAuthenticated(user, mockToken, targetPath);
    };
    return (_jsx("div", { style: styles.screen, children: _jsxs("section", { style: { ...styles.card, ...(isCompact ? styles.cardCompact : undefined) }, children: [_jsxs("div", { style: { ...styles.cardHeader, ...(isCompact ? styles.cardHeaderCompact : undefined) }, children: [_jsxs("div", { style: styles.brandBlock, children: [_jsx("div", { style: styles.kicker, children: "Facility Management Platform" }), _jsx("h1", { style: styles.title, children: "METRO-FIX" }), _jsx("p", { style: styles.copy, children: "Managed Dispatch Facility Control Center" })] }), _jsx(ThemeToggle, {})] }), _jsxs("div", { style: { ...styles.toggleRow, ...(isCompact ? styles.toggleRowCompact : undefined) }, children: [_jsx("button", { type: "button", onClick: () => setMode('login'), style: { ...styles.toggleButton, ...(mode === 'login' ? styles.toggleActive : undefined) }, children: "Sign In" }), _jsx("button", { type: "button", onClick: () => setMode('register'), style: { ...styles.toggleButton, ...(mode === 'register' ? styles.toggleActive : undefined) }, children: "Register Profile" })] }), _jsx("div", { style: styles.formPanel, children: mode === 'login' ? (_jsx(Login, { onSuccess: handleLoginSuccess })) : (_jsx(Register, { onSubmit: handleRegistrationSuccess })) })] }) }));
}
const styles = {
    screen: {
        height: '100vh',
        maxHeight: '100vh',
        width: '100vw',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(12px, 2vw, 24px)',
        boxSizing: 'border-box',
        background: 'var(--app-background)',
        overflow: 'hidden',
    },
    card: {
        width: 'min(480px, 100%)',
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        background: 'var(--surface)',
        borderRadius: '24px',
        padding: 'clamp(20px, 3vw, 28px)',
        boxShadow: 'var(--shadow-elevated)',
        border: '1px solid var(--border-subtle)',
        boxSizing: 'border-box',
    },
    cardCompact: {
        borderRadius: '18px',
        padding: '16px',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '16px',
    },
    cardHeaderCompact: {
        flexDirection: 'row',
    },
    brandBlock: {
        flex: 1,
    },
    kicker: {
        fontSize: '0.74rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#f38808',
    },
    title: {
        margin: '4px 0 2px',
        fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
        lineHeight: 1.1,
        color: 'var(--text-primary)',
        fontWeight: 800,
    },
    copy: {
        margin: 0,
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
        fontSize: '0.84rem',
    },
    toggleRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '8px',
        marginBottom: '16px',
    },
    toggleButton: {
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface-strong)',
        color: 'var(--text-secondary)',
        borderRadius: '12px',
        padding: '10px 14px',
        fontWeight: 700,
        fontSize: '0.88rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    toggleRowCompact: {
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    toggleActive: {
        background: '#f38808',
        color: '#ffffff',
        borderColor: '#f38808',
    },
    formPanel: {
        background: 'var(--surface-elevated)',
        borderRadius: '18px',
        padding: '18px',
        border: '1px solid var(--border-subtle)',
    },
};
export default AuthShell;
