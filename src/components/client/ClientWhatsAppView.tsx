'use client';

import React from 'react';
import {
  AlertTriangle,
  Check,
  CheckCheck,
  MessageCircle,
  ShieldAlert,
  Wrench,
  X,
} from 'lucide-react';
import { useWorkshop } from '@/context/WorkshopContext';
import {
  BLOCKING_EXTRA_WARNING,
  formatCurrencyMXN,
  ORDER_STATUS_LABELS,
} from '@/lib/workshop-engine';
import { OrderStatus, WorkOrder } from '@/types/workshop';

const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  recibido_diagnostico: 'bg-sky-100 text-sky-900 border-sky-300',
  esperando_aprobacion_presupuesto:
    'bg-amber-100 text-amber-900 border-amber-300',
  en_reparacion: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  pruebas_calidad: 'bg-purple-100 text-purple-900 border-purple-300',
  listo_entrega: 'bg-emerald-100 text-emerald-950 border-emerald-400',
  entregado: 'bg-slate-200 text-slate-800 border-slate-300',
};

export function ClientWhatsAppView({ customOrder }: { customOrder?: WorkOrder }) {
  const { activeOrder, decideBudgetBase, decideExtraRepair } = useWorkshop();
  const order = customOrder ?? activeOrder;

  return (
    <section
      aria-label="Vista del Cliente (Simulador Chat WhatsApp)"
      className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-[#efeae2] shadow-lg overflow-hidden flex flex-col"
    >
      {/* Barra Superior Fija estilo WhatsApp */}
      <header className="sticky top-0 z-10 bg-[#075e54] px-4 py-3 text-white shadow-md space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-bold">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">
                TallerTrack Oficial
              </h2>
              <p className="text-xs text-emerald-100">
                {order.vehicle.model} • {order.order_id}
              </p>
            </div>
          </div>

          <div
            aria-live="polite"
            className="text-right bg-black/20 rounded-lg px-2.5 py-1"
          >
            <span className="block text-[10px] uppercase tracking-wider text-emerald-200">
              Total a Pagar
            </span>
            <span
              data-testid="client-total-to-pay"
              className="text-sm font-extrabold text-white"
            >
              {formatCurrencyMXN(order.total_to_pay)} MXN
            </span>
          </div>
        </div>

        {/* Barra de Estado Actual del Auto */}
        <div
          aria-live="polite"
          className="flex items-center justify-between rounded-lg bg-[#054c44] px-3 py-1.5 text-xs"
        >
          <span className="text-emerald-100 font-medium">Estado actual:</span>
          <span
            data-testid="client-order-status-badge"
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
              STATUS_BADGE_STYLES[order.current_status]
            }`}
          >
            {ORDER_STATUS_LABELS[order.current_status]}
          </span>
        </div>
      </header>

      {/* Historial de Mensajes (Burbujas) */}
      <div className="p-4 space-y-3.5 max-h-[640px] overflow-y-auto">
        {/* Burbujas cronológicas del sistema */}
        {order.messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl p-3 text-xs shadow-sm max-w-[92%] ${
              msg.type === 'closure_note'
                ? 'bg-rose-50 border border-rose-300 text-rose-950'
                : 'bg-white text-slate-800'
            }`}
          >
            <p className="leading-relaxed">{msg.text}</p>
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
              <span>{msg.timestamp}</span>
              <CheckCheck
                className="h-3.5 w-3.5 text-sky-500"
                aria-hidden="true"
              />
            </div>
          </div>
        ))}

        {/* Tarjeta Interactiva de Presupuesto Base */}
        {order.budget_base && (
          <article
            data-testid="client-budget-card"
            aria-label="Tarjeta de Presupuesto Base"
            className="rounded-xl border border-emerald-200 bg-white p-3.5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#075e54]">
                <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                Presupuesto Base
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                {formatCurrencyMXN(order.budget_base.amount)}
              </span>
            </div>

            <p className="text-sm text-slate-800 font-medium">
              {order.budget_base.description}
            </p>

            {order.budget_base.status === 'pending' ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  data-testid="btn-approve-budget"
                  onClick={() => decideBudgetBase(order.order_id, 'approved')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition min-h-[44px]"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Aprobar {formatCurrencyMXN(order.budget_base.amount)}
                </button>
                <button
                  type="button"
                  data-testid="btn-reject-budget"
                  onClick={() => decideBudgetBase(order.order_id, 'rejected')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition min-h-[44px]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Rechazar
                </button>
              </div>
            ) : (
              <div
                data-testid="client-budget-confirmed-status"
                className={`rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-1.5 ${
                  order.budget_base.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {order.budget_base.status === 'approved' ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Presupuesto Base Aprobado ({formatCurrencyMXN(order.budget_base.amount)})
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" aria-hidden="true" />
                    Presupuesto Base Rechazado
                  </>
                )}
              </div>
            )}
          </article>
        )}

        {/* Tarjetas Interactivas de Reparaciones Extras */}
        {order.extra_repairs.map((extra) => (
          <article
            key={extra.id}
            data-testid={`client-extra-card-${extra.id}`}
            aria-label={`Tarjeta de Reparación Extra ${extra.id}`}
            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-700">
                <ShieldAlert
                  className="h-3.5 w-3.5 text-amber-600"
                  aria-hidden="true"
                />
                Reparación Extra ({extra.id})
              </span>
              <span className="text-sm font-extrabold text-slate-900">
                + {formatCurrencyMXN(extra.amount)}
              </span>
            </div>

            <p className="text-sm font-medium text-slate-800">
              {extra.description}
            </p>

            {/* Advertencia obligatoria si es vinculada/bloqueante */}
            {extra.is_blocking && (
              <div
                data-testid={`client-extra-blocking-warning-${extra.id}`}
                className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs font-semibold text-amber-950"
              >
                {BLOCKING_EXTRA_WARNING}
              </div>
            )}

            {extra.status === 'pending' ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  data-testid={`btn-approve-extra-${extra.id}`}
                  onClick={() =>
                    decideExtraRepair(order.order_id, extra.id, 'approved')
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition min-h-[44px]"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Aprobar (+ {formatCurrencyMXN(extra.amount)})
                </button>
                <button
                  type="button"
                  data-testid={`btn-reject-extra-${extra.id}`}
                  onClick={() =>
                    decideExtraRepair(order.order_id, extra.id, 'rejected')
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition min-h-[44px]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Rechazar
                </button>
              </div>
            ) : (
              <div
                data-testid={`client-extra-confirmed-status-${extra.id}`}
                className={`rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-1.5 ${
                  extra.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {extra.status === 'approved' ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Aprobado (+ {formatCurrencyMXN(extra.amount)})
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" aria-hidden="true" />
                    Rechazado
                  </>
                )}
              </div>
            )}
          </article>
        ))}

        {/* Nota de Cierre Automático en la Vista del Cliente */}
        {order.default_closure_note && (
          <div
            role="alert"
            data-testid="client-closure-note-banner"
            className="rounded-xl border-2 border-rose-400 bg-rose-50 p-3.5 text-xs font-bold text-rose-950 flex items-start gap-2.5 shadow-sm"
          >
            <AlertTriangle
              className="h-5 w-5 text-rose-600 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p>{order.default_closure_note}</p>
              <p className="mt-1 font-normal text-rose-800">
                Tu vehículo ya está marcado como <strong>Listo para Entrega</strong>. Puedes pasar al taller a recogerlo.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
