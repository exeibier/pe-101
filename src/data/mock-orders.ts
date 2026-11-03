import { WorkOrder } from '@/types/workshop';

export const INITIAL_SEED_ORDER: WorkOrder = {
  order_id: 'ORD-101',
  token_url: 'https://taller.app/chat/ORD-101',
  client: {
    name: 'Carlos Mendoza',
    phone: '5215512345678',
  },
  vehicle: {
    model: 'Seat Ibiza 2019',
    initial_fault: 'Ruido fuerte al frenar y vibración de volante',
  },
  current_status: 'esperando_aprobacion_presupuesto',
  status_history: [
    { status: 'recibido_diagnostico', timestamp: '10:00 AM' },
    { status: 'esperando_aprobacion_presupuesto', timestamp: '10:15 AM' },
  ],
  budget_base: {
    description: 'Cambio de discos y balatas delanteras',
    amount: 2800.0,
    status: 'pending',
  },
  extra_repairs: [
    {
      id: 'EXT-1',
      description: 'Rectificado de masa derecha con juego',
      amount: 650.0,
      is_blocking: true,
      status: 'pending',
    },
  ],
  default_closure_note: null,
  total_to_pay: 0.0,
  messages: [
    {
      id: 'MSG-WELCOME-ORD-101',
      type: 'welcome',
      text: '¡Hola Carlos Mendoza! Recibimos tu Seat Ibiza 2019 en TallerTrack. Falla reportada: "Ruido fuerte al frenar y vibración de volante". Estado actual: Recibido / En Diagnóstico.',
      timestamp: '10:00 AM',
    },
    {
      id: 'MSG-BUDGET-ORD-101',
      type: 'status_change',
      text: 'Se ha generado el diagnóstico y presupuesto base para tu Seat Ibiza 2019. Por favor revísalo para continuar.',
      timestamp: '10:15 AM',
    },
  ],
};

export function getInitialMockOrders(): WorkOrder[] {
  return [structuredClone(INITIAL_SEED_ORDER)];
}
