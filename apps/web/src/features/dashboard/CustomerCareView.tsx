import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { JobStatus, ServiceType } from '@metro-fix/core-types';
import { useMediaQuery } from '@metro-fix/ui';

const boardOrder = [
  JobStatus.Requested,
  JobStatus.PendingAcceptance,
  JobStatus.Assigned,
  JobStatus.OnRoute,
  JobStatus.Inspection,
  JobStatus.InProgress,
  JobStatus.Completed,
] as const;

const statusLabels: Record<JobStatus, string> = {
  [JobStatus.Requested]: 'REQUESTED',
  [JobStatus.PendingAcceptance]: 'PENDING_ACCEPTANCE',
  [JobStatus.Assigned]: 'ASSIGNED',
  [JobStatus.OnRoute]: 'ON_ROUTE',
  [JobStatus.Inspection]: 'INSPECTION',
  [JobStatus.InProgress]: 'IN_PROGRESS',
  [JobStatus.Completed]: 'COMPLETED',
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
};

const mockWorkers: WorkerCandidate[] = [
  {
    id: 'wrk-01',
    fullName: 'Amina Yusuf',
    serviceTypes: [ServiceType.Hard, ServiceType.Strategic],
    coverageZone: 'North District',
    rating: 4.9,
    proximityKm: 1.2,
    isAvailable: true,
  },
  {
    id: 'wrk-02',
    fullName: 'Malik Thompson',
    serviceTypes: [ServiceType.Soft],
    coverageZone: 'Central Business',
    rating: 4.7,
    proximityKm: 2.6,
    isAvailable: true,
  },
  {
    id: 'wrk-03',
    fullName: 'Nadia Khan',
    serviceTypes: [ServiceType.Hard, ServiceType.Soft],
    coverageZone: 'East Park',
    rating: 4.8,
    proximityKm: 3.1,
    isAvailable: true,
  },
  {
    id: 'wrk-04',
    fullName: 'Omar Silva',
    serviceTypes: [ServiceType.Strategic],
    coverageZone: 'Harbor Loop',
    rating: 4.5,
    proximityKm: 4.4,
    isAvailable: true,
  },
];

const mockCards: DispatchCard[] = [
  {
    id: 'req-1001',
    title: 'Chiller room maintenance',
    customerName: 'Skyline Towers',
    serviceType: ServiceType.Hard,
    urgency: 'Critical',
    location: 'Building A · Basement',
    assignedWorker: null,
    status: JobStatus.Requested,
    summary: 'Primary chilled water pump vibration needs immediate triage.',
    createdAt: '2026-07-22T07:00:00.000Z',
  },
  {
    id: 'req-1002',
    title: 'Lobby deep clean',
    customerName: 'Tower One Management',
    serviceType: ServiceType.Soft,
    urgency: 'High',
    location: 'Tower Lobby',
    assignedWorker: null,
    status: JobStatus.PendingAcceptance,
    summary: 'Worker ping sent and awaiting a response before dispatch lock-in.',
    createdAt: '2026-07-22T08:10:00.000Z',
  },
  {
    id: 'req-1003',
    title: 'Security SOP review',
    customerName: 'Metro Logistics',
    serviceType: ServiceType.Strategic,
    urgency: 'Medium',
    location: 'Operations Room',
    assignedWorker: {
      id: 'wrk-07',
      fullName: 'Jamal Reed',
      rating: 4.7,
      proximityKm: 2.9,
    },
    status: JobStatus.Assigned,
    summary: 'Supervisor accepted the assignment and is being prepared for route start.',
    createdAt: '2026-07-22T09:15:00.000Z',
  },
  {
    id: 'req-1004',
    title: 'Electrical outlet audit',
    customerName: 'Northpoint Residences',
    serviceType: ServiceType.Hard,
    urgency: 'Medium',
    location: 'Unit 14B',
    assignedWorker: {
      id: 'wrk-02',
      fullName: 'Malik Thompson',
      rating: 4.7,
      proximityKm: 2.6,
    },
    status: JobStatus.OnRoute,
    summary: 'Technician is traveling to site and background GPS is active.',
    createdAt: '2026-07-22T10:00:00.000Z',
  },
  {
    id: 'req-1005',
    title: 'Fire suppression inspection',
    customerName: 'Greenfield Mall',
    serviceType: ServiceType.Strategic,
    urgency: 'High',
    location: 'Service Corridor',
    assignedWorker: {
      id: 'wrk-01',
      fullName: 'Amina Yusuf',
      rating: 4.9,
      proximityKm: 1.2,
    },
    status: JobStatus.Inspection,
    summary: 'Worker has arrived and is validating scope and estimated work time.',
    createdAt: '2026-07-22T10:35:00.000Z',
  },
  {
    id: 'req-1006',
    title: 'Retail floor restoration',
    customerName: 'Crescent Retail',
    serviceType: ServiceType.Soft,
    urgency: 'Low',
    location: 'Hallway C',
    assignedWorker: {
      id: 'wrk-03',
      fullName: 'Nadia Khan',
      rating: 4.8,
      proximityKm: 3.1,
    },
    status: JobStatus.InProgress,
    summary: 'Cleanup and repair work is actively under way on site.',
    createdAt: '2026-07-22T11:20:00.000Z',
  },
  {
    id: 'req-1007',
    title: 'Generator compliance wrap-up',
    customerName: 'Harbor Offices',
    serviceType: ServiceType.Hard,
    urgency: 'Medium',
    location: 'Roof Access',
    assignedWorker: {
      id: 'wrk-04',
      fullName: 'Omar Silva',
      rating: 4.5,
      proximityKm: 4.4,
    },
    status: JobStatus.Completed,
    summary: 'Job closed, payment cleared, and invoice issued.',
    createdAt: '2026-07-22T12:05:00.000Z',
  },
];

