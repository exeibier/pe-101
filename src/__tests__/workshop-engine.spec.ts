import { describe, expect, it } from 'vitest';
import {
  addExtraRepair,
  buildWhatsAppLink,
  calculateTotalToPay,
  CLOSURE_NOTE_BASE_REJECTED,
  CLOSURE_NOTE_CRITICAL_EXTRA_REJECTED,
  createWorkOrder,
  respondBudgetBase,
  respondExtraRepair,
  setBudgetBase,
  updateOrderStatus,
} from '@/lib/workshop-engine';

describe('workshop-engine (Reglas de Negocio SPEC-001)', () => {
  it('CA-1: crea una orden en recibido_diagnostico con total 0 y genera el enlace directo de WhatsApp', () => {
    const order = createWorkOrder(
      {
        clientName: 'Carlos Mendoza',
        clientPhone: '5215512345678',
        vehicleModel: 'Seat Ibiza 2019',
        initialFault: 'Ruido fuerte al frenar y vibración de volante',
      },
      'ORD-101',
      '10:00 AM'
    );

    expect(order.order_id).toBe('ORD-101');
    expect(order.token_url).toBe('https://taller.app/chat/ORD-101');
    expect(order.current_status).toBe('recibido_diagnostico');
    expect(order.total_to_pay).toBe(0);
    expect(order.status_history).toEqual([
      { status: 'recibido_diagnostico', timestamp: '10:00 AM' },
    ]);

    const waLink = buildWhatsAppLink(order);
    expect(waLink).toContain(
      'https://api.whatsapp.com/send?phone=5215512345678&text='
    );
    expect(decodeURIComponent(waLink)).toContain(
      'Hola Carlos, sigue el estado de tu auto aquí: https://taller.app/chat/ORD-101'
    );
  });

  it('CA-2: al cargar el presupuesto base, el estado cambia a esperando_aprobacion_presupuesto y status pending', () => {
    const initial = createWorkOrder(
      {
        clientName: 'Carlos Mendoza',
        clientPhone: '5215512345678',
        vehicleModel: 'Seat Ibiza 2019',
        initialFault: 'Ruido fuerte al frenar',
      },
      'ORD-101',
      '10:00 AM'
    );

    const withBudget = setBudgetBase(
      initial,
      'Cambio de discos y balatas delanteras',
      2800,
      '10:15 AM'
    );

    expect(withBudget.current_status).toBe('esperando_aprobacion_presupuesto');
    expect(withBudget.budget_base).toEqual({
      description: 'Cambio de discos y balatas delanteras',
      amount: 2800,
      status: 'pending',
    });
    expect(withBudget.total_to_pay).toBe(0);
  });

  it('CA-3: si el cliente aprueba el presupuesto base, pasa a en_reparacion y suma al total_to_pay', () => {
    const initial = createWorkOrder(
      {
        clientName: 'Carlos Mendoza',
        clientPhone: '5215512345678',
        vehicleModel: 'Seat Ibiza 2019',
        initialFault: 'Ruido fuerte al frenar',
      },
      'ORD-101'
    );
    const withBudget = setBudgetBase(
      initial,
      'Cambio de discos y balatas delanteras',
      2800
    );

    const approved = respondBudgetBase(withBudget, 'approved', '10:20 AM');

    expect(approved.budget_base?.status).toBe('approved');
    expect(approved.current_status).toBe('en_reparacion');
    expect(approved.total_to_pay).toBe(2800);
    expect(approved.default_closure_note).toBeNull();
  });

  it('CA-4: si el cliente rechaza el presupuesto base, pasa a listo_entrega con nota automática y total en 0', () => {
    const initial = createWorkOrder(
      {
        clientName: 'Carlos Mendoza',
        clientPhone: '5215512345678',
        vehicleModel: 'Seat Ibiza 2019',
        initialFault: 'Ruido fuerte al frenar',
      },
      'ORD-101'
    );
    const withBudget = setBudgetBase(
      initial,
      'Cambio de discos y balatas delanteras',
      2800
    );

    const rejected = respondBudgetBase(withBudget, 'rejected', '10:25 AM');

    expect(rejected.budget_base?.status).toBe('rejected');
    expect(rejected.current_status).toBe('listo_entrega');
    expect(rejected.default_closure_note).toBe(CLOSURE_NOTE_BASE_REJECTED);
    expect(rejected.total_to_pay).toBe(0);
  });

  it('CA-5: reparación extra NO bloqueante (is_blocking: false) suma al aprobarse o mantiene reparación regular al rechazarse', () => {
    let order = createWorkOrder(
      {
        clientName: 'Carlos Mendoza',
        clientPhone: '5215512345678',
        vehicleModel: 'Seat Ibiza 2019',
        initialFault: 'Ruido fuerte al frenar',
      },
      'ORD-101'
    );
    order = setBudgetBase(order, 'Cambio de discos y balatas', 2800);
    order = respondBudgetBase(order, 'approved');
    order = addExtraRepair(
      order,
      {
        description: 'Cambio de plumillas limpiaparabrisas',
        amount: 450,
        is_blocking: false,
      },
      'EXT-OPT'
    );

    const approvedExtra = respondExtraRepair(order, 'EXT-OPT', 'approved');
    expect(approvedExtra.current_status).toBe('en_reparacion');
    expect(approvedExtra.total_to_pay).toBe(3250);

    const rejectedExtra = respondExtraRepair(order, 'EXT-OPT', 'rejected');
    expect(rejectedExtra.current_status).toBe('en_reparacion');
    expect(rejectedExtra.default_closure_note).toBeNull();
    expect(rejectedExtra.total_to_pay).toBe(2800);
  });

  it('CA-6: reparación extra BLOQUEANTE (is_blocking: true) rechazada transiciona inmediatamente a listo_entrega con nota automática', () => {
    let order = createWorkOrder(
      {
        clientName: 'Carlos Mendoza',
        clientPhone: '5215512345678',
        vehicleModel: 'Seat Ibiza 2019',
        initialFault: 'Ruido fuerte al frenar',
      },
      'ORD-101'
    );
    order = setBudgetBase(order, 'Cambio de discos y balatas', 2800);
    order = respondBudgetBase(order, 'approved');
    order = addExtraRepair(
      order,
      {
        description: 'Rectificado de masa derecha con juego',
        amount: 650,
        is_blocking: true,
      },
      'EXT-1'
    );

    const rejectedBlocking = respondExtraRepair(
      order,
      'EXT-1',
      'rejected',
      '11:00 AM'
    );

    expect(rejectedBlocking.current_status).toBe('listo_entrega');
    expect(rejectedBlocking.default_closure_note).toBe(
      CLOSURE_NOTE_CRITICAL_EXTRA_REJECTED
    );
    // El presupuesto base ya estaba aprobado ($2,800), pero la extra rechazada ($650) no se suma
    expect(rejectedBlocking.total_to_pay).toBe(2800);
  });

  it('CA-7: calculateTotalToPay calcula exactamente Costo Base aprobado + suma de Extras aprobadas', () => {
    const total = calculateTotalToPay(
      { description: 'Base', amount: 2800, status: 'approved' },
      [
        {
          id: 'EXT-1',
          description: 'Extra 1',
          amount: 650,
          is_blocking: true,
          status: 'approved',
        },
        {
          id: 'EXT-2',
          description: 'Extra 2',
          amount: 500,
          is_blocking: false,
          status: 'rejected',
        },
        {
          id: 'EXT-3',
          description: 'Extra 3',
          amount: 300,
          is_blocking: false,
          status: 'pending',
        },
      ]
    );

    expect(total).toBe(3450);
  });

  it('CA-8: cierre de ciclo registra cada transición en status_history', () => {
    let order = createWorkOrder(
      {
        clientName: 'Carlos Mendoza',
        clientPhone: '5215512345678',
        vehicleModel: 'Seat Ibiza 2019',
        initialFault: 'Ruido al frenar',
      },
      'ORD-101',
      '10:00 AM'
    );
    order = setBudgetBase(order, 'Frenos', 2800, '10:10 AM');
    order = respondBudgetBase(order, 'approved', '10:20 AM');
    order = updateOrderStatus(order, 'pruebas_calidad', '12:00 PM');
    order = updateOrderStatus(order, 'listo_entrega', '01:00 PM');
    order = updateOrderStatus(order, 'entregado', '02:00 PM');

    expect(order.current_status).toBe('entregado');
    expect(order.status_history.map((s) => s.status)).toEqual([
      'recibido_diagnostico',
      'esperando_aprobacion_presupuesto',
      'en_reparacion',
      'pruebas_calidad',
      'listo_entrega',
      'entregado',
    ]);
  });
});
