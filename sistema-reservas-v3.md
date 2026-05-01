# Prompt / Especificación para Lovable: Love Shack Cruises Reserva App (v3)

**Descripción del Proyecto:**
Quiero desarrollar la versión "v3" de nuestro sistema local de reservas marítimas y cotizaciones (Love Shack Cruises).

## 1. Paradigma y Visión UI/UX

- **Mobile-First / iOS App Vibe:** El diseño, flujo y arquitectura deben sentirse como una aplicación nativa de iOS moderno implementada con tecnologías web.
- **Soberanía de Datos / Local-First:** Funciona de forma desconectada. Toda la persistencia es manejada en el navegador vía `localStorage` usando archivos e índices JSON.
- **Fricción Cero:** Diseñado para la operación del día a día, minimizando la carga cognitiva de los agentes de venta.

## 2. Pila Tecnológica y Calidad del Código

- **Tecnologías Core:** HTML5, CSS3, Vanilla JS (o React/Vite si es necesario por tu motor, pero prevaleciendo componentes limpios), JSON, SVG.
- **Diseño del CSS:** Orientado al uso intensivo de CSS Variables (Custom Properties), modular, escalable, mantenible, enfocado en el principio DRY (Don't Repeat Yourself).
- **Entregable:** Todo el desarrollo debe estar encapsulado y autónomo dentro de una nueva carpeta llamada `/v3`. No se debe mutar o romper ninguna funcionalidad de versiones previas fuera de este directorio.

## 3. Arquitectura y Layout Base

La aplicación funcionará como una Single Page Application (SPA) con ruteo manejado internamente (Hidratación de pantallas).
El Layout base general deberá tener la siguiente estructura semántica aproximada:

```html
<body>
  <header><!-- Barra superior con título y acciones globales --></header>
  <main>
    <div id="app" data-behavior="hydrate-screens">
      <!-- Las pantallas y vistas dinámicas se renderizan/hidratan aquí -->
    </div>
  </main>
  <nav id="bottom-nav">
    <!-- Navegación estilo app nativa inferior -->
    <!-- Debe ser tambien de hidratacion dinamica, de manera que el menu cambia segun las necesidades -->
    <!-- Floating Action Button (FAB) insertado estratégicamente aquí o anclado al body -->
  </nav>
  <footer></footer>
</body>
```

## 4. Funcionalidad Core: Nueva Cotización (Floating Action Button)

- Existirá un **Botón Flotante (FAB)** en la parte inferior derecha.
- Al presionarlo, se hidrata dinámicamente en `#app` la pantalla del "Estimador de Precios".
- **Auto-Guardado Inicial:** Al instante de iniciar el flujo, se debe generar un `UUID` y guadar una sesión json vacía en `localStorage` (Ej. Estado: "Borrador").
- **Historial Persistente:** Si la app se cierra a la mitad, la cotización debe aparecer en el listado de historiales para retomarse posteriormente con todos sus valores intactos.

## 5. El Flujo de Cotización (3 Etapas - Pipeline UI)

Debes sugerir e implementar la mejor interfaz para un flujo progresivo (Ej: Tabs de navegación progresiva tipo _Stepper_, u hojas/vistas que hacen un _slide-in_). El flujo es:

- **Paso 1: Estimación Rápida.** (Inspirado en la calculadora de precios).
  - Selección de duración del viaje (horas).
  - Suma de pasajeros (Adultos, menores).
  - Resultado automático mostrado en pantalla.
  - _Acción:_ Guarda el estado en `localStorage` pero permite cerrar la app aquí sabiendo que el precio estimado ya se calculó.
- **Paso 2: Detalles Operativos del Viaje.**
  - Input de Fecha de la posible expedición.
  - Input de Horario de Salida y de Retorno.
  - Inputs de datos de contacto del Cliente.
- **Paso 3: Cierre y Ajustes (Booking Source).**
  - Seleccionar origen de la reserva (Ej: Direct, Get My Boat, Viator) el cual impactará comisiones.
  - Ajustes de precio manual (descuentos o recargos).
  - Añadir Extras (licencias de pesca, menú adicional).
  - _Acción Final:_ Convertir estado de "Borrador" a "Reserva" e inyectarla en el Panel/Dashboard principal de Reservas.

## 6. Estructura de Datos (Ejemplo JSON en Local Storage)

La persistencia debe seguir un esquema como este para cada registro:

```json
{
  "id": "uuid-v4",
  "status": "draft",
  "createdAt": "2026-04-22T10:00:00Z",
  "updatedAt": "2026-04-22T10:05:00Z",
  "data": {
    "step1_pricing": {
      "durationHours": 4,
      "paxBase": 14,
      "paxExtra": 5,
      "estimatedBasePrice": 2900
    },
    "step2_details": {
      "tripDate": "2026-05-15",
      "startTime": "10:00",
      "endTime": "14:00",
      "customerName": "John Doe",
      "customerPhone": "+1 555 1234"
    },
    "step3_adjustments": {
      "bookingSource": "get-my-boat",
      "manualDiscount": 0,
      "extrasFee": 110,
      "finalTotalPrice": 3010
    }
  }
}
```

_Por favor: Genera esta aplicación con la mejor calidad visual, animaciones fluidas CSS y modularidad posible._
