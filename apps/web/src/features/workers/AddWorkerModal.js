import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ServicePillar } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
export const addWorkerSchema = z.object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    email: z.string().trim().email('Enter a valid email address'),
    phoneNumber: z.string().trim().optional(),
    coverageZone: z.string().trim().optional(),
    servicePillars: z.array(z.nativeEnum(ServicePillar)).min(1, 'Select at least one service pillar'),
});
export function AddWorkerModal({ isOpen, onClose, onWorkerAdded }) {
    const [submitError, setSubmitError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const modalRef = useModalAccessibility(isOpen, onClose);
    const { register, handleSubmit, control, reset, formState: { errors }, } = useForm({
        resolver: zodResolver(addWorkerSchema),
        defaultValues: {
            fullName: '',
            email: '',
            phoneNumber: '',
            coverageZone: 'Colombo Central',
            servicePillars: [ServicePillar.HARD],
        },
    });
    if (!isOpen)
        return null;
    const onSubmit = async (values) => {
        setIsLoading(true);
        setSubmitError(null);
        const token = localStorage.getItem('metrofix_token');
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || 'Failed to register worker in database.');
            }
            const createdWorker = await response.json();
            reset();
            onWorkerAdded(createdWorker);
            onClose();
        }
        catch (err) {
            setSubmitError(err.message || 'Network error occurred while creating worker.');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { style: styles.overlay, onClick: onClose, children: _jsxs("div", { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "add-worker-title", tabIndex: -1, style: styles.modal, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { style: styles.header, children: [_jsxs("div", { children: [_jsx("h2", { id: "add-worker-title", style: styles.title, children: "Register New Field Technician" }), _jsx("p", { style: styles.subtitle, children: "Add a new worker to the active dispatch roster" })] }), _jsx("button", { type: "button", "aria-label": "Close modal", style: styles.closeBtn, onClick: onClose, children: "\u2715" })] }), submitError && (_jsx("div", { style: styles.errorBanner, children: _jsxs("span", { children: ["\u26A0\uFE0F ", submitError] }) })), _jsxs("form", { onSubmit: handleSubmit(onSubmit), style: styles.form, noValidate: true, children: [_jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "worker-fullName", children: "Full Name *" }), _jsx("input", { id: "worker-fullName", type: "text", ...register('fullName'), placeholder: "e.g. Priyantha Jayasinghe", style: {
                                        ...styles.input,
                                        ...(errors.fullName ? styles.inputError : undefined),
                                    } }), errors.fullName && _jsx("span", { style: styles.fieldError, children: errors.fullName.message })] }), _jsxs("div", { style: styles.row, children: [_jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "worker-email", children: "Email Address *" }), _jsx("input", { id: "worker-email", type: "email", ...register('email'), placeholder: "worker@metro-fix.com", style: {
                                                ...styles.input,
                                                ...(errors.email ? styles.inputError : undefined),
                                            } }), errors.email && _jsx("span", { style: styles.fieldError, children: errors.email.message })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "worker-phone", children: "Phone Number" }), _jsx("input", { id: "worker-phone", type: "text", ...register('phoneNumber'), placeholder: "+94 77 123 4567", style: styles.input })] })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "worker-zone", children: "Coverage Zone / Primary Location" }), _jsx("input", { id: "worker-zone", type: "text", ...register('coverageZone'), placeholder: "e.g. Colombo 03 / Port City Zone", style: styles.input })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, children: "Pillar Capabilities *" }), _jsx(Controller, { name: "servicePillars", control: control, render: ({ field }) => (_jsx("div", { style: styles.pillarOptions, children: [
                                            { value: ServicePillar.HARD, label: 'Hard Services (Electrical, Mechanical, HVAC)' },
                                            { value: ServicePillar.SOFT, label: 'Soft Services (Sanitization, Janitorial)' },
                                            { value: ServicePillar.STRATEGIC, label: 'Strategic (Compliance, Audits, Safety)' },
                                        ].map((pillar) => {
                                            const isChecked = field.value?.includes(pillar.value);
                                            return (_jsxs("label", { style: {
                                                    ...styles.pillarChip,
                                                    ...(isChecked ? styles.pillarChipActive : undefined),
                                                }, children: [_jsx("input", { type: "checkbox", value: pillar.value, checked: isChecked, onChange: (e) => {
                                                            const newVals = e.target.checked
                                                                ? [...(field.value || []), pillar.value]
                                                                : field.value.filter((val) => val !== pillar.value);
                                                            field.onChange(newVals);
                                                        }, style: { display: 'none' } }), _jsx("span", { children: isChecked ? '✓' : '+' }), " ", pillar.label] }, pillar.value));
                                        }) })) }), errors.servicePillars && (_jsx("span", { style: styles.fieldError, children: errors.servicePillars.message }))] }), _jsxs("div", { style: styles.actions, children: [_jsx("button", { type: "button", style: styles.cancelBtn, onClick: onClose, children: "Cancel" }), _jsx("button", { type: "submit", disabled: isLoading, style: styles.submitBtn, children: isLoading ? 'Creating Worker...' : 'Register Worker' })] })] })] }) }));
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
        maxWidth: '560px',
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
    inputError: {
        borderColor: '#fc8181',
        boxShadow: '0 0 0 1px #fc8181',
    },
    fieldError: {
        color: '#fc8181',
        fontSize: '0.78rem',
    },
    pillarOptions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    pillarChip: {
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'rgba(0, 0, 0, 0.2)',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '0.84rem',
        fontWeight: 600,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.15s ease',
    },
    pillarChipActive: {
        background: 'rgba(243, 136, 8, 0.25)',
        borderColor: '#f38808',
        color: '#ffffff',
    },
    actions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '12px',
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
export default AddWorkerModal;
