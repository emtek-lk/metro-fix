import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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
  physicalAddress?: string;
};

export type ServiceRecord = {
  id: string;
  serviceName: string;
  pillarCategory: ServicePillar;
  basePrice: string;
  requiredSubscriptionTier: SubscriptionTier;
  status: ServiceStatus;
};

export type WorkerRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  coverageZone: string;
  rating: number;
  serviceTypes: string;
  status: 'Active' | 'On Route' | 'Offline';
};

export type SubscriptionPlanRecord = {
  id: string;
  tierName: SubscriptionTier;
  targetFacility: FacilityType;
  monthlyFee: string;
  activeAccounts: number;
  includedServices: string;
  status: 'Active' | 'Draft';
};

export type FinancialRecord = {
  id: string;
  jobId: string;
  customerName: string;
  servicePillar: ServicePillar;
  amount: string;
  paymentStatus: 'Paid' | 'Pending' | 'Refunded';
  invoiceDate: string;
};

// Zod schema for Customer Creation Form
export const createCustomerFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  phoneNumber: z.string().trim().min(7, 'Please enter a valid phone number.'),
  facilityType: z.enum(['Residential', 'Commercial', 'Industrial']),
  subscriptionTier: z.enum(['Basic', 'Plus', 'Premium']).default('Basic'),
  physicalAddress: z.string().trim().min(5, 'Physical address must be at least 5 characters.'),
});

export type CreateCustomerFormValues = z.infer<typeof createCustomerFormSchema>;

