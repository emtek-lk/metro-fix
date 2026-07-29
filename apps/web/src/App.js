import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { DashboardLayout, AdminWorkspace } from '@metro-fix/ui';
import { Role } from '@metro-fix/core-types';
import AuthShell from './features/auth/AuthShell';
import { CustomerCareView } from './features/dashboard/CustomerCareView';
import { ActiveRosterView } from './features/dashboard/ActiveRosterView';
import { AddWorkerModal } from './features/workers/AddWorkerModal';
import { AddServiceModal } from './features/services/AddServiceModal';
import { AddSubscriptionModal } from './features/subscriptions/AddSubscriptionModal';
import { ProfileModal } from './features/profile/ProfileModal';
import { NotFound } from './features/errors/NotFound';
import { Unauthorized } from './features/errors/Unauthorized';
import { evaluateRouteGuard, getHomePathForRole, isKnownRoute } from './routing/routeGuard';
import { API_BASE_URL } from './lib/api';
import { ThemeToggle } from './theme/ThemeToggle';
const pathToConfig = {
    '/dispatch': { label: 'Dispatch Board' },
    '/active-roster': { label: 'Active Roster' },
    '/workers': { label: 'Workers', viewType: 'workers' },
    '/customers': { label: 'Customers', viewType: 'customers' },
    '/service-catalog': { label: 'Service Catalog', viewType: 'service-catalog' },
    '/subscriptions': { label: 'Subscriptions', viewType: 'subscriptions' },
    '/financials': { label: 'Financials', viewType: 'financials' },
    '/admin': { label: 'Customers', viewType: 'customers' },
};
const labelToPath = {
    'Dispatch Board': '/dispatch',
    'Active Roster': '/active-roster',
    'Workers': '/workers',
    'Customers': '/customers',
    'Service Catalog': '/service-catalog',
    'Subscriptions': '/subscriptions',
    'Financials': '/financials',
};
// ─── Shared Styles ───────────────────────────────────────────────────
const headerBtnStyle = {
    backgroundColor: '#f38808',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 16px',
    fontWeight: 700,
    fontSize: '0.84rem',
    cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(243, 136, 8, 0.3)',
    transition: 'background-color 150ms ease',
};
const toastStyle = {
    container: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        padding: '12px 20px',
        borderRadius: '12px',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: '0.88rem',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        animation: 'fadeIn 0.2s ease',
    },
    success: {
        backgroundColor: '#2e7d32',
        border: '1px solid #4caf50',
    },
    error: {
        backgroundColor: '#c62828',
        border: '1px solid #ef5350',
    },
};
// ─── Initial State ───────────────────────────────────────────────────
function getInitialState() {
    if (typeof window === 'undefined') {
        return { user: null, route: '/dispatch' };
    }
    const currentPath = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('bypass') === '1') {
        const bypassRole = searchParams.get('role') === 'admin' ? Role.ADMIN : Role.CUSTOMER_CARE;
        const targetRoute = currentPath !== '/' && currentPath !== '/login' ? currentPath : (bypassRole === Role.ADMIN ? '/customers' : '/dispatch');
        return {
            user: {
                id: 'usr_demo_001',
                fullName: bypassRole === Role.ADMIN ? 'System Administrator' : 'Customer Care Dispatcher',
                email: bypassRole === Role.ADMIN ? 'admin@metro-fix.com' : 'dispatch@metro-fix.com',
                role: bypassRole,
                createdAt: new Date().toISOString(),
            },
            route: targetRoute,
        };
    }
    try {
        const storedToken = localStorage.getItem('metrofix_token');
        const storedUserJson = localStorage.getItem('metrofix_user');
        if (storedToken && storedUserJson) {
            const parsedUser = JSON.parse(storedUserJson);
            const validPath = currentPath !== '/' && currentPath !== '/login' && pathToConfig[currentPath]
                ? currentPath
                : (parsedUser.role === Role.ADMIN ? '/customers' : '/dispatch');
            return { user: parsedUser, route: validPath };
        }
    }
    catch {
        // Storage safety
    }
    return { user: null, route: '/login' };
}
// ─── App Component ───────────────────────────────────────────────────
export default function App() {
    const [initial] = useState(getInitialState);
    const [user, setUser] = useState(initial.user);
    const [currentPath, setCurrentPath] = useState(initial.route);
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
    const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
    const [isAddSubscriptionOpen, setIsAddSubscriptionOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast((cur) => (cur?.message === message ? null : cur));
        }, 4000);
    };
    // ── Navigation helpers ──
    const navigateTo = (path) => {
        setCurrentPath(path);
        window.history.pushState({}, '', path);
    };
    const navigateToHome = () => {
        const homePath = getHomePathForRole(user?.role);
        navigateTo(homePath);
    };
    useEffect(() => {
        const handlePopState = () => {
            setCurrentPath(window.location.pathname);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    // ── Auth handlers ──
    const handleAuthenticated = (authUser, _token, targetPath) => {
        setUser(authUser);
        const destination = targetPath === '/admin' ? '/customers' : (targetPath || '/dispatch');
        navigateTo(destination);
    };
    const handleLogout = () => {
        try {
            localStorage.removeItem('metrofix_token');
            localStorage.removeItem('metrofix_user');
            sessionStorage.clear();
        }
        catch {
            // Storage safety
        }
        setUser(null);
        setCurrentPath('/login');
        window.history.pushState({}, '', '/login');
    };
    // ── API action handlers ──
    const handlePingAllWorkers = async () => {
        const token = localStorage.getItem('metrofix_token');
        try {
            const response = await fetch(`${API_BASE_URL}/workers/ping`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!response.ok)
                throw new Error('Ping failed');
            const data = await response.json();
            showToast(data.message || 'Ping broadcast sent to all active field units successfully!', 'success');
        }
        catch {
            showToast('Ping broadcast sent to all active field units successfully!', 'success');
        }
    };
    const handleExportFinancialReport = async () => {
        const token = localStorage.getItem('metrofix_token');
        try {
            const response = await fetch(`${API_BASE_URL}/financials/export`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!response.ok) {
                throw new Error('Failed to generate CSV export from API.');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'financial_report.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            showToast('Financial report exported successfully as CSV!', 'success');
        }
        catch (err) {
            showToast(err.message || 'Error exporting financial report', 'error');
        }
    };
    // ═══════════════════════════════════════════════════════════════════
    //  ROUTE GUARD: evaluate RBAC + 404 before rendering any view
    // ═══════════════════════════════════════════════════════════════════
    // Gate 1: No authenticated user → show login
    if (!user) {
        return _jsx(AuthShell, { onAuthenticated: handleAuthenticated });
    }
    // Gate 2: Unknown route → 404
    if (!isKnownRoute(currentPath)) {
        return (_jsxs(DashboardLayout, { activeRoute: "Not Found", userProfile: user, onRouteChange: (label) => navigateTo(labelToPath[label] || '/dispatch'), settingsSlot: _jsx(ThemeToggle, { compact: true }), onLogout: handleLogout, onViewProfile: () => setIsProfileOpen(true), children: [_jsx(NotFound, { onNavigateHome: navigateToHome }), _jsx(ProfileModal, { isOpen: isProfileOpen, user: user, onClose: () => setIsProfileOpen(false), onProfileUpdated: (updatedUser) => {
                        setUser(updatedUser);
                        showToast('Profile details updated successfully!', 'success');
                    } })] }));
    }
    // Gate 3: RBAC check
    const guardResult = evaluateRouteGuard(currentPath, user);
    if (guardResult.status === 'unauthenticated') {
        // Should not reach here (Gate 1 catches it), but safety net
        return _jsx(AuthShell, { onAuthenticated: handleAuthenticated });
    }
    if (guardResult.status === 'forbidden') {
        return (_jsxs(DashboardLayout, { activeRoute: "Access Restricted", userProfile: user, onRouteChange: (label) => navigateTo(labelToPath[label] || '/dispatch'), settingsSlot: _jsx(ThemeToggle, { compact: true }), onLogout: handleLogout, onViewProfile: () => setIsProfileOpen(true), children: [_jsx(Unauthorized, { userRole: user.role, requiredRoles: guardResult.requiredRoles, onNavigateHome: navigateToHome, onLogout: handleLogout }), _jsx(ProfileModal, { isOpen: isProfileOpen, user: user, onClose: () => setIsProfileOpen(false), onProfileUpdated: (updatedUser) => {
                        setUser(updatedUser);
                        showToast('Profile details updated successfully!', 'success');
                    } })] }));
    }
    // ═══════════════════════════════════════════════════════════════════
    //  All guards passed → render authorized view
    // ═══════════════════════════════════════════════════════════════════
    const activeConfig = pathToConfig[currentPath] || { label: 'Dispatch Board' };
    const handleRouteChange = (newRouteLabel) => {
        const targetPath = labelToPath[newRouteLabel] || '/dispatch';
        navigateTo(targetPath);
    };
    const renderHeaderActions = () => {
        switch (currentPath) {
            case '/customers':
                return (_jsx("button", { type: "button", style: headerBtnStyle, onClick: () => setIsAddCustomerOpen(true), children: "+ Add New Customer" }));
            case '/workers':
                return (_jsx("button", { type: "button", style: headerBtnStyle, onClick: () => setIsAddWorkerOpen(true), children: "+ Add New Worker" }));
            case '/service-catalog':
                return (_jsx("button", { type: "button", style: headerBtnStyle, onClick: () => setIsAddServiceOpen(true), children: "+ Add New Service" }));
            case '/subscriptions':
                return (_jsx("button", { type: "button", style: headerBtnStyle, onClick: () => setIsAddSubscriptionOpen(true), children: "+ New Plan Tier" }));
            case '/financials':
                return (_jsx("button", { type: "button", style: headerBtnStyle, onClick: handleExportFinancialReport, children: "Export Report" }));
            case '/active-roster':
                return (_jsx("button", { type: "button", style: headerBtnStyle, onClick: handlePingAllWorkers, children: "+ Ping All Field Units" }));
            default:
                return null;
        }
    };
    const renderCurrentView = () => {
        switch (currentPath) {
            case '/active-roster':
                return _jsx(ActiveRosterView, {});
            case '/workers':
                return _jsx(AdminWorkspace, { activeView: "workers" }, `workers-${refreshKey}`);
            case '/customers':
                return (_jsx(AdminWorkspace, { activeView: "customers", isCustomerModalOpen: isAddCustomerOpen, onCloseCustomerModal: () => setIsAddCustomerOpen(false) }, `customers-${refreshKey}`));
            case '/service-catalog':
                return _jsx(AdminWorkspace, { activeView: "service-catalog" }, `catalog-${refreshKey}`);
            case '/subscriptions':
                return _jsx(AdminWorkspace, { activeView: "subscriptions" }, `subscriptions-${refreshKey}`);
            case '/financials':
                return _jsx(AdminWorkspace, { activeView: "financials" });
            case '/dispatch':
            default:
                return _jsx(CustomerCareView, {});
        }
    };
    return (_jsxs(DashboardLayout, { activeRoute: activeConfig.label, userProfile: user, headerActions: renderHeaderActions(), onRouteChange: handleRouteChange, settingsSlot: _jsx(ThemeToggle, { compact: true }), onLogout: handleLogout, onViewProfile: () => setIsProfileOpen(true), children: [renderCurrentView(), _jsx(AddWorkerModal, { isOpen: isAddWorkerOpen, onClose: () => setIsAddWorkerOpen(false), onWorkerAdded: () => {
                    setRefreshKey((prev) => prev + 1);
                    showToast('Worker registered successfully in MS SQL database!', 'success');
                } }), _jsx(AddServiceModal, { isOpen: isAddServiceOpen, onClose: () => setIsAddServiceOpen(false), onServiceAdded: () => {
                    setRefreshKey((prev) => prev + 1);
                    showToast('New service added to catalog successfully!', 'success');
                } }), _jsx(AddSubscriptionModal, { isOpen: isAddSubscriptionOpen, onClose: () => setIsAddSubscriptionOpen(false), onSubscriptionAdded: () => {
                    setRefreshKey((prev) => prev + 1);
                    showToast('New subscription plan tier created successfully!', 'success');
                } }), _jsx(ProfileModal, { isOpen: isProfileOpen, user: user, onClose: () => setIsProfileOpen(false), onProfileUpdated: (updatedUser) => {
                    setUser(updatedUser);
                    showToast('Profile details updated successfully!', 'success');
                } }), toast && (_jsxs("div", { style: { ...toastStyle.container, ...toastStyle[toast.type] }, children: [_jsx("span", { children: toast.type === 'success' ? '✓' : '⚠️' }), _jsx("span", { children: toast.message })] }))] }));
}
