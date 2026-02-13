# Animation Performance Optimization Plan

## Current Issues Identified

### 1. Bottom Sheet Animations

- **Current**: `transition: all 0.25s ease` - too slow
- **Issues**:
  - `backdrop-filter: blur(4px)` on overlay is computationally expensive
  - `ease` timing function feels sluggish for touch interactions
  - 250ms duration is too long for mobile responsiveness

### 2. Wheel 3D Picker Animations

- **Current**: `transition: opacity 0.25s ease` per wheel item
- **Issues**:
  - `filter: blur(3px)` on wheel items causes repaints on every frame
  - Multiple simultaneous transitions (opacity, font-size, color)
  - 3D `rotateX` + `translateZ` transforms are GPU-intensive
  - Too many wheel items animating simultaneously

### 3. Toggle Switch

- **Current**: `transition: background 0.3s, transform 0.3s`
- **Issues**: 300ms is too slow for instant feedback

### 4. Custom Select Dropdown

- **Current**: `@keyframes slideUp 0.2s` + `display: none/block`
- **Issues**: `display` property breaks CSS transitions

---

## Optimization Plan

### Phase 1: Timing & Easing Improvements

#### Bottom Sheet

```css
/* Before */
.bottom-sheet {
  transition: all 0.25s ease;
}

/* After */
.bottom-sheet {
  transition:
    transform 0.18s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.18s ease-out;
}
```

#### Wheel Items

```css
/* Before */
.wheel-item {
  transition:
    opacity 0.2s ease,
    font-size 0.2s ease,
    color 0.2s ease;
}

/* After */
.wheel-item {
  transition:
    opacity 0.12s ease-out,
    font-size 0.12s ease-out;
  /* Remove color transition - instant change */
}
```

#### Toggle Switch

```css
/* Before */
.toggle-switch {
  transition: background 0.3s;
}
.toggle-switch::after {
  transition: transform 0.3s;
}

/* After */
.toggle-switch {
  transition: background 0.2s ease-out;
}
.toggle-switch::after {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

### Phase 2: Remove Expensive CSS Properties

#### Remove Backdrop Filter

```css
/* Before */
.sheet-overlay {
  backdrop-filter: blur(4px);
}

/* After - use simple opacity instead */
.sheet-overlay {
  /* Remove backdrop-filter entirely */
  background: rgba(0, 0, 0, 0.4); /* Darker background compensates */
}
```

#### Reduce/Remove Filter Blur on Wheel

```css
/* Before */
.wheel-item {
  filter: blur(3px);
}

/* After - use opacity gradients instead */
.wheel-item {
  filter: none; /* or blur(1px) at most */
}
```

---

### Phase 3: Optimize Transition Properties

#### Use `will-change` for GPU Acceleration

```css
.bottom-sheet {
  will-change: transform;
}

.wheel-item {
  will-change: opacity, transform;
}
```

#### Limit Transition Scope

```css
/* Before */
transition: all 0.25s ease;

/* After - only animate what changes */
transition:
  transform 0.18s cubic-bezier(0.32, 0.72, 0, 1),
  opacity 0.15s ease-out;
```

---

### Phase 4: Animation Timing Reference

| Component              | Current Duration | Recommended Duration | Timing Function                     |
| ---------------------- | ---------------- | -------------------- | ----------------------------------- |
| Bottom Sheet Open      | 250ms            | 180ms                | `cubic-bezier(0.32, 0.72, 0, 1)`    |
| Bottom Sheet Close     | 250ms            | 150ms                | `cubic-bezier(0.32, 0.72, 0, 1)`    |
| Wheel Item Active      | 200ms            | 120ms                | `ease-out`                          |
| Toggle Switch          | 300ms            | 200ms                | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Select Dropdown        | 200ms            | 150ms                | `ease-out`                          |
| Pricing Display Expand | 200ms            | 150ms                | `ease-out`                          |

---

## Implementation Order

1. **Quick Wins** (Phase 1): Reduce durations and improve easing - provides immediate perceived improvement
2. **Performance Fixes** (Phase 2): Remove expensive CSS properties - improves frame rates
3. **Optimization** (Phase 3): Add GPU hints and limit transitions - final polish

---

## Files to Modify

1. `pricing-calculator/index.html` - Contains most inline CSS for animations:
   - Lines ~199-222: `.bottom-sheet` and `.sheet-overlay`
   - Lines ~366-389: `.wheel-3d` and `.wheel-item`
   - Lines ~516-558: `.toggle-switch`
   - Lines ~602-650: Wheel item transitions and filters

---

## Testing Checklist

- [ ] Bottom sheet opens/closes feels snappy
- [ ] Wheel scrolling responds instantly to touch
- [ ] No dropped frames during animations
- [ ] Toggle switch provides immediate feedback
- [ ] Animations feel consistent across iOS and Android
