import {
  AddExtraRepairInput,
  ApprovalStatus,
  BudgetBase,
  CreateOrderInput,
  ExtraRepair,
  OrderStatus,
  WorkOrder,
} from '@/types/workshop';

export const CLOSURE_NOTE_BASE_REJECTED =
  'Servicio no concluido: Presupuesto base rechazado por el cliente';

export const CLOSURE_NOTE_CRITICAL_EXTRA_REJECTED =
  'Servicio detenido: Reparación crítica necesaria para resolver el problema original rechazada por el cliente';

export const BLOCKING_EXTRA_WARNING =
  '⚠️ Esta reparación es requerida para solucionar la falla inicial. Si se rechaza, el auto se dejará listo para entrega sin terminar el servicio.';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  recibido_diagnostico: 'Recibido / En Diagnóstico',
  esperando_aprobacion_presupuesto: 'Esperando Aprobación de Presupuesto',
  en_reparacion: 'En Reparación',
  pruebas_calidad: 'Pruebas de Calidad',
  listo_entrega: 'Listo para Entrega',
  entregado: 'Entregado',
};

export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatCurrencyMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Total = (Costo Base si aprobado) + sum(Extras con status: approved)
 */
export function calculateTotalToPay(
  budgetBase: BudgetBase | null,
  extraRepairs: ExtraRepair[]
): number {
  const baseTotal =
    budgetBase && budgetBase.status === 'approved' ? budgetBase.amount : 0;
  const extrasTotal = extraRepairs
    .filter((extra) => extra.status === 'approved')
    .reduce((acc, extra) => acc + extra.amount, 0);

  return Number((baseTotal + extrasTotal).toFixed(2));
}

/**
 * Construye el enlace directo de WhatsApp API:
 * https://api.whatsapp.com/send?phone={phone}&text={mensaje con token_url}
 */
export function buildWhatsAppLink(order: WorkOrder): string {
  const cleanPhone = order.client.phone.replace(/\D/g, '');
  const firstName = order.client.name.trim().split(/\s+/)[0] || order.client.name;
  const message = `Hola ${firstName}, sigue el estado de tu auto aquí: ${order.token_url}`;
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
    message
  )}`;
}

/**
 * 1. Alta del Auto y Enlace Directo
 */
export function createWorkOrder(
  input: CreateOrderInput,
  orderId: string = `ORD-${Math.floor(100 + Math.random() * 900)}`,
  timestamp: string = formatTime()
): WorkOrder {
  const tokenUrl = `https://taller.app/chat/${orderId}`;
  const cleanPhone = input.clientPhone.replace(/\D/g, '');

  return {
    order_id: orderId,
    token_url: tokenUrl,
    client: {
      name: input.clientName.trim(),
      phone: cleanPhone,
    },
    vehicle: {
      model: input.vehicleModel.trim(),
      initial_fault: input.initialFault.trim(),
    },
    current_status: 'recibido_diagnostico',
    status_history: [
      {
        status: 'recibido_diagnostico',
        timestamp,
      },
    ],
    budget_base: null,
    extra_repairs: [],
    default_closure_note: null,
    total_to_pay: 0,
    messages: [
      {
        id: `MSG-WELCOME-${orderId}`,
        type: 'welcome',
        text: `¡Hola ${input.clientName.trim()}! Recibimos tu ${input.vehicleModel.trim()} en TallerTrack. Falla reportada: "${input.initialFault.trim()}". Estado actual: Recibido / En Diagnóstico.`,
        timestamp,
      },
    ],
  };
}

/**
 * 2. Flujo de Diagnóstico y Presupuesto Base (Carga del Mecánico)
 */
export function setBudgetBase(
  order: WorkOrder,
  description: string,
  amount: number,
  timestamp: string = formatTime()
): WorkOrder {
  const nextStatus: OrderStatus = 'esperando_aprobacion_presupuesto';
  const nextBudget: BudgetBase = {
    description: description.trim(),
    amount: Number(amount),
    status: 'pending',
  };

  const statusChanged = order.current_status !== nextStatus;

  return {
    ...order,
    current_status: nextStatus,
    status_history: statusChanged
      ? [...order.status_history, { status: nextStatus, timestamp }]
      : order.status_history,
    budget_base: nextBudget,
    total_to_pay: calculateTotalToPay(nextBudget, order.extra_repairs),
    messages: [
      ...order.messages,
      {
        id: `MSG-BUDGET-${Date.now()}`,
        type: 'status_change',
        text: `Se ha generado el diagnóstico y presupuesto base para tu ${order.vehicle.model}. Por favor revísalo para continuar.`,
        timestamp,
      },
    ],
  };
}

/**
 * 2. Respuesta del Cliente al Presupuesto Base (Aprobar / Rechazar)
 */
