# Pricing Configuration

## Rate Details

| Parameter | Value |
|-----------|-------|
| Base Price | $600 USD per hour |
| Minimum Hours | 2 hours |
| Maximum Hours | 8 hours |
| Included Passengers | 1 - 14 passengers |
| Extra Passenger Fee | $100 USD per passenger |
| Maximum Passengers | 50 passengers |

## Description

- The hourly rate of **$600 USD** applies for any reservation between **2 and 8 hours**.
- The base price covers up to **14 passengers** at no additional cost.
- For groups of **15 or more passengers**, a fee of **$100 USD** applies for each passenger beyond the 14th.
- The maximum allowed capacity is **50 passengers**.

---

## JSON Configuration

```javascript
const PRICING_CONFIG = {
  hourlyRate: 600,           // USD per hour
  minHours: 2,               // Minimum booking duration
  maxHours: 8,               // Maximum booking duration
  includedPassengers: 14,    // Passengers included in base price
  extraPassengerFee: 100,    // USD per extra passenger
  maxPassengers: 50          // Maximum capacity
};

/**
 * Calculates the total price for a reservation
 * @param {number} hours - Number of hours for the reservation
 * @param {number} passengerCount - Number of passengers
 * @returns {object} - Contains total price and breakdown
 */
function calculatePrice(hours, passengerCount) {
  // Validate hours
  if (hours < PRICING_CONFIG.minHours || hours > PRICING_CONFIG.maxHours) {
    throw new Error(`Hours must be between ${PRICING_CONFIG.minHours} and ${PRICING_CONFIG.maxHours}`);
  }

  // Validate passengers
  if (passengerCount < 1 || passengerCount > PRICING_CONFIG.maxPassengers) {
    throw new Error(`Passengers must be between 1 and ${PRICING_CONFIG.maxPassengers}`);
  }

  // Calculate base price
  const basePrice = hours * PRICING_CONFIG.hourlyRate;

  // Calculate extra passengers
  const extraPassengers = Math.max(0, passengerCount - PRICING_CONFIG.includedPassengers);
  const extraPassengerCost = extraPassengers * PRICING_CONFIG.extraPassengerFee;

  // Total price
  const totalPrice = basePrice + extraPassengerCost;

  return {
    hours,
    passengerCount,
    basePrice,
    extraPassengers,
    extraPassengerCost,
    totalPrice
  };
}

// Example usage:
// calculatePrice(4, 12)  -> 4 hours, 12 passengers = $2,400 USD
// calculatePrice(4, 20)  -> 4 hours, 20 passengers = $2,400 + $600 = $3,000 USD
// calculatePrice(8, 50)  -> 8 hours, 50 passengers = $4,800 + $3,600 = $8,400 USD
```

---

## Price Examples

| Hours | Passengers | Base Price | Extra Passengers | Extra Cost | Total |
|-------|------------|------------|------------------|------------|-------|
| 2 | 8 | $1,200 | 0 | $0 | $1,200 |
| 4 | 14 | $2,400 | 0 | $0 | $2,400 |
| 4 | 20 | $2,400 | 6 | $600 | $3,000 |
| 6 | 30 | $3,600 | 16 | $1,600 | $5,200 |
| 8 | 50 | $4,800 | 36 | $3,600 | $8,400 |

---

# Order Folio / Reservation Code Nomenclature

## Format Structure

```
[INITIALS] [CONFIRMATION_DATE]-[TRIP_DATE] [TIME]
```

**Example:** `IG 2002-1304 11A`

## Components Breakdown

### 1. Initials (Agent/Captain Code)

| Code | Name |
|------|------|
| IG | Ivan Gonzalez |
| DR | Daniel Rios |

### 2. Confirmation Date

- Format: `MMDD` (Month-Day)
- Represents the date when the reservation was confirmed
- Example: `2002` = February 20th

### 3. Trip Date

- Format: `MMDD` (Month-Day)
- Represents the date of the scheduled trip
- Example: `1304` = April 13th

### 4. Time

