import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';

export type FacilityType = 'Residential' | 'Commercial' | 'Industrial';
export type SubscriptionTier = 'Basic' | 'Plus' | 'Premium';
export type ServiceStatus = 'Active' | 'Disabled';
export type ServicePillar = 'Hard' | 'Soft' | 'Strategic';

export type CustomerRecord = {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  phone: string;
  facilityType: FacilityType;
  subscriptionTier: SubscriptionTier;
};

export type ServiceRecord = {
  id: string;
  serviceName: string;
  pillarCategory: ServicePillar;
  basePrice: string;
  requiredSubscriptionTier: SubscriptionTier;
  status: ServiceStatus;
};

const customerRows: CustomerRecord[] = [
  {
    id: 'cust-001',
    fullName: 'Aisha Rahman',
    displayName: 'Aisha R.',
    email: 'aisha.rahman@metrofix.dev',
    phone: '+1 (555) 010-2234',
    facilityType: 'Residential',
    subscriptionTier: 'Plus',
  },
  {
    id: 'cust-002',
    fullName: 'Metro Logistics LLC',
    displayName: 'Metro Logistics',
    email: 'ops@metrologistics.com',
    phone: '+1 (555) 010-7781',
    facilityType: 'Industrial',
    subscriptionTier: 'Premium',
  },
  {
    id: 'cust-003',
    fullName: 'Crescent Retail Group',
    displayName: 'Crescent Retail',
    email: 'facilities@crescentrg.com',
    phone: '+1 (555) 010-3389',
    facilityType: 'Commercial',
    subscriptionTier: 'Basic',
  },
  {
    id: 'cust-004',
    fullName: 'Northpoint Residences',
    displayName: 'Northpoint',
    email: 'admin@northpointresidences.com',
    phone: '+1 (555) 010-9912',
    facilityType: 'Residential',
    subscriptionTier: 'Plus',
  },
  {
    id: 'cust-005',
    fullName: 'Greenfield Mall',
    displayName: 'Greenfield Mall',
    email: 'property@greenfieldmall.com',
    phone: '+1 (555) 010-1208',
    facilityType: 'Commercial',
    subscriptionTier: 'Premium',
  },
  {
    id: 'cust-006',
    fullName: 'Harbor Offices',
    displayName: 'Harbor Offices',
    email: 'admin@harboroffices.com',
    phone: '+1 (555) 010-4507',
    facilityType: 'Commercial',
    subscriptionTier: 'Plus',
  },
];

const serviceRows: ServiceRecord[] = [
  {
    id: 'svc-001',
    serviceName: 'Chiller Maintenance',
    pillarCategory: 'Hard',
    basePrice: '$450',
    requiredSubscriptionTier: 'Plus',
    status: 'Active',
  },
  {
    id: 'svc-002',
    serviceName: 'Deep Cleaning',
    pillarCategory: 'Soft',
    basePrice: '$180',
    requiredSubscriptionTier: 'Basic',
    status: 'Active',
  },
  {
    id: 'svc-003',
    serviceName: 'Security Patrol Review',
    pillarCategory: 'Strategic',
    basePrice: '$650',
    requiredSubscriptionTier: 'Premium',
    status: 'Active',
  },
  {
    id: 'svc-004',
    serviceName: 'Fire Panel Compliance',
    pillarCategory: 'Hard',
    basePrice: '$520',
    requiredSubscriptionTier: 'Plus',
    status: 'Disabled',
  },
  {
    id: 'svc-005',
    serviceName: 'Floor Restoration',
    pillarCategory: 'Soft',
    basePrice: '$320',
    requiredSubscriptionTier: 'Basic',
    status: 'Active',
  },
  {
    id: 'svc-006',
    serviceName: 'Energy Audit Planning',
    pillarCategory: 'Strategic',
    basePrice: '$980',
    requiredSubscriptionTier: 'Premium',
    status: 'Active',
  },
];