export function respondBudgetBase(
  order: WorkOrder,
  decision: Exclude<ApprovalStatus, 'pending'>,
  timestamp: string = formatTime()
): WorkOrder {
  if (!order.budget_base) {
    return order;
  }

  const updatedBudget: BudgetBase = {
    ...order.budget_base,
    status: decision,
  };

  if (decision === 'approved') {
    const nextStatus: OrderStatus = 'en_reparacion';
    const nextTotal = calculateTotalToPay(updatedBudget, order.extra_repairs);

    return {
      ...order,
      current_status: nextStatus,
      status_history: [
        ...order.status_history,
        { status: nextStatus, timestamp },
      ],
      budget_base: updatedBudget,
      default_closure_note: null,
      total_to_pay: nextTotal,
      messages: [
        ...order.messages,
        {
          id: `MSG-BUDGET-APPROVED-${Date.now()}`,
          type: 'status_change',
          text: `Presupuesto base aprobado (${formatCurrencyMXN(
            updatedBudget.amount
          )}). Tu auto ha pasado a: En Reparación.`,
          timestamp,
        },
      ],
    };
  }

  // decision === 'rejected'
  const nextStatus: OrderStatus = 'listo_entrega';
  const nextTotal = calculateTotalToPay(updatedBudget, order.extra_repairs);

  return {
    ...order,
    current_status: nextStatus,
    status_history: [
      ...order.status_history,
      { status: nextStatus, timestamp },
    ],
    budget_base: updatedBudget,
    default_closure_note: CLOSURE_NOTE_BASE_REJECTED,
    total_to_pay: nextTotal,
    messages: [
      ...order.messages,
      {
        id: `MSG-BUDGET-REJECTED-${Date.now()}`,
        type: 'closure_note',
        text: `${CLOSURE_NOTE_BASE_REJECTED}. Tu vehículo se encuentra Listo para Entrega.`,
        timestamp,
      },
    ],
  };
}

/**
 * 3. Agregar Reparación Extra
 */
export function addExtraRepair(
  order: WorkOrder,
  input: AddExtraRepairInput,
  customId?: string,
  timestamp: string = formatTime()
): WorkOrder {
  const nextIndex = order.extra_repairs.length + 1;
  const newExtra: ExtraRepair = {
    id: customId || `EXT-${nextIndex}`,
    description: input.description.trim(),
    amount: Number(input.amount),
    is_blocking: Boolean(input.is_blocking),
    status: 'pending',
  };

  const nextExtras = [...order.extra_repairs, newExtra];

  return {
    ...order,
    extra_repairs: nextExtras,
    total_to_pay: calculateTotalToPay(order.budget_base, nextExtras),
    messages: [
      ...order.messages,
      {
        id: `MSG-EXTRA-NEW-${newExtra.id}-${Date.now()}`,
        type: 'status_change',
        text: `El mecánico reportó una reparación adicional: "${newExtra.description}" (+${formatCurrencyMXN(
          newExtra.amount
        )}).`,
        timestamp,
      },
    ],
  };
}

/**
 * 3. Respuesta del Cliente a Reparación Extra (Aprobar / Rechazar)
 */
export function respondExtraRepair(
  order: WorkOrder,
  extraId: string,
  decision: Exclude<ApprovalStatus, 'pending'>,
  timestamp: string = formatTime()
): WorkOrder {
  const targetExtra = order.extra_repairs.find((item) => item.id === extraId);
  if (!targetExtra) {
    return order;
  }

  const updatedExtras = order.extra_repairs.map((item) =>
    item.id === extraId ? { ...item, status: decision } : item
  );

  const nextTotal = calculateTotalToPay(order.budget_base, updatedExtras);

  // Caso is_blocking: true y rechazada -> Transición inmediata a listo_entrega con nota fija
  if (decision === 'rejected' && targetExtra.is_blocking) {
    const nextStatus: OrderStatus = 'listo_entrega';
    return {
      ...order,
      current_status: nextStatus,
      status_history: [
        ...order.status_history,
        { status: nextStatus, timestamp },
      ],
      extra_repairs: updatedExtras,
      default_closure_note: CLOSURE_NOTE_CRITICAL_EXTRA_REJECTED,
      total_to_pay: nextTotal,
      messages: [
        ...order.messages,
        {
          id: `MSG-EXTRA-CRIT-REJECTED-${extraId}-${Date.now()}`,
          type: 'closure_note',
          text: `${CLOSURE_NOTE_CRITICAL_EXTRA_REJECTED}. Tu auto ha pasado a: Listo para Entrega.`,
          timestamp,
        },
      ],
    };
  }

  // Caso aprobada (bloqueante o no) o rechazada con is_blocking: false
  const feedbackText =
    decision === 'approved'
      ? `Reparación extra aprobada: "${targetExtra.description}" (+${formatCurrencyMXN(
          targetExtra.amount
        )}).`
      : `Reparación opcional descartada: "${targetExtra.description}". El auto continúa su reparación regular.`;

  return {
    ...order,
    extra_repairs: updatedExtras,
    total_to_pay: nextTotal,
    messages: [
      ...order.messages,
      {
        id: `MSG-EXTRA-RESP-${extraId}-${Date.now()}`,
        type: 'status_change',
        text: feedbackText,
        timestamp,
      },
    ],
  };
}

/**
 * 5. Cambio manual de estado por el mecánico (Cierre de ciclo)
 */
export function updateOrderStatus(
  order: WorkOrder,
  nextStatus: OrderStatus,
  timestamp: string = formatTime()
): WorkOrder {
  if (order.current_status === nextStatus) {
    return order;
  }

  return {
    ...order,
    current_status: nextStatus,
    status_history: [
      ...order.status_history,
      { status: nextStatus, timestamp },
    ],
    messages: [
      ...order.messages,
      {
        id: `MSG-STATUS-${nextStatus}-${Date.now()}`,
        type: 'status_change',
        text: `Actualización de taller: El estado de tu ${order.vehicle.model} ahora es "${ORDER_STATUS_LABELS[nextStatus]}".`,
        timestamp,
      },
    ],
  };
}
