# Pricing Calculator Architecture

## Overview

A comprehensive reservation pricing calculator with Apple-style UI, supporting multiple booking sources, reprice types, and extra services.

---

## 1. JSON Data Schemas

### Reservation Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "createdTime": { "type": "string", "format": "date-time" },
    "listName": { "type": "string" },
    "client": { "type": "object", "$ref": "#/definitions/Client" },
    "tour": { "type": "object", "$ref": "#/definitions/Tour" },
    "agent": { "type": "object", "$ref": "#/definitions/Agent" },
    "source": { "type": "object", "$ref": "#/definitions/Source" },
    "trip": { "type": "object", "$ref": "#/definitions/Trip" },
    "pricing": { "type": "object", "$ref": "#/definitions/Pricing" },
    "status": {
      "type": "string",
      "enum": ["reservado", "completado", "cancelado", "tentativo"]
    }
  },
  "definitions": {
    "Client": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "email": { "type": "string", "format": "email" },
        "phone": { "type": "string" }
      },
      "required": ["id", "name"]
    },
    "Tour": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "type": {
          "type": "string",
          "enum": [
            "Bay Trip",
            "Whale Watching",
            "Snorkeling Tour",
            "Sunset Cruise",
            "Fishing"
          ]
        },
        "name": { "type": "string" }
      },
      "required": ["id", "type"]
    },
    "Source": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "hourlyRate": { "type": "number" },
        "hasFee": { "type": "boolean" },
        "feePercentage": { "type": "number" }
      },
      "required": ["id", "name"]
    },
    "Trip": {
      "type": "object",
      "properties": {
        "date": { "type": "string", "format": "date" },
        "startTime": { "type": "string" },
        "endTime": { "type": "string" },
        "duration": { "type": "number", "minimum": 2, "maximum": 8 },
        "adults": { "type": "number", "minimum": 1, "maximum": 50 },
        "extras": { "type": "number", "minimum": 0 }
      },
      "required": ["duration", "adults"]
    },
    "Pricing": {
      "type": "object",
      "properties": {
        "basePrice": { "type": "number" },
        "extraPassengersCharge": { "type": "number" },
        "extrasAmount": { "type": "number" },
        "subTotal": { "type": "number" },
        "repriceType": { "type": "string", "enum": ["%", "#", "$", "coupon"] },
        "repriceDiscount": { "type": "number" },
        "finalPrice": { "type": "number" },
        "fee": { "type": "number" },
        "totalCharged": { "type": "number" }
      }
    }
  }
}
```

### Pricing Rules Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "baseHourlyRate": { "type": "number", "const": 600 },
    "minDuration": { "type": "number", "const": 2 },
    "maxDuration": { "type": "number", "const": 8 },
    "maxPassengers": { "type": "number", "const": 50 },
    "includedPassengers": { "type": "number", "const": 14 },
    "extraPassengerRate": { "type": "number", "const": 100 },
    "fishingLicenseRate": { "type": "number", "const": 22 },
    "sources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "hourlyRate": { "type": "number" },
          "hasFee": { "type": "boolean" },
          "feePercentage": { "type": "number" }
        }
      }
    },
    "repriceTypes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "code": { "type": "string" },
          "name": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    }
  }
}
```

### Sources Configuration JSON

