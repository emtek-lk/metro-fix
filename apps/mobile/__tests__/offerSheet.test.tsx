import React from 'react';
import { Modal, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { JobStatus, ServiceRequest } from '@metro-fix/core-types';
import { NewJobAlertModal } from '../src/components/NewJobAlertModal';
import { ToastProvider } from '../src/components/ui/Toast';
import { ThemeProvider } from '../src/theme/ThemeProvider';

const mockAccept = jest.fn();
const mockDecline = jest.fn();
jest.mock('../src/hooks/useJobs', () => ({
  useAcceptOffer: () => ({ mutateAsync: mockAccept }),
  useDeclineOffer: () => ({ mutateAsync: mockDecline }),
}));

const NOW = new Date('2026-10-03T12:00:00Z').getTime();

const offer = (secondsLeft = 90): ServiceRequest =>
  ({
    id: 'job-1',
    title: 'Roof chiller fault',
    description: 'Compressor trips after ten minutes.',
    status: JobStatus.PENDING_ACCEPTANCE,
    servicePillar: 'HARD',
    facilityType: 'COMMERCIAL',
    customerId: 'cust',
    customer: { user: { fullName: 'Eleanor Vance' } },
    location: { latitude: 6.9271, longitude: 79.8612 },
    offerExpiresAt: new Date(NOW + secondsLeft * 1000).toISOString(),
    createdAt: new Date(NOW).toISOString(),
  }) as unknown as ServiceRequest;

const mounted: ReactTestRenderer.ReactTestRenderer[] = [];

const handlers = () => ({
  onAccepted: jest.fn(),
  onDeclined: jest.fn(),
  onExpired: jest.fn(),
  onDismiss: jest.fn(),
});

const show = async (job: ServiceRequest | null, fns = handlers()) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <ToastProvider>
          <NewJobAlertModal visible={!!job} job={job} {...fns} />
        </ToastProvider>
      </ThemeProvider>,
    );
  });
  mounted.push(renderer);
  return { renderer, fns };
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

const press = async (renderer: ReactTestRenderer.ReactTestRenderer, label: string) => {
  const target = renderer.root.find(
    (node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function',
  );
  await ReactTestRenderer.act(async () => {
    await target.props.onPress();
  });
};

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  mockAccept.mockReset();
  mockDecline.mockReset();
});

afterEach(async () => {
  await ReactTestRenderer.act(async () => {
    mounted.splice(0).forEach((renderer) => renderer.unmount());
  });
  jest.useRealTimers();
});

describe('offer sheet', () => {
  it('shows the job and the time left', async () => {
    const { renderer } = await show(offer(90));
    const out = texts(renderer);
    expect(out).toContain('Roof chiller fault');
    expect(out).toContain('Eleanor Vance');
    expect(out).toContain('6.9271, 79.8612');
    expect(out).toContain('1:30');
  });

  it('counts down every second', async () => {
    const { renderer } = await show(offer(90));
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(30_000);
    });
    expect(texts(renderer)).toContain('1:00');
  });

  it('renders nothing without a job', async () => {
    const { renderer } = await show(null);
    expect(renderer.toJSON()).toBeNull();
  });

  it('accepts: calls the API and hands the accepted job back', async () => {
    const accepted = { ...offer(), status: JobStatus.ASSIGNED } as ServiceRequest;
    mockAccept.mockResolvedValue(accepted);
    const { renderer, fns } = await show(offer());

    await press(renderer, 'Accept job');

    expect(mockAccept).toHaveBeenCalledWith('job-1');
    expect(fns.onAccepted).toHaveBeenCalledWith(accepted);
    expect(fns.onExpired).not.toHaveBeenCalled();
  });

  it('closes itself and explains when the offer is gone by the time it is accepted', async () => {
    mockAccept.mockRejectedValue({ response: { status: 409, data: { message: 'This offer has expired and went back to dispatch.' } } });
    const { renderer, fns } = await show(offer());

    await press(renderer, 'Accept job');

    expect(fns.onAccepted).not.toHaveBeenCalled();
    expect(fns.onExpired).toHaveBeenCalledTimes(1);
    expect(texts(renderer)).toContain('This offer has expired and went back to dispatch.');
  });

  it('declines: calls the API and tells the screen', async () => {
    mockDecline.mockResolvedValue({});
    const { renderer, fns } = await show(offer());

    await press(renderer, 'Decline');

    expect(mockDecline).toHaveBeenCalledWith({ jobId: 'job-1' });
    expect(fns.onDeclined).toHaveBeenCalledTimes(1);
  });

  it('does not decline when the sheet is dismissed with the Android back button', async () => {
    const { renderer, fns } = await show(offer());

    await ReactTestRenderer.act(async () => {
      renderer.root.findByType(Modal).props.onRequestClose();
    });

    expect(fns.onDismiss).toHaveBeenCalledTimes(1);
    expect(mockDecline).not.toHaveBeenCalled();
    expect(fns.onDeclined).not.toHaveBeenCalled();
  });

  it('closes itself when the time runs out, once', async () => {
    const { renderer, fns } = await show(offer(3));

    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(5_000);
    });

    expect(fns.onExpired).toHaveBeenCalledTimes(1);
    expect(texts(renderer)).toContain('Expired');

    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(10_000);
    });
    expect(fns.onExpired).toHaveBeenCalledTimes(1);
  });

  it('cannot be answered once it has expired', async () => {
    const { renderer } = await show(offer(2));
    await ReactTestRenderer.act(async () => {
      jest.advanceTimersByTime(3_000);
    });
    const accept = renderer.root.find(
      (node) => node.props.accessibilityLabel === 'Accept job' && typeof node.props.onPress === 'function',
    );
    expect(accept.props.accessibilityState).toMatchObject({ disabled: true });
  });
});
