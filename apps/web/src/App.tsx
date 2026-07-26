import { useState, useEffect, type CSSProperties } from 'react';
import { DashboardLayout, AdminWorkspace } from '@metro-fix/ui';
import { Role, type User } from '@metro-fix/core-types';
import AuthShell from './features/auth/AuthShell';
import { CustomerCareView } from './features/dashboard/CustomerCareView';
import { ActiveRosterView } from './features/dashboard/ActiveRosterView';
import { ThemeToggle } from './theme/ThemeToggle';

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
};

const labelToPath: Record<string, string> = {
  'Dispatch Board': '/dispatch',
  'Active Roster': '/active-roster',
  'Workers': '/workers',
  'Customers': '/customers',
  'Service Catalog': '/service-catalog',
  'Subscriptions': '/subscriptions',
  'Financials': '/financials',
};

const headerBtnStyle: CSSProperties = {
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

function getInitialState(): { user: User | null; route: string } {
  if (typeof window === 'undefined') {
    return { user: null, route: '/dispatch' };
  }

  const currentPath = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  // Explicit URL bypass param for testing
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

  // Session check in local storage
  try {
    const storedToken = localStorage.getItem('metrofix_token');
    const storedUserJson = localStorage.getItem('metrofix_user');
    if (storedToken && storedUserJson) {
      const parsedUser = JSON.parse(storedUserJson) as User;
      const validPath = currentPath !== '/' && currentPath !== '/login' && pathToConfig[currentPath]
        ? currentPath
        : (parsedUser.role === Role.ADMIN ? '/customers' : '/dispatch');
      return { user: parsedUser, route: validPath };
    }
  } catch {
    // Storage safety
  }

  return { user: null, route: '/login' };
}

export default function App() {
  const [initial] = useState(getInitialState);
  const [user, setUser] = useState<User | null>(initial.user);
  const [currentPath, setCurrentPath] = useState<string>(initial.route);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleAuthenticated = (authUser: User, _token: string, targetPath: string) => {
    setUser(authUser);
    const destination = targetPath === '/admin' ? '/customers' : (targetPath || '/dispatch');
    setCurrentPath(destination);
    window.history.pushState({}, '', destination);
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

  if (!user) {
    return <AuthShell onAuthenticated={handleAuthenticated} />;
  }

  const activeConfig = pathToConfig[currentPath] || { label: 'Dispatch Board' };

  const handleRouteChange = (newRouteLabel: string) => {
    const targetPath = labelToPath[newRouteLabel] || '/dispatch';
    setCurrentPath(targetPath);
    window.history.pushState({}, '', targetPath);
  };

  const renderHeaderActions = () => {
    switch (currentPath) {
      case '/customers':
        return (
          <button type="button" style={headerBtnStyle} onClick={() => setIsAddCustomerOpen(true)}>
            + Add New Customer
          </button>
        );
      case '/workers':
        return (
          <button type="button" style={headerBtnStyle} onClick={() => alert('Add New Worker triggered')}>
            + Add New Worker
          </button>
        );
      case '/service-catalog':
        return (
          <button type="button" style={headerBtnStyle} onClick={() => alert('Add New Service triggered')}>
            + Add New Service
          </button>
        );
      case '/subscriptions':
        return (
          <button type="button" style={headerBtnStyle} onClick={() => alert('New Plan Tier triggered')}>
            + New Plan Tier
          </button>
        );
      case '/financials':
        return (
          <button type="button" style={headerBtnStyle} onClick={() => alert('Exporting financial report...')}>
            Export Report
          </button>
        );
      case '/active-roster':
        return (
          <button type="button" style={headerBtnStyle} onClick={() => alert('Pinging all field units...')}>
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
        return <AdminWorkspace activeView="workers" />;
      case '/customers':
        return (
          <AdminWorkspace
            activeView="customers"
            isCustomerModalOpen={isAddCustomerOpen}
            onCloseCustomerModal={() => setIsAddCustomerOpen(false)}
          />
        );
      case '/service-catalog':
        return <AdminWorkspace activeView="service-catalog" />;
      case '/subscriptions':
        return <AdminWorkspace activeView="subscriptions" />;
      case '/financials':
        return <AdminWorkspace activeView="financials" />;
      case '/dispatch':
      default:
        return <CustomerCareView />;
    }
  };

  return (
    <DashboardLayout
      activeRoute={activeConfig.label}
      userProfile={user}
      headerActions={renderHeaderActions()}
      onRouteChange={handleRouteChange}
      settingsSlot={<ThemeToggle compact />}
      onLogout={handleLogout}
    >
      {renderCurrentView()}
    </DashboardLayout>
  );
}