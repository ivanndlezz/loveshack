/**
 * Storage Manager - Handles LocalStorage operations for reservations
 * with automatic JSON file synchronization
 */

const STORAGE_KEY = "loveshack_reservations";
const JSON_FILE_PATH = "data/loveshack_reservations.json";
const MENU_OPTIONS_PATH = "data/menu-options.json";

// Cache for JSON data
let jsonReservationsCache = null;
let menuOptionsCache = null;
let syncWarnings = [];

/**
 * Load reservations from JSON file on server
 * @returns {Promise<Array>}
 */
async function loadReservationsFromJson() {
  try {
    const response = await fetch(JSON_FILE_PATH);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    jsonReservationsCache = Array.isArray(data) ? data : [];
    return jsonReservationsCache;
  } catch (error) {
    console.warn(
      "Could not load JSON file (may not exist yet):",
      error.message,
    );
    jsonReservationsCache = [];
    return [];
  }
}

/**
 * Save reservations to JSON file via the local Python save server.
 * Requires `save_server.py` to be running on localhost:8765.
 * Falls back silently if the server is not available.
 * @param {Array} reservations
 * @returns {Promise<boolean>}
 */
async function saveReservationsToJson(reservations) {
  const SAVE_SERVER = "http://localhost:8765/save";

  try {
    const response = await fetch(SAVE_SERVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reservations),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[AutoSave] ✓ ${result.count} reservations saved to JSON.`);
      return true;
    } else {
      const err = await response.json().catch(() => ({}));
      console.warn("[AutoSave] Server error:", err.error || response.status);
      return false;
    }
  } catch {
    // Server not running — fail silently, localStorage still has the data
    return false;
  }
}

/**
 * Load menu options from JSON file
 * @returns {Promise<Object>}
 */
async function loadMenuOptions() {
  if (menuOptionsCache) {
    return menuOptionsCache;
  }

  try {
    const response = await fetch(MENU_OPTIONS_PATH);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    menuOptionsCache = await response.json();
    return menuOptionsCache;
  } catch (error) {
    console.warn(
      "Could not load menu options JSON, using defaults:",
      error.message,
    );
    // Return default options
    menuOptionsCache = {
      foodOptions: [
        "MEXICAN BUFFET & NATIONAL OPEN BAR",
        "BBQ & OPEN BAR",
        "SEAFOOD DINNER & OPEN BAR",
      ],
      tourNames: ["SNORKEL", "SUNSET", "WHALE WATCHING", "FISHING"],
      reservationSources: [
        "Contacto Directo",
        "WhatsApp",
        "Booking.com",
        "TripAdvisor",
      ],
      paymentMethods: ["CASH", "CREDIT CARD", "TRANSFER"],
      statusOptions: ["pending", "confirmed", "completed", "cancelled"],
    };
    return menuOptionsCache;
  }
}

/**
 * Check sync status between localStorage and JSON file
 * @returns {Promise<Object>} Sync comparison result
 */
async function checkSyncStatus() {
  const localReservations = getReservations();
  const jsonReservations = await loadReservationsFromJson();

  return compareReservations(jsonReservations);
}

/**
 * Get sync warnings from last check
 * @returns {Array}
 */
function getSyncWarnings() {
  return syncWarnings;
}

/**
 * Clear sync warnings
 */
function clearSyncWarnings() {
  syncWarnings = [];
}

/**
 * Initialize automatic JSON sync
 * Call this on app startup
 */
async function initializeAutoSync() {
  // Load menu options
  await loadMenuOptions();

  // Check sync status
  const comparison = await checkSyncStatus();

  // Generate warnings for items only in localStorage
  if (comparison.onlyInLocal.length > 0) {
    syncWarnings = comparison.onlyInLocal.map((r) => ({
      type: "local_only",
      folio: r.folio || r.id,
      guestName: r.guestName || "Unknown",
      message: `Reserva "${r.folio || r.id}" (${r.guestName || "Unknown"}) está solo en localStorage, no en el archivo JSON`,
    }));
  }

  // If JSON has more data than localStorage, prompt to merge
  if (comparison.onlyInJson.length > 0 && comparison.onlyInLocal.length === 0) {
    // JSON has new data, offer to load it
    const shouldLoad = confirm(
      `El archivo JSON tiene ${comparison.onlyInJson.length} reserva(s) más que localStorage.\n` +
        `¿Deseas cargar los datos del archivo JSON?`,
    );

    if (shouldLoad) {
      const merged = [...comparison.onlyInJson];
      saveReservations(merged);
    }
  }

  // If both have data but different, warn
  if (comparison.hasWarnings && comparison.onlyInLocal.length > 0) {
    console.warn("⚠️ SYNC WARNINGS:", syncWarnings);
  }

  return {
    hasWarnings: comparison.hasWarnings,
    warnings: syncWarnings,
    localCount: comparison.localCount,
    jsonCount: comparison.jsonCount,
  };
}

/**
 * Get all reservations from localStorage
 * @returns {Array} Array of reservation objects
 */
function getReservations() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading reservations from localStorage:", error);
    return [];
  }
}

/**
 * Save reservations array to localStorage
 * @param {Array} reservations - Array of reservation objects
 * @returns {boolean} Success status
 */
function saveReservations(reservations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    return true;
  } catch (error) {
    console.error("Error saving reservations to localStorage:", error);
    return false;
  }
}

/**
 * Get a single reservation by ID/slug
 * @param {string} id - Reservation ID (folio code)
 * @returns {Object|null} Reservation object or null if not found
 */
function getReservationById(id) {
  const reservations = getReservations();
  return reservations.find((r) => r.id === id || r.folio === id) || null;
}

/**
 * Add a new reservation
 * @param {Object} reservation - Reservation object
 * @returns {boolean} Success status
 */
function addReservation(reservation) {
  const reservations = getReservations();

  // Generate unique ID and folio if not provided
  if (!reservation.id) {
    reservation.id = generateReservationId();
  }
  if (!reservation.folio) {
    reservation.folio = generateFolio(reservation);
  }

  // Add created timestamp
  reservation.createdAt = new Date().toISOString();

  // Set default status
  reservation.status = reservation.status || "pending";

  reservations.push(reservation);
  return saveReservations(reservations);
}

/**
 * Update an existing reservation
 * @param {string} id - Reservation ID
 * @param {Object} updates - Fields to update
 * @returns {boolean} Success status
 */
function updateReservation(id, updates) {
  const reservations = getReservations();
  const index = reservations.findIndex((r) => r.id === id);

  if (index === -1) {
    console.error("Reservation not found:", id);
    return false;
  }

  // Update fields
  reservations[index] = {
    ...reservations[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return saveReservations(reservations);
}

/**
 * Delete a reservation
 * @param {string} id - Reservation ID
 * @returns {boolean} Success status
 */
function deleteReservation(id) {
  const reservations = getReservations();
  const filtered = reservations.filter((r) => r.id !== id);

  if (filtered.length === reservations.length) {
    console.error("Reservation not found:", id);
    return false;
  }

  return saveReservations(filtered);
}

/**
 * Generate a unique reservation ID
 * @returns {string} Unique ID
 */
function generateReservationId() {
  return "res_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

/**
 * Create a local Date object from a YYYY-MM-DD string
 * prevents timezone offset issues from shifting the day backwards
 * @param {string} dateString - YYYY-MM-DD date string
 * @returns {Date} Date object for the local timezone
 */
function parseLocalDate(dateString) {
  if (!dateString) return new Date();
  // By appending T12:00:00, we force the date to be evaluated at noon UTC,
  // which safely avoids timezone shifts from pushing the date back a day.
  return new Date(dateString + "T12:00:00");
}

/**
 * Generate folio code based on reservation data
 * Format: [AGENT] [CONF_DATE]-[TRIP_DATE] [TIME]
 * Example: IG 2002-1304 11A
 * @param {Object} reservation - Reservation object
 * @returns {string} Folio code
 */
function generateFolio(reservation) {
  const agentCode = reservation.agentCode || "IG";
  const confirmationDate = new Date();
  const tripDate = parseLocalDate(reservation.reservationDate);

  // Format dates as MMDD
  const confirmMMDD =
    String(confirmationDate.getMonth() + 1).padStart(2, "0") +
    String(confirmationDate.getDate()).padStart(2, "0");
  const tripMMDD =
    String(tripDate.getMonth() + 1).padStart(2, "0") +
    String(tripDate.getDate()).padStart(2, "0");

  // Format time
  const time = reservation.reservationTime || "11:00";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const isPM = hour >= 12;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const period = isPM ? "P" : "A";
  const timeStr =
    minutes === "00"
      ? `${displayHour}${period}`
      : `${displayHour}${minutes}${period}`;

  return `${agentCode} ${confirmMMDD}-${tripMMDD} ${timeStr}`;
}

/**
 * Calculate pricing for a reservation
 * @param {Object} data - Form data
 * @returns {Object} Pricing breakdown
 */
function calculatePricing(data) {
  const hourlyRate = parseFloat(data.hourlyRate) || 600;
  const hours = parseInt(data.reservationHours) || 4;
  const adults = parseInt(data.adults) || 1;
  const kids = parseInt(data.kids) || 0;
  const infants = parseInt(data.infants) || 0;
  const extraPax = parseInt(data.extraPax) || 0;
  const extraPassengerFee = parseFloat(data.extraPassengerFee) || 100;
  const extraCostAmount = parseFloat(data.extraCostAmount) || 0;
  const priceAdjustment = parseFloat(data.priceAdjustment) || 0;

  const totalPassengers = adults + kids + infants;
  const extraPassengers = Math.max(0, totalPassengers - 14) + extraPax;

  const basePrice = hourlyRate * hours;
  const extraPassengerCost = extraPassengers * extraPassengerFee;
  const totalPrice = basePrice + extraPassengerCost + extraCostAmount + priceAdjustment;

  const deposit = parseFloat(data.deposit) || 0;
  const balance = totalPrice - deposit;

  return {
    hourlyRate,
    hours,
    totalPassengers,
    extraPassengers,
    basePrice,
    extraPassengerCost,
    extraCostAmount,
    priceAdjustment,
    totalPrice,
    deposit,
    balance,
  };
}

/**
 * Export reservations to JSON string
 * @returns {string} JSON string
 */
function exportReservations() {
  const reservations = getReservations();
  return JSON.stringify(reservations, null, 2);
}

/**
 * Import reservations from JSON string
 * @param {string} jsonString - JSON string to import
 * @returns {boolean} Success status
 */
function importReservations(jsonString) {
  try {
    const reservations = JSON.parse(jsonString);
    if (!Array.isArray(reservations)) {
      throw new Error("Invalid format: expected array");
    }
    return saveReservations(reservations);
  } catch (error) {
    console.error("Error importing reservations:", error);
    return false;
  }
}

/**
 * Clear all reservations
 * @returns {boolean} Success status
 */
function clearAllReservations() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing reservations:", error);
    return false;
  }
}

/**
 * Get sample reservations for demo/testing
 * @returns {Array} Sample reservations
 */
function getSampleReservations() {
  return [
    {
      id: "res_1700000001",
      folio: "IG 2002-1304 11A",
      agentCode: "IG",
      contactName: "Ivan Gonzalez",
      guestName: "Dave Sciriha",
      contactPhone: "",
      contactEmail: "",
      reservationDate: "2026-04-13",
      reservationTime: "11:00",
      reservationHours: 4,
      tourName: "SNORKEL",
      adults: 8,
      kids: 0,
      infants: 0,
      extraPax: 0,
      foodOption: "MEXICAN BUFFET & NATIONAL OPEN BAR",
      hotel: "",
      notes: "",
      reservationSource: "Contacto Directo",
      hourlyRate: 600,
      extraPassengerFee: 100,
      basePrice: 2400,
      extraPassengerCost: 0,
      totalPrice: 2400,
      deposit: 0,
      balance: 2400,
      paymentMethod: "CASH",
      status: "confirmed",
      createdAt: "2026-02-20T10:00:00.000Z",
    },
    {
      id: "res_1700000002",
      folio: "IG 2002-0204 11A",
      agentCode: "IG",
      contactName: "Ivan Gonzalez",
      guestName: "Kristin Render",
      contactPhone: "",
      contactEmail: "",
      reservationDate: "2026-04-02",
      reservationTime: "11:00",
      reservationHours: 3,
      tourName: "SNORKEL",
      adults: 14,
      kids: 6,
      infants: 0,
      extraPax: 6,
      foodOption: "MEXICAN BUFFET & NATIONAL OPEN BAR",
      hotel: "",
      notes: "High School Graduation Party - Moms & Sons",
      reservationSource: "Contacto Directo",
      hourlyRate: 600,
      extraPassengerFee: 100,
      basePrice: 1800,
      extraPassengerCost: 600,
      totalPrice: 2400,
      deposit: 900,
      balance: 1500,
      paymentMethod: "CASH",
      status: "confirmed",
      createdAt: "2026-02-20T11:00:00.000Z",
    },
  ];
}

// Initialize with sample data if empty
function initializeSampleData() {
  const reservations = getReservations();
  if (reservations.length === 0) {
    const samples = getSampleReservations();
    saveReservations(samples);
    return true;
  }
  return false;
}

// Auto-initialize on load (only in browser)
if (typeof window !== "undefined") {
  // Don't auto-initialize - let user create reservations
  // initializeSampleData();
}

// ==================== JSON FILE OPERATIONS ====================

const JSON_FILE_NAME = "loveshack_reservations.json";

/**
 * Export reservations to a JSON file (download)
 * @returns {boolean} Success status
 */
function exportReservationsToFile() {
  try {
    const reservations = getReservations();
    const jsonString = JSON.stringify(reservations, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = JSON_FILE_NAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(
      "Reservations exported to file:",
      reservations.length,
      "reservations",
    );
    return true;
  } catch (error) {
    console.error("Error exporting reservations to file:", error);
    return false;
  }
}

/**
 * Import reservations from a JSON file
 * @param {File} file - The JSON file to import
 * @returns {Promise<{success: boolean, count: number, error?: string}>}
 */
async function importReservationsFromFile(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();

      reader.onload = function (e) {
        try {
          const reservations = JSON.parse(e.target.result);

          if (!Array.isArray(reservations)) {
            resolve({
              success: false,
              count: 0,
              error: "Invalid format: expected array",
            });
            return;
          }

          // Validate each reservation has required fields
          const validReservations = reservations.filter((r) => r.id || r.folio);

          if (validReservations.length === 0) {
            resolve({
              success: false,
              count: 0,
              error: "No valid reservations found in file",
            });
            return;
          }

          // Save to localStorage
          const success = saveReservations(validReservations);

          if (success) {
            console.log(
              "Reservations imported from file:",
              validReservations.length,
              "reservations",
            );
            resolve({ success: true, count: validReservations.length });
          } else {
            resolve({
              success: false,
              count: 0,
              error: "Failed to save to localStorage",
            });
          }
        } catch (parseError) {
          console.error("Error parsing JSON file:", parseError);
          resolve({ success: false, count: 0, error: "Invalid JSON format" });
        }
      };

      reader.onerror = function () {
        resolve({ success: false, count: 0, error: "Error reading file" });
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Error importing reservations from file:", error);
      resolve({ success: false, count: 0, error: error.message });
    }
  });
}

/**
 * Compare localStorage reservations with imported JSON data
 * @param {Array} jsonReservations - Reservations from JSON file
 * @returns {Object} Comparison result with warnings
 */
function compareReservations(jsonReservations) {
  const localReservations = getReservations();

  // Create sets of IDs for comparison
  const localIds = new Set(localReservations.map((r) => r.id));
  const localFolios = new Set(
    localReservations.map((r) => r.folio).filter(Boolean),
  );
  const jsonIds = new Set(jsonReservations.map((r) => r.id));
  const jsonFolios = new Set(
    jsonReservations.map((r) => r.folio).filter(Boolean),
  );

  // Find reservations only in localStorage
  const onlyInLocal = localReservations.filter(
    (r) => !jsonIds.has(r.id) && !jsonFolios.has(r.folio),
  );

  // Find reservations only in JSON file
  const onlyInJson = jsonReservations.filter(
    (r) => !localIds.has(r.id) && !localFolios.has(r.folio),
  );

  // Find reservations in both (compare updated times)
  const inBoth = localReservations.filter(
    (r) => jsonIds.has(r.id) || jsonFolios.has(r.folio),
  );

  // Check for conflicts (different data)
  const conflicts = [];
  inBoth.forEach((localRes) => {
    const jsonRes = jsonReservations.find(
      (r) => r.id === localRes.id || r.folio === localRes.folio,
    );
    if (jsonRes) {
      const localUpdated = new Date(
        localRes.updatedAt || localRes.createdAt || 0,
      );
      const jsonUpdated = new Date(jsonRes.updatedAt || jsonRes.createdAt || 0);

      if (localUpdated.getTime() !== jsonUpdated.getTime()) {
        conflicts.push({
          reservation: localRes,
          localUpdated,
          jsonUpdated,
          newerInLocal: localUpdated > jsonUpdated,
        });
      }
    }
  });

  return {
    localCount: localReservations.length,
    jsonCount: jsonReservations.length,
    onlyInLocal,
    onlyInJson,
    inBoth: inBoth.length,
    conflicts,
    hasWarnings:
      onlyInLocal.length > 0 || onlyInJson.length > 0 || conflicts.length > 0,
  };
}

/**
 * Import and compare reservations from a JSON file, showing warnings
 * @param {File} file - The JSON file to import
 * @returns {Promise<{success: boolean, comparison: Object, imported: boolean}>}
 */
async function importAndCompareReservations(file) {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();

      reader.onload = function (e) {
        try {
          const jsonReservations = JSON.parse(e.target.result);

          if (!Array.isArray(jsonReservations)) {
            resolve({
              success: false,
              comparison: null,
              imported: false,
              error: "Invalid format",
            });
            return;
          }

          // Perform comparison
          const comparison = compareReservations(jsonReservations);

          // If there are warnings, let user decide what to do
          if (comparison.hasWarnings) {
            resolve({
              success: true,
              comparison,
              imported: false,
              needsDecision: true,
            });
            return;
          }

          // No warnings, proceed with import
          const validReservations = jsonReservations.filter(
            (r) => r.id || r.folio,
          );
          const success = saveReservations(validReservations);

          resolve({
            success,
            comparison,
            imported: success,
            needsDecision: false,
          });
        } catch (parseError) {
          resolve({
            success: false,
            comparison: null,
            imported: false,
            error: "Invalid JSON",
          });
        }
      };

      reader.onerror = function () {
        resolve({
          success: false,
          comparison: null,
          imported: false,
          error: "Error reading file",
        });
      };

      reader.readAsText(file);
    } catch (error) {
      resolve({
        success: false,
        comparison: null,
        imported: false,
        error: error.message,
      });
    }
  });
}

/**
 * Generate a warning message based on comparison results
 * @param {Object} comparison - Result from compareReservations
 * @returns {string} Warning message
 */
function generateSyncWarningMessage(comparison) {
  const messages = [];

  if (comparison.onlyInLocal.length > 0) {
    messages.push(
      `⚠️ ${comparison.onlyInLocal.length} reservation(s) only in localStorage (not in JSON file):`,
    );
    comparison.onlyInLocal.forEach((r) => {
      messages.push(
        `   - ${r.folio || r.id}: ${r.guestName || "Unknown guest"}`,
      );
    });
  }

  if (comparison.onlyInJson.length > 0) {
    messages.push(
      `\n⚠️ ${comparison.onlyInJson.length} reservation(s) only in JSON file (not in localStorage):`,
    );
    comparison.onlyInJson.forEach((r) => {
      messages.push(
        `   - ${r.folio || r.id}: ${r.guestName || "Unknown guest"}`,
      );
    });
  }

  if (comparison.conflicts.length > 0) {
    messages.push(
      `\n⚠️ ${comparison.conflicts.length} reservation(s) with conflicting timestamps:`,
    );
    comparison.conflicts.forEach((c) => {
      const res = c.reservation;
      const newer = c.newerInLocal ? "localStorage" : "JSON file";
      messages.push(`   - ${res.folio || res.id}: Newer in ${newer}`);
    });
  }

  return messages.join("\n");
}

// Hidden file input element for import
let importFileInput = null;

/**
 * Create or get the hidden file input element
 * @returns {HTMLInputElement}
 */
function getImportFileInput() {
  if (!importFileInput) {
    importFileInput = document.createElement("input");
    importFileInput.type = "file";
    importFileInput.accept = ".json,application/json";
    importFileInput.style.display = "none";
    document.body.appendChild(importFileInput);
  }
  return importFileInput;
}

/**
 * Trigger file import dialog
 * @param {Function} callback - Callback function to handle the imported file
 */
function triggerImportDialog(callback) {
  const input = getImportFileInput();
  input.value = ""; // Reset to allow selecting same file again

  input.onchange = function (e) {
    const file = e.target.files[0];
    if (file && callback) {
      callback(file);
    }
  };

  input.click();
}
