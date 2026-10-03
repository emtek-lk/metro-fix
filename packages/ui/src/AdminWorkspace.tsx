import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { RefreshButton } from './RefreshButton';
import { Skeleton } from './Skeleton';
import { API_BASE_URL } from './hosting';
import { EditCustomerModal, EditWorkerModal, type EditableCustomer, type EditableWorker } from './EditRecordModals';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export type FacilityType = 'Residential' | 'Commercial' | 'Industrial';
export type SubscriptionTier = 'Access' | 'Essential' | 'Plus' | 'Business';
export type ServiceStatus = 'Active' | 'Disabled';
export type ServicePillar = 'Hard' | 'Soft' | 'Strategic';

export type CustomerRecord = {
  id: string;
  fullName: string;
  displayName: string;
  companyName?: string;
  email: string;
  phone: string;
  facilityType: FacilityType;
  /** A plan name, or "No plan (lead)" for someone who signed up but has not subscribed. */
  subscriptionTier: SubscriptionTier;
  physicalAddress?: string;
  billing?: string;
  subscribedSince?: string;
  /** Raw API values, used to pre-fill the edit form. */
  raw?: EditableCustomer;
};

export type ServiceRecord = {
  id: string;
  serviceName: string;
  pillarCategory: ServicePillar;
  serviceGroup: string;
  description: string;
  basePrice: string;
  requiredSubscriptionTier: SubscriptionTier;
  status: ServiceStatus;
};

export type WorkerRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  rating: number;
  serviceTypes: string;
  /** Accepted unfinished jobs plus open offers, counted live by the API. */
  activeJobs: number;
  status: 'Available' | 'On job' | 'Off duty';
  raw?: EditableWorker;
};

export type SubscriptionPlanRecord = {
  id: string;
  tierName: SubscriptionTier;
  targetFacility: FacilityType;
  monthlyFee: string;
  annualFee: string;
  allowance: string;
  labourDiscount: string;
  inspection: string;
  activeAccounts: number;
  includedServices: string;
  status: 'Active' | 'Draft';
};

/** API enums arrive upper-case (HARD, ACCESS...); the grids show them title-cased. */
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
const formatLkr = (value?: number | string | null) =>
  value === null || value === undefined || value === '' ? '—' : `LKR ${Number(value).toLocaleString('en-LK')}`;

export type FinancialRecord = {
  id: string;
  jobId: string;
  customerName: string;
  servicePillar: ServicePillar;
  amount: string;
  amountLkr: number;
  hours: number;
  /** Invoiced = approved and closed by dispatch; Awaiting approval = work done, not yet closed. */
  paymentStatus: 'Invoiced' | 'Awaiting approval';
  invoiceDate: string;
  dueDate?: string;
};

export type FinancialSummary = {
  currency: string;
  months: { key: string; label: string; jobs: number; subscriptions: number; total: number }[];
  byPillar: { name: string; value: number }[];
  kpis: { invoiced: number; awaitingApproval: number; subscriptions: number; invoiceCount: number };
};

// Zod schema for Customer Creation Form
export const createCustomerFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  phoneNumber: z.string().trim().min(7, 'Please enter a valid phone number.'),
  facilityType: z.enum(['Residential', 'Commercial', 'Industrial']),
  subscriptionTier: z.enum(['Access', 'Essential', 'Plus', 'Business']).default('Access'),
  physicalAddress: z.string().trim().min(5, 'Physical address must be at least 5 characters.'),
});

export type CreateCustomerFormValues = z.infer<typeof createCustomerFormSchema>;

const planBadge = (tier: string): CSSProperties =>
  tier.startsWith('No plan')
    ? { ...styles.statusPill, background: 'rgba(148, 163, 184, 0.18)', color: 'var(--text-secondary)' }
    : { ...styles.statusPill, ...styles.statusActive };

const makeCustomerColumns = (onView: (row: CustomerRecord) => void, onEdit: (row: CustomerRecord) => void): ColumnDef<CustomerRecord>[] => [
  { accessorKey: 'fullName', header: 'Full Name' },
  { accessorKey: 'companyName', header: 'Company', cell: ({ getValue }) => getValue<string>() || '—' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'facilityType', header: 'Facility Type' },
  {
    accessorKey: 'subscriptionTier',
    header: 'Plan',
    cell: ({ getValue }) => <span style={planBadge(getValue<string>())}>{getValue<string>()}</span>,
  },
  { accessorKey: 'subscribedSince', header: 'Subscribed since', cell: ({ getValue }) => getValue<string>() || '—' },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div style={styles.inlineActions}>
        <button type="button" className="metro-text-btn" style={styles.textButton} onClick={() => onView(row.original)}>
          View
        </button>
        <button type="button" className="metro-text-btn" style={styles.textButton} onClick={() => onEdit(row.original)}>
          Edit
        </button>
      </div>
    ),
  },
];

