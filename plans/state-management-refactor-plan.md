# State Management Refactor Plan

## Problem Statement

The codebase currently uses direct DOM manipulation (`element.style.display = "flex"`) which:

- Doesn't allow CSS transitions/animations
- Is hard to maintain and debug
- Is not declarative
- Leads to abrupt UI changes

## Solution

Replace direct style manipulation with **opacity/visibility-based** state transitions that allow smooth CSS animations:

- `[data-state="visible"]` - element is fully visible and interactive
- `[data-state="hidden"]` - element is hidden (with fade transition)
- `[data-state="active"]` - element is active/interactive
- `[data-state="inactive"]` - element is inactive

## State Transition Strategy

Instead of `display: none/flex`, use:

```css
.element {
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition:
    opacity 0.3s ease,
    visibility 0.3s ease,
    transform 0.3s ease;
  pointer-events: none;
}

.element[data-state="visible"] {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}
```

This provides:

- Smooth fade-in/fade-out animations
- No clicking on hidden elements (pointer-events)
- Consistent transition timing
- Declarative state in HTML

## CSS Pattern for States

### Base State Classes (for elements that need transitions)

```css
/* Base class for state-managed elements */
.state-managed {
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition:
    opacity 0.25s ease,
    visibility 0.25s ease,
    transform 0.25s ease;
  pointer-events: none;
}

/* Visible state - smooth fade in */
.state-managed[data-state="visible"],
.state-managed[data-state="active"],
.state-managed[data-state="expanded"] {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

/* Hidden state - fade out */
.state-managed[data-state="hidden"],
.state-managed[data-state="inactive"],
.state-managed[data-state="collapsed"] {
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  pointer-events: none;
}

/* Block-level elements */
.state-managed[data-state="block"] {
  display: block !important;
}

.state-managed[data-state="flex"] {
  display: flex !important;
}
```

### Alternative: Utility Classes

```css
/* Fade transitions */
.fade-transition {
  transition:
    opacity 0.25s ease,
    visibility 0.25s ease;
}

/* Slide + fade transitions */
.slide-fade-transition {
  transition:
    opacity 0.25s ease,
    visibility 0.25s ease,
    transform 0.25s ease;
}
```

## Affected Elements & Their States

| Element ID           | Current Display | New State      | Transition Type |
| -------------------- | --------------- | -------------- | --------------- |
| `extraPassengersRow` | flex/none       | visible/hidden | slide-fade      |
| `extrasRow`          | flex/none       | visible/hidden | slide-fade      |
| `discountRow`        | flex/none       | visible/hidden | slide-fade      |
| `feeRow`             | flex/none       | visible/hidden | slide-fade      |
| `feeNotice`          | flex/none       | visible/hidden | fade            |
| `validationMessages` | block/none      | visible/hidden | fade            |
| `badge`              | flex/none       | visible/hidden | fade            |
| `indicator`          | flex/none       | visible/hidden | slide-fade      |

## Implementation Steps

### Step 1: Add CSS State Rules

Add to `pricing-calculator/css/styles.css`:

```css
/* State Management - Base Transitions */
.state-managed {
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition:
    opacity 0.25s ease,
    visibility 0.25s ease,
    transform 0.25s ease;
  pointer-events: none;
}

/* Visible states */
.state-managed[data-state="visible"],
.state-managed[data-state="active"],
.state-managed[data-state="expanded"] {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

/* Hidden states */
.state-managed[data-state="hidden"],
.state-managed[data-state="inactive"],
.state-managed[data-state="collapsed"] {
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  pointer-events: none;
}

/* Utility for flex/block display override when needed */
.state-managed[data-state="flex"] {
  display: flex !important;
}

.state-managed[data-state="block"] {
  display: block !important;
}
```

### Step 2: Add State Classes to HTML Elements

Add `class="state-managed"` to elements:

```html
<div
  class="pricing-row state-managed"
  data-state="hidden"
  id="extraPassengersRow"
></div>
```

### Step 3: Refactor JavaScript

Replace `.style.display` with `setAttribute("data-state", ...)`:

```javascript
// Before
elements.extraPassengersRow.style.display = "flex";

// After
elements.extraPassengersRow.setAttribute("data-state", "visible");
```

### Step 4: State Management Helper Functions (Optional)

Create clean helper functions:

```javascript
// State management utilities
const state = {
  visible: (el) => el.setAttribute("data-state", "visible"),
  hidden: (el) => el.setAttribute("data-state", "hidden"),
  active: (el) => el.setAttribute("data-state", "active"),
  inactive: (el) => el.setAttribute("data-state", "inactive"),
  expanded: (el) => el.setAttribute("data-state", "expanded"),
  collapsed: (el) => el.setAttribute("data-state", "collapsed"),
};

// Usage: state.visible(elements.extraPassengersRow);
```

## Files to Modify

1. [ ] `pricing-calculator/css/styles.css` - Add state-based CSS with transitions
2. [ ] `pricing-calculator/index.html` - Add `state-managed` class to elements
3. [ ] `pricing-calculator/js/app.js` - Replace style.display with setAttribute

## Benefits

1. **Smooth animations** - fade-in/fade-out effects
2. **Declarative** - state is explicit in the DOM
3. **Maintainable** - single source of truth for visibility
4. **Accessible** - hidden elements can't be clicked (pointer-events)
5. **Consistent** - uniform transition timing across all elements
6. **Debuggable** - easy to inspect current state in DevTools

## Example: Refactored Pricing Section

**Before:**

```javascript
if (basePricing.extraPassengers > 0) {
  elements.extraPassengersRow.style.display = "flex";
  elements.extraCount.textContent = basePricing.extraPassengers;
} else {
  elements.extraPassengersRow.style.display = "none";
}
```

**After:**

```javascript
if (basePricing.extraPassengers > 0) {
  elements.extraPassengersRow.setAttribute("data-state", "visible");
  elements.extraCount.textContent = basePricing.extraPassengers;
} else {
  elements.extraPassengersRow.setAttribute("data-state", "hidden");
}
```

**HTML:**

```html
<div class="pricing-row state-managed" id="extraPassengersRow"></div>
```

**CSS:**

```css
.pricing-row.state-managed {
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.25s ease;
  pointer-events: none;
}

.pricing-row.state-managed[data-state="visible"] {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}
```

## Next Steps

1. Review and approve this plan
2. Switch to Code mode for implementation
3. Add CSS rules
4. Update HTML elements
5. Refactor JavaScript
6. Test all transitions
