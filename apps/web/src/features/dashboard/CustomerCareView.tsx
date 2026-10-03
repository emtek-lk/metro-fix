import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import {
  JobStatus,
  ServiceType,
  JOB_STATUSES_IN_ORDER,
  describeOfferTimeout,
  formatCountdown,
  canTransition,
} from '@metro-fix/core-types';
import { useMediaQuery } from '@metro-fix/ui';
import { API_BASE_URL } from '../../lib/api';
import { WebSocketService } from '../../lib/websocket';

// Column order and the rules for moving between columns come from the shared lifecycle in
// @metro-fix/core-types, the same definition the API enforces and the mobile apps use.
const boardOrder = JOB_STATUSES_IN_ORDER;

const statusLabels: Record<JobStatus, string> = {
  [JobStatus.Requested]: 'REQUESTED',
  [JobStatus.PendingAcceptance]: 'PENDING_ACCEPTANCE',
  [JobStatus.Assigned]: 'ASSIGNED',
  [JobStatus.OnRoute]: 'ON_ROUTE',
  [JobStatus.Inspection]: 'INSPECTION',
  [JobStatus.InProgress]: 'IN_PROGRESS',
  [JobStatus.Completed]: 'COMPLETED',
  [JobStatus.Closed]: 'CLOSED',
  [JobStatus.Cancelled]: 'CANCELLED',
};

type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

type WorkerCandidate = {
  id: string;
  fullName: string;
  serviceTypes: ServiceType[];
  coverageZone: string;
  rating: number;
  proximityKm: number;
  isAvailable: boolean;
};

type AssignedWorker = {
  id: string;
  fullName: string;
  rating: number;
  proximityKm: number;
};

type DispatchCard = {
  id: string;
  title: string;
  customerName: string;
  serviceType: ServiceType;
  urgency: UrgencyLevel;
  location: string;
  assignedWorker: AssignedWorker | null;
  status: JobStatus;
  summary: string;
  createdAt: string;
  /** While PENDING_ACCEPTANCE: when the offer lapses and returns to the queue. */
  offerExpiresAt?: string | null;
  cancelReason?: string | null;
};

const asIso = (value: unknown): string =>
  typeof value === 'string' ? value : value instanceof Date ? value.toISOString() : new Date().toISOString();

/** One place that turns an API job into a board card (fetch, job.created and job.updated all use it). */
function jobToCard(job: any): DispatchCard {
  return {
    id: job.id,
    title: job.title || 'Service Request',
    customerName: job.customer?.user?.fullName || 'Customer Site',
    serviceType: (job.servicePillar as ServiceType) || ServiceType.Hard,
    urgency: toUrgency(job.urgency),
    location: job.facilityType || 'Site Location',
    assignedWorker: job.worker
      ? {
          id: job.worker.id,
          fullName: job.worker.user?.fullName || 'Assigned Worker',
          rating: job.worker.rating || 5.0,
          proximityKm: 1.5,
        }
      : null,
    status: (job.status as JobStatus) || JobStatus.Requested,
    summary: job.description || 'Service request description',
    createdAt: asIso(job.createdAt),
    offerExpiresAt: job.offerExpiresAt ? asIso(job.offerExpiresAt) : null,
    cancelReason: job.cancelReason ?? null,
  };
}

function emptyColumns(): Record<JobStatus, DispatchCard[]> {
  return boardOrder.reduce(
    (collection, status) => {
      collection[status] = [];
      return collection;
    },
    {} as Record<JobStatus, DispatchCard[]>,
  );
}

/** Error text from a failed API call, preferring the server's own message. */
async function apiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    return message || fallback;
  } catch {
    return fallback;
  }
}