```json
{
  "sources": [
    {
      "id": "direct",
      "name": "📞 Direct - Call",
      "hourlyRate": 600,
      "hasFee": false,
      "feePercentage": 0
    },
    {
      "id": "get-my-boat",
      "name": "Get My Boat",
      "hourlyRate": 500,
      "hasFee": true,
      "feePercentage": 0.115
    },
    {
      "id": "viator",
      "name": "Viator",
      "hourlyRate": 600,
      "hasFee": true,
      "feePercentage": 0.15
    },
    {
      "id": "fareharbor",
      "name": "🚦Fareharbor",
      "hourlyRate": 600,
      "hasFee": true,
      "feePercentage": 0.12
    },
    {
      "id": "anchor-rides",
      "name": "Anchor Rides",
      "hourlyRate": 600,
      "hasFee": false,
      "feePercentage": 0
    },
    {
      "id": "travel-cabo-tours",
      "name": "Travel Cabo Tours",
      "hourlyRate": 600,
      "hasFee": true,
      "feePercentage": 0.1
    },
    {
      "id": "andr",
      "name": "Andres Lopez",
      "hourlyRate": 600,
      "hasFee": false,
      "feePercentage": 0
    },
    {
      "id": "mauricio-bojorquez",
      "name": "Mauricion Bojorquez",
      "hourlyRate": 600,
      "hasFee": false,
      "feePercentage": 0
    },
    {
      "id": "jose-ferron",
      "name": "Jose Ferron",
      "hourlyRate": 600,
      "hasFee": false,
      "feePercentage": 0
    },
    {
      "id": "ramiro-munguia",
      "name": "Ramiro Munguia",
      "hourlyRate": 600,
      "hasFee": false,
      "feePercentage": 0
    },
    {
      "id": "adriana-transcabo",
      "name": "Adriana Transcabo",
      "hourlyRate": 600,
      "hasFee": false,
      "feePercentage": 0
    },
    {
      "id": "grand-solmar",
      "name": "Grand Solmar - Luis Roberts",
      "hourlyRate": 600,
      "hasFee": false,
      "feePercentage": 0
    },
    {
      "id": "eduardo-araujo",
      "name": "Eduardo Araujo",
      "hourlyRate": 600,
      "hasFee": false,
      "feePercentage": 0
    }
  ]
}
```

---

## 2. JavaScript Calculation Functions

### Core Pricing Calculator