- Format: `HHMM[A|P]` or `HH[A|P]`
- `A` = AM, `P` = PM
- Examples:
  - `11A` = 11:00 AM
  - `1130A` = 11:30 AM
  - `230P` = 2:30 PM
  - `6P` = 6:00 PM

## Complete Example Breakdown

**Code:** `IG 2002-1304 11A`

| Component | Value | Meaning |
|-----------|-------|---------|
| Initials | IG | Ivan Gonzalez (agent/captain) |
| Confirmation Date | 2002 | February 20th (reservation confirmed) |
| Trip Date | 1304 | April 13th (scheduled trip) |
| Time | 11A | 11:00 AM (departure time) |

---

## JSON Configuration

```javascript
const FOLIO_CONFIG = {
  agents: {
    IG: 'Ivan Gonzalez',
    DR: 'Daniel Rios'
  },
  dateFormat: 'MMDD',
  timeFormat: 'HHMM[A|P]'
};

/**
 * Parses a reservation code/folio
 * @param {string} folio - The reservation code (e.g., "IG 2002-1304 11A")
 * @returns {object} - Parsed folio components
 */
function parseFolio(folio) {
  const parts = folio.split(' ');
  const [initials, dates, time] = parts;
  const [confirmDate, tripDate] = dates.split('-');
  
  // Parse time
  const isPM = time.endsWith('P');
  const timeNum = time.replace(/[AP]$/, '');
  const hasMinutes = timeNum.length > 2;
  
  let hours = hasMinutes ? parseInt(timeNum.slice(0, -2)) : parseInt(timeNum);
  const minutes = hasMinutes ? parseInt(timeNum.slice(-2)) : 0;
  
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  
  return {
    agentCode: initials,
    agentName: FOLIO_CONFIG.agents[initials],
    confirmationDate: {
      month: parseInt(confirmDate.slice(0, 2)),
      day: parseInt(confirmDate.slice(2))
    },
    tripDate: {
      month: parseInt(tripDate.slice(0, 2)),
      day: parseInt(tripDate.slice(2))
    },
    departureTime: {
      hours,
      minutes,
      formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    },
    raw: folio
  };
}

/**
 * Generates a reservation code/folio
 * @param {string} agentCode - Agent initials (IG, DR)
 * @param {Date} confirmationDate - Date reservation was confirmed
 * @param {Date} tripDate - Date of the trip
 * @param {number} hours - Departure hour (0-23)
 * @param {number} minutes - Departure minutes (0-59)
 * @returns {string} - Generated folio code
 */
function generateFolio(agentCode, confirmationDate, tripDate, hours, minutes = 0) {
  const formatDate = (date) => 
    `${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  
  const isPM = hours >= 12;
  const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  const period = isPM ? 'P' : 'A';
  
  const timeStr = minutes > 0 
    ? `${displayHours}${minutes.toString().padStart(2, '0')}${period}`
    : `${displayHours}${period}`;
  
  return `${agentCode} ${formatDate(confirmationDate)}-${formatDate(tripDate)} ${timeStr}`;
}

// Example usage:
// parseFolio("IG 2002-1304 11A")
// Returns: { agentCode: "IG", agentName: "Ivan Gonzalez", confirmationDate: { month: 2, day: 20 }, ... }
//
// generateFolio("DR", new Date(2026, 1, 20), new Date(2026, 3, 13), 14, 30)
// Returns: "DR 2002-1304 230P"
```

---

## Additional Folio Examples

| Folio | Agent | Confirmed | Trip Date | Time |
|-------|-------|-----------|-----------|------|
| IG 2002-1304 11A | Ivan Gonzalez | Feb 20 | Apr 13 | 11:00 AM |
| DR 2002-1304 230P | Daniel Rios | Feb 20 | Apr 13 | 2:30 PM |
| IG 1503-2003 9A | Ivan Gonzalez | Mar 15 | Mar 20 | 9:00 AM |
| DR 0104-1504 630P | Daniel Rios | Apr 1 | Apr 15 | 6:30 PM |
