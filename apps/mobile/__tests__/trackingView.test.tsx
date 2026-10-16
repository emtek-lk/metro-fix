import React from 'react';
import { Alert, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';
import { CustomerTrackingView } from '../src/components/CustomerTrackingView';
import { ToastProvider } from '../src/components/ui/Toast';
import { ThemeProvider } from '../src/theme/ThemeProvider';

const mockCancel = jest.fn();
let mockJob: ServiceRequest | undefined;
jest.mock('../src/hooks/useJobs', () => ({
  useJobDetail: () => ({ data: mockJob }),
  useCancelJob: () => ({ mutateAsync: mockCancel, isPending: false }),
}));

// The settings hook reads the API through react-query; here it is just the built-in defaults, with a
// switch to try the "customers may not cancel" rule.
let mockAllowCancel = true;
jest.mock('../src/hooks/useAppSettings', () => ({
  useAppSettings: () => ({ allowCustomerCancellation: mockAllowCancel, supportEmail: 'support@metro-fix.com' }),
}));

const job = (extra: Record<string, unknown> = {}): ServiceRequest =>
  ({
    id: 'job-1',
    title: 'Lobby AC not cooling',
    description: 'Warm air',
    status: JobStatus.REQUESTED,
    servicePillar: 'HARD',
    facilityType: 'COMMERCIAL',
    customerId: 'cust',
    workerId: null,
    createdAt: '2026-10-03T09:00:00Z',
    ...extra,
  }) as unknown as ServiceRequest;

const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

const show = async (current: ServiceRequest) => {
  mockJob = current;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <ToastProvider>
          <CustomerTrackingView job={current} onNewBooking={jest.fn()} />
        </ToastProvider>
      </ThemeProvider>,
    );
  });
  mounted.push(renderer);
  return renderer;
};

const texts = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAllByType(Text)
    .map((node) =>
      React.Children.toArray(node.props.children)
        .filter((child) => typeof child === 'string' || typeof child === 'number')
        .join(''),
    )
    .join(' | ');

const buttonLabels = (renderer: ReactTestRenderer.ReactTestRenderer) =>
  renderer.root
    .findAll((node) => typeof node.props.onPress === 'function' && typeof node.props.accessibilityLabel === 'string')
    .map((node) => node.props.accessibilityLabel as string);

beforeEach(() => {
  mockCancel.mockReset();
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(async () => {
  await ReactTestRenderer.act(async () => {
    mounted.splice(0).forEach((renderer) => renderer.unmount());
  });
  jest.restoreAllMocks();
});

describe('customer tracking', () => {
  it('tells the truth about a request nobody has picked up yet', async () => {
    const renderer = await show(job());
    const out = texts(renderer);
    expect(out).toContain('Waiting for dispatch');
    expect(out).toContain('choosing the nearest certified technician');
    // No made-up technician before one exists.
    expect(out).not.toContain('Your technician');
    expect(out).not.toContain('Alex Rivers');
  });

  it('shows the real technician once one has accepted', async () => {
    const renderer = await show(
      job({
        status: JobStatus.ON_ROUTE,
        workerId: 'w1',
        worker: { id: 'w1', rating: 4.8, user: { fullName: 'Carlos Rivera', phoneNumber: '+94 77 100 0001' } },
      }),
    );
    const out = texts(renderer);
    expect(out).toContain('Your technician');
    expect(out).toContain('Carlos Rivera');
    expect(out).toContain('4.8 rating');
    expect(buttonLabels(renderer)).toContain('Call Carlos Rivera');
  });

  it('does not show a technician while the job is only on offer', async () => {
    const renderer = await show(job({ status: JobStatus.PENDING_ACCEPTANCE, workerId: 'w1', worker: { id: 'w1', user: { fullName: 'Carlos' } } }));
    expect(texts(renderer)).not.toContain('Your technician');
    expect(texts(renderer)).toContain('Contacting a technician');
  });

  it('asks before cancelling, then cancels', async () => {
    mockCancel.mockResolvedValue({});
    const renderer = await show(job());

    await ReactTestRenderer.act(async () => {
      renderer.root
        .find((node) => node.props.accessibilityLabel === 'Cancel request' && typeof node.props.onPress === 'function')
        .props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(mockCancel).not.toHaveBeenCalled();

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const confirm = buttons.find((b: any) => b.style === 'destructive');
    await ReactTestRenderer.act(async () => {
      await confirm.onPress();
    });
    expect(mockCancel).toHaveBeenCalledWith({ jobId: 'job-1' });
  });

  it('explains when the cancel is refused', async () => {
    mockCancel.mockRejectedValue({ response: { status: 409, data: { message: 'A job in IN_PROGRESS can no longer be cancelled.' } } });
    const renderer = await show(job());
    await ReactTestRenderer.act(async () => {
      renderer.root
        .find((node) => node.props.accessibilityLabel === 'Cancel request' && typeof node.props.onPress === 'function')
        .props.onPress();
    });
    const confirm = (Alert.alert as jest.Mock).mock.calls[0][2].find((b: any) => b.style === 'destructive');
    await ReactTestRenderer.act(async () => {
      await confirm.onPress();
    });
    expect(texts(renderer)).toContain('A job in IN_PROGRESS can no longer be cancelled.');
  });

  it('hides cancel when dispatch has switched customer cancellation off', async () => {
    mockAllowCancel = false;
    try {
      const renderer = await show(job({ status: JobStatus.REQUESTED }));
      expect(buttonLabels(renderer)).not.toContain('Cancel request');
    } finally {
      mockAllowCancel = true;
    }
  });

  it('offers no cancel once work has started', async () => {
    const renderer = await show(job({ status: JobStatus.IN_PROGRESS, workerId: 'w1' }));
    expect(buttonLabels(renderer)).not.toContain('Cancel request');
  });

  it('shows a cancelled request as cancelled, without a timeline', async () => {
    const renderer = await show(job({ status: JobStatus.CANCELLED, cancelReason: 'Fixed it myself' }));
    const out = texts(renderer);
    expect(out).toContain('Cancelled');
    expect(out).toContain('Reason: Fixed it myself');
    expect(out).not.toContain('Service progress');
    expect(buttonLabels(renderer)).not.toContain('Cancel request');
  });
});