```javascript
/**
 * Pricing Calculator Module
 * Handles all reservation pricing calculations including:
 * - Base pricing based on duration and source
 * - Extra passenger charges
 * - Extra services (fishing licenses, etc.)
 * - Reprice discounts (%, #, $, coupon)
 * - Source fees (Get My Boat, Viator, etc.)
 */

const PricingCalculator = {
  // Constants
  CONSTANTS: {
    BASE_HOURLY_RATE: 600,
    MIN_DURATION: 2,
    MAX_DURATION: 8,
    MAX_PASSENGERS: 50,
    INCLUDED_PASSENGERS: 14,
    EXTRA_PASSENGER_RATE: 100,
    FISHING_LICENSE_RATE: 22,
  },

  // Default sources configuration
  SOURCES: {
    direct: { hourlyRate: 600, hasFee: false, feePercentage: 0 },
    "get-my-boat": { hourlyRate: 500, hasFee: true, feePercentage: 0.115 },
    viator: { hourlyRate: 600, hasFee: true, feePercentage: 0.15 },
    fareharbor: { hourlyRate: 600, hasFee: true, feePercentage: 0.12 },
    "travel-cabo-tours": { hourlyRate: 600, hasFee: true, feePercentage: 0.1 },
    // Other sources default to base rate with no fee
    default: { hourlyRate: 600, hasFee: false, feePercentage: 0 },
  },

  /**
   * Calculate base price for the trip
   * @param {Object} trip - Trip details
   * @param {string} sourceId - Booking source ID
   * @returns {Object} Base price breakdown
   */
  calculateBasePrice(trip, sourceId = "default") {
    const source = this.SOURCES[sourceId] || this.SOURCES["default"];
    const duration = Math.max(trip.duration, this.CONSTANTS.MIN_DURATION);
    const passengers = Math.min(trip.adults, this.CONSTANTS.MAX_PASSENGERS);

    // Base trip cost (hours × hourly rate)
    const baseTripCost = duration * source.hourlyRate;

    // Extra passengers beyond included
    const extraPassengers = Math.max(
      0,
      passengers - this.CONSTANTS.INCLUDED_PASSENGERS,
    );
    const extraPassengerCharge =
      extraPassengers * this.CONSTANTS.EXTRA_PASSENGER_RATE;

    return {
      baseTripCost,
      hourlyRate: source.hourlyRate,
      duration,
      passengers,
      extraPassengers,
      extraPassengerCharge,
      subtotal: baseTripCost + extraPassengerCharge,
    };
  },

  /**
   * Calculate extra services cost
   * @param {Object} extras - Extra services
   * @param {string} tourType - Type of tour
   * @returns {Object} Extra services breakdown
   */
  calculateExtras(extras, tourType = null) {
    const breakdown = {
      fishingLicenses: 0,
      otherExtras: 0,
      total: 0,
    };

    if (!extras) return breakdown;

    // Fishing licenses
    if (extras.fishingLicenses && tourType === "Fishing") {
      breakdown.fishingLicenses =
        extras.fishingLicenses * this.CONSTANTS.FISHING_LICENSE_RATE;
    }

    // Other extras amount from input
    if (extras.amount) {
      breakdown.otherExtras = parseFloat(extras.amount) || 0;
    }

    breakdown.total = breakdown.fishingLicenses + breakdown.otherExtras;
    return breakdown;
  },

  /**
   * Apply reprice discount to subtotal
   * @param {number} subtotal - Base subtotal
   * @param {string} repriceType - Type of reprice (%, #, $, coupon)
   * @param {number} repriceDiscount - Discount value
   * @returns {Object} Reprice breakdown
   */
  applyReprice(subtotal, repriceType, repriceDiscount) {
    const breakdown = {
      originalSubtotal: subtotal,
      repriceType,
      repriceDiscount,
      discountedAmount: 0,
      finalPrice: subtotal,
    };

    if (!repriceType || !repriceDiscount) {
      breakdown.finalPrice = subtotal;
      return breakdown;
    }

    switch (repriceType) {
      case "%":
        // Percentage discount
        breakdown.discountedAmount = subtotal * (repriceDiscount / 100);
        breakdown.finalPrice = subtotal - breakdown.discountedAmount;
        break;

      case "#":
        // Fixed amount discount
        breakdown.discountedAmount = Math.min(repriceDiscount, subtotal);
        breakdown.finalPrice = subtotal - breakdown.discountedAmount;
        break;

      case "$":
        // Fixed final price (override)
        breakdown.finalPrice = repriceDiscount;
        break;

      case "coupon":
        // Coupon price (same as $)
        breakdown.finalPrice = repriceDiscount;
        break;

      default:
        breakdown.finalPrice = subtotal;
    }

    return breakdown;
  },

  /**
   * Calculate source fee (Get My Boat, Viator, etc.)
   * @param {number} finalPrice - Final business price
   * @param {string} sourceId - Booking source ID
   * @returns {Object} Fee breakdown
   */
  calculateSourceFee(finalPrice, sourceId = "default") {
    const source = this.SOURCES[sourceId] || this.SOURCES["default"];
    const breakdown = {
      sourceId,
      hasFee: source.hasFee,
      feePercentage: source.feePercentage,
      feeAmount: 0,
      totalCharged: finalPrice,
    };

    if (source.hasFee) {
      // Fee is included in customer price, so business receives less
      // customer pays = business_price / (1 - fee_percentage)
      breakdown.totalCharged = finalPrice / (1 - source.feePercentage);
      breakdown.feeAmount = breakdown.totalCharged - finalPrice;
    }

    return breakdown;
  },

  /**
   * Main calculation function - combines all steps
   * @param {Object} reservation - Full reservation data
   * @returns {Object} Complete pricing breakdown
   */
  calculate(reservation) {
    const { trip, source, extras, reprice } = reservation;

    // Step 1: Calculate base price
    const basePricing = this.calculateBasePrice(trip, source);

    // Step 2: Calculate extras
    const extrasPricing = this.calculateExtras(extras, trip.tourType);

    // Step 3: Calculate subtotal
    const subtotal = basePricing.subtotal + extrasPricing.total;

    // Step 4: Apply reprice
    const repriceResult = this.applyReprice(
      subtotal,
      reprice?.type,
      reprice?.discount,
    );

    // Step 5: Calculate source fee
    const feeResult = this.calculateSourceFee(repriceResult.finalPrice, source);

    // Return complete breakdown
    return {
      basePricing,
      extrasPricing,
      subtotal,
      reprice: repriceResult,
      fee: feeResult,
      summary: {
        basePrice: basePricing.subtotal,
        extras: extrasPricing.total,
        subtotal,
        discount: repriceResult.discountedAmount,
        businessPrice: repriceResult.finalPrice,
        fee: feeResult.feeAmount,
        customerPrice: feeResult.totalCharged,
      },
    };
  },

  /**
   * Format price as currency
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Validate reservation data
   * @param {Object} reservation - Reservation to validate
   * @returns {Object} Validation result with errors array
   */
  validate(reservation) {
    const errors = [];

    if (!reservation.trip) {
      errors.push("Trip information is required");
    } else {
      if (!reservation.trip.duration || reservation.trip.duration < 2) {
        errors.push("Duration must be at least 2 hours");
      }
      if (!reservation.trip.adults || reservation.trip.adults < 1) {
        errors.push("At least 1 adult is required");
      }
      if (reservation.trip.adults > 50) {
        errors.push("Maximum 50 passengers allowed");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Export for different environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = PricingCalculator;
}
```

