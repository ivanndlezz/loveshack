# Pricing Calculator Implementation Roadmap

## Current State Analysis

### New App (`pricing-calculator/index.html`)

- ✅ **Complete**: Picker UI for duration (2-8 hrs) and passengers (1-50)
- ✅ **Complete**: Pricing calculation with base rate ($600/hr) and GMB rate ($500/hr + 11.5% fee)
- ✅ **Complete**: iOS-style wheel picker with 3D effects
- ❌ **Missing**: Booking source selector (has simple GMB toggle only)
- ❌ **Missing**: Tour type selection
- ❌ **Missing**: Customer info layer
- ❌ **Missing**: Inquiry/quote management

### Old App (`ui-testing-examples/old-index.html`)

- ✅ **Complete**: Full customer info (name, email, phone, date)
- ✅ **Complete**: Tour type selection (Bay, Whale, Snorkel, Sunset, Fishing)
- ✅ **Complete**: Booking source selector with search
- ✅ **Complete**: Pricing type (Regular $600/hr, Snack $450/hr)
- ✅ **Complete**: Extras (fishing licenses, other extras)
- ✅ **Complete**: Reprice/discount section
- ✅ **Complete**: Inquiry manager (save/export/import quotes)
- ❌ **Outdated**: Design is older, not PWA-optimized

---

## Proposed Architecture (3 Layers)

```
┌─────────────────────────────────────────────────────┐
│              CUSTOMER INFO LAYER                    │
│  (Name, Email, Phone, Trip Date)                    │
├─────────────────────────────────────────────────────┤
│              TOUR TYPE & SPECS LAYER               │
│  (Tour Type, Pricing Type, Duration, Passengers)   │
├─────────────────────────────────────────────────────┤
│              PRICING LAYER                          │
│  (Base Rate, Source Fees, Extras, Discounts)      │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Replace GMB Toggle with Booking Source Selector

**Files to modify**: `pricing-calculator/index.html`

**Changes**:

1. Remove `.gmb-toggle` element
2. Add custom searchable select for booking sources
3. Update pricing rules in JavaScript to handle different source fees

**Booking Sources & Pricing Rules**:
| Source | Rate | Fee |
|--------|------|-----|
| Direct | $600/hr | None |
| Get My Boat | $500/hr | $50 fixed |
| Viator | $600/hr | 15% variable |
| Fareharbor | $600/hr | 12% variable |
| Travel Cabo Tours | $600/hr | 10% variable |
| Anchor Rides | $550/hr | $75 fixed |
| Others (agents) | $600/hr | Custom % |

---

### Phase 2: Add Tour Type Selection

**New UI Components**:

- Bottom sheet picker for tour type (Bay, Whale, Snorkel, Sunset, Fishing)
- Update pricing rules per tour type if needed

**Tour Type Configuration**:
| Tour Type | Default Rate | Notes |
|-----------|--------------|-------|
| Bay Trip | $600/hr | Standard rate |
| Whale Watching | $600/hr | May have seasonal rates |
| Snorkeling Tour | $600/hr | + equipment costs? |
| Sunset Cruise | $650/hr | Premium rate |
| Fishing | $700/hr | Higher rate + licenses |

---

### Phase 3: Add Customer Info Layer

**New UI Components**:

- Bottom sheet or expandable section for customer details
- Fields: Name, Email, Phone, Trip Date
- Inline validation

**Design Pattern**:

- Use existing bottom sheet pattern for form inputs
- Store in `tripData` object

---

### Phase 4: Integrate All Layers

**Updated State Management**:

```javascript
let tripData = {
  // Customer Info
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  tripDate: "",

  // Tour Specs
  tourType: "Bay Trip",
  pricingType: "regular", // or "snack"

  // Booking
  source: "direct",

  // Inputs (existing)
  duration: 2,
  passengers: 14,

  // Extras
  fishingLicenses: 0,
  extrasAmount: 0,

  // Discount
  repriceType: "", // or "%" or "dollar"
  repriceDiscount: 0,
};
```

---

## Files to Modify

1. **`pricing-calculator/index.html`**
   - Add booking source selector
   - Add tour type picker
   - Add customer info form
   - Update pricing display for all new fields

2. **`pricing-calculator/js/app.js`** (or inline script)
   - Update `calculatePrice()` to handle all source types
   - Add tour type pricing rules
   - Add customer validation

---

## Next Steps

Would you like me to proceed with Phase 1 (implementing the booking source selector)?
