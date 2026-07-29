import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SubscriptionTier, FacilityType } from '@metro-fix/core-types';
import { API_BASE_URL } from '../../lib/api';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
export const addSubscriptionSchema = z.object({
    tierName: z.nativeEnum(SubscriptionTier),
    targetFacility: z.nativeEnum(FacilityType),
    monthlyFee: z.string().trim().min(1, 'Monthly fee is required'),
    includedServices: z.string().trim().min(5, 'Included services description is required'),
});
export function AddSubscriptionModal({ isOpen, onClose, onSubscriptionAdded }) {
    const [submitError, setSubmitError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const modalRef = useModalAccessibility(isOpen, onClose);
    const { register, handleSubmit, reset, formState: { errors }, } = useForm({
        resolver: zodResolver(addSubscriptionSchema),
        defaultValues: {
            tierName: SubscriptionTier.BASIC,
            targetFacility: FacilityType.COMMERCIAL,
            monthlyFee: '$499/mo',
            includedServices: 'Routine Soft Maintenance & Dispatch',
        },
    });
    if (!isOpen)
        return null;
    const onSubmit = async (values) => {
        setIsLoading(true);
        setSubmitError(null);
        const token = localStorage.getItem('metrofix_token');
        try {
            const response = await fetch(`${API_BASE_URL}/subscriptions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(values),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || 'Failed to create subscription plan tier.');
            }
            const createdPlan = await response.json();
            reset();
            onSubscriptionAdded(createdPlan);
            onClose();
        }
        catch (err) {
            setSubmitError(err.message || 'Network error occurred while creating subscription plan.');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { style: styles.overlay, onClick: onClose, children: _jsxs("div", { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "add-sub-title", tabIndex: -1, style: styles.modal, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { style: styles.header, children: [_jsxs("div", { children: [_jsx("h2", { id: "add-sub-title", style: styles.title, children: "Define New Subscription Plan Tier" }), _jsx("p", { style: styles.subtitle, children: "Set facility scope, monthly fee, and service coverage" })] }), _jsx("button", { type: "button", "aria-label": "Close modal", style: styles.closeBtn, onClick: onClose, children: "\u2715" })] }), submitError && (_jsx("div", { style: styles.errorBanner, children: _jsxs("span", { children: ["\u26A0\uFE0F ", submitError] }) })), _jsxs("form", { onSubmit: handleSubmit(onSubmit), style: styles.form, noValidate: true, children: [_jsxs("div", { style: styles.row, children: [_jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "tier-name", children: "Subscription Tier *" }), _jsxs("select", { id: "tier-name", ...register('tierName'), style: styles.select, children: [_jsx("option", { value: SubscriptionTier.BASIC, children: "Basic Tier" }), _jsx("option", { value: SubscriptionTier.PLUS, children: "Plus Tier" }), _jsx("option", { value: SubscriptionTier.PREMIUM, children: "Premium Tier" })] })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "target-facility", children: "Target Facility Type *" }), _jsxs("select", { id: "target-facility", ...register('targetFacility'), style: styles.select, children: [_jsx("option", { value: FacilityType.RESIDENTIAL, children: "Residential" }), _jsx("option", { value: FacilityType.COMMERCIAL, children: "Commercial" }), _jsx("option", { value: FacilityType.INDUSTRIAL, children: "Industrial" })] })] })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "monthly-fee", children: "Monthly Fee ($/mo) *" }), _jsx("input", { id: "monthly-fee", type: "text", ...register('monthlyFee'), placeholder: "e.g. $499/mo", style: {
                                        ...styles.input,
                                        ...(errors.monthlyFee ? styles.inputError : undefined),
                                    } }), errors.monthlyFee && _jsx("span", { style: styles.fieldError, children: errors.monthlyFee.message })] }), _jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "included-services", children: "Included Services & Features *" }), _jsx("textarea", { id: "included-services", rows: 3, ...register('includedServices'), placeholder: "e.g. 24/7 Priority Emergency Dispatch, Monthly HVAC Checkups", style: {
                                        ...styles.textarea,
                                        ...(errors.includedServices ? styles.inputError : undefined),
                                    } }), errors.includedServices && (_jsx("span", { style: styles.fieldError, children: errors.includedServices.message }))] }), _jsxs("div", { style: styles.actions, children: [_jsx("button", { type: "button", style: styles.cancelBtn, onClick: onClose, children: "Cancel" }), _jsx("button", { type: "submit", disabled: isLoading, style: styles.submitBtn, children: isLoading ? 'Creating Plan...' : 'Create Plan Tier' })] })] })] }) }));
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
        maxWidth: '520px',
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
    textarea: {
        padding: '10px 12px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'rgba(0, 0, 0, 0.25)',
        color: '#ffffff',
        boxSizing: 'border-box',
        fontSize: '0.9rem',
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'inherit',
    },
    select: {
        padding: '10px 12px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        background: '#1e3247',
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
export default AddSubscriptionModal;
