import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../lib/api';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
export function AssignWorkerModal({ isOpen, jobId, jobTitle, onClose, onWorkerAssigned, }) {
    const modalRef = useModalAccessibility(isOpen, onClose);
    const [workers, setWorkers] = useState([]);
    const [selectedWorkerId, setSelectedWorkerId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!isOpen)
            return;
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('metrofix_token');
        fetch(`${API_BASE_URL}/workers`, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        })
            .then((res) => {
            if (!res.ok)
                throw new Error('Failed to fetch field workers list');
            return res.json();
        })
            .then((data) => {
            setIsLoading(false);
            const mapped = data.map((item) => ({
                id: item.id,
                fullName: item.user?.fullName || 'Field Worker',
                rating: item.rating ?? 5.0,
                servicePillars: item.servicePillars || [],
                isAvailable: item.isAvailable ?? true,
            }));
            setWorkers(mapped);
            if (mapped.length > 0) {
                setSelectedWorkerId(mapped[0].id);
            }
        })
            .catch((err) => {
            setIsLoading(false);
            setError(err.message || 'Error connecting to workers endpoint');
        });
    }, [isOpen]);
    if (!isOpen || !jobId)
        return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedWorkerId) {
            setError('Please select a worker from the list');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        const token = localStorage.getItem('metrofix_token');
        try {
            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/assign`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ workerId: selectedWorkerId }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.message || 'Failed to assign worker to service request.');
            }
            const assignedWorkerObj = workers.find((w) => w.id === selectedWorkerId);
            const workerName = assignedWorkerObj ? assignedWorkerObj.fullName : 'Worker';
            setIsSubmitting(false);
            onWorkerAssigned(workerName);
            onClose();
        }
        catch (err) {
            setIsSubmitting(false);
            setError(err.message || 'Failed to assign worker.');
        }
    };
    return (_jsx("div", { style: styles.overlay, onClick: onClose, children: _jsxs("div", { ref: modalRef, role: "dialog", "aria-modal": "true", "aria-labelledby": "assign-worker-title", tabIndex: -1, style: styles.modal, onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { style: styles.header, children: [_jsxs("div", { children: [_jsx("h2", { id: "assign-worker-title", style: styles.title, children: "Assign Worker to Service Ticket" }), _jsxs("p", { style: styles.subtitle, children: ["Ticket: ", _jsx("strong", { style: { color: '#f38808' }, children: jobTitle || jobId })] })] }), _jsx("button", { type: "button", "aria-label": "Close modal", style: styles.closeBtn, onClick: onClose, children: "\u2715" })] }), error && (_jsx("div", { style: styles.errorBanner, children: _jsxs("span", { children: ["\u26A0\uFE0F ", error] }) })), isLoading ? (_jsx("div", { style: styles.loadingState, children: _jsx("span", { children: "\uD83D\uDD04 Loading available field workers from database..." }) })) : (_jsxs("form", { onSubmit: handleSubmit, style: styles.form, children: [_jsxs("div", { style: styles.fieldGroup, children: [_jsx("label", { style: styles.label, htmlFor: "worker-select", children: "Select Dispatch Worker *" }), _jsx("select", { id: "worker-select", value: selectedWorkerId, onChange: (e) => setSelectedWorkerId(e.target.value), style: styles.select, children: workers.map((w) => (_jsxs("option", { value: w.id, children: [w.fullName, " (Rating: ", w.rating, " \u2605)", w.servicePillars && w.servicePillars.length > 0
                                                ? ` · [${w.servicePillars.join(', ')}]`
                                                : ''] }, w.id))) })] }), _jsxs("div", { style: styles.actions, children: [_jsx("button", { type: "button", style: styles.cancelBtn, onClick: onClose, children: "Cancel" }), _jsx("button", { type: "submit", disabled: isSubmitting, style: styles.submitBtn, children: isSubmitting ? 'Assigning...' : 'Dispatch Worker' })] })] }))] }) }));
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
        maxWidth: '500px',
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
        fontSize: '0.86rem',
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
    loadingState: {
        padding: '24px 0',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: 'rgba(255, 255, 255, 0.8)',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '0.86rem',
        fontWeight: 600,
        color: '#ffffff',
    },
    select: {
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        background: '#1e3247',
        color: '#ffffff',
        fontSize: '0.95rem',
        outline: 'none',
        cursor: 'pointer',
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
export default AssignWorkerModal;