const initialCustomerRows: CustomerRecord[] = [
  {
    id: 'cust-001',
    fullName: 'Aisha Rahman',
    displayName: 'Aisha R.',
    email: 'aisha.rahman@metrofix.dev',
    phone: '+1 (555) 010-2234',
    facilityType: 'Residential',
    subscriptionTier: 'Plus',
    physicalAddress: '124 Market St, San Francisco, CA',
  },
  {
    id: 'cust-002',
    fullName: 'Metro Logistics LLC',
    displayName: 'Metro Logistics',
    email: 'ops@metrologistics.com',
    phone: '+1 (555) 010-7781',
    facilityType: 'Industrial',
    subscriptionTier: 'Premium',
    physicalAddress: '890 Harbor Blvd, Oakland, CA',
  },
  {
    id: 'cust-003',
    fullName: 'Crescent Retail Group',
    displayName: 'Crescent Retail',
    email: 'facilities@crescentrg.com',
    phone: '+1 (555) 010-3389',
    facilityType: 'Commercial',
    subscriptionTier: 'Basic',
    physicalAddress: '450 Plaza Way, San Jose, CA',
  },
  {
    id: 'cust-004',
    fullName: 'Northpoint Residences',
    displayName: 'Northpoint',
    email: 'admin@northpointresidences.com',
    phone: '+1 (555) 010-9912',
    facilityType: 'Residential',
    subscriptionTier: 'Plus',
    physicalAddress: '782 Pine Ave, Berkeley, CA',
  },
  {
    id: 'cust-005',
    fullName: 'Greenfield Mall',
    displayName: 'Greenfield Mall',
    email: 'property@greenfieldmall.com',
    phone: '+1 (555) 010-1208',
    facilityType: 'Commercial',
    subscriptionTier: 'Premium',
    physicalAddress: '100 Grand Galleria, San Mateo, CA',
  },
  {
    id: 'cust-006',
    fullName: 'Harbor Offices',
    displayName: 'Harbor Offices',
    email: 'admin@harboroffices.com',
    phone: '+1 (555) 010-4507',
    facilityType: 'Commercial',
    subscriptionTier: 'Plus',
    physicalAddress: '300 Embarcadero Center, San Francisco, CA',
  },
  {
    id: 'cust-007',
    fullName: 'Skyline Towers FM',
    displayName: 'Skyline Towers',
    email: 'dispatch@skylinetowers.com',
    phone: '+1 (555) 010-8819',
    facilityType: 'Commercial',
    subscriptionTier: 'Premium',
    physicalAddress: '550 California St, San Francisco, CA',
  },
  {
    id: 'cust-008',
    fullName: 'Pacific Bay Logistics',
    displayName: 'Pacific Bay',
    email: 'admin@pacificbaylogistics.com',
    phone: '+1 (555) 010-6641',
    facilityType: 'Industrial',
    subscriptionTier: 'Plus',
    physicalAddress: '1200 Maritime St, Oakland, CA',
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
  {
    id: 'svc-007',
    serviceName: 'HVAC Air Filter Replacement',
    pillarCategory: 'Hard',
    basePrice: '$280',
    requiredSubscriptionTier: 'Basic',
    status: 'Active',
  },
  {
    id: 'svc-008',
    serviceName: 'Waste Management Triage',
    pillarCategory: 'Soft',
    basePrice: '$210',
    requiredSubscriptionTier: 'Basic',
    status: 'Active',
  },
];

const initialWorkerRows: WorkerRecord[] = [
  { id: 'wrk-01', fullName: 'Amina Yusuf', email: 'amina.y@metrofix.dev', phone: '+1 (555) 012-4491', coverageZone: 'North District', rating: 4.9, serviceTypes: 'Hard, Strategic', status: 'Active' },
  { id: 'wrk-02', fullName: 'Malik Thompson', email: 'malik.t@metrofix.dev', phone: '+1 (555) 012-7720', coverageZone: 'Central Business', rating: 4.7, serviceTypes: 'Soft', status: 'On Route' },
  { id: 'wrk-03', fullName: 'Nadia Khan', email: 'nadia.k@metrofix.dev', phone: '+1 (555) 012-3310', coverageZone: 'East Park', rating: 4.8, serviceTypes: 'Hard, Soft', status: 'Active' },
  { id: 'wrk-04', fullName: 'Omar Silva', email: 'omar.s@metrofix.dev', phone: '+1 (555) 012-8843', coverageZone: 'Harbor Loop', rating: 4.5, serviceTypes: 'Strategic', status: 'Active' },
  { id: 'wrk-05', fullName: 'Elena Rostova', email: 'elena.r@metrofix.dev', phone: '+1 (555) 012-9901', coverageZone: 'South Bay', rating: 4.9, serviceTypes: 'Hard', status: 'Offline' },
  { id: 'wrk-06', fullName: 'David Chen', email: 'david.c@metrofix.dev', phone: '+1 (555) 012-1152', coverageZone: 'West Campus', rating: 4.6, serviceTypes: 'Soft, Strategic', status: 'Active' },
];

const initialSubscriptionRows: SubscriptionPlanRecord[] = [
  { id: 'sub-tier-01', tierName: 'Basic', targetFacility: 'Residential', monthlyFee: '$299/mo', activeAccounts: 42, includedServices: 'Basic Soft FM, Standard Dispatch', status: 'Active' },
  { id: 'sub-tier-02', tierName: 'Plus', targetFacility: 'Commercial', monthlyFee: '$799/mo', activeAccounts: 28, includedServices: 'Hard + Soft FM, Priority Dispatch', status: 'Active' },
  { id: 'sub-tier-03', tierName: 'Premium', targetFacility: 'Industrial', monthlyFee: '$1,499/mo', activeAccounts: 14, includedServices: 'All Pillars, Dedicated Supervisor, SLA Guarantee', status: 'Active' },
];

const initialFinancialRows: FinancialRecord[] = [
  { id: 'inv-9001', jobId: 'req-1001', customerName: 'Skyline Towers', servicePillar: 'Hard', amount: '$1,250.00', paymentStatus: 'Paid', invoiceDate: '2026-07-22' },
  { id: 'inv-9002', jobId: 'req-1002', customerName: 'Tower One Management', servicePillar: 'Soft', amount: '$480.00', paymentStatus: 'Pending', invoiceDate: '2026-07-22' },
  { id: 'inv-9003', jobId: 'req-1003', customerName: 'Metro Logistics LLC', servicePillar: 'Strategic', amount: '$2,100.00', paymentStatus: 'Paid', invoiceDate: '2026-07-21' },
  { id: 'inv-9004', jobId: 'req-1004', customerName: 'Northpoint Residences', servicePillar: 'Hard', amount: '$350.00', paymentStatus: 'Paid', invoiceDate: '2026-07-21' },
  { id: 'inv-9005', jobId: 'req-1005', customerName: 'Greenfield Mall', servicePillar: 'Strategic', amount: '$1,850.00', paymentStatus: 'Paid', invoiceDate: '2026-07-20' },
  { id: 'inv-9006', jobId: 'req-1006', customerName: 'Crescent Retail Group', servicePillar: 'Soft', amount: '$620.00', paymentStatus: 'Paid', invoiceDate: '2026-07-19' },
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
        <button type="button" className="metro-text-btn" style={styles.textButton}>View</button>
        <button type="button" className="metro-text-btn" style={styles.textButton}>Edit</button>
      </div>
    ),
  },
];

