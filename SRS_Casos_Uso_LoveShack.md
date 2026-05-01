# Especificación de Requisitos de Software (Casos de Uso)
## Sistema de Reservaciones - Love Shack Cruises
**Basado en el estándar IEEE 830**

---

## 1. Introducción

### 1.1 Propósito
Este documento define la especificación de requisitos de software y casos de uso para el Sistema de Reservaciones de Love Shack Cruises. El propósito es detallar el comportamiento del sistema centrándose en el procesamiento interno, la gestión de datos y los documentos/outputs generados, omitiendo abstracciones de interfaz gráfica de usuario.

### 1.2 Alcance
El sistema automatiza el cálculo de cotizaciones complejas, la asignación de folios, la gestión del almacenamiento local estructurado y la sincronización con fuentes externas (archivos JSON) para reservas de tours marítimos (Snorkel, Sunset, Fishing, Baytrip, entre otros).

### 1.3 Definiciones, Acrónimos y Abreviaturas
*   **Folio:** Identificador único correlativo generado a partir de las iniciales del agente, fecha de confirmación, fecha del tour y horario (ej. `IG 2002-1304 11A`).
*   **Pax:** Pasajero.
*   **JSON:** Formato de archivo de almacenamiento persistente y portátil para el intercambio de datos.

---

## 2. Descripción General

### 2.1 Perspectiva del Producto
El sistema es una herramienta de funcionamiento independiente (local) con capacidades de persistencia sin estado permanente conectado a red, pero con capacidad de leer e integrarse a archivos JSON persistentes (Importar/Exportar/Sincronizar).

### 2.2 Funciones del Sistema
*   Creación, lectura, actualización y eliminación de cotizaciones y reservas (CRUD).
*   Motor de cálculo dinámico de precios (cargos base, horas extras, excedente de pax, ajustes negociados/especiales, anticipos y saldo pendiente).
*   Generador automático de documentos (Tickets de confirmación y Reportes JSON).
*   Sincronización y validación de entidades estructuradas locales contra archivos estáticos.

---

## 3. Requisitos Específicos: Casos de Uso

A continuación se describen los Casos de Uso fundamentales del sistema, orientados a las entradas, los procesos lógicos y los documentos u outputs esperados.

### CU-01: Registro y Cálculo de Nueva Reserva
*   **Actor:** Agente de Ventas
*   **Entradas:**
    *   **Datos del cliente:** Nombre de contacto principal, nombre de pasajero, teléfono, origen de la venta.
    *   **Detalles operativos:** Tipo de tour, fecha, hora de salida, duración en horas, selección de menú de alimentos.
    *   **Pasajeros:** Cantidad de adultos, niños menores, infantes y excedentes.
    *   **Variables financieras:** Tarifa por hora, cargo por pasajero extra, título/monto de cargo adicional, ajuste global de precio (positivo o negativo), monto de anticipo (depósito), método de pago.
*   **Secuencia de Procesamiento:**
    1.  El sistema asigna un ID único y genera el **Folio** basado en las reglas de nomenclatura del vendedor y fechas.
    2.  El motor de precios totaliza los pasajeros. Si los pasajeros base superan el límite estructural (14 pax), calcula la penalización por pasajero extra.
    3.  Multiplica tarifa por hora base. Agrega costos extra, suma el ajuste de precio global (si existe) y deduce el anticipo.
    4.  Determina el balance restante.
*   **Output / Documento Esperado:** 
    *   Objeto transaccional guardado en el almacén de datos (Storage).
    *   **Recibo/Ticket de Confirmación:** Un documento formal con desglose financiero detallado, políticas de no-show, notas de ajuste y formato de impresión optimizado.

### CU-02: Emisión del Ticket/Voucher de Abordaje
*   **Actor:** Operador / Agente de Ventas
*   **Entradas:** Identificador (Folio o ID) de una reserva existente.
*   **Secuencia de Procesamiento:**
    1.  El sistema recupera la estructura completa de la reserva.
    2.  Procesa descripciones complejas, asignando el activo gráfico (Logo o Identificador SVG de Tour como *Snorkel*, *Sunset*) directamente vinculado al tipo de tour.
    3.  Genera en memoria la estructura del documento con reglas de presentación estandarizadas y desglose de matemáticas aplicadas.
*   **Output / Documento Esperado:**
    *   Documento de pre-prensa (diseño imprimible o PDF virtual) que incluye bloque de cabecera con folio, bloque de itinerario, desglose tabular de balance a pagar y bloque de políticas de cancelación/propinas.

### CU-03: Sincronización y Conciliación de BD Externa (JSON Sync)
*   **Actor:** Administrador del Sistema
*   **Entradas:** Documento plano (Archivo `.json`) subido al sistema.
*   **Secuencia de Procesamiento:**
    1.  El sistema carga los registros locales existentes.
    2.  Procesa el JSON analizando todas las tuplas contenidas.
    3.  Cruza la información usando ID y Folio como llaves primarias.
    4.  Clasifica los resultados en tres categorías: Existentes solo en local, Existentes solo en JSON, y Conflictos (existentes en ambos pero con sello de tiempo `updatedAt` diferente).
*   **Output / Documento Esperado:**
    *   **Reporte de Sincronización:** Documento de texto/log alertando de discrepancias tecnológicas.
    *   (Si se corrobora) Actualización del almacén de base de datos fusionando de forma segura los registros más recientes sin pérdida de cotizaciones manuales.

### CU-04: Modificación Operativa y Recálculo de Reserva
*   **Actor:** Agente de Ventas
*   **Entradas:** Folio existente y un cambio de parámetro (Ej: Incrementar pasajeros, añadir nota de ajuste, o reducir duración del chárter).
*   **Secuencia de Procesamiento:**
    1.  Adquiere el payload almacenado de la reserva.
    2.  Realiza nuevamente el ciclo completo del motor de cálculo de precios del CU-01.
    3.  Actualiza el marcador de tiempo del registro (`updatedAt`).
*   **Output / Documento Esperado:**
    *   Base de datos actualizada evitando duplicidad.
    *   Versión alterada del Ticket Operativo de Abordaje, reconfigurando las advertencias (por ejemplo, actualizando de "Anticipo 50%" a liquidado).

### CU-05: Eliminación Segura / Revocación
*   **Actor:** Agente de Ventas / Administrador
*   **Entradas:** Folio a revocar.
*   **Secuencia de Procesamiento:**
    1.  Proceso de confirmación de intención de barrido mediante alerta multi-paso.
    2.  Búsqueda de la llave del índice en el almacenamiento persistente y corte del registro del árbol de datos.
*   **Output / Documento Esperado:**
    *   Ningún documento impreso.
    *   Índice estructurado de base de datos expurgado y actualizado en la memoria (reducción en el conteo total de reservas).

### CU-06: Exportación para Back-up y Análisis
*   **Actor:** Administrador / Contabilidad
*   **Entradas:** Comando de vaciado global.
*   **Secuencia de Procesamiento:**
    1.  Verificación de integridad de toda la memoria y serialización de la base de objetos en cadena de texto estricta y analizable (JSON).
*   **Output / Documento Esperado:**
    *   Documento electrónico unificado (`loveshack_reservations.json`) preparado para su lectura en otros sistemas financieros o bases de estado externo.
