import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMediaQuery } from '@metro-fix/ui';
const subscriptions = [
    {
        id: 'sub-101',
        account: 'Metro Towers',
        plan: 'Premium Operations',
        service: 'Hard + Soft',
        status: 'Active',
        renewal: '2026-08-12',
    },
    {
        id: 'sub-102',
        account: 'Central Mall',
        plan: 'Enterprise Coverage',
        service: 'Strategic',
        status: 'Pending',
        renewal: '2026-08-18',
    },
    {
        id: 'sub-103',
        account: 'North Campus',
        plan: 'Standard FM',
        service: 'Hard',
        status: 'Paused',
        renewal: '2026-09-01',
    },
];
const services = [
    { name: 'Hard FM', coverage: 'Mechanical, electrical, HVAC', utilization: '92%' },
    { name: 'Soft FM', coverage: 'Cleaning, reception, security', utilization: '78%' },
    { name: 'Strategic FM', coverage: 'Audits, planning, vendor governance', utilization: '66%' },
];
export function AdminView() {
    const isCompact = useMediaQuery('(max-width: 980px)');
    return (_jsxs("section", { style: styles.view, children: [_jsx("div", { style: { ...styles.hero, ...(isCompact ? styles.heroCompact : undefined) }, children: _jsxs("div", { children: [_jsx("div", { style: styles.kicker, children: "Management Workspace" }), _jsx("h2", { style: styles.title, children: "Subscription and services control" }), _jsx("p", { style: styles.copy, children: "Track customer subscriptions, service coverage, and plan-level utilization in a clean operations table." })] }) }), _jsxs("div", { style: { ...styles.statGrid, ...(isCompact ? styles.statGridCompact : undefined) }, children: [_jsxs("div", { style: styles.statCard, children: [_jsx("div", { style: styles.statLabel, children: "Active subscriptions" }), _jsx("div", { style: styles.statValue, children: "148" })] }), _jsxs("div", { style: styles.statCard, children: [_jsx("div", { style: styles.statLabel, children: "Managed services" }), _jsx("div", { style: styles.statValue, children: "12" })] }), _jsxs("div", { style: styles.statCard, children: [_jsx("div", { style: styles.statLabel, children: "Renewals this week" }), _jsx("div", { style: styles.statValue, children: "24" })] })] }), _jsxs("div", { style: styles.panel, children: [_jsxs("div", { style: styles.panelHeader, children: [_jsx("h3", { style: styles.panelTitle, children: "Subscriptions" }), _jsx("span", { style: styles.panelMeta, children: "Manage contract lifecycle and renewal readiness" })] }), _jsx("div", { style: styles.tableWrap, children: _jsxs("table", { style: { ...styles.table, minWidth: 760 }, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: styles.th, children: "Account" }), _jsx("th", { style: styles.th, children: "Plan" }), _jsx("th", { style: styles.th, children: "Service mix" }), _jsx("th", { style: styles.th, children: "Status" }), _jsx("th", { style: styles.th, children: "Renewal" })] }) }), _jsx("tbody", { children: subscriptions.map((row) => (_jsxs("tr", { children: [_jsx("td", { style: styles.tdStrong, children: row.account }), _jsx("td", { style: styles.td, children: row.plan }), _jsx("td", { style: styles.td, children: row.service }), _jsx("td", { style: styles.td, children: _jsx("span", { style: { ...styles.statusChip, ...statusTone[row.status] }, children: row.status }) }), _jsx("td", { style: styles.td, children: row.renewal })] }, row.id))) })] }) })] }), _jsxs("div", { style: styles.panel, children: [_jsxs("div", { style: styles.panelHeader, children: [_jsx("h3", { style: styles.panelTitle, children: "Services" }), _jsx("span", { style: styles.panelMeta, children: "Service catalog posture and utilization" })] }), _jsx("div", { style: { ...styles.serviceCards, ...(isCompact ? styles.serviceCardsCompact : undefined) }, children: services.map((service) => (_jsxs("article", { style: styles.serviceCard, children: [_jsxs("div", { style: styles.serviceTopRow, children: [_jsx("h4", { style: styles.serviceName, children: service.name }), _jsx("span", { style: styles.utilization, children: service.utilization })] }), _jsx("p", { style: { ...styles.copy, color: '#4e6769' }, children: service.coverage })] }, service.name))) })] })] }));
}
const statusTone = {
    Active: {
        background: 'rgba(74, 173, 131, 0.12)',
        color: '#2d7d58',
    },
    Pending: {
        background: 'rgba(224, 169, 54, 0.14)',
        color: '#956c14',
    },
    Paused: {
        background: 'rgba(149, 92, 188, 0.12)',
        color: '#6f4491',
    },
};
const styles = {
    view: {
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        color: '#eff7f7',
    },
    hero: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    heroCompact: {
        flexDirection: 'column',
    },
    kicker: {
        color: '#81b1b3',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        fontSize: '0.78rem',
        fontWeight: 700,
    },
    title: {
        margin: '10px 0 8px',
        fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
    },
    copy: {
        margin: 0,
        color: 'rgba(234, 243, 243, 0.72)',
        lineHeight: 1.6,
    },
    statGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '14px',
    },
    statGridCompact: {
        gridTemplateColumns: '1fr',
    },
    statCard: {
        padding: '20px',
        borderRadius: '20px',
        background: 'var(--surface-strong)',
        border: '1px solid var(--border-subtle)',
    },
    statLabel: {
        color: 'var(--text-secondary)',
        marginBottom: '12px',
    },
    statValue: {
        fontSize: '2rem',
        fontWeight: 800,
        color: 'var(--text-primary)',
    },
    panel: {
        padding: '22px',
        borderRadius: '22px',
        background: 'var(--surface-strong)',
        border: '1px solid var(--border-subtle)',
    },
    panelHeader: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '16px',
    },
    panelTitle: {
        margin: 0,
        fontSize: '1.2rem',
    },
    panelMeta: {
        color: 'var(--text-secondary)',
        fontSize: '0.92rem',
    },
    tableWrap: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        color: 'var(--text-primary)',
    },
    th: {
        textAlign: 'left',
        padding: '14px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        color: 'var(--sidebar-accent)',
        fontSize: '0.84rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
    },
    td: {
        padding: '14px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        color: 'var(--text-secondary)',
    },
    tdStrong: {
        padding: '14px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
        fontWeight: 700,
    },
    statusChip: {
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '999px',
        padding: '6px 10px',
        fontWeight: 700,
        fontSize: '0.82rem',
    },
    serviceCards: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '14px',
    },
    serviceCardsCompact: {
        gridTemplateColumns: '1fr',
    },
    serviceCard: {
        background: 'var(--surface)',
        color: 'var(--text-primary)',
        borderRadius: '18px',
        padding: '18px',
    },
    serviceTopRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '10px',
    },
    serviceName: {
        margin: 0,
        fontSize: '1rem',
    },
    utilization: {
        borderRadius: '999px',
        padding: '6px 10px',
        background: 'var(--sidebar-accent)',
        color: 'var(--text-inverse)',
        fontWeight: 700,
        fontSize: '0.8rem',
    },
};
export default AdminView;
