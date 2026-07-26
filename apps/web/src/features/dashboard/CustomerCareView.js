import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
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
];
const statusLabels = {
    [JobStatus.Requested]: 'REQUESTED',
    [JobStatus.PendingAcceptance]: 'PENDING_ACCEPTANCE',
    [JobStatus.Assigned]: 'ASSIGNED',
    [JobStatus.OnRoute]: 'ON_ROUTE',
    [JobStatus.Inspection]: 'INSPECTION',
    [JobStatus.InProgress]: 'IN_PROGRESS',
    [JobStatus.Completed]: 'COMPLETED',
};
const mockWorkers = [
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
const mockCards = [
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
function createInitialColumns() {
    return boardOrder.reduce((collection, status) => {
        collection[status] = mockCards.filter((card) => card.status === status);
        return collection;
    }, {});
}
function calculateWorkerScore(worker) {
    const availabilityBonus = worker.isAvailable ? 12 : -12;
    return worker.rating * 25 + availabilityBonus - worker.proximityKm * 4;
}
function getWorkerBadgeLabel(worker) {
    return `${worker.rating.toFixed(1)} rating · ${worker.proximityKm.toFixed(1)}km`;
}
export function CustomerCareView() {
    const [columns, setColumns] = useState(createInitialColumns);
    const [isDispatchModalOpen, setDispatchModalOpen] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [selectedWorkerId, setSelectedWorkerId] = useState(null);
    const isCompact = useMediaQuery('(max-width: 980px)');
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [toast, setToast] = useState(null);
    const showToast = (message, type) => {
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
            if (!res.ok)
                throw new Error(`HTTP error ${res.status}`);
            return res.json();
        })
            .then((data) => {
            if (!isMounted)
                return;
            setIsLoading(false);
            if (!Array.isArray(data) || data.length === 0)
                return;
            const newCols = {
                [JobStatus.Requested]: [],
                [JobStatus.PendingAcceptance]: [],
                [JobStatus.Assigned]: [],
                [JobStatus.OnRoute]: [],
                [JobStatus.Inspection]: [],
                [JobStatus.InProgress]: [],
                [JobStatus.Completed]: [],
            };
            data.forEach((job) => {
                const card = {
                    id: job.id,
                    title: job.title || 'Service Request',
                    customerName: job.customer?.user?.fullName || 'Customer Site',
                    serviceType: job.servicePillar || ServiceType.Hard,
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
                    status: job.status || JobStatus.Requested,
                    summary: job.description || 'Service request description',
                    createdAt: job.createdAt || new Date().toISOString(),
                };
                if (newCols[card.status]) {
                    newCols[card.status].push(card);
                }
                else {
                    newCols[JobStatus.Requested].push(card);
                }
            });
            setColumns(newCols);
        })
            .catch((err) => {
            if (!isMounted)
                return;
            setIsLoading(false);
            setFetchError('Unable to connect to live NestJS API. Displaying local workspace state.');
            console.warn('Using seed/mock jobs, NestJS backend connecting or starting:', err);
        });
        return () => {
            isMounted = false;
        };
    }, []);
    const grouped = useMemo(() => boardOrder.map((status) => ({ status, items: columns[status] })), [columns]);
    const sortedWorkers = useMemo(() => [...mockWorkers].sort((left, right) => calculateWorkerScore(right) - calculateWorkerScore(left)), []);
    const selectedCard = useMemo(() => {
        if (!selectedCardId) {
            return null;
        }
        return boardOrder.flatMap((status) => columns[status]).find((card) => card.id === selectedCardId) ?? null;
    }, [columns, selectedCardId]);
    const openDispatchModal = (cardId) => {
        setSelectedCardId(cardId);
        setSelectedWorkerId(sortedWorkers[0]?.id ?? null);
        setDispatchModalOpen(true);
    };
    const closeDispatchModal = () => {
        setDispatchModalOpen(false);
        setSelectedCardId(null);
        setSelectedWorkerId(null);
    };
    const findCardLocation = (cardId) => {
        for (const status of boardOrder) {
            const cardIndex = columns[status].findIndex((card) => card.id === cardId);
            if (cardIndex !== -1) {
                return { status, index: cardIndex };
            }
        }
        return null;
    };
    const moveCard = (cardId, destinationStatus, mutate, destinationIndex) => {
        setColumns((currentColumns) => {
            const currentLocation = boardOrder.reduce((result, status) => {
                if (result.status) {
                    return result;
                }
                const foundIndex = currentColumns[status].findIndex((card) => card.id === cardId);
                if (foundIndex !== -1) {
                    return { status, index: foundIndex };
                }
                return result;
            }, { status: null, index: -1 });
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
            }
            else {
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
        moveCard(selectedCardId, JobStatus.PendingAcceptance, (card) => ({
            ...card,
            status: JobStatus.PendingAcceptance,
            assignedWorker: {
                id: worker.id,
                fullName: worker.fullName,
                rating: worker.rating,
                proximityKm: worker.proximityKm,
            },
        }), 0);
        closeDispatchModal();
    };
    const handleRejectSimulation = (cardId) => {
        moveCard(cardId, JobStatus.Requested, (card) => ({
            ...card,
            status: JobStatus.Requested,
            assignedWorker: null,
        }), 0);
    };
    const handleDragEnd = (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) {
            return;
        }
        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
        }
        const sourceStatus = source.droppableId;
        const destinationStatus = destination.droppableId;
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
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            showToast(`Job status updated to "${statusLabels[destinationStatus]}"`, 'success');
        })
            .catch((err) => {
            setColumns(previousColumns);
            showToast(`Failed to persist job status change to backend API. Action reverted.`, 'error');
            console.warn('Failed to persist job status to backend:', err);
        });
    };
    return (_jsxs("section", { style: styles.view, children: [isLoading && (_jsxs("div", { style: styles.loadingBanner, children: [_jsx("div", { style: styles.spinner }), _jsx("span", { children: "Fetching live service requests from NestJS API..." })] })), fetchError && !isLoading && (_jsx("div", { style: styles.errorBanner, children: _jsxs("span", { children: ["\u26A0\uFE0F ", fetchError] }) })), toast && (_jsx("div", { style: {
                    ...styles.toastNotification,
                    background: toast.type === 'success' ? '#2b435f' : '#8b0000',
                    borderColor: toast.type === 'success' ? '#f38808' : '#ff4d4d',
                }, children: _jsxs("span", { children: [toast.type === 'success' ? '✓' : '✕', " ", toast.message] }) })), _jsx(DragDropContext, { onDragEnd: handleDragEnd, children: _jsx("div", { style: { ...styles.boardShell, ...(isCompact ? styles.boardShellCompact : undefined) }, children: _jsx("div", { style: { ...styles.board, ...(isCompact ? styles.boardCompact : undefined) }, children: grouped.map(({ status, items }) => (_jsxs("article", { style: styles.column, children: [_jsxs("div", { style: styles.columnHeader, children: [_jsx("span", { children: statusLabels[status] }), _jsx("span", { style: styles.badge, children: items.length })] }), _jsx(Droppable, { droppableId: status, children: (provided, snapshot) => (_jsxs("div", { ref: provided.innerRef, ...provided.droppableProps, style: {
                                            ...styles.cardStack,
                                            ...(snapshot.isDraggingOver ? styles.cardStackDraggingOver : undefined),
                                        }, children: [items.map((item, index) => (_jsx(Draggable, { draggableId: item.id, index: index, children: (draggableProvided, draggableSnapshot) => (_jsxs("div", { ref: draggableProvided.innerRef, ...draggableProvided.draggableProps, ...draggableProvided.dragHandleProps, style: {
                                                        ...styles.card,
                                                        ...(draggableSnapshot.isDragging ? styles.cardDragging : undefined),
                                                        ...draggableProvided.draggableProps.style,
                                                    }, children: [_jsxs("div", { style: styles.cardTopRow, children: [_jsx("span", { style: styles.serviceChip, children: item.serviceType }), _jsx("span", { style: styles.cardId, children: item.id })] }), _jsx("h3", { style: styles.cardTitle, children: item.title }), _jsx("p", { style: styles.cardMeta, children: item.customerName }), _jsx("p", { style: styles.cardCopy, children: item.summary }), _jsxs("div", { style: styles.cardFooterRow, children: [_jsx("span", { style: { ...styles.urgencyPill, ...(urgencyStyles[item.urgency] ?? undefined) }, children: item.urgency }), _jsx("span", { style: styles.cardFooter, children: item.location })] }), item.assignedWorker && (_jsxs("div", { style: styles.workerChip, children: [_jsx("span", { style: styles.workerChipLabel, children: "Worker" }), _jsx("span", { children: item.assignedWorker.fullName })] })), _jsxs("div", { style: styles.cardActions, children: [status === JobStatus.Requested && (_jsx("button", { type: "button", style: styles.secondaryActionButton, onClick: (event) => {
                                                                        event.stopPropagation();
                                                                        openDispatchModal(item.id);
                                                                    }, children: "Dispatch Worker" })), status === JobStatus.PendingAcceptance && (_jsx("button", { type: "button", style: styles.rejectButton, onClick: (event) => {
                                                                        event.stopPropagation();
                                                                        handleRejectSimulation(item.id);
                                                                    }, children: "Simulate Reject" }))] })] })) }, item.id))), items.length === 0 && _jsx("div", { style: styles.emptyState, children: "No jobs in this stage." }), provided.placeholder] })) })] }, status))) }) }) }), isDispatchModalOpen && (_jsx("div", { style: styles.modalOverlay, role: "dialog", "aria-modal": "true", "aria-label": "Worker dispatch modal", children: _jsxs("div", { style: styles.modalCard, children: [_jsxs("div", { style: styles.modalHeader, children: [_jsxs("div", { children: [_jsx("div", { style: styles.kicker, children: "Dispatch Workflow" }), _jsx("h3", { style: styles.modalTitle, children: "Assign worker for job" })] }), _jsx("button", { type: "button", style: styles.closeButton, onClick: closeDispatchModal, children: "Close" })] }), selectedCard && (_jsxs("div", { style: styles.dispatchContext, children: [_jsx("div", { style: styles.dispatchContextLabel, children: "Selected job" }), _jsx("div", { style: styles.dispatchContextTitle, children: selectedCard.title }), _jsxs("div", { style: styles.dispatchContextMeta, children: [selectedCard.customerName, " \u00B7 ", selectedCard.location] })] })), _jsxs("div", { style: styles.dispatchGrid, children: [_jsxs("div", { style: styles.workerList, children: [_jsx("div", { style: styles.dispatchLaneTitle, children: "Available workers" }), sortedWorkers.map((worker) => {
                                            const isSelected = worker.id === selectedWorkerId;
                                            return (_jsxs("button", { type: "button", style: { ...styles.workerRow, ...(isSelected ? styles.workerRowSelected : undefined) }, onClick: () => setSelectedWorkerId(worker.id), children: [_jsxs("div", { style: styles.workerTopRow, children: [_jsx("strong", { style: styles.workerName, children: worker.fullName }), _jsx("span", { style: styles.workerScore, children: calculateWorkerScore(worker).toFixed(0) })] }), _jsx("div", { style: styles.workerMeta, children: worker.coverageZone }), _jsx("div", { style: styles.workerMeta, children: getWorkerBadgeLabel(worker) })] }, worker.id));
                                        })] }), _jsxs("div", { style: styles.dispatchPreview, children: [_jsx("div", { style: styles.dispatchLaneTitle, children: "Dispatch summary" }), _jsx("div", { style: styles.dispatchDropZone, children: "Move job to PENDING_ACCEPTANCE with selected worker." }), _jsx("button", { type: "button", style: styles.primaryButton, onClick: confirmDispatch, disabled: !selectedWorkerId, children: "Confirm dispatch" })] })] })] }) }))] }));
}
const styles = {
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
const urgencyStyles = {
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