const serviceColumns: ColumnDef<ServiceRecord>[] = [
  { accessorKey: 'serviceName', header: 'Service Name' },
  { accessorKey: 'pillarCategory', header: 'Pillar Category' },
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

const workerColumns: ColumnDef<WorkerRecord>[] = [
  { accessorKey: 'fullName', header: 'Full Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  { accessorKey: 'coverageZone', header: 'Coverage Zone' },
  {
    accessorKey: 'rating',
    header: 'Internal Rating',
    cell: ({ getValue }) => <span style={styles.ratingPill}>★ {getValue<number>().toFixed(1)}</span>,
  },
  { accessorKey: 'serviceTypes', header: 'Pillar Capabilities' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const val = getValue<string>();
      return <span style={{ ...styles.statusPill, ...(val === 'Active' ? styles.statusActive : styles.statusDisabled) }}>{val}</span>;
    },
  },
];

const subscriptionColumns: ColumnDef<SubscriptionPlanRecord>[] = [
  { accessorKey: 'tierName', header: 'Tier Name' },
  { accessorKey: 'targetFacility', header: 'Target Facility' },
  { accessorKey: 'monthlyFee', header: 'Monthly Fee' },
  { accessorKey: 'activeAccounts', header: 'Active Accounts' },
  { accessorKey: 'includedServices', header: 'Included Services' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <span style={{ ...styles.statusPill, ...styles.statusActive }}>{getValue<string>()}</span>,
  },
];

const financialColumns: ColumnDef<FinancialRecord>[] = [
  { accessorKey: 'id', header: 'Invoice ID' },
  { accessorKey: 'jobId', header: 'Job ID' },
  { accessorKey: 'customerName', header: 'Customer' },
  { accessorKey: 'servicePillar', header: 'Service Pillar' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'invoiceDate', header: 'Invoice Date' },
  {
    accessorKey: 'paymentStatus',
    header: 'Payment Status',
    cell: ({ getValue }) => {
      const val = getValue<string>();
      return <span style={{ ...styles.statusPill, ...(val === 'Paid' ? styles.statusActive : styles.statusDisabled) }}>{val}</span>;
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
      pagination: { pageIndex, pageSize: 8 },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      const nextState = typeof updater === 'function' ? updater({ pageIndex, pageSize: 8 }) : updater;
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
        <button type="button" className="metro-page-btn" style={styles.pageButton} onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </button>
        <div style={styles.pageMeta}>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
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
      subscriptionTier: 'Basic',
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
      const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3000';
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
                <option value="Basic">Basic</option>
                <option value="Plus">Plus</option>
                <option value="Premium">Premium</option>
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
  const [customers, setCustomers] = useState<CustomerRecord[]>(initialCustomerRows);
  const [workers, setWorkers] = useState<WorkerRecord[]>(initialWorkerRows);
  const [services, setServices] = useState<ServiceRecord[]>(serviceRows);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlanRecord[]>(initialSubscriptionRows);
  const [financials, setFinancials] = useState<FinancialRecord[]>(initialFinancialRows);
  const [isLoading, setIsLoading] = useState(true);
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
      [c.fullName, c.email, c.phone, c.facilityType, c.subscriptionTier, c.physicalAddress ?? '']
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const filteredWorkers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return workers;
    return workers.filter((w) =>
      [w.fullName, w.email, w.phone, w.coverageZone, w.serviceTypes, w.status]
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [workers, searchQuery]);

  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return services;
    return services.filter((s) =>
      [s.serviceName, s.pillarCategory, s.basePrice, s.requiredSubscriptionTier, s.status]
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [services, searchQuery]);

  const filteredSubscriptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return subscriptions;
    return subscriptions.filter((s) =>
      [s.tierName, s.targetFacility, s.monthlyFee, s.includedServices, s.status]
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
    const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3000';
    let endpoint = `${apiBase}/customers`;
    if (activeView === 'workers') endpoint = `${apiBase}/workers`;
    if (activeView === 'service-catalog') endpoint = `${apiBase}/services`;
    if (activeView === 'subscriptions') endpoint = `${apiBase}/subscriptions`;
    if (activeView === 'financials') endpoint = `${apiBase}/financials`;

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
        if (!Array.isArray(data) || data.length === 0) return;

        if (activeView === 'workers') {
          const mappedWorkers: WorkerRecord[] = data.map((item) => ({
            id: item.id || `wrk-${Math.random().toString(36).slice(2, 6)}`,
            fullName: item.user?.fullName || 'Field Worker',
            email: item.user?.email || 'N/A',
            phone: item.user?.phoneNumber || 'N/A',
            coverageZone: 'Colombo Central',
            rating: item.rating ?? 5.0,
            serviceTypes: Array.isArray(item.servicePillars) ? item.servicePillars.join(', ') : 'Hard',
            status: item.isAvailable ? 'Active' : 'Offline',
          }));
          setWorkers(mappedWorkers);
        } else if (activeView === 'service-catalog') {
          const mappedServices: ServiceRecord[] = data.map((item) => ({
            id: item.id || `srv-${Math.random().toString(36).slice(2, 6)}`,
            serviceName: item.serviceName || 'Service Item',
            pillarCategory: item.pillarCategory || 'Hard',
            basePrice: item.basePrice || '$250.00',
            requiredSubscriptionTier: item.requiredSubscriptionTier || 'Basic',
            status: item.status || 'Active',
          }));
          setServices(mappedServices);
        } else if (activeView === 'subscriptions') {
          const mappedSubs: SubscriptionPlanRecord[] = data.map((item) => ({
            id: item.id || `sub-${Math.random().toString(36).slice(2, 6)}`,
            tierName: item.tierName || 'Basic',
            targetFacility: item.targetFacility || 'Commercial',
            monthlyFee: item.monthlyFee || '$499/mo',
            activeAccounts: item.activeAccounts ?? 0,
            includedServices: item.includedServices || 'Facility Service Tier',
            status: item.status || 'Active',
          }));
          setSubscriptions(mappedSubs);
        } else if (activeView === 'financials') {
          const mappedFin: FinancialRecord[] = data.map((item) => ({
            id: item.id || 'INV-9001',
            jobId: item.jobId || 'REQ-1001',
            customerName: item.customerName || 'Facility Customer',
            servicePillar: item.servicePillar || 'Hard',
            amount: item.amount || '$500.00',
            paymentStatus: item.paymentStatus || 'Paid',
            invoiceDate: item.invoiceDate || '2026-07-28',
          }));
          setFinancials(mappedFin);
        } else {
          const mappedCustomers: CustomerRecord[] = data.map((item) => ({
            id: item.id || `cust-${Math.random().toString(36).slice(2, 6)}`,
            fullName: item.user?.fullName || 'Customer User',
            displayName: (item.user?.fullName || 'Customer').split(' ')[0],
            email: item.user?.email || 'N/A',
            phone: item.user?.phoneNumber || 'N/A',
            facilityType: (item.facilityType as FacilityType) || 'Commercial',
            subscriptionTier: (item.subscriptionTier as SubscriptionTier) || 'Basic',
            physicalAddress: 'Site Location',
          }));
          setCustomers(mappedCustomers);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsLoading(false);
        setFetchError(`Unable to load live ${activeView} directory from API. Displaying default records.`);
        console.warn(`Using default ${activeView} rows, NestJS API connecting or starting:`, err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeView]);

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

  // Prepare Financial Chart Data
  const revenueTrend = useMemo(() => {
    if (activeView !== 'financials') return [];
    // Mock trend over the last 6 months
    return [
      { month: 'Mar', revenue: 12500 },
      { month: 'Apr', revenue: 15000 },
      { month: 'May', revenue: 13200 },
      { month: 'Jun', revenue: 18400 },
      { month: 'Jul', revenue: 21000 },
      { month: 'Aug', revenue: 24500 },
    ];
  }, [activeView]);

  const revenueByPillar = useMemo(() => {
    if (activeView !== 'financials') return [];
    const counts = { Hard: 0, Soft: 0, Strategic: 0 };
    financials.forEach((f) => {
      const val = parseFloat(f.amount.replace(/[^0-9.-]+/g,""));
      counts[f.servicePillar] += val;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activeView, financials]);

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
          emptyMessage={isFiltering ? 'No customers match your search.' : 'No customers found in directory.'}
        />
      )}

      {activeView === 'service-catalog' && (
        <DataTable<ServiceRecord>
          key={`services-${searchQuery}`}
          columns={serviceColumns}
          data={filteredServices}
          emptyMessage={isFiltering ? 'No services match your search.' : 'No service catalog records.'}
        />
      )}

      {activeView === 'workers' && (
        <DataTable<WorkerRecord>
          key={`workers-${searchQuery}`}
          columns={workerColumns}
          data={filteredWorkers}
          emptyMessage={isFiltering ? 'No workers match your search.' : 'No workers registered in system.'}
        />
      )}

      {activeView === 'subscriptions' && (
        <DataTable<SubscriptionPlanRecord>
          key={`subscriptions-${searchQuery}`}
          columns={subscriptionColumns}
          data={filteredSubscriptions}
          emptyMessage={isFiltering ? 'No subscription tiers match your search.' : 'No subscription tiers defined.'}
        />
      )}

      {activeView === 'financials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
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
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Revenue Trend (6 Months)</h3>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <LineChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface-strong)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }} 
                        itemStyle={{ color: 'var(--text-primary)' }}
                        formatter={(val: number) => [`$${val.toLocaleString()}`, 'Revenue']}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#f38808" strokeWidth={3} dot={{ fill: '#f38808', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-elevated)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Revenue by Pillar</h3>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={revenueByPillar} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: 'var(--surface-strong)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
                        formatter={(val: number) => [`$${val.toLocaleString()}`, 'Revenue']}
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
            emptyMessage={isFiltering ? 'No financial records match your search.' : 'No financial ledger entries found.'}
          />
        </div>
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