const customerColumns: ColumnDef<CustomerRecord>[] = [
  { accessorKey: 'fullName', header: 'Full Name' },
  { accessorKey: 'displayName', header: 'Display Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'facilityType', header: 'Facility Type' },
  { accessorKey: 'subscriptionTier', header: 'Active Subscription Tier' },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <div style={styles.inlineActions}>
        <button type="button" style={styles.textButton}>View</button>
        <button type="button" style={styles.textButton}>Edit</button>
      </div>
    ),
  },
];

const serviceColumns: ColumnDef<ServiceRecord>[] = [
  { accessorKey: 'serviceName', header: 'Service Name' },
  { accessorKey: 'pillarCategory', header: 'Pillar Category' },
  { accessorKey: 'basePrice', header: 'Base Price' },
  { accessorKey: 'requiredSubscriptionTier', header: 'Required Subscription Tier' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const value = getValue<ServiceStatus>();
      return <span style={{ ...styles.statusPill, ...(value === 'Active' ? styles.statusActive : styles.statusDisabled) }}>{value}</span>;
    },
  },
];

function DataTable<TData>({ columns, data, emptyMessage }: { columns: ColumnDef<TData>[]; data: TData[]; emptyMessage: string; }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize: 5 },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      const nextState = typeof updater === 'function' ? updater({ pageIndex, pageSize: 5 }) : updater;
      setPageIndex(nextState.pageIndex);
    },
  });

  const pageRows = table.getRowModel().rows;

  return (
    <div style={styles.tableShell}>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={styles.th}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <span style={styles.thInner}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() ? <span style={styles.sortGlyph}>{header.column.getIsSorted() === 'asc' ? '↑' : '↓'}</span> : null}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {pageRows.length > 0 ? (
              pageRows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={styles.td}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={styles.emptyCell}>{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.paginationRow}>
        <button type="button" style={styles.pageButton} onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </button>
        <div style={styles.pageMeta}>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <button type="button" style={styles.pageButton} onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </button>
      </div>
    </div>
  );
}

