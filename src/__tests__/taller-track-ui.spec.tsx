import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { WorkshopProvider } from '@/context/WorkshopContext';
import HomePage from '@/app/page';
import { getInitialMockOrders } from '@/data/mock-orders';
import {
  BLOCKING_EXTRA_WARNING,
  CLOSURE_NOTE_CRITICAL_EXTRA_REJECTED,
} from '@/lib/workshop-engine';

function renderPrototype() {
  return render(
    <WorkshopProvider initialOrders={getInitialMockOrders()}>
      <HomePage />
    </WorkshopProvider>
  );
}

describe('TallerTrack UI Integration (MechanicPanel + ClientWhatsAppView)', () => {
  it('muestra la advertencia de reparación crítica bloqueante y al aprobar presupuesto base + extra actualiza el total a $3,450.00 MXN', async () => {
    const user = userEvent.setup();
    renderPrototype();

    // Verifica que la advertencia obligatoria de reparación bloqueante esté presente
    expect(
      screen.getByTestId('client-extra-blocking-warning-EXT-1')
    ).toHaveTextContent(BLOCKING_EXTRA_WARNING);

    // El total inicial debe ser $0.00 MXN
    expect(screen.getByTestId('client-total-to-pay')).toHaveTextContent(
      '$0.00 MXN'
    );

    // El cliente aprueba el presupuesto base ($2,800.00)
    await user.click(screen.getByTestId('btn-approve-budget'));

    // Los botones del presupuesto base desaparecen y se muestra el estado confirmado
    expect(screen.queryByTestId('btn-approve-budget')).not.toBeInTheDocument();
    expect(
      screen.getByTestId('client-budget-confirmed-status')
    ).toHaveTextContent('Presupuesto Base Aprobado');

    // El estado pasa a "En Reparación" y el total sube a $2,800.00 MXN
    expect(screen.getByTestId('client-order-status-badge')).toHaveTextContent(
      'En Reparación'
    );
    expect(screen.getByTestId('client-total-to-pay')).toHaveTextContent(
      '$2,800.00 MXN'
    );

    // El cliente aprueba la reparación extra EXT-1 ($650.00)
    await user.click(screen.getByTestId('btn-approve-extra-EXT-1'));

    expect(
      screen.queryByTestId('btn-approve-extra-EXT-1')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('client-total-to-pay')).toHaveTextContent(
      '$3,450.00 MXN'
    );
  });

  it('al rechazar una reparación extra bloqueante en la vista del cliente, pasa inmediatamente a Listo para Entrega con la nota automática del sistema', async () => {
    const user = userEvent.setup();
    renderPrototype();

    // Aprobamos primero el presupuesto base para estar en_reparacion
    await user.click(screen.getByTestId('btn-approve-budget'));
    expect(screen.getByTestId('client-order-status-badge')).toHaveTextContent(
      'En Reparación'
    );

    // El cliente rechaza la reparación extra crítica EXT-1
    await user.click(screen.getByTestId('btn-reject-extra-EXT-1'));

    // El estado cambia inmediatamente a Listo para Entrega
    expect(screen.getByTestId('client-order-status-badge')).toHaveTextContent(
      'Listo para Entrega'
    );

    // Se muestra la nota automática de cierre tanto en cliente como en mecánico
    expect(
      screen.getByTestId('client-closure-note-banner')
    ).toHaveTextContent(CLOSURE_NOTE_CRITICAL_EXTRA_REJECTED);
    expect(screen.getByTestId('mechanic-closure-note')).toHaveTextContent(
      CLOSURE_NOTE_CRITICAL_EXTRA_REJECTED
    );

    // El monto de la extra rechazada no se suma al total ($2,800.00 se mantiene)
    expect(screen.getByTestId('client-total-to-pay')).toHaveTextContent(
      '$2,800.00 MXN'
    );
  });

  it('permite registrar un vehículo nuevo en el panel del mecánico y genera el enlace de WhatsApp', async () => {
    const user = userEvent.setup();
    renderPrototype();

    await user.click(screen.getByRole('button', { name: /Nueva Orden/i }));

    const form = screen.getByRole('form', {
      name: /Formulario de Alta Rápida/i,
    });

    await user.type(
      within(form).getByLabelText(/Nombre del cliente/i),
      'Laura Gómez'
    );
    await user.type(
      within(form).getByLabelText(/WhatsApp \(con lada\)/i),
      '5215598765432'
    );
    await user.type(
      within(form).getByLabelText(/Auto \(Marca, modelo y año\)/i),
      'Mazda 3 2021'
    );
    await user.type(
      within(form).getByLabelText(/Falla reportada/i),
      'Testigo de check engine encendido'
    );

    await user.click(
      within(form).getByRole('button', {
        name: /Registrar y Enviar Enlace por WhatsApp/i,
      })
    );

    const linkCode = screen.getByTestId('generated-whatsapp-link');
    expect(linkCode.textContent).toContain(
      'https://api.whatsapp.com/send?phone=5215598765432&text='
    );
    expect(decodeURIComponent(linkCode.textContent || '')).toContain(
      'Hola Laura, sigue el estado de tu auto aquí: https://taller.app/chat/ORD-102'
    );
  });
});
