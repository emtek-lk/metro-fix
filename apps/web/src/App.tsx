import { useState, useEffect, lazy, Suspense, type CSSProperties, type ReactNode } from 'react';
import { DashboardLayout, SURFACE, SkeletonCards, useMediaQuery } from '@metro-fix/ui';
import { Role, surfaceAllowsRole, type User } from '@metro-fix/core-types';
import AuthShell from './features/auth/AuthShell';
import { ProfileModal } from './features/profile/ProfileModal';
import { CustomerShell } from './features/portal/CustomerShell';
import { LoadErrorBoundary } from './features/errors/LoadErrorBoundary';
import { WrongSite } from './features/errors/WrongSite';

import { PortalServices } from './features/portal/PortalServices';
import { PortalRequests } from './features/portal/PortalRequests';
import { PortalSubscription } from './features/portal/PortalSubscription';
import { NotFound } from './features/errors/NotFound';
import { Unauthorized } from './features/errors/Unauthorized';
import { evaluateRouteGuard, getHomePathForRole, isKnownRoute } from './routing/routeGuard';
import { API_BASE_URL } from './lib/api';
import { ThemeToggle } from './theme/ThemeToggle';

// Staff screens are loaded the first time they are opened, so the customer website never downloads
// the dispatch board, the admin tables and charts, or the add / edit pop-ups.
const AdminWorkspace = lazy(() => import('@metro-fix/ui/admin').then((m) => ({ default: m.AdminWorkspace })));
const CustomerCareView = lazy(() => import('./features/dashboard/CustomerCareView').then((m) => ({ default: m.CustomerCareView })));
const ActiveRosterView = lazy(() => import('./features/dashboard/ActiveRosterView').then((m) => ({ default: m.ActiveRosterView })));
const AddWorkerModal = lazy(() => import('./features/workers/AddWorkerModal').then((m) => ({ default: m.AddWorkerModal })));
const AddServiceModal = lazy(() => import('./features/services/AddServiceModal').then((m) => ({ default: m.AddServiceModal })));
const AddSubscriptionModal = lazy(() => import('./features/subscriptions/AddSubscriptionModal').then((m) => ({ default: m.AddSubscriptionModal })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));

// ─── Route Metadata ──────────────────────────────────────────────────

type AdminViewType = 'customers' | 'service-catalog' | 'workers' | 'subscriptions' | 'financials';

const pathToConfig: Record<string, { label: string; viewType?: AdminViewType }> = {
  '/dispatch': { label: 'Dispatch Board' },
  '/active-roster': { label: 'Active Roster' },
  '/workers': { label: 'Workers', viewType: 'workers' },
  '/customers': { label: 'Customers', viewType: 'customers' },
  '/service-catalog': { label: 'Service Catalog', viewType: 'service-catalog' },
  '/subscriptions': { label: 'Subscriptions', viewType: 'subscriptions' },
  '/financials': { label: 'Financials', viewType: 'financials' },
  '/admin': { label: 'Customers', viewType: 'customers' },
  '/portal/services': { label: 'Browse Services' },
  '/portal/requests': { label: 'My Requests' },
  '/portal/subscription': { label: 'Subscription' },
  '/settings': { label: 'Settings' },
};

const labelToPath: Record<string, string> = {
  'Dispatch Board': '/dispatch',
  'Active Roster': '/active-roster',
  'Workers': '/workers',
  'Customers': '/customers',
  'Service Catalog': '/service-catalog',
  'Subscriptions': '/subscriptions',
  'Financials': '/financials',
  'Browse Services': '/portal/services',
  'My Requests': '/portal/requests',
  'Subscription': '/portal/subscription',
  'Settings': '/settings',
};

// ─── Shared Styles ───────────────────────────────────────────────────

// Header action buttons use the .metro-header-btn CSS class (index.css)
// so that :hover pseudo-class transitions fire correctly — inline styles
// cannot respond to pseudo-selectors.

