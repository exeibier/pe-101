# Spec: TallerTrack - Prototipo de Gestión y Tracking para Taller Mecánico

- **Estado:** Completado
- **Fecha:** 2026-11-03

## 1. Descripción del Feature

**TallerTrack** es una solución web enfocada en dispositivos móviles (construida en Next.js con estado simulado/*mock* en memoria) diseñada para gestionar y simular el ciclo de vida completo de reparación de un vehículo en un taller mecánico, eliminando la necesidad de llamadas telefónicas mediante dos vistas móviles sincronizadas en tiempo real:

1. **Vista A — Back-office del Mecánico (Móvil):** Panel de control donde el mecánico registra vehículos entrantes, genera enlaces directos de seguimiento para WhatsApp, actualiza estados de la orden, envía el presupuesto base y reporta reparaciones adicionales (indicando si bloquean o no la reparación original), visualizando en tiempo real las respuestas del cliente.
2. **Vista B — Vista del Cliente (Simulación Web de Chat estilo WhatsApp):** Interfaz tipo chat interactivo a la que el cliente accede mediante su enlace único (`token_url`), donde consulta el estado actual de su vehículo, recibe notificaciones automáticas en burbujas de mensaje, aprueba o rechaza presupuestos y reparaciones extra mediante tarjetas interactivas, y visualiza en todo momento el total acumulado a pagar.

---

### 1.1 Modelo de Datos Simplificado (En Memoria / JSON)

Cada orden de trabajo (`WorkOrder`) se estructura en memoria de la siguiente forma:

```json
{
  "order_id": "ORD-101",
  "token_url": "https://taller.app/chat/ORD-101",
  "client": {
    "name": "Carlos Mendoza",
    "phone": "5215512345678"
  },
  "vehicle": {
    "model": "Seat Ibiza 2019",
    "initial_fault": "Ruido fuerte al frenar y vibración de volante"
  },
  "current_status": "recibido_diagnostico",
  "status_history": [
    { "status": "recibido_diagnostico", "timestamp": "10:00 AM" }
  ],
  "budget_base": {
    "description": "Cambio de discos y balatas delanteras",
    "amount": 2800.00,
    "status": "pending"
  },
  "extra_repairs": [
    {
      "id": "EXT-1",
      "description": "Rectificado de masa derecha con juego",
      "amount": 650.00,
      "is_blocking": true,
      "status": "pending"
    }
  ],
  "default_closure_note": null,
  "total_to_pay": 0.00
}
```

#### Estados Permitidos (`OrderStatus`)
- `recibido_diagnostico`: Recepción y diagnóstico inicial del vehículo.
- `esperando_aprobacion_presupuesto`: Diagnóstico cargado, esperando decisión del cliente sobre el presupuesto base.
- `en_reparacion`: Presupuesto base aprobado, vehículo en intervención mecánica.
- `pruebas_calidad`: Reparación concluida, en validación y control de calidad.
- `listo_entrega`: Vehículo listo para que el cliente pase a recogerlo (ya sea por conclusión exitosa o por detención debido a rechazo de presupuesto/reparación crítica).
- `entregado`: Ciclo cerrado, vehículo entregado al propietario.

---

### 1.2 Reglas de Negocio y Lógica de Transiciones

1. **Alta del Auto y Enlace Directo de WhatsApp:**
   - Al capturar: `Nombre del cliente`, `Teléfono (con lada)`, `Modelo del auto` y `Falla inicial`.
   - El sistema crea la orden en estado `recibido_diagnostico`, genera el `token_url` (`https://taller.app/chat/{order_id}`) y construye el enlace directo de WhatsApp API:
     `https://api.whatsapp.com/send?phone={phone}&text=Hola%20{name},%20sigue%20el%20estado%20de%20tu%20auto%20aqu%C3%AD:%20{token_url}`

2. **Flujo de Diagnóstico y Presupuesto Base:**
   - Todo vehículo registrado inicia en `recibido_diagnostico`.
   - Cuando el mecánico registra la ` descripción` y el `monto` del diagnóstico base, el presupuesto queda en `status: "pending"` y el estado de la orden pasa automáticamente a `esperando_aprobacion_presupuesto`.
   - **Si el cliente aprueba el presupuesto base:**
     - `budget_base.status` cambia a `"approved"`.
     - El estado de la orden transiciona automáticamente a `en_reparacion`.
     - El monto base se suma a `total_to_pay`.
   - **Si el cliente rechaza el presupuesto base:**
     - `budget_base.status` cambia a `"rejected"`.
     - El estado de la orden transiciona automáticamente a `listo_entrega`.
     - Se asigna `default_closure_note`: `"Servicio no concluido: Presupuesto base rechazado por el cliente"`.

3. **Manejo de Reparaciones Extras (`extra_repairs`):**
   - Cada reparación extra incluye: `description`, `amount` y `is_blocking` (`true` / `false`), iniciando con `status: "pending"`.
   - **Caso Independiente (`is_blocking: false`):**
     - **Aprobada (`approved`):** Se suma su `amount` a `total_to_pay`. El auto continúa su flujo regular.
     - **Rechazada (`rejected`):** Se descarta sin sumar al total y el auto continúa su reparación regular.
   - **Caso Crítico / Vinculado al fallo original (`is_blocking: true`):**
     - **Aprobada (`approved`):** Se suma su `amount` a `total_to_pay` y el auto continúa su reparación.
     - **Rechazada (`rejected`):**
       - Transición automática e inmediata del estado de la orden a `listo_entrega`.
       - Se registra automáticamente en `default_closure_note`: `"Servicio detenido: Reparación crítica necesaria para resolver el problema original rechazada por el cliente"` (sin solicitar notas manuales al mecánico).

4. **Cálculo del Total Acumulado (`total_to_pay`):**
   $$\text{Total} = (\text{Costo Base si } \texttt{status === 'approved'}) + \sum (\text{Extras con } \texttt{status === 'approved'})$$

5. **Cierre de Ciclo Regular:**
   - Flujo normal tras aprobación: `en_reparacion` $\rightarrow$ `pruebas_calidad` $\rightarrow$ `listo_entrega` $\rightarrow$ `entregado`.
   - Cada cambio de estado registra una entrada en `status_history` con su `timestamp` y emite una notificación en el historial de chat del cliente.

---

### 1.3 Interfaces del Prototipo

1. **Conmutador Global de Simulación:**
   - Barra o selector superior que permite alternar instantáneamente entre **[PANEL MECÁNICO]** y **[VISTA CLIENTE (WHATSAPP)]** (o visualizarlas lado a lado en pantallas de escritorio) compartiendo el mismo estado en memoria.

2. **Vista A: Back-Office del Mecánico (Móvil):**
   - **Formulario de Alta Rápida:** Campos para Nombre del cliente, WhatsApp (con lada), Auto y Falla reportada; botón `[Registrar y Enviar Enlace por WhatsApp]` que muestra/copia el enlace generado de `api.whatsapp.com/send`.
   - **Detalle del Auto Activo:**
     - Selector manual de estado (`recibido_diagnostico`, `en_reparacion`, `pruebas_calidad`, `listo_entrega`, `entregado`).
     - Formulario/Modal `+ Cargar Presupuesto Base` (Descripción + Importe).
     - Formulario/Modal `+ Agregar Reparación Extra` (Descripción, Costo y switch `¿Bloquea la reparación original? (Sí/No)`).
     - Indicadores visuales en tiempo real del estado de cada presupuesto/extra: `Aprobado` (verde), `Rechazado` (rojo), `Esperando respuesta` (amarillo).

3. **Vista B: Pantalla del Cliente (Simulador Web de Chat WhatsApp):**
   - **Barra Superior Fija:** Nombre del Taller, modelo del auto en atención, badge con el estado actual y **Total a Pagar (`$X,XXX.XX MXN`)** actualizado dinámicamente.
   - **Historial de Mensajes (Burbujas):**
     - Mensaje automático inicial con detalles de recepción y falla reportada.
     - Burbujas informativas por cada cambio de estado y notas de cierre automático si ocurren.
   - **Tarjetas Interactivas en el Chat:**
     - **Tarjeta de Presupuesto Base:** Muestra descripción, costo y botones `[Aprobar $XXXX]` / `[Rechazar]`.
     - **Tarjeta de Reparación Extra:** Muestra descripción, costo y, cuando `is_blocking === true`, la advertencia destacada: *"⚠️ Esta reparación es requerida para solucionar la falla inicial. Si se rechaza, el auto se dejará listo para entrega sin terminar el servicio."* Incluye botones `[Aprobar (+ $XXX)]` / `[Rechazar]`.
     - Al pulsar cualquier opción, los botones de acción desaparecen y la tarjeta muestra el sello definitivo (`Aprobado` o `Rechazado`).

---

## 2. Archivos que se Tocan

Listado de archivos creados/modificados para implementar el prototipo en Next.js (App Router + TypeScript + Tailwind CSS):

- `package.json` - (Nuevo) Dependencias de Next.js 15, React 19, Tailwind CSS y Vitest + Testing Library.
- `tsconfig.json` / `next.config.mjs` / `tailwind.config.ts` / `postcss.config.mjs` / `vitest.config.ts` - (Nuevos) Configuración base del proyecto y runner de pruebas.
- `src/types/workshop.ts` - (Nuevo) Definición de tipos e interfaces TypeScript (`WorkOrder`, `OrderStatus`, `BudgetBase`, `ExtraRepair`, `ChatEventMessage`, `StatusHistoryEntry`).
- `src/lib/workshop-engine.ts` - (Nuevo) Motor de reglas de negocio puras: creación de orden, generación de link de WhatsApp, cálculo de `total_to_pay`, transiciones de presupuesto base y reparaciones extra (incluyendo reglas de bloqueo y notas automáticas).
- `src/data/mock-orders.ts` - (Nuevo) Datos semilla (*mock*) iniciales basados en el caso `ORD-101` (Carlos Mendoza - Seat Ibiza 2019) para pruebas inmediatas.
- `src/context/WorkshopContext.tsx` - (Nuevo) Proveedor de estado en memoria (con sincronización en `localStorage`) que conecta en tiempo real el `[PANEL MECÁNICO]` y la `[VISTA CLIENTE (WHATSAPP)]`.
- `src/components/mechanic/MechanicPanel.tsx` - (Nuevo) Vista móvil del Back-office del mecánico (alta rápida, selector de estados, carga de presupuesto base, alta de reparaciones extra y semáforo de respuestas).
- `src/components/client/ClientWhatsAppView.tsx` - (Nuevo) Simulador móvil del chat del cliente con cabecera fija (estado + total a pagar), burbujas de eventos y tarjetas interactivas de aprobación/rechazo.
- `src/app/layout.tsx` / `src/app/globals.css` - (Nuevos) Layout raíz con `WorkshopProvider` y estilos globales.
- `src/app/page.tsx` - (Nuevo) Página principal del prototipo con el selector superior para alternar entre **[PANEL MECÁNICO]**, **[VISTA CLIENTE (WHATSAPP)]** y **Ambas Vistas**.
- `src/app/chat/[orderId]/page.tsx` - (Nuevo) Ruta directa simulada del enlace compartido por WhatsApp para una orden específica.

---

## 3. Criterios de Aceptación

- [x] **CA-1 (Alta de vehículo y enlace de WhatsApp):** Dado que el mecánico ingresa nombre (`Carlos Mendoza`), teléfono (`5215512345678`), modelo (`Seat Ibiza 2019`) y falla inicial, cuando presiona `[Registrar y Enviar Enlace por WhatsApp]`, entonces se crea la orden con estado `recibido_diagnostico`, `total_to_pay: 0.00`, y se genera el enlace `https://api.whatsapp.com/send?phone=5215512345678&text=...` incluyendo el `token_url` de la orden.
- [x] **CA-2 (Carga de presupuesto base):** Dado un vehículo en `recibido_diagnostico`, cuando el mecánico carga el presupuesto base con descripción y monto (`$2,800.00`), entonces el estado de la orden cambia a `esperando_aprobacion_presupuesto`, el presupuesto queda en estado `pending` (amarillo) y aparece una tarjeta interactiva de aprobación en el chat del cliente.
- [x] **CA-3 (Aprobación de presupuesto base):** Dado un presupuesto base en estado `pending`, cuando el cliente pulsa `[Aprobar $2800]` en su vista de chat, entonces los botones desaparecen mostrando el estado confirmado, la orden pasa automáticamente a `en_reparacion`, el mecánico ve el presupuesto en verde (`Aprobado`) y el `total_to_pay` se actualiza a `$2,800.00 MXN`.
- [x] **CA-4 (Rechazo de presupuesto base):** Dado un presupuesto base en estado `pending`, cuando el cliente pulsa `[Rechazar]`, entonces el presupuesto cambia a `rejected` (rojo), la orden transiciona automáticamente a `listo_entrega`, `total_to_pay` permanece en `$0.00 MXN` y se registra la nota automática *"Servicio no concluido: Presupuesto base rechazado por el cliente"*.
- [x] **CA-5 (Reparación extra NO bloqueante - Aprobada y Rechazada):** Dada una reparación extra con `is_blocking: false` y costo `$450.00`, cuando el cliente la aprueba, el `total_to_pay` incrementa en `$450.00`; si el cliente la rechaza, el `total_to_pay` no cambia y la orden mantiene su estado actual de reparación sin detenerse.
- [x] **CA-6 (Reparación extra BLOQUEANTE - Advertencia y Rechazo Crítico):** Dada una reparación extra con `is_blocking: true` y costo `$650.00`, cuando se muestra al cliente en el chat, debe incluir la advertencia *"⚠️ Esta reparación es requerida para solucionar la falla inicial. Si se rechaza, el auto se dejará listo para entrega sin terminar el servicio."* Si el cliente pulsa `[Rechazar]`, el estado del auto cambia inmediata y automáticamente a `listo_entrega`, se inserta la nota automática *"Servicio detenido: Reparación crítica necesaria para resolver el problema original rechazada por el cliente"* y el costo de dicha extra no se suma al total.
- [x] **CA-7 (Cálculo dinámico del total acumulado):** Dado un presupuesto base aprobado (`$2,800.00`), una reparación extra aprobada (`$650.00`) y otra reparación extra rechazada o pendiente (`$500.00`), el total a pagar mostrado en la barra superior del cliente y en el panel del mecánico debe ser exactamente `$3,450.00 MXN`.
- [x] **CA-8 (Cierre de ciclo y trazabilidad en historial):** Cuando el mecánico avanza el estado por `en_reparacion` $\rightarrow$ `pruebas_calidad` $\rightarrow$ `listo_entrega` $\rightarrow$ `entregado`, cada transición se agrega a `status_history` con su hora y genera una burbuja de notificación en la vista del cliente.

---

## 4. Suite de Tests

Detalle de las pruebas automatizadas que validarán los criterios de aceptación:

- **Tests Unitarios (`workshop-engine.spec.ts`):**
  - Generación de `order_id`, `token_url` y formato codificado de URL de WhatsApp (`api.whatsapp.com/send`).
  - Transiciones de estado al cargar, aprobar y rechazar el presupuesto base (incluyendo verificación de `default_closure_note`).
  - Evaluación de reparaciones extras con `is_blocking: false` vs `is_blocking: true` al aprobarse o rechazarse.
  - Función de cálculo `calculateTotalToPay` con combinaciones de presupuestos y extras en estados `pending`, `approved` y `rejected`.
  - Registro cronológico en `status_history` a lo largo del cierre de ciclo.
- **Tests de Integración / Componentes (`taller-track-ui.spec.tsx`):**
  - Sincronización entre `MechanicPanel` y `ClientWhatsAppView` a través de `WorkshopContext`.
  - Renderizado condicional de la alerta de bloqueo (`⚠️ Esta reparación es requerida...`) únicamente cuando `is_blocking === true`.
  - Desaparición de los botones `[Aprobar]` / `[Rechazar]` una vez que el cliente toma una decisión.
- **Tests End-to-End (E2E) / UI:**
  - Flujo 1 (Camino Feliz): Alta de auto $\rightarrow$ Presupuesto base aprobado $\rightarrow$ Extra aprobada $\rightarrow$ Avance hasta `listo_entrega` y `entregado`.
  - Flujo 2 (Rechazo Crítico): Alta de auto $\rightarrow$ Presupuesto base aprobado $\rightarrow$ Extra bloqueante rechazada $\rightarrow$ Transición inmediata a `listo_entrega` con nota automática.
- **Archivos de Test:**
  - `src/__tests__/workshop-engine.spec.ts`
  - `src/__tests__/taller-track-ui.spec.tsx`