---

## 3. Apple-Style Form UI Design

### Design Principles

- **Minimalist**: Clean whitespace, subtle shadows
- **Typography**: San Francisco font (system-ui), clear hierarchy
- **Colors**: Neutral grays, accent blue (#007AFF)
- **Interactions**: Smooth transitions, micro-animations
- **Feedback**: Real-time updates, clear pricing breakdown

### HTML Structure

```html
<!-- Main Container -->
<div class="calculator-container">
  <!-- Header -->
  <header class="calculator-header">
    <h1>Reservation Pricing</h1>
    <p class="subtitle">Calculate final prices with sources and discounts</p>
  </header>

  <!-- Form Card -->
  <div class="form-card">
    <!-- Trip Details Section -->
    <section class="form-section">
      <h2 class="section-title">
        <span class="icon">🚢</span>
        Trip Details
      </h2>

      <div class="form-grid">
        <div class="form-group">
          <label>Tour Type</label>
          <select id="tourType" class="form-select">
            <option value="">Select tour...</option>
            <option value="Bay Trip">Bay Trip</option>
            <option value="Whale Watching">Whale Watching</option>
            <option value="Snorkeling Tour">Snorkeling Tour</option>
            <option value="Sunset Cruise">Sunset Cruise</option>
            <option value="Fishing">Fishing</option>
          </select>
        </div>

        <div class="form-group">
          <label>Duration (hours)</label>
          <input
            type="number"
            id="duration"
            min="2"
            max="8"
            value="3"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>Passengers</label>
          <input
            type="number"
            id="passengers"
            min="1"
            max="50"
            value="14"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>Booking Source</label>
          <select id="source" class="form-select">
            <option value="direct">📞 Direct - Call</option>
            <option value="get-my-boat">Get My Boat</option>
            <option value="viator">Viator</option>
            <option value="fareharbor">🚦Fareharbor</option>
            <option value="travel-cabo-tours">Travel Cabo Tours</option>
            <option value="default">Other Source</option>
          </select>
        </div>
      </div>
    </section>

    <!-- Extras Section -->
    <section class="form-section">
      <h2 class="section-title">
        <span class="icon">✨</span>
        Extra Services
      </h2>

      <div class="form-grid">
        <div class="form-group">
          <label>Fishing Licenses</label>
          <input
            type="number"
            id="fishingLicenses"
            min="0"
            value="0"
            class="form-input"
          />
          <span class="form-hint">$22 each (Fishing tours only)</span>
        </div>

        <div class="form-group full-width">
          <label>Other Extras Amount</label>
          <div class="input-with-prefix">
            <span class="prefix">$</span>
            <input
              type="number"
              id="extrasAmount"
              min="0"
              step="0.01"
              value="0"
              class="form-input"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Reprice Section -->
    <section class="form-section">
      <h2 class="section-title">
        <span class="icon">🏷️</span>
        Reprice / Discount
      </h2>

      <div class="form-grid">
        <div class="form-group">
          <label>Reprice Type</label>
          <select id="repriceType" class="form-select">
            <option value="">None</option>
            <option value="%">% Percentage</option>
            <option value="#"># Fixed Amount</option>
            <option value="$">$ Fixed Price</option>
            <option value="coupon">Coupon</option>
          </select>
        </div>

        <div class="form-group">
          <label>Discount Value</label>
          <div class="input-with-prefix">
            <span class="prefix" id="discountPrefix">%</span>
            <input
              type="number"
              id="repriceDiscount"
              min="0"
              step="0.01"
              value=""
              class="form-input"
            />
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- Pricing Summary Card -->
  <div class="summary-card">
    <h2 class="summary-title">Pricing Summary</h2>

    <div class="summary-breakdown">
      <div class="summary-row">
        <span
          >Base Trip (<span id="summaryDuration">3</span>h ×
          <span id="summaryRate">$600</span>)</span
        >
        <span id="baseTripPrice">$1,800</span>
      </div>

      <div class="summary-row" id="extraPassengersRow">
        <span>Extra Passengers (<span id="extraCount">0</span>)</span>
        <span id="extraPassengerPrice">$0</span>
      </div>

      <div class="summary-row" id="extrasRow">
        <span>Extra Services</span>
        <span id="extrasPrice">$0</span>
      </div>

      <div class="summary-divider"></div>

      <div class="summary-row subtotal">
        <span>Subtotal</span>
        <span id="subtotalPrice">$1,800</span>
      </div>

      <div class="summary-row discount" id="discountRow" style="display: none;">
        <span>Discount (<span id="discountType">%</span>)</span>
        <span id="discountAmount">-$0</span>
      </div>

      <div class="summary-divider"></div>

      <div class="summary-row final">
        <span>Business Receives</span>
        <span id="businessPrice">$1,800</span>
      </div>

      <div class="summary-row fee" id="feeRow" style="display: none;">
        <span><span id="feeSource">Source</span> Fee</span>
        <span id="feeAmount">$0</span>
      </div>

      <div class="summary-row total">
        <span>Customer Pays</span>
        <span id="customerPrice">$1,800</span>
      </div>
    </div>

    <!-- Fee Notice for Sources with Fees -->
    <div class="fee-notice" id="feeNotice" style="display: none;">
      <span class="notice-icon">ℹ️</span>
      <span id="feeNoticeText">Get My Boat charges 11.5% fee</span>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="action-buttons">
    <button class="btn btn-secondary" id="resetBtn">Reset</button>
    <button class="btn btn-primary" id="copyBtn">Copy Summary</button>
  </div>
</div>
```

### CSS Styles (Apple Design)

```css
/* CSS Variables */
:root {
  --system-font:
    -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue",
    sans-serif;
  --primary-color: #007aff;
  --primary-hover: #0056cc;
  --background: #f5f5f7;
  --card-bg: #ffffff;
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --border-color: #d2d2d7;
  --success-color: #34c759;
  --warning-color: #ff9500;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.1);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --transition: all 0.2s ease;
}

/* Main Container */
.calculator-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: var(--system-font);
  background: var(--background);
  min-height: 100vh;
}

/* Header */
.calculator-header {
  text-align: center;
  margin-bottom: 32px;
}

.calculator-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.calculator-header .subtitle {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

/* Cards */
.form-card,
.summary-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 24px;
  margin-bottom: 20px;
}

/* Form Sections */
.form-section {
  margin-bottom: 28px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
}

.section-title .icon {
  font-size: 16px;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: span 2;
}

/* Form Elements */
.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.form-input,
.form-select {
  height: 44px;
  padding: 0 14px;
  font-size: 16px;
  font-family: var(--system-font);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  color: var(--text-primary);
  transition: var(--transition);
  appearance: none;
  -webkit-appearance: none;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}

.form-hint {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Input with Prefix */
.input-with-prefix {
  display: flex;
  align-items: center;
}

.input-with-prefix .prefix {
  padding: 0 12px;
  font-size: 16px;
  color: var(--text-secondary);
  background: #f5f5f7;
  border: 1px solid var(--border-color);
  border-right: none;
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  height: 44px;
  display: flex;
  align-items: center;
}

.input-with-prefix .form-input {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

/* Summary Card */
.summary-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
}

.summary-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: var(--text-primary);
}

.summary-row span:first-child {
  color: var(--text-secondary);
}

.summary-row.subtotal {
  font-weight: 500;
}

.summary-row.final {
  font-weight: 600;
  font-size: 17px;
}

.summary-row.total {
  font-weight: 700;
  font-size: 20px;
  color: var(--primary-color);
}

.summary-row.discount {
  color: var(--success-color);
}

.summary-row.fee {
  color: var(--warning-color);
  font-size: 14px;
}

.summary-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}

/* Fee Notice */
.fee-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: #fff8e1;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: #b25d00;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  flex: 1;
  height: 50px;
  font-size: 17px;
  font-weight: 500;
  font-family: var(--system-font);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--card-bg);
  color: var(--primary-color);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: #f5f5f7;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-card,
.summary-card {
  animation: fadeIn 0.3s ease;
}

/* Responsive */
@media (max-width: 480px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full-width {
    grid-column: span 1;
  }

  .action-buttons {
    flex-direction: column-reverse;
  }
}
```

---

## 4. Implementation Plan

### Files Structure

```
pricing-calculator/
├── index.html          # Main HTML structure
├── styles.css          # Apple-style CSS
├── calculator.js       # PricingCalculator class
├── app.js              # UI interactions & real-time updates
└── schemas/
    ├── reservation.json    # Reservation schema
    └── pricing-rules.json  # Pricing rules configuration
```

### Implementation Steps

1. Create `reservation.json` schema
2. Create `pricing-rules.json` configuration
3. Build `PricingCalculator` class with all methods
4. Create HTML form structure
5. Apply Apple-style CSS
6. Add JavaScript for real-time calculations
7. Implement copy-to-clipboard functionality
8. Test with sample reservations

---

## 5. Usage Examples

### Basic Calculation

```javascript
const reservation = {
  trip: { duration: 3, adults: 23, tourType: "Bay Trip" },
  source: "get-my-boat",
  extras: { fishingLicenses: 0, amount: 0 },
  reprice: { type: null, discount: null },
};

const result = PricingCalculator.calculate(reservation);
console.log(result.summary);
/*
{
  basePrice: 2400,
  extras: 0,
  subtotal: 2400,
  discount: 0,
  businessPrice: 2400,
  fee: 311.88,
  customerPrice: 2711.88
}
*/
```

### With Percentage Discount

```javascript
const reservation = {
  trip: { duration: 4, adults: 20, tourType: "Fishing" },
  source: "direct",
  extras: { fishingLicenses: 2, amount: 100 },
  reprice: { type: "%", discount: 10 },
};

const result = PricingCalculator.calculate(reservation);
console.log(result.summary);
/*
{
  basePrice: 2600,    // 4h × $600 + 6 extra passengers × $100
  extras: 144,       // 2 fishing licenses × $22 + $100 other
  subtotal: 2744,
  discount: 274.40,  // 10% off
  businessPrice: 2469.60,
  fee: 0,
  customerPrice: 2469.60
}
*/
```
