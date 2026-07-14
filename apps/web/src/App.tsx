import { useState } from 'react';
import { Button } from '@metro-fix/ui';
import type { UserProfile, ApiResponse } from '@metro-fix/core-types';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Functionality: Simulated API fetch demonstrating end-to-end typing
  const handleFetchUserProfile = () => {
    setLoading(true);

    // Simulate standard network latency (800ms delay)
    setTimeout(() => {
      // Development: Enforcing the API contract shape we defined in core-types
      const mockApiResponse: ApiResponse<UserProfile> = {
        success: true,
        data: {
          id: 'usr_99824',
          fullName: 'Shamil Suraweera',
          email: 'shamil@metrofix.dev',
          createdAt: new Date().toLocaleDateString(),
        },
      };

      if (mockApiResponse.success) {
        setUser(mockApiResponse.data);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Metro-Fix Workspace</h1>
        <p style={styles.subtitle}>Web frontend running on Ubuntu environment.</p>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2 style={styles.sectionHeader}>Component Integration Test</h2>
          <p style={styles.paragraph}>
            This button is loaded as a hot-reloadable module directly from your local 
            <code>packages/ui</code> library.
          </p>
          
          <Button 
            label={loading ? 'Accessing Data Contract...' : 'Load Profile Data'} 
            onClick={handleFetchUserProfile} 
          />
        </section>

        {user && (
          <section style={styles.card}>
            <h3 style={styles.cardHeader}>User Profile Data (Type Confirmed)</h3>
            <div style={styles.metaRow}>
              <span style={styles.label}>Unique ID:</span> 
              <code style={styles.code}>{user.id}</code>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.label}>Full Name:</span> 
              <span style={styles.value}>{user.fullName}</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.label}>Email Address:</span> 
              <span style={styles.value}>{user.email}</span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.label}>Initialized:</span> 
              <span style={styles.value}>{user.createdAt}</span>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// Layout Styling (Simple inline CSS for clean separation without extra dependencies)
const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    maxWidth: '640px',
    margin: '60px auto',
    padding: '0 24px',
    color: '#1a1a1a',
  },
  header: {
    borderBottom: '1px solid #eaeaea',
    paddingBottom: '24px',
    marginBottom: '32px',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    margin: '0 0 8px 0',
    color: '#000',
  },
  subtitle: {
    fontSize: '1rem',
    margin: 0,
    color: '#666',
  },
  main: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  section: {
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #eaeaea',
    backgroundColor: '#fafafa',
  },
  sectionHeader: {
    fontSize: '1.25rem',
    margin: '0 0 12px 0',
  },
  paragraph: {
    color: '#444',
    lineHeight: 1.5,
    margin: '0 0 20px 0',
  },
  card: {
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #0070f3',
    backgroundColor: '#f0f7ff',
  },
  cardHeader: {
    color: '#0070f3',
    margin: '0 0 16px 0',
    fontSize: '1.1rem',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(0, 112, 243, 0.1)',
  },
  label: {
    fontWeight: 600,
    color: '#333',
  },
  value: {
    color: '#555',
  },
  code: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.9em',
  },
};