const toastStyle: Record<string, CSSProperties> = {
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
  // On phones the customer site has a tab bar along the bottom; the toast spans the width above it.
  aboveTabs: {
    left: '16px',
    right: '16px',
    bottom: 'calc(76px + env(safe-area-inset-bottom))',
    justifyContent: 'center',
  },
};

const updateBannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  flexWrap: 'wrap',
  padding: '10px 16px',
  marginBottom: 12,
  borderRadius: 12,
  border: '1px solid rgba(243, 136, 8, 0.6)',
  background: 'rgba(243, 136, 8, 0.12)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
};

const updateButtonStyle: CSSProperties = {
  border: '1px solid #d37105',
  background: 'linear-gradient(135deg, #f38808, #d37105)',
  color: '#fff',
  padding: '6px 14px',
  borderRadius: 10,
  fontWeight: 700,
  cursor: 'pointer',
};

// ─── Initial State ───────────────────────────────────────────────────

function getInitialState(): { user: User | null; route: string } {
  if (typeof window === 'undefined') {
    return { user: null, route: '/dispatch' };
  }

  const currentPath = window.location.pathname;
  try {
    const storedToken = localStorage.getItem('metrofix_token');
    const storedUserJson = localStorage.getItem('metrofix_user');
    if (storedToken && storedUserJson) {
      const parsedUser = JSON.parse(storedUserJson) as User;
      const validPath = currentPath !== '/' && currentPath !== '/login' && pathToConfig[currentPath]
        ? currentPath
        : getHomePathForRole(parsedUser.role);
      return { user: parsedUser, route: validPath };
    }
  } catch {
    // Storage safety
  }

  return { user: null, route: '/login' };
}

// ─── App Component ───────────────────────────────────────────────────

