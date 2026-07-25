import { useMemo, useState, type CSSProperties } from 'react';
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

    setColumns((current) => ({
      ...current,
      [sourceStatus]: sourceCards,
      [destinationStatus]: destinationCards,
    }));
  };

  return (
    <section style={styles.view}>
      <div style={{ ...styles.hero, ...(isCompact ? styles.heroCompact : undefined) }}>
        <div>
          <div style={styles.kicker}>Customer Care Workspace</div>
          <h2 style={styles.title}>Job lifecycle Kanban</h2>
          <p style={styles.copy}>
            Coordinate service demand, queue workers, and track execution from requested to completed.
          </p>
        </div>

        <button type="button" style={styles.primaryButton} onClick={() => setDispatchModalOpen(true)}>
          Drag and Drop Worker Dispatch
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ ...styles.boardShell, ...(isCompact ? styles.boardShellCompact : undefined) }}>
          <div style={{ ...styles.board, ...(isCompact ? styles.boardCompact : undefined) }}>
          {grouped.map(({ status, items }) => (
            <Droppable key={status} droppableId={status}>
              {(provided, snapshot) => (
                <article
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    ...styles.column,
                    ...(snapshot.isDraggingOver ? styles.columnDraggingOver : undefined),
                  }}
                >
                  <div style={styles.columnHeader}>
                    <span>{statusLabels[status]}</span>
                    <span style={styles.badge}>{items.length}</span>
                  </div>

                  <div style={styles.cardStack}>
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
                                  Simulate Worker Reject
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
                </article>
              )}
            </Droppable>
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
                <h3 style={styles.modalTitle}>Assign a worker for acceptance</h3>
              </div>
              <button type="button" style={styles.closeButton} onClick={closeDispatchModal}>
                Close
              </button>
            </div>
            <p style={styles.copy}>
              Select the best worker based on proximity and internal rating. Confirming will move the job into the pending acceptance stage.
            </p>

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
                <div style={styles.dispatchDropZone}>The selected worker will be attached to the job and moved into PENDING_ACCEPTANCE.</div>
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
    gap: '22px',
    color: 'var(--text-primary)',
    minWidth: 0,
    background: 'var(--bg-primary)',
  },
  hero: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '20px',
  },
  heroCompact: {
    flexDirection: 'column',
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
    maxWidth: '64ch',
  },
  primaryButton: {
    border: '1px solid #d37105',
    background: 'linear-gradient(135deg, #f38808, #d37105)',
    color: '#ffffff',
    padding: '13px 16px',
    borderRadius: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 14px 28px rgba(0, 0, 0, 0.18)',
  },
  boardShell: {
    width: '100%',
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
    paddingBottom: '8px',
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
    width: 'max-content',
    minWidth: '100%',
  },
  boardCompact: {
    gridAutoFlow: 'row',
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    width: '100%',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    minHeight: '70svh',
    padding: '16px',
    borderRadius: '22px',
    background: 'var(--surface-strong)',
    border: '1px solid var(--border-subtle)',
    boxSizing: 'border-box',
  },
  columnDraggingOver: {
    boxShadow: 'var(--shadow-elevated)',
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  badge: {
    minWidth: '28px',
    height: '28px',
    borderRadius: '999px',
    display: 'grid',
    placeItems: 'center',
    background: '#f38808',
    color: 'var(--text-inverse)',
    fontSize: '0.85rem',
  },
  cardStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    padding: '14px',
    borderRadius: '18px',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-elevated)',
    border: '1px solid var(--border-subtle)',
    cursor: 'grab',
    boxSizing: 'border-box',
  },
  cardDragging: {
    cursor: 'grabbing',
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '10px',
  },
  serviceChip: {
    borderRadius: '999px',
    background: '#f38808',
    color: 'var(--text-inverse)',
    padding: '5px 10px',
    fontSize: '0.74rem',
    fontWeight: 700,
  },
  cardId: {
    fontSize: '0.76rem',
    color: 'var(--text-secondary)',
  },
  cardTitle: {
    margin: '0 0 8px',
    fontSize: '1rem',
  },
  cardMeta: {
    margin: '0 0 8px',
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
    fontWeight: 600,
  },
  cardCopy: {
    margin: 0,
    color: 'var(--text-secondary)',
    lineHeight: 1.55,
    fontSize: '0.92rem',
  },
  cardFooterRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '14px',
  },
  cardFooter: {
    fontSize: '0.84rem',
    color: 'var(--text-muted)',
  },
  urgencyPill: {
    padding: '5px 10px',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#ffffff',
    background: '#2b435f',
  },
  workerChip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '14px',
    padding: '10px 12px',
    borderRadius: '14px',
    background: 'rgba(43, 67, 95, 0.08)',
    color: 'var(--text-primary)',
  },
  workerChipLabel: {
    fontSize: '0.74rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#2b435f',
  },
  cardActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '14px',
  },
  secondaryActionButton: {
    border: '1px solid #f38808',
    background: 'transparent',
    color: '#f38808',
    padding: '10px 12px',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  rejectButton: {
    border: '1px solid #d37105',
    background: '#d37105',
    color: '#ffffff',
    padding: '10px 12px',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyState: {
    padding: '18px',
    borderRadius: '14px',
    border: '1px dashed var(--border-subtle)',
    color: 'var(--text-secondary)',
    textAlign: 'center',
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
    width: 'min(720px, 100%)',
    borderRadius: '24px',
    background: 'var(--surface)',
    border: '1px solid var(--border-subtle)',
    padding: '24px',
    boxSizing: 'border-box',
    maxHeight: '85svh',
    overflowY: 'auto',
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
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface-strong)',
    color: '#f38808',
    borderRadius: '12px',
    padding: '10px 12px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  dispatchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
    marginTop: '18px',
  },
  dispatchLaneTitle: {
    marginBottom: '12px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  workerList: {
    background: 'var(--surface-strong)',
    borderRadius: '18px',
    padding: '16px',
    border: '1px solid var(--border-subtle)',
  },
  workerRow: {
    width: '100%',
    textAlign: 'left',
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    borderRadius: '16px',
    padding: '12px 14px',
    marginBottom: '10px',
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
    gap: '12px',
    marginBottom: '6px',
  },
  workerName: {
    fontSize: '0.96rem',
  },
  workerScore: {
    borderRadius: '999px',
    background: '#f38808',
    color: '#ffffff',
    padding: '4px 8px',
    fontSize: '0.74rem',
    fontWeight: 700,
  },
  workerMeta: {
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
    lineHeight: 1.4,
  },
  dispatchPreview: {
    background: 'var(--surface-strong)',
    borderRadius: '18px',
    padding: '16px',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  dispatchContext: {
    marginTop: '18px',
    borderRadius: '18px',
    padding: '16px',
    border: '1px solid var(--border-subtle)',
    background: 'rgba(43, 67, 95, 0.08)',
  },
  dispatchContextLabel: {
    color: '#f38808',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: '0.75rem',
    fontWeight: 700,
  },
  dispatchContextTitle: {
    marginTop: '6px',
    color: 'var(--text-primary)',
    fontSize: '1.04rem',
    fontWeight: 700,
  },
  dispatchContextMeta: {
    marginTop: '4px',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  dispatchDropZone: {
    minHeight: '132px',
    borderRadius: '16px',
    border: '1px dashed rgba(243, 136, 8, 0.34)',
    display: 'grid',
    placeItems: 'center',
    color: '#2b435f',
    background: 'var(--surface-strong)',
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