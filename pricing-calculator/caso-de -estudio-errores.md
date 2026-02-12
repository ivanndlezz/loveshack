# Caso de Estudio: Debugging del Input de Teclado

## Resumen del Problema

El usuario no podía escribir números directamente en el input del picker. Los eventos de teclado llegaban (`keydown` se disparaba), pero el valor del input no cambiaba.

## Análisis Comparativo

### [`people-and-time-example.html`](pricing-calculator/people-and-time-example.html) (Con Errores)

**Problema 1: Event Listener Redundante en input-trigger**

```javascript
// ❌ DUPLICADO: onclick inline + event listener separado
<div class="input-trigger" id="inputTrigger"></div>
```

```javascript
const inputTrigger = document.getElementById("inputTrigger");
inputTrigger.addEventListener("click", () => {
  durationInput.focus();
});
```

**Problema 2: Listener de input que limpiaba el valor**

```javascript
// ❌ Este listener podía causar conflictos
durationInput.addEventListener("input", (e) => {
  durationInput.value = durationInput.value.replace(/\D/g, "");
});
```

### [`people-and-time-corrected.html`](pricing-calculator/people-and-time-corrected.html) (Corregido)

**Solución: Enfoque Simple y Nativo**

```html
<!-- ✅ onclick inline funciona correctamente -->
<div class="input-trigger" onclick="durationInput.focus()"></div>
<input type="number" class="manual-input" id="durationInput" />
```

```javascript
// ✅ Solo el evento nativo de type="number"
durationInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") durationInput.blur();
});
```

## Por Qué Fallé

1. **Complejidad Excesiva**: Agregué más código (event listeners separados, logs de debug, validación manual) cuando la solución era más simple.

2. **No Identifiqué el Root Cause**: Los logs de `keydown` mostraban que el valor era "2" antes del cambio, pero no investigué por qué el valor se mantenía estático. El problema era que el `input-trigger` con event listener separado de alguna manera interfería con el focus del input.

3. **No Comparé con la Versión Funcional**: Tenía [`just-time.html`](pricing-calculator/just-time.html) que funcionaba perfectamente, pero no identifiqué las diferencias clave.

## Lecciones Aprendidas

1. **KISS (Keep It Simple, Stupid)**: A veces la solución más simple es la correcta. El `onclick="durationInput.focus()"` inline funciona mejor que un event listener separado.

2. **Confiar en el Navegador**: El `type="number"` nativo funciona correctamente si no hay interferencia de otros elementos.

3. **Comparar con Versiones Funcionales**: Cuando tienes un archivo que funciona (`just-time.html`), compáralo directamente con el que no funciona para identificar diferencias.

4. **Evitar Over-engineering**: No agregar validación manual de input si el tipo nativo (`type="number"`) ya funciona.

## Solución Final

Usar `onclick="durationInput.focus()"` inline en el `input-trigger` y confiar en el comportamiento nativo de `type="number"`.

## El Error Exacto

En [`people-and-time-example.html`](pricing-calculator/people-and-time-example.html:458-462) había:

```javascript
const inputTrigger = document.getElementById("inputTrigger");

inputTrigger.addEventListener("click", () => {
  durationInput.focus();
});
```

**Esto causaba un conflicto** con el comportamiento nativo del focus. Cuando el input tenía `pointer-events: none` y luego pasaba a `pointer-events: auto`, el event listener del `inputTrigger` de alguna manera bloqueaba que los eventos de teclado llegaran al input.

## La Solución

En [`people-and-time-corrected.html`](pricing-calculator/people-and-time-corrected.html:348) simplemente se usa:

```html
<div class="input-trigger" onclick="durationInput.focus()"></div>
```

**Sin JavaScript separado para el inputTrigger**. El onclick inline funciona correctamente porque se ejecuta en el contexto nativo del navegador sin intermediarios.