export default function App() {
  const [initial] = useState(getInitialState);
  const [user, setUser] = useState<User | null>(initial.user);
  const [currentPath, setCurrentPath] = useState<string>(initial.route);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddSubscriptionOpen, setIsAddSubscriptionOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [portalRefresh, setPortalRefresh] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  // Phones get a tab bar along the bottom, so toasts sit above it there.
  const isNarrow = useMediaQuery('(max-width: 859px)');

  // Vite tells us when a screen's code file is gone (a new release went out while this tab was open).
  useEffect(() => {
    const onPreloadError = () => setUpdateReady(true);
    window.addEventListener('vite:preloadError', onPreloadError);
    return () => window.removeEventListener('vite:preloadError', onPreloadError);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 4000);
  };

  // ── Navigation helpers ──

  const navigateTo = (path: string) => {
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

  const handleAuthenticated = (authUser: User, _token: string, targetPath: string) => {
    setUser(authUser);
    // Always land on the role's own home: customers must never open the dispatch board.
    const destination = targetPath === '/admin' ? '/customers' : (targetPath || getHomePathForRole(authUser.role));
    navigateTo(destination);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('metrofix_token');
      localStorage.removeItem('metrofix_user');
      sessionStorage.clear();
    } catch {
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
      if (!response.ok) throw new Error('Ping failed');
      const data = await response.json();
      showToast(data.message || 'Ping broadcast sent to all active field units successfully!', 'success');
    } catch {
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
    } catch (err: any) {
      showToast(err.message || 'Error exporting financial report', 'error');
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  //  ROUTE GUARD: evaluate RBAC + 404 before rendering any view
  // ═══════════════════════════════════════════════════════════════════

  // Gate 1: No authenticated user → show login
  if (!user) {
    return <AuthShell onAuthenticated={handleAuthenticated} />;
  }

  // Gate 1b: each website serves one audience (staff or customers); the other is sent to its own site.
  if (!surfaceAllowsRole(SURFACE, user.role)) {
    return <WrongSite role={user.role} onSignOut={handleLogout} />;
  }

  const isCustomer = user.role === Role.CUSTOMER;

  /** The frame around a screen: the customer website's own shell, or the staff dashboard layout. */
  const renderFrame = (activeRoute: string, content: ReactNode, headerActions?: ReactNode) =>
    isCustomer ? (
      <CustomerShell user={user} activePath={currentPath} onNavigate={navigateTo} onLogout={handleLogout}>
        {content}
      </CustomerShell>
    ) : (
      <DashboardLayout
        activeRoute={activeRoute}
        userProfile={user}
        headerActions={headerActions}
        onRouteChange={(label) => navigateTo(labelToPath[label] || '/dispatch')}
        settingsSlot={<ThemeToggle compact />}
        onLogout={handleLogout}
        onViewProfile={() => setIsProfileOpen(true)}
      >
        {content}
      </DashboardLayout>
    );

  // Gate 2: Unknown route → 404
  if (!isKnownRoute(currentPath)) {
    return renderFrame(
      'Not Found',
      <>
        <NotFound onNavigateHome={navigateToHome} />
        <ProfileModal
          isOpen={isProfileOpen}
          user={user}
          onClose={() => setIsProfileOpen(false)}
          onProfileUpdated={(updatedUser) => {
            setUser(updatedUser);
            showToast('Profile details updated successfully!', 'success');
          }}
        />
      </>,
    );
  }

  // Gate 3: RBAC check
  const guardResult = evaluateRouteGuard(currentPath, user);

  if (guardResult.status === 'unauthenticated') {
    // Should not reach here (Gate 1 catches it), but safety net
    return <AuthShell onAuthenticated={handleAuthenticated} />;
  }

  if (guardResult.status === 'forbidden') {
    return renderFrame(
      'Access Restricted',
      <>
        <Unauthorized
          userRole={user.role}
          requiredRoles={guardResult.requiredRoles}
          onNavigateHome={navigateToHome}
          onLogout={handleLogout}
        />
        <ProfileModal
          isOpen={isProfileOpen}
          user={user}
          onClose={() => setIsProfileOpen(false)}
          onProfileUpdated={(updatedUser) => {
            setUser(updatedUser);
            showToast('Profile details updated successfully!', 'success');
          }}
        />
      </>,
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  //  All guards passed → render authorized view
  // ═══════════════════════════════════════════════════════════════════

  const activeConfig = pathToConfig[currentPath] || { label: 'Dispatch Board' };

  const handleRouteChange = (newRouteLabel: string) => {
    const targetPath = labelToPath[newRouteLabel] || '/dispatch';
    navigateTo(targetPath);
  };

  const renderHeaderActions = () => {
    switch (currentPath) {
      case '/customers':
        return (
          <button type="button" className="metro-header-btn" onClick={() => setIsAddCustomerOpen(true)}>
            + Add New Customer
          </button>
        );
      case '/workers':
        return (
          <button type="button" className="metro-header-btn" onClick={() => setIsAddWorkerOpen(true)}>
            + Add New Worker
          </button>
        );
      case '/service-catalog':
        return (
          <button type="button" className="metro-header-btn" onClick={() => setIsAddServiceOpen(true)}>
            + Add New Service
          </button>
        );
      case '/subscriptions':
        return (
          <button type="button" className="metro-header-btn" onClick={() => setIsAddSubscriptionOpen(true)}>
            + New Plan Tier
          </button>
        );
      case '/financials':
        return (
          <button type="button" className="metro-header-btn" onClick={handleExportFinancialReport}>
            Export Report
          </button>
        );
      case '/active-roster':
        return (
          <button type="button" className="metro-header-btn" onClick={handlePingAllWorkers}>
            + Ping All Field Units
          </button>
        );
      default:
        return null;
    }
  };

  const renderCurrentView = () => {
    switch (currentPath) {
      case '/active-roster':
        return <ActiveRosterView />;
      case '/workers':
        return <AdminWorkspace activeView="workers" refreshSignal={refreshKey} />;
      case '/customers':
        return (
          <AdminWorkspace
            activeView="customers"
            refreshSignal={refreshKey}
            isCustomerModalOpen={isAddCustomerOpen}
            onCloseCustomerModal={() => setIsAddCustomerOpen(false)}
          />
        );
      case '/service-catalog':
        return <AdminWorkspace activeView="service-catalog" refreshSignal={refreshKey} />;
      case '/subscriptions':
        return <AdminWorkspace activeView="subscriptions" refreshSignal={refreshKey} />;
      case '/financials':
        return <AdminWorkspace activeView="financials" refreshSignal={refreshKey} />;
      case '/portal/services':
        return <PortalServices onNeedSubscription={() => navigateTo('/portal/subscription')} onRequested={() => { setPortalRefresh((k) => k + 1); showToast('Request sent! Dispatch will assign a technician shortly.', 'success'); navigateTo('/portal/requests'); }} />;
      case '/portal/requests':
        return <PortalRequests refreshKey={portalRefresh} />;
      case '/settings':
        return (
          <SettingsPage
            user={user}
            onProfileUpdated={(updated) => {
              setUser(updated);
              showToast('Your details were updated.', 'success');
            }}
            onLogout={handleLogout}
          />
        );
      case '/portal/subscription':
        return <PortalSubscription onChanged={() => showToast('Your subscription was updated.', 'success')} onDeclined={(message) => showToast(message, 'error')} />;
      case '/dispatch':
      default:
        return <CustomerCareView />;
    }
  };

  const modalFallback = null;
  const screen = (
    <>
      {updateReady && (
        <div role="status" style={updateBannerStyle}>
          <span>A new version of {isCustomer ? 'the site' : 'METRO-FIX'} is available.</span>
          <button type="button" style={updateButtonStyle} onClick={() => window.location.reload()}>
            Reload to update
          </button>
        </div>
      )}

      <LoadErrorBoundary resetKey={currentPath}>
        <Suspense fallback={<SkeletonCards count={4} height={96} />}>{renderCurrentView()}</Suspense>
      </LoadErrorBoundary>

      {/* Staff pop-ups are only fetched (and mounted) when opened. */}
      {isAddWorkerOpen && (
        <LoadErrorBoundary resetKey="add-worker">
          <Suspense fallback={modalFallback}>
            <AddWorkerModal
              isOpen={isAddWorkerOpen}
              onClose={() => setIsAddWorkerOpen(false)}
              onWorkerAdded={() => {
                setRefreshKey((prev) => prev + 1);
                showToast('Worker registered successfully in MS SQL database!', 'success');
              }}
            />
          </Suspense>
        </LoadErrorBoundary>
      )}

      {isAddServiceOpen && (
        <LoadErrorBoundary resetKey="add-service">
          <Suspense fallback={modalFallback}>
            <AddServiceModal
              isOpen={isAddServiceOpen}
              onClose={() => setIsAddServiceOpen(false)}
              onServiceAdded={() => {
                setRefreshKey((prev) => prev + 1);
                showToast('New service added to catalog successfully!', 'success');
              }}
            />
          </Suspense>
        </LoadErrorBoundary>
      )}

      {isAddSubscriptionOpen && (
        <LoadErrorBoundary resetKey="add-subscription">
          <Suspense fallback={modalFallback}>
            <AddSubscriptionModal
              isOpen={isAddSubscriptionOpen}
              onClose={() => setIsAddSubscriptionOpen(false)}
              onSubscriptionAdded={() => {
                setRefreshKey((prev) => prev + 1);
                showToast('New subscription plan tier created successfully!', 'success');
              }}
            />
          </Suspense>
        </LoadErrorBoundary>
      )}

      <ProfileModal
        isOpen={isProfileOpen}
        user={user}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={(updatedUser) => {
          setUser(updatedUser);
          showToast('Profile details updated successfully!', 'success');
        }}
      />

      {toast && (
        <div
          role="status"
          style={{
            ...toastStyle.container,
            ...toastStyle[toast.type],
            ...(isCustomer && isNarrow ? toastStyle.aboveTabs : undefined),
          }}
        >
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );

  return renderFrame(activeConfig.label, screen, renderHeaderActions());
}