const serviceColumns: ColumnDef<ServiceRecord>[] = [
  { accessorKey: 'serviceName', header: 'Service Name' },
  { accessorKey: 'pillarCategory', header: 'Pillar' },
  { accessorKey: 'serviceGroup', header: 'Group' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'basePrice', header: 'Base Price' },
  { accessorKey: 'requiredSubscriptionTier', header: 'Required Tier' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const value = getValue<ServiceStatus>();
      return <span style={{ ...styles.statusPill, ...(value === 'Active' ? styles.statusActive : styles.statusDisabled) }}>{value}</span>;
    },
  },
];

const WORKER_STATUS_STYLE: Record<WorkerRecord['status'], CSSProperties> = {
  Available: { background: 'rgba(74, 173, 131, 0.18)', color: '#4aad83' },
  'On job': { background: 'rgba(243, 136, 8, 0.18)', color: '#f38808' },
  'Off duty': { background: 'rgba(148, 163, 184, 0.18)', color: '#94a3b8' },
};

const makeWorkerColumns = (onEdit: (row: WorkerRecord) => void): ColumnDef<WorkerRecord>[] => [
  { accessorKey: 'fullName', header: 'Full Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  {
    accessorKey: 'rating',
    header: 'Internal Rating',
    cell: ({ getValue }) => <span style={styles.ratingPill}>★ {getValue<number>().toFixed(1)}</span>,
  },
  { accessorKey: 'serviceTypes', header: 'Services' },
  { accessorKey: 'activeJobs', header: 'Active jobs' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const val = getValue<WorkerRecord['status']>();
      return <span style={{ ...styles.statusPill, ...WORKER_STATUS_STYLE[val] }}>{val}</span>;
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div style={styles.inlineActions}>
        <button type="button" className="metro-text-btn" style={styles.textButton} onClick={() => onEdit(row.original)}>
          Edit
        </button>
      </div>
    ),
  },
];

const subscriptionColumns: ColumnDef<SubscriptionPlanRecord>[] = [
  { accessorKey: 'tierName', header: 'Tier Name' },
  { accessorKey: 'targetFacility', header: 'Target Facility' },
  { accessorKey: 'monthlyFee', header: 'Monthly Fee' },
  { accessorKey: 'annualFee', header: 'Annual Fee' },
  { accessorKey: 'allowance', header: 'Included Allowance' },
  { accessorKey: 'labourDiscount', header: 'Labour Discount' },
  { accessorKey: 'inspection', header: 'Inspection' },
  { accessorKey: 'activeAccounts', header: 'Active Accounts' },
  { accessorKey: 'includedServices', header: 'Included Services' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <span style={{ ...styles.statusPill, ...styles.statusActive }}>{getValue<string>()}</span>,
  },
];

const financialColumns: ColumnDef<FinancialRecord>[] = [
  { accessorKey: 'id', header: 'Invoice' },
  { accessorKey: 'jobId', header: 'Ticket' },
  { accessorKey: 'customerName', header: 'Customer' },
  { accessorKey: 'servicePillar', header: 'Service', cell: ({ getValue }) => titleCase(getValue<string>()) },
  { accessorKey: 'hours', header: 'Hours', cell: ({ getValue }) => `${getValue<number>()} h` },
  {
    accessorKey: 'amountLkr',
    header: 'Amount',
    cell: ({ row }) => <span style={{ fontWeight: 700 }}>{row.original.amount}</span>,
  },
  { accessorKey: 'invoiceDate', header: 'Date' },
  { accessorKey: 'dueDate', header: 'Due', cell: ({ getValue }) => getValue<string>() || '—' },
  {
    accessorKey: 'paymentStatus',
    header: 'Status',
    cell: ({ getValue }) => {
      const val = getValue<string>();
      return (
        <span style={{ ...styles.statusPill, ...(val === 'Invoiced' ? styles.statusActive : { background: 'rgba(243, 136, 8, 0.18)', color: '#d37105' }), whiteSpace: 'nowrap' }}>
          {val}
        </span>
      );
    },
  },
];

