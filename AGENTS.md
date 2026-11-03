# Contexto del Proyecto y Lineamientos para Agentes (`AGENTS.md`)

Este archivo proporciona el contexto principal y las reglas de trabajo que todos los agentes deben seguir al colaborar en este repositorio.

---

## 1. Contexto del Negocio y Propósito del Proyecto

El proyecto consiste en un **Sistema de Gestión y Tracking para un Taller Mecánico**.

### Objetivo Principal
Permitir que el taller mecánico registre la recepción de un automóvil y lleve el seguimiento (*tracking*) detallado del estado de reparación del vehículo a lo largo de todo su ciclo de servicio.

### Actores y Necesidades Clave
* **Mecánico / Personal del Taller:**
  * Recibe el vehículo y registra su ingreso y diagnóstico inicial.
  * Actualiza el estado de la reparación conforme avanza por las distintas etapas (ej. *Recibido*, *En Diagnóstico*, *Esperando Refacciones*, *En Reparación*, *Control de Calidad*, *Listo para Entrega*, *Entregado*).
  * Registra observaciones, avances y tiempos estimados.
* **Cliente (Propietario del Vehículo):**
  * Puede consultar en todo momento cuál es el estado actual de la reparación de su automóvil de forma clara y transparente.
  * Sabe con exactitud cuándo el vehículo está listo y en qué momento debe acudir al taller a recogerlo.

### Stack Tecnológico y Alcance Actual
* **Framework:** Aplicación web construida con **Next.js**.
* **Persistencia / Datos (Fase Actual):** Por ahora el proyecto **no utiliza una base de datos real**. Toda la información y las operaciones deben funcionar mediante **datos *mock* (simulados)** que aparenten un comportamiento real y fluido (por ejemplo, estado en memoria, `localStorage` o servicios *mock* con datos semilla realistas de vehículos, clientes y estados de reparación).

---

## 2. Documentación y Gestión de Especificaciones (Specs)

Todo nuevo *feature*, módulo o cambio significativo **debe ser especificado y documentado dentro del mismo proyecto** antes o durante su implementación, para garantizar trazabilidad y servir como referencia futura para otros desarrolladores y agentes.

### Ubicación de las Specs
* Todas las especificaciones deben almacenarse dentro del repositorio en el directorio:
  `docs/specs/`
* Convención de nombres sugerida: `docs/specs/YYYY-MM-DD-<nombre-del-feature>.md` o `docs/specs/SPEC-<id>-<nombre-del-feature>.md`.

### Formato Obligatorio de una Spec
Cada archivo de especificación que se cree **debe** seguir la siguiente estructura y contener las cuatro secciones obligatorias:

```markdown
# Spec: [Nombre del Feature]

- **Estado:** [Borrador | En Progreso | Completado]
- **Fecha:** YYYY-MM-DD

## 1. Descripción del Feature
Explicación clara y detallada de qué hace la funcionalidad, qué problema resuelve dentro del flujo del taller mecánico (para el mecánico y/o para el cliente) y cómo encaja en el sistema de tracking del vehículo.

## 2. Archivos que se Tocan
Listado de los archivos y módulos del proyecto que serán creados, modificados o eliminados para implementar este feature.
- `ruta/al/archivo1.ext` - (Nuevo / Modificado) Breve descripción del cambio o responsabilidad.
- `ruta/al/archivo2.ext` - (Nuevo / Modificado) Breve descripción del cambio o responsabilidad.

## 3. Criterios de Aceptación
Condiciones claras, verificables y orientadas al comportamiento que deben cumplirse para considerar el feature terminado.
- [ ] **CA-1:** Dado [contexto inicial], cuando [acción ejecutada], entonces [resultado esperado].
- [ ] **CA-2:** ...

## 4. Suite de Tests
Detalle de las pruebas automatizadas que validan los criterios de aceptación y aseguran que no existan regresiones.
- **Tests Unitarios:** Qué funciones, modelos o reglas de negocio se prueban aisladamente.
- **Tests de Integración / API:** Qué endpoints, servicios o interacciones con base de datos se validan.
- **Tests End-to-End (E2E) / UI:** Qué flujos completos del mecánico o del cliente se verifican.
- **Archivos de Test:**
  - `ruta/al/test1.spec.ext`
```

---

## 3. Reglas de Trabajo para los Agentes

1. **Lectura y Creación de Specs:** Antes de implementar un nuevo feature, verifica si ya existe una spec en `docs/specs/`. Si no existe, créala siguiendo el formato obligatorio o actualízala si los requerimientos evolucionan.
2. **Sincronización con la Implementación:** Al finalizar un cambio, asegúrate de que la sección **Archivos que se Tocan** y la **Suite de Tests** en la spec reflejen fielmente los archivos reales del repositorio.
3. **Calidad y Pruebas:** Ningún feature se considera completo si no cuenta con su respectiva suite de tests ejecutándose satisfactoriamente y cubriendo los criterios de aceptación definidos en su spec.
4. **Enfoque en el Dominio:** Mantén siempre presente la experiencia tanto del **mecánico** (agilidad para actualizar el estado del vehículo) como del **cliente** (claridad sobre el progreso de su auto y aviso oportuno para recogerlo).