/** m:ss left until an offer lapses, ticking every second. Shows "expiring…" once the time is up. */
function OfferCountdown({ expiresAt, workerName }: { expiresAt: string; workerName?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
  const label =
    remaining > 0
      ? formatCountdown(remaining)
      : 'expiring…';
  return (
    <div style={styles.offerChip} role="timer" aria-live="off" aria-label={`Offer expires in ${label}`}>
      <span style={styles.offerChipLabel}>{workerName ? `Awaiting ${workerName}` : 'Awaiting answer'}</span>
      <span style={{ ...styles.offerChipTime, ...(remaining <= 15 ? styles.offerChipTimeUrgent : undefined) }}>
        {label}
      </span>
    </div>
  );
}

const toUrgency = (value?: string): UrgencyLevel => {
  const normalized = (value ?? 'MEDIUM').toUpperCase();
  return (normalized.charAt(0) + normalized.slice(1).toLowerCase()) as UrgencyLevel;
};

function calculateWorkerScore(worker: WorkerCandidate) {
  const availabilityBonus = worker.isAvailable ? 12 : -12;
  return worker.rating * 25 + availabilityBonus - worker.proximityKm * 4;
}

function getWorkerBadgeLabel(worker: WorkerCandidate) {
  return `${worker.rating.toFixed(1)} rating · ${worker.proximityKm.toFixed(1)}km`;
}

export function CustomerCareView() {
  const [columns, setColumns] = useState<Record<JobStatus, DispatchCard[]>>(emptyColumns);
  const [workersList, setWorkersList] = useState<WorkerCandidate[]>([]);
  const [isDispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>('');
  const isCompact = useMediaQuery('(max-width: 980px)');

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 4000);
  };

  const loadJobs = useCallback((isMounted: () => boolean) => {
    setFetchError(null);
    setIsRefreshing(true);

    const token = localStorage.getItem('metrofix_token');
    fetch(`${API_BASE_URL}/jobs`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (res.status === 401) {
          // The saved login is no longer valid (expired, or the API was reset): sign in again.
          try {
            localStorage.removeItem('metrofix_token');
            localStorage.removeItem('metrofix_user');
          } catch {
            // Storage safety
          }
          window.location.assign('/login');
          throw new Error('Session expired');
        }
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data: any[]) => {
        if (!isMounted()) return;
        setIsLoading(false);
        setIsRefreshing(false);
        if (!Array.isArray(data)) return;
        const newCols = emptyColumns();
        data.forEach((job) => {
          const card = jobToCard(job);
          (newCols[card.status] ?? newCols[JobStatus.Requested]).push(card);
        });
        setColumns(newCols);
      })
      .catch((err) => {
        if (!isMounted()) return;
        setIsLoading(false);
        setIsRefreshing(false);
        setFetchError('Unable to reach the API. Showing the last loaded jobs; press Refresh to retry.');
        console.warn('Could not load jobs:', err);
      });

  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    loadJobs(() => mounted);
    return () => {
      mounted = false;
    };
  }, [loadJobs]);

  // Setup WebSocket for real-time job updates
  useEffect(() => {
    const wsService = new WebSocketService(API_BASE_URL);
    wsService.connect(localStorage.getItem('metrofix_token'));

    // Listen for new jobs
    const unsubscribeCreate = wsService.on('job.created', (newJob) => {
      setColumns((prevColumns) => {
        const card = jobToCard(newJob);
        if (Object.values(prevColumns).some((cards) => cards.some((existing) => existing.id === card.id))) {
          return prevColumns;
        }
        // Newest first, matching the fetched order, so a fresh request is seen without scrolling.
        return { ...prevColumns, [card.status]: [card, ...(prevColumns[card.status] || [])] };
      });
      showToast('New service request received!', 'success');
    });

    // Listen for job updates
    const unsubscribeUpdate = wsService.on('job.updated', (updatedJob) => {
      setColumns((prevColumns) => {
        const updated = { ...prevColumns };
        // Remove from wherever the card was, then place it in its new column.
        (Object.keys(updated) as JobStatus[]).forEach((status) => {
          updated[status] = updated[status].filter((card) => card.id !== updatedJob.id);
        });
        const newCard = jobToCard(updatedJob);
        updated[newCard.status] = [newCard, ...(updated[newCard.status] || [])];
        return updated;
      });
    });

    // Refetch after a dropped connection so nothing raised in the meantime is missed.
    const unsubscribeReconnect = wsService.onReconnect(() => loadJobs(() => true));

    return () => {
      unsubscribeReconnect();
      unsubscribeCreate();
      unsubscribeUpdate();
      wsService.disconnect();
    };
  }, [loadJobs]);

  const grouped = useMemo(() => boardOrder.map((status) => ({ status, items: columns[status] })), [columns]);

  // Filter cards across all columns by the search query
  const filteredGrouped = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return grouped;
    return grouped.map((col) => ({
      ...col,
      items: col.items.filter(
        (card) =>
          card.title.toLowerCase().includes(q) ||
          card.customerName.toLowerCase().includes(q) ||
          card.location.toLowerCase().includes(q) ||
          card.serviceType.toLowerCase().includes(q) ||
          card.urgency.toLowerCase().includes(q) ||
          (card.assignedWorker?.fullName.toLowerCase().includes(q) ?? false)
      ),
    }));
  }, [grouped, searchQuery]);

  const sortedWorkers = useMemo(
    () => [...workersList].sort((left, right) => calculateWorkerScore(right) - calculateWorkerScore(left)),
    [workersList]
  );

  const selectedCard = useMemo(() => {
    if (!selectedCardId) {
      return null;
    }

    return boardOrder.flatMap((status) => columns[status]).find((card) => card.id === selectedCardId) ?? null;
  }, [columns, selectedCardId]);

  const openDispatchModal = (cardId: string) => {
    setSelectedCardId(cardId);
    setDispatchModalOpen(true);

    const token = localStorage.getItem('metrofix_token');
    fetch(`${API_BASE_URL}/workers`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: WorkerCandidate[] = data.map((item) => ({
            id: item.id,
            fullName: item.user?.fullName || 'Field Worker',
            serviceTypes: [ServiceType.Hard],
            coverageZone: 'Colombo Central',
            rating: item.rating ?? 5.0,
            proximityKm: 1.5,
            isAvailable: item.isAvailable ?? true,
          }));
          setWorkersList(mapped);
          setSelectedWorkerId(mapped[0].id);
        } else {
          setSelectedWorkerId(sortedWorkers[0]?.id ?? null);
        }
      })
      .catch(() => {
        setSelectedWorkerId(sortedWorkers[0]?.id ?? null);
      });
  };

  const closeDispatchModal = () => {
    setDispatchModalOpen(false);
    setSelectedCardId(null);
    setSelectedWorkerId(null);
  };

  const findCardLocation = (cardId: string) => {
    for (const status of boardOrder) {
      const cardIndex = columns[status].findIndex((card) => card.id === cardId);
      if (cardIndex !== -1) {
        return { status, index: cardIndex };
      }
    }

    return null;
  };

  const moveCard = (
    cardId: string,
    destinationStatus: JobStatus,
    mutate?: (card: DispatchCard) => DispatchCard,
    destinationIndex?: number
  ) => {
    setColumns((currentColumns) => {
      const currentLocation = boardOrder.reduce<{ status: JobStatus | null; index: number }>(
        (result, status) => {
          if (result.status) {
            return result;
          }

          const foundIndex = currentColumns[status].findIndex((card) => card.id === cardId);
          if (foundIndex !== -1) {
            return { status, index: foundIndex };
          }

          return result;
        },
        { status: null, index: -1 }
      );

      if (!currentLocation.status) {
        return currentColumns;
      }

      const sourceStatus = currentLocation.status;
      const sourceCards = [...currentColumns[sourceStatus]];
      const [removedCard] = sourceCards.splice(currentLocation.index, 1);
      const nextCard = mutate ? mutate({ ...removedCard }) : { ...removedCard, status: destinationStatus };
      const destinationCards = [...currentColumns[destinationStatus]];

      if (destinationIndex === undefined) {
        destinationCards.unshift(nextCard);
      } else {
        destinationCards.splice(destinationIndex, 0, nextCard);
      }

      return {
        ...currentColumns,
        [sourceStatus]: sourceCards,
        [destinationStatus]: destinationCards,
      };
    });
  };

  /** Offers the job to the chosen worker. They have OFFER_TIMEOUT_SECONDS to accept or it returns here. */
  const confirmDispatch = async () => {
    if (!selectedCardId || !selectedWorkerId) {
      return;
    }

    const worker = sortedWorkers.find((entry) => entry.id === selectedWorkerId);
    const fallbackName = worker ? worker.fullName : 'Field Worker';
    const token = localStorage.getItem('metrofix_token');

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${selectedCardId}/offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ workerId: selectedWorkerId }),
      });

      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, 'Failed to send the offer.'));
      }

      const updatedJob = await response.json();
      const offered = jobToCard(updatedJob);
      const workerName = offered.assignedWorker?.fullName || fallbackName;

      moveCard(selectedCardId, offered.status, () => offered, 0);
      showToast(`Offer sent to ${workerName}. They have ${describeOfferTimeout()} to accept.`, 'success');
      closeDispatchModal();
    } catch (err: any) {
      // Keep the modal open and the card where it is: a failed offer must not look like a success.
      showToast(err?.message || 'Could not send the offer.', 'error');
    }
  };

  /** Dispatcher sign-off: reviewed proof of work, archive the ticket (COMPLETED -> CLOSED). */
  const handleCloseJob = async (cardId: string) => {
    const token = localStorage.getItem('metrofix_token');
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${cardId}/close`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      moveCard(cardId, JobStatus.Closed, (card) => ({ ...card, status: JobStatus.Closed }), 0);
      showToast('Job closed and archived.', 'success');
    } catch (err) {
      showToast('Could not close the job. Please try again.', 'error');
      console.warn('Failed to close job:', err);
    }
  };

  /** Asks the API to move a job; resolves to an error message, or null when it worked. */
  const requestStatusChange = async (cardId: string, status: JobStatus): Promise<string | null> => {
    const token = localStorage.getItem('metrofix_token');
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${cardId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        return await apiErrorMessage(response, `Request failed (HTTP ${response.status}).`);
      }
      return null;
    } catch {
      return 'Could not reach the server.';
    }
  };

  /** Pulls a pending offer back to the queue. */
  const handleWithdrawOffer = async (cardId: string) => {
    const error = await requestStatusChange(cardId, JobStatus.Requested);
    if (error) {
      showToast(error, 'error');
      return;
    }
    moveCard(cardId, JobStatus.Requested, (card) => ({
      ...card,
      status: JobStatus.Requested,
      assignedWorker: null,
      offerExpiresAt: null,
    }), 0);
    showToast('Offer withdrawn. The job is back in the queue.', 'success');
  };

  /** Cancels a job that has not started work. */
  const handleCancelJob = async (cardId: string) => {
    if (!window.confirm('Cancel this job? The customer and any assigned worker will be notified.')) {
      return;
    }
    const error = await requestStatusChange(cardId, JobStatus.Cancelled);
    if (error) {
      showToast(error, 'error');
      return;
    }
    moveCard(cardId, JobStatus.Cancelled, (card) => ({ ...card, status: JobStatus.Cancelled, offerExpiresAt: null }), 0);
    showToast('Job cancelled.', 'success');
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const sourceStatus = source.droppableId as JobStatus;
    const destinationStatus = destination.droppableId as JobStatus;

    // Reordering inside one column is just a local change.
    if (sourceStatus === destinationStatus) {
      setColumns((current) => {
        const cards = [...current[sourceStatus]];
        const [moved] = cards.splice(source.index, 1);
        cards.splice(destination.index, 0, moved);
        return { ...current, [sourceStatus]: cards };
      });
      return;
    }

    // The lifecycle decides what is allowed (same table the API enforces); say no right away.
    if (!canTransition(sourceStatus, destinationStatus)) {
      showToast(`A job can't move from ${statusLabels[sourceStatus]} to ${statusLabels[destinationStatus]}.`, 'error');
      return;
    }

    // Dragging a queued job onto PENDING_ACCEPTANCE means "offer it": pick the worker first.
    if (sourceStatus === JobStatus.Requested && destinationStatus === JobStatus.PendingAcceptance) {
      openDispatchModal(draggableId);
      return;
    }

    if (destinationStatus === JobStatus.Cancelled) {
      void handleCancelJob(draggableId);
      return;
    }

    if (destinationStatus === JobStatus.Requested && sourceStatus === JobStatus.PendingAcceptance) {
      void handleWithdrawOffer(draggableId);
      return;
    }

    const sourceCards = [...columns[sourceStatus]];
    const sourceIndex = sourceCards.findIndex((card) => card.id === draggableId);
    if (sourceIndex === -1) {
      return;
    }

    const [movedItem] = sourceCards.splice(sourceIndex, 1);
    const updatedItem: DispatchCard = {
      ...movedItem,
      status: destinationStatus,
      offerExpiresAt: null,
      assignedWorker: destinationStatus === JobStatus.Requested ? null : movedItem.assignedWorker,
    };
    const destinationCards = [...columns[destinationStatus]];
    destinationCards.splice(destination.index, 0, updatedItem);

    const previousColumns = columns;
    setColumns((current) => ({
      ...current,
      [sourceStatus]: sourceCards,
      [destinationStatus]: destinationCards,
    }));
    setAriaAnnouncement(`Moved job card ${movedItem.title || movedItem.id} to ${statusLabels[destinationStatus]}`);

    void requestStatusChange(draggableId, destinationStatus).then((error) => {
      if (error) {
        setColumns(previousColumns);
        showToast(error, 'error');
      } else {
        showToast(`Job status updated to "${statusLabels[destinationStatus]}"`, 'success');
      }
    });
  };

  return (
    <section style={styles.view} aria-label="Customer Care Managed Dispatch Kanban Board">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {ariaAnnouncement}
      </div>
      {toast && (
        <div
          style={{
            ...styles.toastNotification,
            background: toast.type === 'success' ? '#2b435f' : '#8b0000',
            borderColor: toast.type === 'success' ? '#f38808' : '#ff4d4d',
          }}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'} {toast.message}</span>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Modern Board-level search bar */}
        {(() => {
          const totalCards = grouped.reduce((acc, col) => acc + col.items.length, 0);
          const filteredCards = filteredGrouped.reduce((acc, col) => acc + col.items.length, 0);
          const isFiltering = searchQuery.trim().length > 0;
          return (
            <div className="metro-search-row">
              <div className="metro-search-wrap">
                <div className="metro-search-container">
                  <div className="metro-search-icon" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search dispatch board..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="metro-search-input"
                    aria-label="Search dispatch jobs"
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
              <button
                type="button"
                onClick={() => loadJobs(() => true)}
                disabled={isRefreshing}
                aria-label="Refresh dispatch board"
                title="Refresh jobs"
                style={styles.refreshButton}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={isRefreshing ? { animation: 'metro-spin 0.8s linear infinite' } : undefined}
                >
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                  <polyline points="21 3 21 9 15 9" />
                </svg>
                <span>{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
              </button>
              {fetchError && <span style={styles.fetchError} role="alert">{fetchError}</span>}
              {isFiltering && (
                <div className="metro-search-count-pill">
                  {filteredCards === 0
                    ? 'No matches'
                    : `${filteredCards} of ${totalCards}`}
                </div>
              )}
            </div>
          );
        })()}

        <div style={{ ...styles.boardShell, ...(isCompact ? styles.boardShellCompact : undefined) }}>
          <div style={{ ...styles.board, ...(isCompact ? styles.boardCompact : undefined) }}>
            {filteredGrouped.map(({ status, items }) => (
              <article key={status} style={styles.column}>
                <div style={styles.columnHeader}>
                  <span>{statusLabels[status]}</span>
                  <span style={styles.badge}>{items.length}</span>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        ...styles.cardStack,
                        ...(snapshot.isDraggingOver ? styles.cardStackDraggingOver : undefined),
                      }}
                    >
                      {items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(draggableProvided, draggableSnapshot) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                              style={{
                                ...styles.card,
                                ...(draggableSnapshot.isDragging ? styles.cardDragging : undefined),
                                ...draggableProvided.draggableProps.style,
                              }}
                            >
                              <div style={styles.cardTopRow}>
                                <span style={styles.serviceChip}>{item.serviceType}</span>
                                <span style={styles.cardId}>{item.id}</span>
                              </div>
                              <h3 style={styles.cardTitle}>{item.title}</h3>
                              <p style={styles.cardMeta}>{item.customerName}</p>
                              <p style={styles.cardCopy}>{item.summary}</p>
                              <div style={styles.cardFooterRow}>
                                <span style={{ ...styles.urgencyPill, ...(urgencyStyles[item.urgency] ?? undefined) }}>
                                  {item.urgency}
                                </span>
                                <span style={styles.cardFooter}>{item.location}</span>
                              </div>

                              {status === JobStatus.PendingAcceptance && item.offerExpiresAt ? (
                                <OfferCountdown
                                  expiresAt={item.offerExpiresAt}
                                  workerName={item.assignedWorker?.fullName}
                                />
                              ) : (
                                item.assignedWorker && (
                                  <div style={styles.workerChip}>
                                    <span style={styles.workerChipLabel}>Worker</span>
                                    <span>{item.assignedWorker.fullName}</span>
                                  </div>
                                )
                              )}

                              {status === JobStatus.Cancelled && item.cancelReason && (
                                <p style={styles.cardCopy}>Reason: {item.cancelReason}</p>
                              )}

                              <div style={styles.cardActions}>
                                {status === JobStatus.Requested && (
                                  <button
                                    type="button"
                                    style={styles.secondaryActionButton}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openDispatchModal(item.id);
                                    }}
                                  >
                                    Offer to Worker
                                  </button>
                                )}

                                {status === JobStatus.PendingAcceptance && (
                                  <button
                                    type="button"
                                    style={styles.secondaryActionButton}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleWithdrawOffer(item.id);
                                    }}
                                  >
                                    Withdraw offer
                                  </button>
                                )}

                                {canTransition(status, JobStatus.Cancelled) && (
                                  <button
                                    type="button"
                                    style={styles.linkActionButton}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleCancelJob(item.id);
                                    }}
                                  >
                                    Cancel job
                                  </button>
                                )}

                                {status === JobStatus.Completed && (
                                  <button
                                    type="button"
                                    style={styles.secondaryActionButton}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleCloseJob(item.id);
                                    }}
                                  >
                                    Approve &amp; Close
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}

                      {items.length === 0 && <div style={styles.emptyState}>No jobs in this stage.</div>}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </article>
            ))}
          </div>
        </div>
      </DragDropContext>

      {isDispatchModalOpen && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Worker dispatch modal" className="metro-modal-overlay">
          <div style={styles.modalCard} className="metro-modal-card">
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.kicker}>Dispatch Workflow</div>
                <h3 style={styles.modalTitle}>Offer job to a worker</h3>
              </div>
              <button type="button" style={styles.closeButton} onClick={closeDispatchModal}>
                Close
              </button>
            </div>

            {selectedCard && (
              <div style={styles.dispatchContext}>
                <div style={styles.dispatchContextLabel}>Selected job</div>
                <div style={styles.dispatchContextTitle}>{selectedCard.title}</div>
                <div style={styles.dispatchContextMeta}>
                  {selectedCard.customerName} · {selectedCard.location}
                </div>
              </div>
            )}

            <div style={styles.dispatchGrid}>
              <div style={styles.workerList}>
                <div style={styles.dispatchLaneTitle}>Available workers</div>
                {sortedWorkers.map((worker) => {
                  const isSelected = worker.id === selectedWorkerId;

                  return (
                    <button
                      key={worker.id}
                      type="button"
                      style={{ ...styles.workerRow, ...(isSelected ? styles.workerRowSelected : undefined) }}
                      onClick={() => setSelectedWorkerId(worker.id)}
                    >
                      <div style={styles.workerTopRow}>
                        <strong style={styles.workerName}>{worker.fullName}</strong>
                        <span style={styles.workerScore}>{calculateWorkerScore(worker).toFixed(0)}</span>
                      </div>
                      <div style={styles.workerMeta}>{worker.coverageZone}</div>
                      <div style={styles.workerMeta}>{getWorkerBadgeLabel(worker)}</div>
                    </button>
                  );
                })}
              </div>

              <div style={styles.dispatchPreview}>
                <div style={styles.dispatchLaneTitle}>Dispatch summary</div>
                <div style={styles.dispatchDropZone}>
                  The selected worker has {describeOfferTimeout()} to accept. If they decline or do not answer, the job returns to the queue.
                </div>
                <button type="button" style={styles.primaryButton} onClick={confirmDispatch} disabled={!selectedWorkerId}>
                  Send offer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  view: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    color: 'var(--text-primary)',
    minWidth: 0,
    overflow: 'hidden',
    gap: '10px',
  },
  /* ─── Board search bar ─── */
  boardSearchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  boardSearchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '14px',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    boxShadow: '0 2px 8px rgba(14, 20, 21, 0.04)',
  },
  boardSearchIcon: {
    color: 'var(--text-secondary)',
    fontSize: '1.2rem',
    lineHeight: 1,
    flexShrink: 0,
    userSelect: 'none',
  },
  boardSearchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '0.92rem',
    outline: 'none',
    minWidth: 0,
  },
  boardSearchClear: {
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
  boardSearchCount: {
    flexShrink: 0,
    fontSize: '0.82rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    padding: '6px 12px',
    borderRadius: '10px',
    background: 'rgba(243, 136, 8, 0.08)',
    border: '1px solid rgba(243, 136, 8, 0.2)',
    color: '#f38808',
  },
  kicker: {
    color: '#f38808',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontSize: '0.78rem',
    fontWeight: 700,
  },
  primaryButton: {
    border: '1px solid #d37105',
    background: 'linear-gradient(135deg, #f38808, #d37105)',
    color: '#ffffff',
    padding: '12px 16px',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
  },
  boardShell: {
    flex: 1,
    height: '100%',
    maxHeight: '100%',
    width: '100%',
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
    boxSizing: 'border-box',
    paddingBottom: '2px',
  },
  boardShellCompact: {
    overflowX: 'visible',
  },
  board: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: 'minmax(280px, 320px)',
    gap: '14px',
    height: '100%',
    maxHeight: '100%',
    width: 'max-content',
    minWidth: '100%',
  },
  boardCompact: {
    gridAutoFlow: 'row',
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    width: '100%',
    height: 'auto',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    padding: '14px',
    borderRadius: '22px',
    background: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
    boxSizing: 'border-box',
    boxShadow: '0 12px 28px rgba(14, 20, 21, 0.06)',
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.82rem',
    marginBottom: '12px',
    flexShrink: 0,
  },
  badge: {
    minWidth: '24px',
    height: '24px',
    borderRadius: '999px',
    display: 'grid',
    placeItems: 'center',
    background: '#f38808',
    color: '#ffffff',
    fontSize: '0.78rem',
    fontWeight: 800,
  },
  cardStack: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    paddingRight: '2px',
  },
  cardStackDraggingOver: {
    background: 'rgba(243, 136, 8, 0.04)',
    borderRadius: '12px',
  },
  card: {
    padding: '14px 14px 13px',
    borderRadius: '16px',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-elevated)',
    border: '1px solid var(--border-subtle)',
    cursor: 'grab',
    boxSizing: 'border-box',
    flexShrink: 0,
    transition: 'box-shadow 140ms ease, border-color 140ms ease',
  },
  cardDragging: {
    cursor: 'grabbing',
    boxShadow: '0 18px 38px rgba(0, 0, 0, 0.18)',
    borderColor: 'rgba(243, 136, 8, 0.45)',
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '8px',
  },
  serviceChip: {
    borderRadius: '999px',
    background: '#f38808',
    color: '#ffffff',
    padding: '4px 8px',
    fontSize: '0.7rem',
    fontWeight: 700,
  },
  cardId: {
    fontSize: '0.74rem',
    color: 'var(--text-secondary)',
  },
  cardTitle: {
    margin: '0 0 6px',
    fontSize: '0.95rem',
    fontWeight: 700,
  },
  cardMeta: {
    margin: '0 0 6px',
    color: 'var(--text-secondary)',
    fontSize: '0.84rem',
    fontWeight: 600,
  },
  cardCopy: {
    margin: 0,
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
    fontSize: '0.84rem',
  },
  cardFooterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: '10px',
  },
  cardFooter: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  urgencyPill: {
    padding: '4px 8px',
    borderRadius: '999px',
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#ffffff',
    background: '#2b435f',
  },
  workerChip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: '10px',
    padding: '8px 10px',
    borderRadius: '10px',
    background: 'var(--surface-strong)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
  },
  workerChipLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#f38808',
  },
  refreshButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    height: 36,
    padding: '0 14px',
    borderRadius: 999,
    border: '1px solid rgba(243, 136, 8, 0.55)',
    background: 'transparent',
    color: '#f38808',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  } as CSSProperties,
  fetchError: {
    color: '#ff8a80',
    fontSize: 13,
  } as CSSProperties,
  offerChip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: '10px',
    padding: '8px 10px',
    borderRadius: '10px',
    background: 'var(--surface-strong)',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    border: '1px dashed #f38808',
  },
  offerChipLabel: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  offerChipTime: {
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 800,
    color: '#f38808',
  },
  offerChipTimeUrgent: {
    color: '#e5484d',
  },
  linkActionButton: {
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    padding: '8px 4px',
    fontWeight: 600,
    fontSize: '0.78rem',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  cardActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px',
  },
  secondaryActionButton: {
    border: '1px solid #f38808',
    background: 'transparent',
    color: '#f38808',
    padding: '8px 10px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
  rejectButton: {
    border: '1px solid #d37105',
    background: '#d37105',
    color: '#ffffff',
    padding: '8px 10px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
  emptyState: {
    padding: '16px',
    borderRadius: '12px',
    border: '1px dashed var(--border-subtle)',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    fontSize: '0.84rem',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(4, 10, 11, 0.62)',
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    zIndex: 99999,
  },
  modalCard: {
    width: 'min(680px, 100%)',
    borderRadius: '24px',
    background: 'var(--surface)',
    border: '1px solid var(--border-subtle)',
    padding: '20px',
    boxSizing: 'border-box',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 30px 72px rgba(0, 0, 0, 0.32)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '12px',
  },
  modalTitle: {
    margin: '4px 0 0',
    fontSize: '1.25rem',
    color: 'var(--text-primary)',
    fontWeight: 700,
  },
  closeButton: {
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    color: '#f38808',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.84rem',
  },
  dispatchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '14px',
    marginTop: '14px',
  },
  dispatchLaneTitle: {
    marginBottom: '10px',
    fontWeight: 700,
    fontSize: '0.88rem',
    color: 'var(--text-primary)',
  },
  workerList: {
    background: 'var(--surface-strong)',
    borderRadius: '14px',
    padding: '14px',
    border: '1px solid var(--border-subtle)',
  },
  workerRow: {
    width: '100%',
    textAlign: 'left',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    borderRadius: '12px',
    padding: '10px 12px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease',
  },
  workerRowSelected: {
    borderColor: '#f38808',
    boxShadow: '0 0 0 1px #f38808 inset, 0 10px 22px rgba(243, 136, 8, 0.12)',
    transform: 'translateY(-1px)',
  },
  workerTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '4px',
  },
  workerName: {
    fontSize: '0.9rem',
  },
  workerScore: {
    borderRadius: '999px',
    background: '#f38808',
    color: '#ffffff',
    padding: '2px 6px',
    fontSize: '0.7rem',
    fontWeight: 700,
  },
  workerMeta: {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    lineHeight: 1.35,
  },
  dispatchPreview: {
    background: 'var(--surface-strong)',
    borderRadius: '14px',
    padding: '14px',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  dispatchContext: {
    marginTop: '12px',
    borderRadius: '14px',
    padding: '12px 14px',
    border: '1px solid var(--border-subtle)',
    background: 'rgba(43, 67, 95, 0.08)',
  },
  dispatchContextLabel: {
    color: '#f38808',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: '0.72rem',
    fontWeight: 700,
  },
  dispatchContextTitle: {
    marginTop: '4px',
    color: 'var(--text-primary)',
    fontSize: '0.96rem',
    fontWeight: 700,
  },
  dispatchContextMeta: {
    marginTop: '2px',
    color: 'var(--text-secondary)',
    fontSize: '0.84rem',
  },
  dispatchDropZone: {
    minHeight: '100px',
    borderRadius: '12px',
    border: '1px dashed rgba(243, 136, 8, 0.34)',
    display: 'grid',
    placeItems: 'center',
    color: 'var(--text-secondary)',
    padding: '12px',
    textAlign: 'center',
  },
  loadingBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    marginBottom: '10px',
    background: '#2b435f',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#f38808',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBanner: {
    padding: '8px 16px',
    marginBottom: '10px',
    background: '#8b0000',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: 500,
  },
  toastNotification: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    padding: '12px 20px',
    borderRadius: '8px',
    color: '#ffffff',
    border: '1px solid #f38808',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    fontSize: '0.9rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};

const urgencyStyles: Record<UrgencyLevel, CSSProperties> = {
  Low: {
    background: '#2b435f',
  },
  Medium: {
    background: '#3d5c7d',
  },
  High: {
    background: '#d37105',
  },
  Critical: {
    background: '#f38808',
  },
};

export default CustomerCareView;