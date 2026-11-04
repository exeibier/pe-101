export type OrderStatus =
  | 'recibido_diagnostico'
  | 'esperando_aprobacion_presupuesto'
  | 'en_reparacion'
  | 'pruebas_calidad'
  | 'listo_entrega'
  | 'entregado';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface BudgetBase {
  description: string;
  amount: number;
  status: ApprovalStatus;
}

export interface ExtraRepair {
  id: string;
  description: string;
  amount: number;
  is_blocking: boolean;
  status: ApprovalStatus;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
}

export interface ChatEventMessage {
  id: string;
  type: 'welcome' | 'status_change' | 'closure_note';
  text: string;
  timestamp: string;
}

export interface WorkOrder {
  order_id: string;
  token_url: string;
  client: {
    name: string;
    phone: string;
  };
  vehicle: {
    model: string;
    initial_fault: string;
  };
  current_status: OrderStatus;
  status_history: StatusHistoryEntry[];
  budget_base: BudgetBase | null;
  extra_repairs: ExtraRepair[];
  default_closure_note: string | null;
  total_to_pay: number;
  messages: ChatEventMessage[];
}

export interface CreateOrderInput {
  clientName: string;
  clientPhone: string;
  vehicleModel: string;
  initialFault: string;
}

export interface AddExtraRepairInput {
  description: string;
  amount: number;
  is_blocking: boolean;
}
