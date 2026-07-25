import { useState } from 'react';
import { DashboardLayout } from '@metro-fix/ui';
import { Role, type User } from '@metro-fix/core-types';
import AuthShell from './features/auth/AuthShell';
import { CustomerCareView } from './features/dashboard/CustomerCareView';
import { ThemeToggle } from './theme/ThemeToggle';

export default function App() {
  const dashboardSearch = new URLSearchParams(window.location.search);
  const isDashboardRoute = window.location.pathname.startsWith('/dashboard');
  const bypassRole = dashboardSearch.get('role') === 'admin' ? Role.Admin : Role.CustomerCare;
  const bypassUser = isDashboardRoute || dashboardSearch.get('bypass') === '1';

  const [user, setUser] = useState<User | null>(
    bypassUser
      ? {
          id: 'usr_demo_001',
          fullName: bypassRole === Role.Admin ? 'Demo Admin' : 'Demo Customer Care',
          email: bypassRole === Role.Admin ? 'admin@metrofix.dev' : 'care@metrofix.dev',
          role: bypassRole,
          createdAt: new Date().toISOString(),
        }
      : null
  );
  const [activeRoute, setActiveRoute] = useState(
    dashboardSearch.get('route') || 'Dispatch Board'
  );

  if (!user) {
    return <AuthShell onAuthenticated={setUser} />;
  }

  return (
    <DashboardLayout
      activeRoute={activeRoute}
      userProfile={user}
      onRouteChange={setActiveRoute}
      settingsSlot={<ThemeToggle compact />}
    >
      <CustomerCareView />
    </DashboardLayout>
  );
}