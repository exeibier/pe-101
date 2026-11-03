'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  PlusCircle,
  Send,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useWorkshop } from '@/context/WorkshopContext';
import {
  buildWhatsAppLink,
  formatCurrencyMXN,
  ORDER_STATUS_LABELS,
} from '@/lib/workshop-engine';
import { ApprovalStatus, OrderStatus } from '@/types/workshop';

const SELECTABLE_STATUSES: OrderStatus[] = [
  'recibido_diagnostico',
  'esperando_aprobacion_presupuesto',
  'en_reparacion',
  'pruebas_calidad',
  'listo_entrega',
  'entregado',
];

function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  if (status === 'approved') {
    return (
      <span
        data-testid={`badge-${status}`}
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-300"
      >
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Aprobado
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        data-testid={`badge-${status}`}
        className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800 border border-rose-300"
      >
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Rechazado
      </span>
    );
  }

  return (
    <span
      data-testid={`badge-${status}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-300"
    >
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      Esperando respuesta
    </span>
  );
}

export function MechanicPanel() {
  const {
    orders,
    activeOrder,
    selectOrder,
    registerOrder,
    changeOrderStatus,
    submitBudgetBase,
    submitExtraRepair,
  } = useWorkshop();

  // Estado Formulario de Alta Rápida
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [initialFault, setInitialFault] = useState('');
  const [lastGeneratedWaLink, setLastGeneratedWaLink] = useState<string | null>(
    null
  );
  const [copiedLink, setCopiedLink] = useState(false);

  // Estado Formulario Presupuesto Base
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetDescription, setBudgetDescription] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');

  // Estado Formulario Reparación Extra
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [extraDescription, setExtraDescription] = useState('');
  const [extraAmount, setExtraAmount] = useState('');
  const [extraIsBlocking, setExtraIsBlocking] = useState(false);

  const activeWhatsAppLink = buildWhatsAppLink(activeOrder);

  const handleRegisterOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !clientName.trim() ||
      !clientPhone.trim() ||
      !vehicleModel.trim() ||
      !initialFault.trim()
    ) {
      return;
    }

    const created = registerOrder({
      clientName,
      clientPhone,
      vehicleModel,
      initialFault,
    });
    const generatedUrl = buildWhatsAppLink(created);
    setLastGeneratedWaLink(generatedUrl);

    setClientName('');
    setClientPhone('');
    setVehicleModel('');
    setInitialFault('');
    setShowNewOrderForm(false);
  };

  const handleLoadBudgetBase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const numericAmount = Number(budgetAmount);
    if (!budgetDescription.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }

    submitBudgetBase(activeOrder.order_id, budgetDescription, numericAmount);
    setBudgetDescription('');
    setBudgetAmount('');
    setShowBudgetForm(false);
  };

  const handleAddExtraRepair = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const numericAmount = Number(extraAmount);
    if (!extraDescription.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }

    submitExtraRepair(activeOrder.order_id, {
      description: extraDescription,
      amount: numericAmount,
      is_blocking: extraIsBlocking,
    });
    setExtraDescription('');
    setExtraAmount('');
    setExtraIsBlocking(false);
    setShowExtraForm(false);
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignorar en entornos sin clipboard API
    }
  };

  return (
    <section
      aria-label="Back-Office del Mecánico"
      className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden"
    >
      {/* Cabecera Back-Office */}
      <header className="bg-slate-900 px-4 py-3.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
            <Wrench className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase">
              Back-Office Mecánico
            </h2>
            <p className="text-xs text-slate-300">
              Gestión de órdenes y presupuestos
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowNewOrderForm((prev) => !prev)}
          aria-expanded={showNewOrderForm}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          {showNewOrderForm ? 'Cerrar Alta' : 'Nueva Orden'}
        </button>
      </header>

      <div className="p-4 space-y-5">
        {/* Selector de Orden Activa */}
        {orders.length > 1 && (
          <div>
            <label
              htmlFor="active-order-select"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1"
            >
              Vehículo Activo ({orders.length} en taller)
            </label>
            <select
              id="active-order-select"
              name="activeOrder"
              value={activeOrder.order_id}
              onChange={(e) => selectOrder(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
            >
              {orders.map((ord) => (
                <option key={ord.order_id} value={ord.order_id}>
                  {ord.order_id} — {ord.vehicle.model} ({ord.client.name})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Formulario de Alta Rápida */}
        {showNewOrderForm && (
          <form
            onSubmit={handleRegisterOrder}
            aria-label="Formulario de Alta Rápida"
            className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Car className="h-4 w-4 text-amber-600" aria-hidden="true" />
              Alta Rápida de Vehículo
            </h3>

            <div>
              <label
                htmlFor="client-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Nombre del cliente *
              </label>
              <input
                id="client-name"
                name="clientName"
                type="text"
                required
                autoComplete="name"
                placeholder="Ej. Carlos Mendoza"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
              />
            </div>

            <div>
              <label
                htmlFor="client-phone"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                WhatsApp (con lada) *
              </label>
              <input
                id="client-phone"
                name="clientPhone"
                type="text"
                inputMode="numeric"
                required
                autoComplete="tel"
                placeholder="Ej. 5215512345678"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
              />
            </div>

            <div>
              <label
                htmlFor="vehicle-model"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Auto (Marca, modelo y año) *
              </label>
              <input
                id="vehicle-model"
                name="vehicleModel"
                type="text"
                required
                placeholder="Ej. Seat Ibiza 2019"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
              />
            </div>

            <div>
              <label
                htmlFor="initial-fault"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Falla reportada *
              </label>
              <textarea
                id="initial-fault"
                name="initialFault"
                required
                rows={2}
                placeholder="Ej. Ruido fuerte al frenar y vibración de volante"
                value={initialFault}
                onChange={(e) => setInitialFault(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-600"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition min-h-[48px]"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Registrar y Enviar Enlace por WhatsApp
            </button>
          </form>
        )}

        {/* Alerta de Enlace recién generado */}
        {lastGeneratedWaLink && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-950 space-y-2"
          >
            <div className="font-bold text-emerald-900">
              ✅ Vehículo registrado — Enlace directo de WhatsApp listo:
            </div>
            <code
              data-testid="generated-whatsapp-link"
              className="block break-all rounded bg-white p-2 text-[11px] text-slate-800 border border-emerald-200"
            >
              {lastGeneratedWaLink}
            </code>
          </div>
        )}

        {/* Tarjeta Resumen del Auto Activo */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-block rounded bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-800">
                {activeOrder.order_id}
              </span>
              <h3 className="mt-1 text-base font-bold text-slate-900">
                {activeOrder.vehicle.model}
              </h3>
              <p className="text-xs text-slate-600">
                Cliente: <strong className="text-slate-800">{activeOrder.client.name}</strong> ({activeOrder.client.phone})
              </p>
            </div>
            <div className="text-right">
              <span className="block text-[11px] font-medium uppercase text-slate-500">
                Total Aprobado
              </span>
              <span
                data-testid="mechanic-total-to-pay"
                className="text-base font-extrabold text-emerald-700"
              >
                {formatCurrencyMXN(activeOrder.total_to_pay)}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-white p-2.5 border border-slate-200 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Falla inicial: </span>
            {activeOrder.vehicle.initial_fault}
          </div>

          {/* Enlace Directo de WhatsApp de la Orden Activa */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-900">
                Enlace WhatsApp del Cliente
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopyLink(activeWhatsAppLink)}
                  className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100"
                >
                  <Copy className="h-3 w-3" aria-hidden="true" />
                  {copiedLink ? 'Copiado' : 'Copiar'}
                </button>
                <a
                  href={activeWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  wa.me
                </a>
              </div>
            </div>
            <p
              data-testid="active-whatsapp-url"
              className="truncate text-[11px] font-mono text-slate-600"
            >
              {activeWhatsAppLink}
            </p>
          </div>

          {/* Selector de Estado del Auto Activo */}
          <div>
            <label
              htmlFor="order-status-select"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              Estado Actual de la Orden
            </label>
            <select
              id="order-status-select"
              name="orderStatus"
              value={activeOrder.current_status}
              onChange={(e) =>
                changeOrderStatus(
                  activeOrder.order_id,
                  e.target.value as OrderStatus
                )
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 min-h-[44px]"
            >
              {SELECTABLE_STATUSES.map((statusKey) => (
                <option key={statusKey} value={statusKey}>
                  {ORDER_STATUS_LABELS[statusKey]} ({statusKey})
                </option>
              ))}
            </select>
          </div>

          {/* Nota de Cierre Automático del Sistema si existe */}
          {activeOrder.default_closure_note && (
            <div
              role="alert"
              data-testid="mechanic-closure-note"
              className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-900 flex items-start gap-2"
            >
              <AlertTriangle
                className="h-4 w-4 text-rose-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{activeOrder.default_closure_note}</span>
            </div>
          )}
        </div>

        {/* Sección Presupuesto Base */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Diagnóstico y Presupuesto Base
            </h3>
            <button
              type="button"
              onClick={() => setShowBudgetForm((prev) => !prev)}
              aria-expanded={showBudgetForm}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
            >
              + Cargar Presupuesto Base
            </button>
          </div>

          {showBudgetForm && (
            <form
              onSubmit={handleLoadBudgetBase}
              aria-label="Cargar Presupuesto Base"
              className="rounded-xl border border-slate-300 bg-slate-50 p-3.5 space-y-3"
            >
              <div>
                <label
                  htmlFor="budget-description"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Descripción del diagnóstico / servicio *
                </label>
                <input
                  id="budget-description"
                  name="budgetDescription"
                  type="text"
                  required
                  placeholder="Ej. Cambio de discos y balatas delanteras"
                  value={budgetDescription}
                  onChange={(e) => setBudgetDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="budget-amount"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Importe (MXN) *
                </label>
                <input
                  id="budget-amount"
                  name="budgetAmount"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="Ej. 2800"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-800 min-h-[44px]"
              >
                Guardar y Enviar Presupuesto Base
              </button>
            </form>
          )}

          {activeOrder.budget_base ? (
            <div
              data-testid="mechanic-budget-card"
              className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {activeOrder.budget_base.description}
                </p>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  {formatCurrencyMXN(activeOrder.budget_base.amount)}
                </p>
              </div>
              <ApprovalStatusBadge status={activeOrder.budget_base.status} />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500">
              Aún no se ha cargado el presupuesto base.
            </p>
          )}
        </div>

        {/* Sección Reparaciones Extras */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Reparaciones Extras ({activeOrder.extra_repairs.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowExtraForm((prev) => !prev)}
              aria-expanded={showExtraForm}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
            >
              + Agregar Reparación Extra
            </button>
          </div>

          {showExtraForm && (
            <form
              onSubmit={handleAddExtraRepair}
              aria-label="Agregar Reparación Extra"
              className="rounded-xl border border-slate-300 bg-slate-50 p-3.5 space-y-3"
            >
              <div>
                <label
                  htmlFor="extra-description"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Descripción de la reparación extra *
                </label>
                <input
                  id="extra-description"
                  name="extraDescription"
                  type="text"
                  required
                  placeholder="Ej. Rectificado de masa derecha con juego"
                  value={extraDescription}
                  onChange={(e) => setExtraDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="extra-amount"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Costo adicional (MXN) *
                </label>
                <input
                  id="extra-amount"
                  name="extraAmount"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="Ej. 650"
                  value={extraAmount}
                  onChange={(e) => setExtraAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5">
                <label
                  htmlFor="extra-is-blocking"
                  className="text-xs font-semibold text-slate-800 cursor-pointer pr-2"
                >
                  ¿Bloquea la reparación original? (Sí/No)
                </label>
                <input
                  id="extra-is-blocking"
                  name="extraIsBlocking"
                  type="checkbox"
                  checked={extraIsBlocking}
                  onChange={(e) => setExtraIsBlocking(e.target.checked)}
                  className="h-5 w-5 accent-amber-600 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-bold text-white hover:bg-slate-800 min-h-[44px]"
              >
                Enviar Reparación Extra al Cliente
              </button>
            </form>
          )}

          {activeOrder.extra_repairs.length > 0 ? (
            <ul className="space-y-2">
              {activeOrder.extra_repairs.map((extra) => (
                <li
                  key={extra.id}
                  data-testid={`mechanic-extra-${extra.id}`}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        {extra.description}
                      </span>
                      {extra.is_blocking ? (
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                          Crítica / Bloqueante
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          Opcional
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-600">
                      + {formatCurrencyMXN(extra.amount)}
                    </p>
                  </div>
                  <ApprovalStatusBadge status={extra.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500">
              Sin reparaciones extras registradas.
            </p>
          )}
        </div>

        {/* Bitácora de Historial de Estados */}
        <div className="border-t border-slate-200 pt-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Historial de Estados ({activeOrder.status_history.length})
          </h3>
          <ol className="space-y-1 text-xs text-slate-600">
            {activeOrder.status_history.map((item, idx) => (
              <li
                key={`${item.status}-${idx}`}
                className="flex items-center justify-between rounded bg-slate-50 px-2.5 py-1"
              >
                <span className="font-medium text-slate-800">
                  {ORDER_STATUS_LABELS[item.status]}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {item.timestamp}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
