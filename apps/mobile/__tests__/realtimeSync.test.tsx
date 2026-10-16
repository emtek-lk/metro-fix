import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRealtimeSync } from '../src/hooks/useRealtimeSync';

// Defined inside the factory: Jest hoists jest.mock above any variable declared in this file.
jest.mock('../src/services/websocket', () => {
  const socket = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    handlers: {} as Record<string, (payload?: any) => void>,
    on: jest.fn(),
  };
  socket.on.mockImplementation((event: string, handler: (payload?: any) => void) => {
    socket.handlers[event] = handler;
    return () => {
      delete socket.handlers[event];
    };
  });
  return { realtimeSocket: socket };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockSocket = require('../src/services/websocket').realtimeSocket as {
  connect: jest.Mock;
  disconnect: jest.Mock;
  on: jest.Mock;
  handlers: Record<string, (payload?: any) => void>;
};

const Probe = ({ token }: { token: string | null }) => {
  useRealtimeSync(token);
  return null;
};

const mount = async (token: string | null, client = new QueryClient()) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <QueryClientProvider client={client}>
        <Probe token={token} />
      </QueryClientProvider>,
    );
  });
  return { renderer, client };
};

beforeEach(() => {
  mockSocket.connect.mockClear();
  mockSocket.disconnect.mockClear();
  mockSocket.on.mockClear();
  mockSocket.handlers = {};
});

describe('useRealtimeSync', () => {
  it('connects with the session token and disconnects when it ends', async () => {
    const { renderer } = await mount('jwt-token');
    expect(mockSocket.connect).toHaveBeenCalledWith('jwt-token');

    await ReactTestRenderer.act(async () => renderer.unmount());
    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('does nothing while signed out', async () => {
    await mount(null);
    expect(mockSocket.connect).not.toHaveBeenCalled();
  });

  it('puts an updated job straight into the cache and refreshes the lists', async () => {
    const client = new QueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    await mount('jwt-token', client);

    const job = { id: 'job-1', status: 'ASSIGNED' };
    await ReactTestRenderer.act(async () => mockSocket.handlers['job.updated'](job));

    expect(client.getQueryData(['jobDetail', 'job-1'])).toEqual(job);
    const refreshed = invalidate.mock.calls.map(([filters]) => (filters as any).queryKey[0]);
    expect(refreshed).toEqual(expect.arrayContaining(['workerJobs', 'myRequests', 'workerStats']));
  });

  it('treats a new offer and a new job like any other change', async () => {
    const client = new QueryClient();
    await mount('jwt-token', client);
    await ReactTestRenderer.act(async () => mockSocket.handlers['job.offered']({ id: 'job-2' }));
    await ReactTestRenderer.act(async () => mockSocket.handlers['job.created']({ id: 'job-3' }));
    expect(client.getQueryData(['jobDetail', 'job-2'])).toEqual({ id: 'job-2' });
    expect(client.getQueryData(['jobDetail', 'job-3'])).toEqual({ id: 'job-3' });
  });

  it('refreshes everything after a reconnect, to catch what was missed', async () => {
    const client = new QueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    await mount('jwt-token', client);

    await ReactTestRenderer.act(async () => mockSocket.handlers['socket.connected']());

    const refreshed = invalidate.mock.calls.map(([filters]) => (filters as any).queryKey[0]);
    expect(refreshed).toContain('jobDetail');
    expect(refreshed).toContain('workerJobs');
  });
});
