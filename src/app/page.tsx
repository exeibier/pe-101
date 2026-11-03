'use client';

import React, { useState } from 'react';
import { Columns2, MessageCircle, RotateCcw, Wrench } from 'lucide-react';
import { MechanicPanel } from '@/components/mechanic/MechanicPanel';
import { ClientWhatsAppView } from '@/components/client/ClientWhatsAppView';
import { useWorkshop } from '@/context/WorkshopContext';

type ViewMode = 'mechanic' | 'client' | 'split';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const { resetDemoData, activeOrder } = useWorkshop();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra Superior de Conmutación del Prototipo */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-sm">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-amber-400 font-extrabold text-sm">
              TT
            </span>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-none">
                TallerTrack
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Prototipo de Seguimiento Mecánico • Orden Activa:{' '}
                <strong className="text-slate-800">{activeOrder.order_id}</strong>
              </p>
            </div>
          </div>

          {/* Selector de Vistas: [PANEL MECÁNICO] y [VISTA CLIENTE (WHATSAPP)] */}
          <nav
            aria-label="Selector de vista del prototipo"
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200"
          >
            <button
              type="button"
              data-testid="switch-mechanic-view"
              aria-pressed={viewMode === 'mechanic'}
              onClick={() => setViewMode('mechanic')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === 'mechanic'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
              [PANEL MECÁNICO]
            </button>

            <button
              type="button"
              data-testid="switch-client-view"
              aria-pressed={viewMode === 'client'}
              onClick={() => setViewMode('client')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === 'client'
                  ? 'bg-[#075e54] text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              [VISTA CLIENTE (WHATSAPP)]
            </button>

            <button
              type="button"
              data-testid="switch-split-view"
              aria-pressed={viewMode === 'split'}
              onClick={() => setViewMode('split')}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === 'split'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
              Ambas Vistas
            </button>
          </nav>

          <button
            type="button"
            onClick={resetDemoData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reiniciar Mock (ORD-101)
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main id="main-content" className="flex-1 mx-auto w-full max-w-6xl p-4 sm:p-6">
        {viewMode === 'mechanic' && <MechanicPanel />}
        {viewMode === 'client' && <ClientWhatsAppView />}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <MechanicPanel />
            <ClientWhatsAppView />
          </div>
        )}
      </main>
    </div>
  );
}
