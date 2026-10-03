import { JobStatus } from '@metro-fix/core-types';
import { FinancialsService } from './financials.service';

const card = (total: number, hours = 2) => ({
  currency: 'LKR',
  taxRate: 0,
  estimate: { lineItems: [], hours: 1, notes: '', subtotal: 100, tax: 0, total: 100, savedAt: 'x' },
  final: { lineItems: [], hours, notes: '', subtotal: total, tax: 0, total, savedAt: 'x' },
});

const job = (over: Record<string, unknown>) => ({
  id: String(Math.random()),
  status: JobStatus.CLOSED,
  servicePillar: 'HARD',
  customer: { user: { fullName: 'Eleanor' } },
  createdAt: new Date('2026-09-01'),
  updatedAt: new Date('2026-09-10'),
  closedAt: new Date('2026-09-10'),
  jobCard: null,
  quoteAmount: null,
  ...over,
});

function build(jobs: any[], payments: any[] = []) {
  const jobRepo = { find: jest.fn(async () => jobs) };
  const paymentRepo = { find: jest.fn(async () => payments) };
  return new FinancialsService(jobRepo as any, paymentRepo as any);
}

describe('FinancialsService', () => {
  it('invents nothing: no finished jobs means no invoices', async () => {
    expect(await build([]).getFinancialRecords()).toEqual([]);
  });

  it('bills the final job card, falling back to the estimate and then the flat quote', async () => {
    const service = build([
      job({ jobCard: card(5000, 3) }),
      job({ jobCard: { ...card(0), final: null } }),
      job({ quoteAmount: 750 }),
      job({}),
    ]);
    const records = await service.getFinancialRecords();
    expect(records.map((r) => r.amountLkr).sort((a, b) => a - b)).toEqual([100, 750, 5000]);
    const big = records.find((r) => r.amountLkr === 5000)!;
    expect(big).toMatchObject({ hours: 3, amount: 'LKR 5,000.00', paymentStatus: 'Invoiced', servicePillar: 'HARD' });
    expect(big.id).toMatch(/^INV-[0-9A-Z]{6}$/);
  });

  it('marks completed-but-open jobs as awaiting approval and keeps them out of revenue', async () => {
    const service = build([job({ status: JobStatus.COMPLETED, jobCard: card(2000) }), job({ jobCard: card(3000) })]);
    const records = await service.getFinancialRecords();
    expect(records.find((r) => r.amountLkr === 2000)?.paymentStatus).toBe('Awaiting approval');
    const summary = await service.getSummary(new Date('2026-10-15'));
    expect(summary.kpis).toMatchObject({ invoiced: 3000, awaitingApproval: 2000, invoiceCount: 1 });
  });

  it('buckets six months of job and subscription revenue and splits it by service', async () => {
    const service = build(
      [job({ jobCard: card(3000) }), job({ servicePillar: 'SOFT', jobCard: card(1000), closedAt: new Date('2026-08-05') })],
      [{ amountLkr: 3500, createdAt: new Date('2026-10-02') }],
    );
    const summary = await service.getSummary(new Date('2026-10-15'));
    expect(summary.months.map((m) => m.key)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
    expect(summary.months.find((m) => m.key === '2026-09')).toMatchObject({ jobs: 3000, total: 3000 });
    expect(summary.months.find((m) => m.key === '2026-08')?.jobs).toBe(1000);
    expect(summary.months.find((m) => m.key === '2026-10')).toMatchObject({ subscriptions: 3500, total: 3500 });
    expect(Object.fromEntries(summary.byPillar.map((p) => [p.name, p.value]))).toEqual({
      Hard: 3000, Soft: 1000, Strategic: 0, Subscriptions: 3500,
    });
  });

  it('exports numbers, not currency strings, in the CSV', async () => {
    const csv = await build([job({ jobCard: card(1234.5) })]).generateCsvReport();
    expect(csv.split('\n')[0]).toContain('Amount (LKR)');
    expect(csv).toContain('"1234.50"');
  });
});