function createInitialColumns(): Record<JobStatus, DispatchCard[]> {
  return boardOrder.reduce(
    (collection, status) => {
      collection[status] = mockCards.filter((card) => card.status === status);
      return collection;
    },
    {} as Record<JobStatus, DispatchCard[]>
  );
}

function calculateWorkerScore(worker: WorkerCandidate) {
  const availabilityBonus = worker.isAvailable ? 12 : -12;
  return worker.rating * 25 + availabilityBonus - worker.proximityKm * 4;
}

function getWorkerBadgeLabel(worker: WorkerCandidate) {
  return `${worker.rating.toFixed(1)} rating · ${worker.proximityKm.toFixed(1)}km`;
}

export function CustomerCareView() {
  const [columns, setColumns] = useState<Record<JobStatus, DispatchCard[]>>(createInitialColumns);
  const [isDispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const isCompact = useMediaQuery('(max-width: 980px)');

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 4000);
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);

    fetch('http://localhost:3000/jobs')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data: any[]) => {
        if (!isMounted) return;
        setIsLoading(false);
        if (!Array.isArray(data) || data.length === 0) return;
        const newCols: Record<JobStatus, DispatchCard[]> = {
          [JobStatus.Requested]: [],
          [JobStatus.PendingAcceptance]: [],
          [JobStatus.Assigned]: [],
          [JobStatus.OnRoute]: [],
          [JobStatus.Inspection]: [],
          [JobStatus.InProgress]: [],
          [JobStatus.Completed]: [],
        };
        data.forEach((job) => {
          const card: DispatchCard = {
            id: job.id,
            title: job.title || 'Service Request',
            customerName: job.customer?.user?.fullName || 'Customer Site',
            serviceType: (job.servicePillar as ServiceType) || ServiceType.Hard,
            urgency: 'Medium',
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
            createdAt: job.createdAt || new Date().toISOString(),
          };
          if (newCols[card.status]) {
            newCols[card.status].push(card);
          } else {
            newCols[JobStatus.Requested].push(card);
          }
        });
        setColumns(newCols);
      })
      .catch((err) => {
        if (!isMounted) return;
        setIsLoading(false);
        setFetchError('Unable to connect to live NestJS API. Displaying local workspace state.');
        console.warn('Using seed/mock jobs, NestJS backend connecting or starting:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const grouped = useMemo(() => boardOrder.map((status) => ({ status, items: columns[status] })), [columns]);

  const sortedWorkers = useMemo(
    () => [...mockWorkers].sort((left, right) => calculateWorkerScore(right) - calculateWorkerScore(left)),
    []
  );

  const selectedCard = useMemo(() => {
    if (!selectedCardId) {
      return null;
    }

    return boardOrder.flatMap((status) => columns[status]).find((card) => card.id === selectedCardId) ?? null;
  }, [columns, selectedCardId]);

  const openDispatchModal = (cardId: string) => {
    setSelectedCardId(cardId);
    setSelectedWorkerId(sortedWorkers[0]?.id ?? null);
    setDispatchModalOpen(true);
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

  const confirmDispatch = () => {
    if (!selectedCardId || !selectedWorkerId) {
      return;
    }

    const worker = sortedWorkers.find((entry) => entry.id === selectedWorkerId);
    if (!worker) {
      return;
    }

    moveCard(
      selectedCardId,
      JobStatus.PendingAcceptance,
      (card) => ({
        ...card,
        status: JobStatus.PendingAcceptance,
        assignedWorker: {
          id: worker.id,
          fullName: worker.fullName,
          rating: worker.rating,
          proximityKm: worker.proximityKm,
        },
      }),
      0
    );

    closeDispatchModal();
  };

  const handleRejectSimulation = (cardId: string) => {
    moveCard(
      cardId,
      JobStatus.Requested,
      (card) => ({
        ...card,
        status: JobStatus.Requested,
        assignedWorker: null,
      }),
      0
    );
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

    if (sourceStatus === JobStatus.Requested && destinationStatus === JobStatus.PendingAcceptance) {
      openDispatchModal(draggableId);
      return;
    }

    const location = findCardLocation(draggableId);
    if (!location) {
      return;
    }

    const sourceCards = [...columns[sourceStatus]];
    const sourceIndex = sourceCards.findIndex((card) => card.id === draggableId);
    if (sourceIndex === -1) {
      return;
    }

    const [movedItem] = sourceCards.splice(sourceIndex, 1);
    const updatedItem = { ...movedItem, status: destinationStatus };

    if (sourceStatus === destinationStatus) {
      sourceCards.splice(destination.index, 0, updatedItem);
      setColumns((current) => ({
        ...current,
        [sourceStatus]: sourceCards,
      }));
      return;
    }

    const destinationCards = [...columns[destinationStatus]];
    destinationCards.splice(destination.index, 0, updatedItem);

    const previousColumns = columns;
    setColumns((current) => ({
      ...current,
      [sourceStatus]: sourceCards,
      [destinationStatus]: destinationCards,
    }));

    fetch(`http://localhost:3000/jobs/${draggableId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: destinationStatus }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showToast(`Job status updated to "${statusLabels[destinationStatus]}"`, 'success');
      })
      .catch((err) => {
        setColumns(previousColumns);
        showToast(`Failed to persist job status change to backend API. Action reverted.`, 'error');
        console.warn('Failed to persist job status to backend:', err);
      });
  };

  return (
    <section style={styles.view}>
      {isLoading && (
        <div style={styles.loadingBanner}>
          <div style={styles.spinner} />
          <span>Fetching live service requests from NestJS API...</span>
        </div>
      )}

      {fetchError && !isLoading && (
        <div style={styles.errorBanner}>
          <span>⚠️ {fetchError}</span>
        </div>
      )}

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
        <div style={{ ...styles.boardShell, ...(isCompact ? styles.boardShellCompact : undefined) }}>
          <div style={{ ...styles.board, ...(isCompact ? styles.boardCompact : undefined) }}>
            {grouped.map(({ status, items }) => (
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

                              {item.assignedWorker && (
                                <div style={styles.workerChip}>
                                  <span style={styles.workerChipLabel}>Worker</span>
                                  <span>{item.assignedWorker.fullName}</span>
                                </div>
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
                                    Dispatch Worker
                                  </button>
                                )}

                                {status === JobStatus.PendingAcceptance && (
                                  <button
                                    type="button"
                                    style={styles.rejectButton}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleRejectSimulation(item.id);
                                    }}
                                  >
                                    Simulate Reject
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
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Worker dispatch modal">
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.kicker}>Dispatch Workflow</div>
                <h3 style={styles.modalTitle}>Assign worker for job</h3>
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
                <div style={styles.dispatchDropZone}>Move job to PENDING_ACCEPTANCE with selected worker.</div>
                <button type="button" style={styles.primaryButton} onClick={confirmDispatch} disabled={!selectedWorkerId}>
                  Confirm dispatch
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
    borderRadius: '18px',
    background: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
    boxSizing: 'border-box',
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
    padding: '12px 14px',
    borderRadius: '14px',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-elevated)',
    border: '1px solid var(--border-subtle)',
    cursor: 'grab',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  cardDragging: {
    cursor: 'grabbing',
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
    background: 'rgba(43, 67, 95, 0.08)',
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
    borderRadius: '20px',
    background: 'var(--surface)',
    border: '1px solid var(--border-subtle)',
    padding: '20px',
    boxSizing: 'border-box',
    maxHeight: '85vh',
    overflowY: 'auto',
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
  },
  workerRowSelected: {
    borderColor: '#f38808',
    boxShadow: '0 0 0 1px #f38808 inset',
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