export function AdminWorkspace() {
  const [activeTab, setActiveTab] = useState<'customers' | 'services'>('customers');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const tabs = useMemo(
    () => [
      { id: 'customers' as const, label: 'Customers', description: 'Directory & Subscriptions' },
      { id: 'services' as const, label: 'Services & Catalog', description: 'Hard, Soft, Strategic services' },
    ],
    []
  );

  return (
    <section style={styles.workspace}>
      <div style={styles.hero}>
        <div>
          <div style={styles.kicker}>Administration Workspace</div>
          <h2 style={styles.title}>Platform operations and catalog management</h2>
          <p style={styles.copy}>
            Manage the customer directory, subscription tiers, and the service catalog from a single tabbed workspace.
          </p>
        </div>
      </div>

      <div style={styles.tabSwitcher}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{ ...styles.tabButton, ...(activeTab === tab.id ? styles.tabButtonActive : undefined) }}
          >
            <span>{tab.label}</span>
            <span style={styles.tabDescription}>{tab.description}</span>
          </button>
        ))}
      </div>

      {activeTab === 'customers' ? (
        <DataTable<CustomerRecord>
          columns={customerColumns}
          data={customerRows}
          emptyMessage="No customer records found."
        />
      ) : (
        <div style={styles.sectionStack}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <div style={styles.sectionKicker}>Service Catalog</div>
              <h3 style={styles.sectionTitle}>Hard, Soft, and Strategic services</h3>
            </div>
            <button type="button" style={styles.primaryButton} onClick={() => setCreateModalOpen(true)}>
              Add New Service
            </button>
          </div>
          <DataTable<ServiceRecord>
            columns={serviceColumns}
            data={serviceRows}
            emptyMessage="No services available."
          />
        </div>
      )}

      {isCreateModalOpen && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Create service modal">
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.sectionKicker}>Service Catalog</div>
                <h3 style={styles.modalTitle}>Add New Service</h3>
              </div>
              <button type="button" style={styles.closeButton} onClick={() => setCreateModalOpen(false)}>
                Close
              </button>
            </div>
            <p style={styles.copy}>
              Modal placeholder for creating a new service entry. Hook this into your form workflow and persistence layer.
            </p>
            <div style={styles.modalStubGrid}>
              <div style={styles.modalStub}>Service name</div>
              <div style={styles.modalStub}>Pillar category</div>
              <div style={styles.modalStub}>Base price</div>
              <div style={styles.modalStub}>Required tier</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  workspace: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: 0,
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
  },
  kicker: {
    color: '#f38808',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
  title: {
    margin: '10px 0 8px',
    fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
    color: 'var(--text-primary)',
  },
  copy: {
    margin: 0,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    maxWidth: '68ch',
  },
  tabSwitcher: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  tabButton: {
    border: '1px solid var(--border-color)',
    background: 'var(--surface-strong)',
    color: 'var(--text-primary)',
    borderRadius: '16px',
    padding: '14px 18px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
    minWidth: '220px',
  },
  tabButtonActive: {
    borderColor: '#f38808',
    boxShadow: '0 12px 28px rgba(243, 136, 8, 0.14)',
  },
  tabDescription: {
    color: 'var(--text-secondary)',
    fontSize: '0.86rem',
  },
  sectionStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minWidth: 0,
  },
  sectionHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  sectionKicker: {
    color: '#f38808',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontSize: '0.74rem',
    fontWeight: 700,
  },
  sectionTitle: {
    margin: '8px 0 0',
    color: 'var(--text-primary)',
    fontSize: '1.45rem',
  },
  primaryButton: {
    border: '1px solid #d37105',
    background: 'linear-gradient(135deg, #f38808, #d37105)',
    color: '#ffffff',
    padding: '12px 16px',
    borderRadius: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  tableShell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    minWidth: 0,
  },
  tableWrap: {
    overflowX: 'auto',
    overflowY: 'hidden',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    background: 'var(--surface)',
  },
  table: {
    width: '100%',
    minWidth: '980px',
    borderCollapse: 'collapse',
    color: 'var(--text-primary)',
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    background: '#2b435f',
    color: '#ffffff',
    fontSize: '0.84rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  thInner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  sortGlyph: {
    color: '#f38808',
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-color)',
    whiteSpace: 'nowrap',
    background: 'var(--surface)',
  },
  emptyCell: {
    padding: '24px 16px',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  inlineActions: {
    display: 'flex',
    gap: '8px',
  },
  textButton: {
    border: '1px solid #f38808',
    background: 'transparent',
    color: '#f38808',
    borderRadius: '999px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '0.76rem',
    fontWeight: 700,
  },
  statusActive: {
    background: '#f38808',
    color: '#ffffff',
  },
  statusDisabled: {
    background: '#2b435f',
    color: '#ffffff',
  },
  paginationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  pageButton: {
    border: '1px solid var(--border-color)',
    background: 'var(--surface-strong)',
    color: 'var(--text-primary)',
    borderRadius: '12px',
    padding: '10px 12px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  pageMeta: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(4, 10, 11, 0.62)',
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    zIndex: 20,
  },
  modalCard: {
    width: 'min(640px, 100%)',
    borderRadius: '24px',
    background: 'var(--surface)',
    border: '1px solid var(--border-color)',
    padding: '24px',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '18px',
    marginBottom: '14px',
  },
  modalTitle: {
    margin: '8px 0 0',
    fontSize: '1.4rem',
    color: 'var(--text-primary)',
  },
  closeButton: {
    border: '1px solid var(--border-color)',
    background: 'var(--surface-strong)',
    color: '#f38808',
    borderRadius: '12px',
    padding: '10px 12px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  modalStubGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    marginTop: '18px',
  },
  modalStub: {
    padding: '14px',
    borderRadius: '14px',
    background: 'var(--surface-strong)',
    border: '1px dashed var(--border-color)',
    color: 'var(--text-secondary)',
  },
};
