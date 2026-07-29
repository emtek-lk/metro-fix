import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
export function ProfileModal({ isOpen, user, onClose, onProfileUpdated, }) {
    const modalRef = useModalAccessibility(isOpen, onClose);
    const [fullName, setFullName] = useState(user.fullName || '');
    const [email, setEmail] = useState(user.email || '');
    const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (isOpen) {
            setFullName(user.fullName || '');
            setEmail(user.email || '');
            setPhoneNumber(user.phoneNumber || '');
            setPassword('');
            setConfirmPassword('');
            setError(null);
        }
    }, [isOpen, user]);
    if (!isOpen)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!fullName.trim()) {
            setError('Full name cannot be empty');
            return;
        }
        if (!email.trim()) {
            setError('Email address cannot be empty');
            return;
        }
        if (password && password !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        if (password && password.length < 8) {
            setError('New password must be at least 8 characters long');
            return;
        }
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('metrofix_token');
        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    phoneNumber,
                    ...(password ? { password } : {}),
                }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || 'Failed to update user profile.');
            }
            const updatedData = await response.json();
            const newProfile = {
                ...user,
                fullName: updatedData.fullName || fullName,
                email: updatedData.email || email,
                phoneNumber: updatedData.phoneNumber || phoneNumber,
            };
            try {
                localStorage.setItem('metrofix_user', JSON.stringify(newProfile));
            }
            catch {
                // Storage safety
            }
            setIsLoading(false);
            onProfileUpdated(newProfile);
            onClose();
        }
        catch (err) {
            setIsLoading(false);
            setError(err.message || 'Error updating profile.');
        }
    };
    return (_jsx("div", { style: styles.overlay, onClick: onClose, children: _jsxs("div", { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "profile-modal-title", tabIndex: -1, style: styles.modal, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { style: styles.header, children: [_jsxs("div", { children: [_jsx("h2", { id: "profile-modal-title", style: styles.title, children: "User Profile Management" }), _jsx("p", { style: styles.subtitle, children: "Update account info and credentials for Metro-Fix" })] }), _jsx("button", { type: "button", "aria-label": "Close modal", style: styles.closeBtn, onClick: onClose, children: "\u2715" })] }), error && (_jsx("div", { style: styles.errorBanner, children: _jsxs("span", { children: ["\u26A0\uFE0F ", error] }) })), _jsxs("form", { onSubmit: handleSubmit, style: styles.form, children: [_jsxs("div", { style: styles.badgeRow, children: [_jsxs("span", { style: styles.roleBadge, children: [user.role, " ROLE"] }), _jsxs("span", { style: styles.idText, children: ["User ID: ", user.id] })] }), _jsxs("div", { style: styles.row, children: [_jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "profile-fullname", children: "Full Name *" }), _jsx("input", { id: "profile-fullname", type: "text", value: fullName, onChange: (e) => setFullName(e.target.value), style: styles.input, required: true })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "profile-email", children: "Email Address *" }), _jsx("input", { id: "profile-email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), style: styles.input, required: true })] })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "profile-phone", children: "Phone Number" }), _jsx("input", { id: "profile-phone", type: "text", value: phoneNumber, onChange: (e) => setPhoneNumber(e.target.value), placeholder: "+94 77 123 4567", style: styles.input })] }), _jsx("div", { style: styles.divider }), _jsx("div", { style: styles.sectionHeader, children: "Change Password (Optional)" }), _jsxs("div", { style: styles.row, children: [_jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "profile-pass", children: "New Password" }), _jsx("input", { id: "profile-pass", type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", style: styles.input })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "profile-conf-pass", children: "Confirm New Password" }), _jsx("input", { id: "profile-conf-pass", type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", style: styles.input })] })] }), _jsxs("div", { style: styles.actions, children: [_jsx("button", { type: "button", style: styles.cancelBtn, onClick: onClose, children: "Cancel" }), _jsx("button", { type: "submit", disabled: isLoading, style: styles.submitBtn, children: isLoading ? 'Saving Changes...' : 'Save Profile' })] })] })] }) }));
}
const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
    },
    modal: {
        backgroundColor: '#2b435f',
        color: '#ffffff',
        borderRadius: '20px',
        padding: '24px',
        width: '100%',
        maxWidth: '540px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
    },
    title: {
        margin: '0 0 4px',
        fontSize: '1.25rem',
        fontWeight: 800,
        color: '#ffffff',
    },
    subtitle: {
        margin: 0,
        fontSize: '0.84rem',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '1.2rem',
        cursor: 'pointer',
        padding: '4px',
    },
    errorBanner: {
        backgroundColor: '#8b0000',
        color: '#ffffff',
        padding: '10px 14px',
        borderRadius: '10px',
        fontSize: '0.85rem',
        marginBottom: '16px',
        fontWeight: 600,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
    },
    badgeRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: '10px',
        fontSize: '0.82rem',
    },
    roleBadge: {
        backgroundColor: '#f38808',
        color: '#ffffff',
        fontWeight: 800,
        fontSize: '0.75rem',
        padding: '3px 8px',
        borderRadius: '6px',
        letterSpacing: '0.5px',
    },
    idText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'monospace',
    },
    row: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '12px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        fontSize: '0.84rem',
        fontWeight: 600,
        color: '#ffffff',
    },
    input: {
        padding: '10px 12px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'rgba(0, 0, 0, 0.25)',
        color: '#ffffff',
        boxSizing: 'border-box',
        fontSize: '0.9rem',
        outline: 'none',
    },
    divider: {
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        margin: '4px 0',
    },
    sectionHeader: {
        fontSize: '0.88rem',
        fontWeight: 700,
        color: '#f38808',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '8px',
    },
    cancelBtn: {
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 700,
    },
    submitBtn: {
        background: '#f38808',
        border: 'none',
        color: '#ffffff',
        padding: '10px 20px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 700,
        boxShadow: '0 4px 14px rgba(243, 136, 8, 0.4)',
    },
};
export default ProfileModal;
