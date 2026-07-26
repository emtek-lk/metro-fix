import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Role, registrationSchema } from '@metro-fix/core-types';
import { useMediaQuery } from '@metro-fix/ui';
import { BrandLogo } from '@metro-fix/ui';
const initialState = {
    fullName: '',
    email: '',
    phoneNumber: '',
    role: Role.Customer,
    password: '',
    confirmPassword: '',
    companyName: '',
    acceptTerms: true,
};
export function Register({ onSubmit }) {
    const [form, setForm] = useState(initialState);
    const [errors, setErrors] = useState({});
    const isCompact = useMediaQuery('(max-width: 820px)');
    const handleSubmit = (event) => {
        event.preventDefault();
        const result = registrationSchema.safeParse(form);
        if (!result.success) {
            setErrors(result.error.issues.reduce((collection, issue) => {
                const key = issue.path.join('.') || 'form';
                collection[key] = issue.message;
                return collection;
            }, {}));
            return;
        }
        setErrors({});
        onSubmit(result.data);
    };
    return (_jsxs("form", { onSubmit: handleSubmit, style: styles.form, children: [_jsx("img", { src: BrandLogo, alt: "Metro-Fix", style: styles.logo }), _jsxs("div", { style: { ...styles.row, ...(isCompact ? styles.rowCompact : undefined) }, children: [_jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "register-full-name", children: "Full name" }), _jsx("input", { id: "register-full-name", value: form.fullName, onChange: (event) => setForm((current) => ({ ...current, fullName: event.target.value })), style: styles.input, placeholder: "Ayesha Khan" }), errors.fullName && _jsx("span", { style: styles.errorText, children: errors.fullName })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "register-role", children: "Role" }), _jsx("select", { id: "register-role", value: form.role, onChange: (event) => setForm((current) => ({ ...current, role: event.target.value })), style: styles.input, children: Object.values(Role).map((role) => (_jsx("option", { value: role, children: role }, role))) })] })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "register-email", children: "Email" }), _jsx("input", { id: "register-email", type: "email", autoComplete: "email", value: form.email, onChange: (event) => setForm((current) => ({ ...current, email: event.target.value })), style: styles.input, placeholder: "name@company.com" }), errors.email && _jsx("span", { style: styles.errorText, children: errors.email })] }), _jsxs("div", { style: { ...styles.row, ...(isCompact ? styles.rowCompact : undefined) }, children: [_jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "register-phone", children: "Phone" }), _jsx("input", { id: "register-phone", value: form.phoneNumber ?? '', onChange: (event) => setForm((current) => ({ ...current, phoneNumber: event.target.value })), style: styles.input, placeholder: "+1 555 0100" })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "register-company", children: "Company" }), _jsx("input", { id: "register-company", value: form.companyName ?? '', onChange: (event) => setForm((current) => ({ ...current, companyName: event.target.value })), style: styles.input, placeholder: "MetroFix Group" })] })] }), _jsxs("div", { style: { ...styles.row, ...(isCompact ? styles.rowCompact : undefined) }, children: [_jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "register-password", children: "Password" }), _jsx("input", { id: "register-password", type: "password", autoComplete: "new-password", value: form.password, onChange: (event) => setForm((current) => ({ ...current, password: event.target.value })), style: styles.input, placeholder: "Minimum 8 characters" }), errors.password && _jsx("span", { style: styles.errorText, children: errors.password })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "register-confirm-password", children: "Confirm password" }), _jsx("input", { id: "register-confirm-password", type: "password", autoComplete: "new-password", value: form.confirmPassword, onChange: (event) => setForm((current) => ({ ...current, confirmPassword: event.target.value })), style: styles.input, placeholder: "Repeat password" }), errors.confirmPassword && _jsx("span", { style: styles.errorText, children: errors.confirmPassword })] })] }), _jsxs("label", { style: styles.checkboxRow, htmlFor: "register-terms", children: [_jsx("input", { id: "register-terms", type: "checkbox", checked: form.acceptTerms, onChange: (event) => setForm((current) => ({ ...current, acceptTerms: event.target.checked ? true : false })) }), _jsx("span", { children: "I accept the operational platform terms." })] }), errors.acceptTerms && _jsx("span", { style: styles.errorText, children: errors.acceptTerms }), _jsx("button", { type: "submit", style: styles.submitButton, children: "Create account" })] }));
}
const styles = {
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
    },
    logo: {
        display: 'block',
        maxWidth: '180px',
        height: 'auto',
        margin: '0 auto 24px auto',
    },
    row: {
        display: 'grid',
        gap: '16px',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    rowCompact: {
        gridTemplateColumns: '1fr',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '0.92rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
    },
    input: {
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid var(--border-subtle)',
        background: 'var(--surface)',
        color: 'var(--text-primary)',
        borderRadius: '14px',
        padding: '13px 14px',
        outline: 'none',
    },
    checkboxRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: 'var(--text-secondary)',
        fontSize: '0.92rem',
    },
    errorText: {
        color: '#b14f4f',
        fontSize: '0.84rem',
    },
    submitButton: {
        border: 'none',
        borderRadius: '14px',
        padding: '14px 18px',
        background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))',
        color: 'var(--text-inverse)',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: 'var(--shadow-elevated)',
    },
};
export default Register;
