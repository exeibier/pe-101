'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useWorkshop } from '@/context/WorkshopContext';
import { ClientWhatsAppView } from '@/components/client/ClientWhatsAppView';

export default function ClientDirectChatPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const { orders } = useWorkshop();

  const targetOrder = orders.find(
    (item) => item.order_id.toUpperCase() === orderId.toUpperCase()
  );

  return (
    <main className="min-h-screen bg-slate-100 p-4 space-y-4">
      <div className="mx-auto max-w-md flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Volver al Simulador TallerTrack
        </Link>
        <span className="text-xs font-mono text-slate-500">
          Enlace directo: {orderId}
        </span>
      </div>

      {targetOrder ? (
        <ClientWhatsAppView customOrder={targetOrder} />
      ) : (
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-3">
          <h1 className="text-base font-bold text-slate-900">
            Orden {orderId} no encontrada
          </h1>
          <p className="text-xs text-slate-600">
            Verifica el código de tu orden o regresa al panel principal del
            prototipo.
          </p>
        </div>
      )}
    </main>
  );
}