const PAGE_SIZES = [10, 25, 50];

function DataTable<TData>({ columns, data, emptyMessage, loading = false }: { columns: ColumnDef<TData>[]; data: TData[]; emptyMessage: string; loading?: boolean }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      const nextState = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
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
                    style={{ ...styles.th, cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                    aria-sort={header.column.getIsSorted() === 'asc' ? 'ascending' : header.column.getIsSorted() === 'desc' ? 'descending' : 'none'}
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
            {loading && data.length === 0 ? (
              Array.from({ length: 6 }, (_, i) => (
                <tr key={`sk-${i}`} aria-hidden="true">
                  {columns.map((_c, j) => (
                    <td key={j} style={styles.td}>
                      <Skeleton width={j === 0 ? '70%' : '55%'} />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length > 0 ? (
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
        <button type="button" className="metro-page-btn" style={styles.pageButton} onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </button>
        <div style={styles.pageMeta}>
          {data.length === 0
            ? '0 rows'
            : `${pageIndex * pageSize + 1}–${Math.min(data.length, (pageIndex + 1) * pageSize)} of ${data.length}`}
          {' · '}Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          {' · '}
          <label>
            <span className="sr-only">Rows per page</span>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageIndex(0);
              }}
              style={{ background: 'transparent', color: 'inherit', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '2px 4px' }}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>
          </label>
        </div>
        <button type="button" className="metro-page-btn" style={styles.pageButton} onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </button>
      </div>
    </div>
  );
}

// Add Customer Modal Component
function AddCustomerModal({
  isOpen,
  onClose,
  onCustomerCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: (newCustomer: CustomerRecord) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      facilityType: 'Residential',
      subscriptionTier: 'Access',
      physicalAddress: '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: CreateCustomerFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    const displayName = values.fullName.split(' ')[0] + (values.fullName.split(' ')[1] ? ` ${values.fullName.split(' ')[1][0]}.` : '');
    const newRecord: CustomerRecord = {
      id: `cust-${Date.now().toString().slice(-4)}`,
      fullName: values.fullName,
      displayName,
      email: values.email,
      phone: values.phoneNumber,
      facilityType: values.facilityType,
      subscriptionTier: values.subscriptionTier,
      physicalAddress: values.physicalAddress,
    };

    try {
      const apiBase = API_BASE_URL;
      const response = await fetch(`${apiBase}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          facilityType: values.facilityType.toUpperCase(),
          subscriptionTier: values.subscriptionTier.toUpperCase(),
          physicalAddress: values.physicalAddress,
        }),
      }).catch(() => null);

      if (response && response.ok) {
        const createdFromApi = await response.json();
        onCustomerCreated({
          id: createdFromApi.id || newRecord.id,
          fullName: createdFromApi.user?.fullName || values.fullName,
          displayName,
          email: createdFromApi.user?.email || values.email,
          phone: createdFromApi.user?.phoneNumber || values.phoneNumber,
          facilityType: values.facilityType,
          subscriptionTier: values.subscriptionTier,
          physicalAddress: values.physicalAddress,
        });
      } else {
        onCustomerCreated(newRecord);
      }

      reset();
      onClose();
    } catch (err: any) {
      console.warn('Customer creation request, using local record:', err);
      onCustomerCreated(newRecord);
      reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.modalOverlay} className="metro-modal-overlay">
      <div style={styles.modalContent} className="metro-modal-card">
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Add New Customer Profile</h3>
          <button type="button" className="metro-ghost-btn" style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {apiError && <div style={styles.errorBanner}>{apiError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} style={styles.formStack}>
          <div>
            <label style={styles.fieldLabel}>FULL NAME *</label>
            <input
              type="text"
              {...register('fullName')}
              placeholder="e.g. Eleanor Vance"
              style={styles.formInput}
            />
            {errors.fullName && <span style={styles.fieldError}>{errors.fullName.message}</span>}
          </div>

          <div style={styles.formGrid2}>
            <div>
              <label style={styles.fieldLabel}>EMAIL ADDRESS *</label>
              <input
                type="email"
                {...register('email')}
                placeholder="eleanor@example.com"
                style={styles.formInput}
              />
              {errors.email && <span style={styles.fieldError}>{errors.email.message}</span>}
            </div>

            <div>
              <label style={styles.fieldLabel}>PHONE NUMBER *</label>
              <input
                type="tel"
                {...register('phoneNumber')}
                placeholder="+1 (555) 019-2834"
                style={styles.formInput}
              />
              {errors.phoneNumber && <span style={styles.fieldError}>{errors.phoneNumber.message}</span>}
            </div>
          </div>

          <div style={styles.formGrid2}>
            <div>
              <label style={styles.fieldLabel}>FACILITY TYPE *</label>
              <select {...register('facilityType')} style={styles.formSelect}>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
              </select>
              {errors.facilityType && <span style={styles.fieldError}>{errors.facilityType.message}</span>}
            </div>

            <div>
              <label style={styles.fieldLabel}>SUBSCRIPTION TIER</label>
              <select {...register('subscriptionTier')} style={styles.formSelect}>
                <option value="Access">Access</option>
                <option value="Essential">Essential</option>
                <option value="Plus">Plus</option>
                <option value="Business">Business</option>
              </select>
            </div>
          </div>

          <div>
            <label style={styles.fieldLabel}>PHYSICAL SITE ADDRESS *</label>
            <textarea
              {...register('physicalAddress')}
              rows={3}
              placeholder="Enter full street address for PostGIS geocoding..."
              style={styles.formTextarea}
            />
            {errors.physicalAddress && <span style={styles.fieldError}>{errors.physicalAddress.message}</span>}
          </div>

          <div style={styles.modalActions}>
            <button type="button" className="metro-ghost-btn" style={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" style={styles.primaryActionBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface AdminWorkspaceProps {
  activeView?: 'customers' | 'service-catalog' | 'workers' | 'subscriptions' | 'financials';
  isCustomerModalOpen?: boolean;
  onCloseCustomerModal?: () => void;
  workersList?: WorkerRecord[];
  onWorkerCreated?: (worker: WorkerRecord) => void;
}

export function AdminWorkspace({
  activeView = 'customers',
  isCustomerModalOpen = false,
  onCloseCustomerModal,
  workersList,
  onWorkerCreated,
}: AdminWorkspaceProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlanRecord[]>([]);
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [viewedCustomer, setViewedCustomer] = useState<CustomerRecord | null>(null);
  const [editedCustomer, setEditedCustomer] = useState<CustomerRecord | null>(null);
  const [editedWorker, setEditedWorker] = useState<WorkerRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCharts, setShowCharts] = useState(true);

  // Reset search whenever the user switches to a different view
  useEffect(() => { setSearchQuery(''); }, [activeView]);

  // ─── Filtered datasets ─────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.fullName, c.companyName ?? '', c.email, c.phone, c.facilityType, c.subscriptionTier, c.physicalAddress ?? '']
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const filteredWorkers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return workers;
    return workers.filter((w) =>
      [w.fullName, w.email, w.phone, w.serviceTypes, w.status]
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [workers, searchQuery]);

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return services;
    return services.filter((s) =>
      [s.serviceName, s.pillarCategory, s.serviceGroup, s.description, s.basePrice, s.requiredSubscriptionTier, s.status]
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [services, searchQuery]);

  const filteredSubscriptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return subscriptions;
    return subscriptions.filter((s) =>
      [s.tierName, s.targetFacility, s.monthlyFee, s.annualFee, s.allowance, s.includedServices, s.status]
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [subscriptions, searchQuery]);

  const filteredFinancials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return financials;
    return financials.filter((f) =>
      [f.id, f.jobId, f.customerName, f.servicePillar, f.amount, f.paymentStatus]
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [financials, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);

    const token = typeof window !== 'undefined' ? (localStorage.getItem('metrofix_token') || localStorage.getItem('metrofix_jwt')) : null;
    const apiBase = API_BASE_URL;
    let endpoint = `${apiBase}/customers`;
    if (activeView === 'workers') endpoint = `${apiBase}/workers`;
    if (activeView === 'service-catalog') endpoint = `${apiBase}/services`;
    if (activeView === 'subscriptions') endpoint = `${apiBase}/subscriptions`;
    if (activeView === 'financials') endpoint = `${apiBase}/financials`;

    if (activeView === 'financials') {
      fetch(`${apiBase}/financials/summary`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => isMounted && setSummary(data))
        .catch(() => isMounted && setSummary(null));
    }

    fetch(endpoint, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data: any[]) => {
        if (!isMounted) return;
        setIsLoading(false);
        if (!Array.isArray(data)) return;

        if (activeView === 'workers') {
          const mappedWorkers: WorkerRecord[] = data.map((item) => ({
            id: item.id || `wrk-${Math.random().toString(36).slice(2, 6)}`,
            fullName: item.user?.fullName || 'Field Worker',
            email: item.user?.email || 'N/A',
            phone: item.user?.phoneNumber || 'N/A',
            rating: item.rating ?? 5.0,
            serviceTypes: Array.isArray(item.servicePillars) ? item.servicePillars.map(titleCase).join(', ') : '—',
            activeJobs: item.liveActiveJobs ?? 0,
            status: item.isAvailable === false ? 'Off duty' : (item.liveActiveJobs ?? 0) > 0 ? 'On job' : 'Available',
            raw: {
              id: item.id,
              fullName: item.user?.fullName || '',
              email: item.user?.email || '',
              phone: item.user?.phoneNumber || '',
              rating: item.rating ?? 5,
              servicePillars: Array.isArray(item.servicePillars) ? item.servicePillars : [],
              isAvailable: item.isAvailable !== false,
            },
          }));
          setWorkers(mappedWorkers);
        } else if (activeView === 'service-catalog') {
          const mappedServices: ServiceRecord[] = data.map((item) => ({
            id: item.id || `srv-${Math.random().toString(36).slice(2, 6)}`,
            serviceName: item.serviceName || 'Service Item',
            pillarCategory: titleCase(item.pillarCategory || 'HARD') as ServicePillar,
            serviceGroup: item.serviceGroup ? titleCase(String(item.serviceGroup).replace(/_/g, ' ')) : '—',
            description: item.description || '',
            basePrice: item.basePrice != null && !item.requiresQuote ? formatLkr(item.basePrice) : item.requiresQuote ? 'Specialist · quoted' : 'Priced per job',
            requiredSubscriptionTier: titleCase(item.requiredSubscriptionTier || 'ACCESS') as SubscriptionTier,
            status: item.status || 'Active',
          }));
          setServices(mappedServices);
        } else if (activeView === 'subscriptions') {
          const mappedSubs: SubscriptionPlanRecord[] = data.map((item) => ({
            id: item.id || `sub-${Math.random().toString(36).slice(2, 6)}`,
            tierName: titleCase(item.tierName || 'ACCESS') as SubscriptionTier,
            targetFacility: titleCase(item.targetFacility || 'COMMERCIAL') as FacilityType,
            monthlyFee: item.isCustomPriced ? `From ${formatLkr(item.monthlyFeeLkr)}` : formatLkr(item.monthlyFeeLkr),
            annualFee: item.annualFeeLkr == null ? 'Custom' : formatLkr(item.annualFeeLkr),
            allowance:
              item.includedVisitsPerMonth == null
                ? 'Per SLA'
                : item.includedVisitsPerMonth === 0
                  ? 'Pay per job'
                  : `${item.includedVisitsPerMonth} visit${item.includedVisitsPerMonth > 1 ? 's' : ''} · ${item.includedLabourHoursPerMonth ?? 0} labour hr / mo`,
            labourDiscount: item.isCustomPriced ? 'Per agreement' : `${item.labourDiscountPct ?? 0}%`,
            inspection: titleCase(item.inspectionCadence || 'NONE'),
            activeAccounts: item.activeAccounts ?? 0,
            includedServices: item.includedServices || 'Facility Service Tier',
            status: item.status || 'Active',
          }));
          setSubscriptions(mappedSubs);
        } else if (activeView === 'financials') {
          const mappedFin: FinancialRecord[] = data.map((item) => ({
            id: item.id,
            jobId: item.jobId,
            customerName: item.customerName || 'Customer',
            servicePillar: titleCase(item.servicePillar || 'Hard') as ServicePillar,
            amount: item.amount,
            amountLkr: Number(item.amountLkr ?? 0),
            hours: Number(item.hours ?? 0),
            paymentStatus: item.paymentStatus,
            invoiceDate: item.invoiceDate,
            dueDate: item.dueDate,
          }));
          setFinancials(mappedFin);
        } else {
          const mappedCustomers: CustomerRecord[] = data.map((item) => ({
            id: item.id || `cust-${Math.random().toString(36).slice(2, 6)}`,
            fullName: item.user?.fullName || 'Customer User',
            displayName: (item.user?.fullName || 'Customer').split(' ')[0],
            companyName: item.companyName || '',
            email: item.user?.email || 'N/A',
            phone: item.user?.phoneNumber || 'N/A',
            facilityType: titleCase(item.facilityType || 'COMMERCIAL') as FacilityType,
            // No plan yet means a lead: signed up, not subscribed.
            subscriptionTier: (item.subscriptionTier ? titleCase(item.subscriptionTier) : 'No plan (lead)') as SubscriptionTier,
            physicalAddress: item.address || '—',
            billing: item.billingCycle ? (item.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly') : '—',
            subscribedSince: item.subscribedAt ? new Date(item.subscribedAt).toLocaleDateString() : '',
            raw: {
              id: item.id,
              fullName: item.user?.fullName || '',
              companyName: item.companyName || '',
              email: item.user?.email || '',
              phone: item.user?.phoneNumber || '',
              address: item.address || '',
              facilityKey: item.facilityType || 'COMMERCIAL',
              planKey: item.subscriptionTier || null,
              billingKey: item.billingCycle || null,
            },
          }));
          setCustomers(mappedCustomers);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsLoading(false);
        setFetchError(`Could not load ${activeView.replace('-', ' ')} from the API. Press Refresh to try again.`);
        console.warn(`Using default ${activeView} rows, NestJS API connecting or starting:`, err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeView, reloadKey]);

  const handleCustomerCreated = (newCustomer: CustomerRecord) => {
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  // ─── Search bar helper ────────────────────────────────────────────
  const placeholders: Record<string, string> = {
    customers: 'Search customers...',
    workers: 'Search workers...',
    'service-catalog': 'Search service catalog...',
    subscriptions: 'Search plans...',
    financials: 'Search invoices...',
  };

  const totalMap: Record<string, number> = {
    customers: customers.length,
    workers: workers.length,
    'service-catalog': services.length,
    subscriptions: subscriptions.length,
    financials: financials.length,
  };

  const filteredCountMap: Record<string, number> = {
    customers: filteredCustomers.length,
    workers: filteredWorkers.length,
    'service-catalog': filteredServices.length,
    subscriptions: filteredSubscriptions.length,
    financials: filteredFinancials.length,
  };

  const total = totalMap[activeView] ?? 0;
  const filtered = filteredCountMap[activeView] ?? 0;
  const isFiltering = searchQuery.trim().length > 0;

  // Financial charts come straight from the API summary (invoiced jobs plus subscription payments).
  const revenueTrend = summary?.months ?? [];
  const revenueByPillar = summary?.byPillar ?? [];
  const lkr = (value: number) => `LKR ${Math.round(value).toLocaleString('en-LK')}`;
  const lkrShort = (value: number) => (value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value));
  const customerColumns = useMemo(() => makeCustomerColumns(setViewedCustomer, setEditedCustomer), []);
  const workerColumns = useMemo(() => makeWorkerColumns(setEditedWorker), []);

  const searchBar = (
    <div className="metro-search-row">
      <div className="metro-search-wrap">
        <div className="metro-search-container">
          <div className="metro-search-icon" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={placeholders[activeView] ?? 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="metro-search-input"
            aria-label={`Search ${activeView}`}
            autoComplete="off"
            spellCheck={false}
          />
          {isFiltering && (
            <button
              type="button"
              aria-label="Clear search"
              className="metro-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <RefreshButton onClick={() => setReloadKey((k) => k + 1)} loading={isLoading} subject={activeView.replace('-', ' ')} />
      {fetchError && <span role="alert" style={{ color: '#ff8a80', fontSize: 13 }}>{fetchError}</span>}
      {isFiltering && (
        <div className="metro-search-count-pill">
          {filtered === 0 ? 'No matches' : `${filtered} of ${total}`}
        </div>
      )}
    </div>
  );

  return (
    <section style={styles.workspace}>
      {searchBar}

      {activeView === 'customers' && (
        <DataTable<CustomerRecord>
          key={`customers-${searchQuery}`}
          columns={customerColumns}
          data={filteredCustomers}
          loading={isLoading}
          emptyMessage={isFiltering ? 'No customers match your search.' : 'No customers found in directory.'}
        />
      )}

      {activeView === 'service-catalog' && (
        <DataTable<ServiceRecord>
          key={`services-${searchQuery}`}
          columns={serviceColumns}
          data={filteredServices}
          loading={isLoading}
          emptyMessage={isFiltering ? 'No services match your search.' : 'No service catalog records.'}
        />
      )}

      {activeView === 'workers' && (
        <DataTable<WorkerRecord>
          key={`workers-${searchQuery}`}
          columns={workerColumns}
          data={filteredWorkers}
          loading={isLoading}
          emptyMessage={isFiltering ? 'No workers match your search.' : 'No workers registered in system.'}
        />
      )}

      {activeView === 'subscriptions' && (
        <DataTable<SubscriptionPlanRecord>
          key={`subscriptions-${searchQuery}`}
          columns={subscriptionColumns}
          data={filteredSubscriptions}
          loading={isLoading}
          emptyMessage={isFiltering ? 'No subscription tiers match your search.' : 'No subscription tiers defined.'}
        />
      )}

      {activeView === 'financials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', flexShrink: 0 }}>
            {[
              { label: 'Invoiced (approved jobs)', value: summary?.kpis.invoiced ?? 0, note: `${summary?.kpis.invoiceCount ?? 0} invoice${summary?.kpis.invoiceCount === 1 ? '' : 's'}` },
              { label: 'Awaiting approval', value: summary?.kpis.awaitingApproval ?? 0, note: 'Completed, not yet closed' },
              { label: 'Subscriptions', value: summary?.kpis.subscriptions ?? 0, note: 'Successful card payments' },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '14px 16px' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700 }}>{kpi.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{lkr(kpi.value)}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{kpi.note}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
            <button 
              onClick={() => setShowCharts(!showCharts)} 
              style={{ background: 'none', border: 'none', color: '#f38808', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {showCharts ? 'Hide Charts' : 'Show Charts'}
            </button>
          </div>
          
          {showCharts && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', flexShrink: 0 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-elevated)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Revenue, last 6 months</h3>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <LineChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={lkrShort} width={44} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface-strong)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} 
                        itemStyle={{ color: 'var(--text-primary)' }}
                        formatter={(val: any) => [lkr(Number(val)), 'Revenue']}
                      />
                      <Line type="monotone" dataKey="total" stroke="#f38808" strokeWidth={3} dot={{ fill: '#f38808', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-elevated)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Revenue by Service</h3>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={revenueByPillar} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={lkrShort} width={44} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: 'var(--surface-strong)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
                        formatter={(val: any) => [lkr(Number(val)), 'Revenue']}
                      />
                      <Bar dataKey="value" fill="#47bfff" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          <DataTable<FinancialRecord>
            key={`financials-${searchQuery}`}
            columns={financialColumns}
            data={filteredFinancials}
            loading={isLoading}
            emptyMessage={isFiltering ? 'No financial records match your search.' : 'No invoices yet. A job appears here once the worker completes it with a priced job card.'}
          />
        </div>
      )}

      {viewedCustomer && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Customer details" onClick={() => setViewedCustomer(null)}>
          <div style={{ ...styles.modalContent, maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{viewedCustomer.fullName}</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" style={styles.textButton} onClick={() => { setEditedCustomer(viewedCustomer); setViewedCustomer(null); }}>Edit</button>
                <button type="button" style={styles.textButton} onClick={() => setViewedCustomer(null)}>Close</button>
              </div>
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 18px', margin: 0, fontSize: '0.9rem' }}>
              {[
                ['Company', viewedCustomer.companyName || '—'],
                ['Email', viewedCustomer.email],
                ['Phone', viewedCustomer.phone],
                ['Facility', viewedCustomer.facilityType],
                ['Address', viewedCustomer.physicalAddress || '—'],
                ['Plan', viewedCustomer.subscriptionTier],
                ['Billing', viewedCustomer.billing || '—'],
                ['Subscribed since', viewedCustomer.subscribedSince || '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'contents' }}>
                  <dt style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</dt>
                  <dd style={{ margin: 0, color: 'var(--text-primary)' }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {editedCustomer?.raw && (
        <EditCustomerModal
          customer={editedCustomer.raw}
          onClose={() => setEditedCustomer(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}
      {editedWorker?.raw && (
        <EditWorkerModal
          worker={editedWorker.raw}
          onClose={() => setEditedWorker(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}

      {/* Creation Modal */}
      <AddCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={onCloseCustomerModal ?? (() => undefined)}
        onCustomerCreated={handleCustomerCreated}
      />
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  workspace: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflowY: 'auto',
    color: 'var(--text-primary)',
    gap: '12px',
    paddingBottom: '24px', // Extra padding at bottom to ensure table is fully visible
  },
  /* ─── Search row ─── */
  searchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '14px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    boxShadow: '0 2px 8px rgba(14, 20, 21, 0.04)',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
  },
  searchIcon: {
    color: 'var(--text-secondary)',
    fontSize: '1.2rem',
    lineHeight: 1,
    flexShrink: 0,
    userSelect: 'none',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '0.92rem',
    outline: 'none',
    minWidth: 0,
  },
  searchClear: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.88rem',
    padding: '2px 4px',
    borderRadius: '6px',
    flexShrink: 0,
    lineHeight: 1,
  },
  searchCount: {
    flexShrink: 0,
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    padding: '6px 12px',
    borderRadius: '10px',
    background: 'rgba(243, 136, 8, 0.08)',
    border: '1px solid rgba(243, 136, 8, 0.2)',
  },
  viewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexShrink: 0,
  },
  viewTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  primaryActionBtn: {
    backgroundColor: '#f38808',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: '10px 18px',
    fontWeight: 800,
    fontSize: '0.88rem',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(243, 136, 8, 0.35)',
    transition: 'background-color 150ms ease',
  },
  tableShell: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--surface-strong)',
    borderRadius: '22px',
    border: '1px solid var(--border-subtle)',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  tableWrap: {
    width: '100%',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    color: 'var(--text-primary)',
  },
  th: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    textAlign: 'left',
    padding: '14px 16px',
    backgroundColor: '#2b435f',
    color: '#ffffff',
    fontSize: '0.82rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    userSelect: 'none',
    boxShadow: '0 1px 0 var(--border-subtle)',
  },
  thInner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  sortGlyph: {
    color: '#f38808',
    fontWeight: 900,
  },
  td: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
  },
  emptyCell: {
    textAlign: 'center',
    padding: '32px',
    color: 'var(--text-secondary)',
  },
  inlineActions: {
    display: 'flex',
    gap: '12px',
  },
  textButton: {
    background: 'none',
    border: 'none',
    color: '#f38808',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  ratingPill: {
    fontWeight: 700,
    color: '#f38808',
  },
  statusPill: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '0.78rem',
    fontWeight: 800,
  },
  statusActive: {
    background: 'rgba(74, 173, 131, 0.18)',
    color: '#4aad83',
  },
  statusDisabled: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'var(--text-secondary)',
  },
  paginationRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderTop: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    flexShrink: 0,
  },
  pageButton: {
    background: 'var(--surface)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.84rem',
  },
  pageMeta: {
    color: 'var(--text-secondary)',
    fontSize: '0.84rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: 'var(--surface)',
    color: 'var(--text-primary)',
    borderRadius: '22px',
    padding: '24px',
    width: '100%',
    maxWidth: '520px',
    border: '1px solid var(--border-subtle)',
    boxShadow: '0 30px 72px rgba(0, 0, 0, 0.32)',
    maxHeight: '90vh',
    overflowY: 'auto',
    scrollbarWidth: 'none',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: '8px',
    lineHeight: 1,
  },
  errorBanner: {
    backgroundColor: 'rgba(243, 136, 8, 0.08)',
    border: '1px solid rgba(243, 136, 8, 0.28)',
    color: 'var(--text-primary)',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '0.85rem',
    marginBottom: '16px',
  },
  formStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formGrid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 800,
    color: 'var(--sidebar-accent)',
    letterSpacing: '0.08em',
    marginBottom: '4px',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    color: 'var(--text-primary)',
    boxSizing: 'border-box',
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    color: 'var(--text-primary)',
    boxSizing: 'border-box',
  },
  formTextarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    color: 'var(--text-primary)',
    boxSizing: 'border-box',
  },
  fieldError: {
    color: '#d37105',
    fontSize: '0.76rem',
    marginTop: '4px',
    display: 'block',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '16px',
  },
  cancelBtn: {
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    padding: '10px 16px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  infoBanner: {
    padding: '10px 16px',
    marginBottom: '12px',
    background: 'rgba(243, 136, 8, 0.08)',
    color: 'var(--text-primary)',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: 600,
    border: '1px solid rgba(243, 136, 8, 0.28)',
  },
};

export default AdminWorkspace;
