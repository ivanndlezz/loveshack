/**
 * Love Shack Reservations App
 * Main application logic
 */

// ==================== STATE ====================
let currentView = "list";
let reservations = [];
let menuOptions = null;
let currentSortBy = "date-asc";
let hideCompleted = true;

// ==================== DOM ELEMENTS ====================
const elements = {
  // Container
  reservationsContainer: document.getElementById("reservationsContainer"),
  reservationCount: document.getElementById("reservationCount"),
  emptyState: document.getElementById("emptyState"),

  // Toggle buttons
  listViewBtn: document.getElementById("listViewBtn"),
  cardsViewBtn: document.getElementById("cardsViewBtn"),
  toggleSlider: document.getElementById("toggleSlider"),

  // JSON Operations
  exportJsonBtn: document.getElementById("exportJsonBtn"),
  importJsonBtn: document.getElementById("importJsonBtn"),
  syncJsonBtn: document.getElementById("syncJsonBtn"),

  // New reservation buttons
  newReservationBtn: document.getElementById("newReservationBtn"),
  emptyStateBtn: document.getElementById("emptyStateBtn"),

  // Modal
  reservationModal: document.getElementById("reservationModal"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalClose: document.getElementById("modalClose"),
  reservationForm: document.getElementById("reservationForm"),

  // Side sheet
  sideSheet: document.getElementById("sideSheet"),
  sideSheetOverlay: document.getElementById("sideSheetOverlay"),
  sideSheetClose: document.getElementById("sideSheetClose"),
  sideSheetBody: document.getElementById("sideSheetBody"),

  // Form fields for pricing calculation
  reservationHours: document.getElementById("reservationHours"),
  adults: document.getElementById("adults"),
  kids: document.getElementById("kids"),
  infants: document.getElementById("infants"),
  extraPax: document.getElementById("extraPax"),
  hourlyRate: document.getElementById("hourlyRate"),
  extraPassengerFee: document.getElementById("extraPassengerFee"),
  extraCostAmount: document.getElementById("extraCostAmount"),
  priceAdjustment: document.getElementById("priceAdjustment"),
  priceAdjustmentNote: document.getElementById("priceAdjustmentNote"),
  deposit: document.getElementById("deposit"),
  basePrice: document.getElementById("basePrice"),
  totalPrice: document.getElementById("totalPrice"),
  balance: document.getElementById("balance"),
};

// ==================== INITIALIZATION ====================
function init() {
  // Load reservations
  loadReservations();

  // Auto-complete past reservations
  autoCompletePastReservations();

  // Initialize auto-sync with JSON file
  initializeAutoSync().then((syncResult) => {
    // Reload reservations after potential merge
    loadReservations();
    autoCompletePastReservations();
    renderReservations();

    // Update sync status indicator
    updateSyncStatusIndicator(syncResult);

    // Show sync warnings if any
    if (syncResult.hasWarnings && syncResult.warnings.length > 0) {
      const warningMessages = syncResult.warnings
        .map((w) => w.message)
        .join("\n");
      alert(`⚠️ AVISOS DE SINCRONIZACIÓN:\n\n${warningMessages}`);
    }
  });

  // Load menu options and populate form
  loadMenuOptions().then((options) => {
    menuOptions = options;
    populateFormOptions();
  });

  // Check for query parameter
  checkQueryParams();

  // Setup event listeners
  setupEventListeners();

  // Render initial view
  renderReservations();
}

/**
 * Load reservations from storage
 */
function loadReservations() {
  reservations = getReservations();
}

/**
 * Auto-complete reservations whose date has already passed
 */
function autoCompletePastReservations() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let hasChanges = false;

  reservations = reservations.map((reservation) => {
    const reservationDate = parseLocalDate(reservation.reservationDate);
    reservationDate.setHours(23, 59, 59, 999);

    if (
      reservationDate < today &&
      reservation.status !== "completed" &&
      reservation.status !== "cancelled"
    ) {
      hasChanges = true;
      return { ...reservation, status: "completed" };
    }
    return reservation;
  });

  if (hasChanges) {
    saveReservations(reservations);
  }
}

/**
 * Check URL query parameters for reservation view
 */
function checkQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const reservationParam = urlParams.get("reservation");

  if (reservationParam) {
    // Open side sheet with specific reservation
    setTimeout(() => {
      openSideSheet(reservationParam);
    }, 100);
  }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // View toggle
  elements.listViewBtn.addEventListener("click", () => setView("list"));
  elements.cardsViewBtn.addEventListener("click", () => setView("cards"));

  // JSON file operations
  elements.exportJsonBtn.addEventListener("click", handleExportJson);
  elements.importJsonBtn.addEventListener("click", handleImportJson);
  elements.syncJsonBtn.addEventListener("click", handleSyncJson);

  // New reservation buttons
  elements.newReservationBtn.addEventListener("click", openModal);
  elements.emptyStateBtn.addEventListener("click", openModal);

  // Modal
  elements.modalOverlay.addEventListener("click", closeModal);
  elements.modalClose.addEventListener("click", closeModal);

  // Form submission
  elements.reservationForm.addEventListener("submit", handleFormSubmit);

  // Side sheet
  elements.sideSheetOverlay.addEventListener("click", closeSideSheet);
  elements.sideSheetClose.addEventListener("click", closeSideSheet);

  // Event delegation for all reservation action buttons (replaces inline onclick)
  document.addEventListener("click", handleReservationAction);

  // Sort select
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSortBy = e.target.value;
      renderReservations();
    });
  }

  // Hide/Show completed toggle button
  const toggleCompletedBtn = document.getElementById("toggleCompletedBtn");
  if (toggleCompletedBtn) {
    toggleCompletedBtn.addEventListener("click", () => {
      hideCompleted = !hideCompleted;
      toggleCompletedBtn.textContent = hideCompleted
        ? "Show Completed"
        : "Hide Completed";
      toggleCompletedBtn.classList.toggle("completed-visible", !hideCompleted);
      renderReservations();
    });
  }

  // Pricing calculation
  const pricingFields = [
    elements.reservationHours,
    elements.adults,
    elements.kids,
    elements.infants,
    elements.extraPax,
    elements.hourlyRate,
    elements.extraPassengerFee,
    elements.extraCostAmount,
    elements.priceAdjustment,
    elements.deposit,
  ];

  pricingFields.forEach((field) => {
    field.addEventListener("input", calculateFormPricing);
    field.addEventListener("change", calculateFormPricing);
  });

  // Handle browser back button
  window.addEventListener("popstate", handlePopState);
}

/**
 * Event delegation handler for reservation action buttons
 * Replaces all inline onclick handlers on side sheet buttons
 */
function handleReservationAction(event) {
  const target = event.target.closest("[data-button-name]");
  if (!target) return;

  const buttonName = target.dataset.buttonName;
  const reservationId = target.dataset.res;

  switch (buttonName) {
    case "status-pending":
      updateStatusFromSheet(reservationId, "pending");
      break;
    case "status-completed":
      updateStatusFromSheet(reservationId, "completed");
      break;
    case "print":
      printReservation();
      break;
    case "edit":
      editReservation(reservationId);
      break;
    case "delete":
      deleteReservationPrompt(reservationId);
      break;
  }
}

/**
 * Handle browser back button
 */
function handlePopState() {
  const urlParams = new URLSearchParams(window.location.search);
  const reservationParam = urlParams.get("reservation");

  if (reservationParam) {
    openSideSheet(reservationParam);
  } else {
    closeSideSheet();
  }
}

// ==================== VIEW MANAGEMENT ====================
/**
 * Set the current view mode
 * @param {string} view - 'list' or 'cards'
 */
function setView(view) {
  currentView = view;

  // Update container data attribute
  elements.reservationsContainer.setAttribute("data-render", view);

  // Update toggle buttons
  elements.listViewBtn.classList.toggle("active", view === "list");
  elements.cardsViewBtn.classList.toggle("active", view === "cards");

  // Update slider position
  elements.toggleSlider.classList.remove("list-view", "cards-view");
  elements.toggleSlider.classList.add`${view}-view`;

  // Re-render
  renderReservations();
}

/**
 * Render reservations based on current view
 */
function renderReservations() {
  const totalCount = reservations.length;

  // Filter
  let filtered = hideCompleted
    ? reservations.filter((r) => r.status !== "completed")
    : [...reservations];

  const visibleCount = filtered.length;

  // Update header count
  elements.reservationCount.textContent = `${totalCount} reservation${totalCount !== 1 ? "s" : ""}`;

  // Update menu stats
  const visibleCountEl = document.getElementById("visibleCount");
  const totalCountEl = document.getElementById("totalCount");
  if (visibleCountEl) visibleCountEl.textContent = visibleCount;
  if (totalCountEl) totalCountEl.textContent = totalCount;

  // Check if empty
  if (totalCount === 0) {
    elements.emptyState.style.display = "flex";
    const items = elements.reservationsContainer.querySelectorAll(
      ".reservation-item, .month-group-header",
    );
    items.forEach((item) => item.remove());
    return;
  }

  elements.emptyState.style.display = "none";

  // Clear existing items
  const existingItems = elements.reservationsContainer.querySelectorAll(
    ".reservation-item, .month-group-header",
  );
  existingItems.forEach((item) => item.remove());

  // Sort
  filtered.sort((a, b) => {
    switch (currentSortBy) {
      case "date-asc":
        return new Date(a.reservationDate) - new Date(b.reservationDate);
      case "name-asc":
        return (a.guestName || "").localeCompare(b.guestName || "");
      case "name-desc":
        return (b.guestName || "").localeCompare(a.guestName || "");
      case "price-asc":
        return (
          (parseFloat(a.totalPrice) || 0) - (parseFloat(b.totalPrice) || 0)
        );
      case "price-desc":
        return (
          (parseFloat(b.totalPrice) || 0) - (parseFloat(a.totalPrice) || 0)
        );
      case "date-desc":
      default:
        return new Date(b.reservationDate) - new Date(a.reservationDate);
    }
  });

  // Only group by month when sorted by date
  const groupByMonth = currentSortBy.startsWith("date");
  let currentMonthYear = "";

  // Render items
  filtered.forEach((reservation) => {
    if (groupByMonth) {
      const date = parseLocalDate(reservation.reservationDate);
      const monthYearStr = date.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      });
      const displayMonthYear =
        monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1);

      if (displayMonthYear !== currentMonthYear) {
        const header = document.createElement("div");
        header.className = "month-group-header";
        header.textContent = displayMonthYear;
        elements.reservationsContainer.appendChild(header);
        currentMonthYear = displayMonthYear;
      }
    }

    const item = createReservationItem(reservation);
    elements.reservationsContainer.appendChild(item);
  });
}

/**
 * Create a reservation item element
 * @param {Object} reservation - Reservation data
 * @returns {HTMLElement} Reservation item element
 */
function createReservationItem(reservation) {
  const item = document.createElement("div");
  item.className = "reservation-item";
  item.dataset.id = reservation.id;

  // Format date
  // Use parseLocalDate from storage.js to prevent timezone offset issues
  const date = parseLocalDate(reservation.reservationDate);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Format time
  const time = reservation.reservationTime || "11:00";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const isPM = hour >= 12;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const timeStr = `${displayHour}:${minutes} ${isPM ? "PM" : "AM"}`;

  // Calculate total passengers
  const totalPax =
    (parseInt(reservation.adults) || 0) +
    (parseInt(reservation.kids) || 0) +
    (parseInt(reservation.infants) || 0);

  // Status class
  const statusClass = `status-${reservation.status || "pending"}`;
  const statusLabel = getStatusLabel(reservation.status);

  // Data attributes
  item.dataset.status = reservation.status || "pending";
  item.dataset.res = reservation.id;
  item.dataset.scope = "reservation-item";

  // Past reservation flag
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resDate = parseLocalDate(reservation.reservationDate);
  resDate.setHours(0, 0, 0, 0);
  if (resDate < today) {
    item.classList.add("is-past");
  }

  if (currentView === "list") {
    // List view template
    item.innerHTML = `
      <div class="reservation-date">${dateStr}</div>
      <div class="reservation-guest">${reservation.guestName || "N/A"}</div>
      <div class="reservation-tour">${reservation.tourName || "SNORKEL"} • ${timeStr}</div>
      <div class="reservation-status ${statusClass}">${statusLabel}</div>
      <div class="reservation-price">$${(reservation.totalPrice || 0).toLocaleString()}</div>
    `;
  } else {
    // Cards view template
    item.innerHTML = `
      <div class="reservation-header">
        <div class="reservation-folio">${reservation.folio || reservation.id}</div>
        <div class="reservation-status ${statusClass}">${statusLabel}</div>
      </div>
      <div class="reservation-guest">${reservation.guestName || "N/A"}</div>
      <div class="reservation-details">
        <div class="detail-item">
          <span class="detail-label">Date</span>
          <span class="detail-value">${dateStr}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Time</span>
          <span class="detail-value">${timeStr}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Tour</span>
          <span class="detail-value">${reservation.tourName || "SNORKEL"}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Hours</span>
          <span class="detail-value">${reservation.reservationHours || 4} hrs</span>
        </div>
      </div>
      <div class="reservation-footer">
        <div class="reservation-passengers">${totalPax} passengers</div>
        <div class="reservation-price">$${(reservation.totalPrice || 0).toLocaleString()}</div>
      </div>
    `;
  }

  // Add click handler
  item.addEventListener("click", () => openSideSheet(reservation.id));

  return item;
}

/**
 * Get status label from status code
 * @param {string} status - Status code
 * @returns {string} Human-readable status
 */
function getStatusLabel(status) {
  const labels = {
    confirmed: "Confirmed",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] || "Pending";
}

// ==================== MODAL ====================
/**
 * Open the new reservation modal
 */
function openModal() {
  elements.reservationModal.classList.add("open");
  document.body.style.overflow = "hidden";

  // Reset form
  elements.reservationForm.reset();

  // Set default date to today
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("reservationDate").value = today;
  document.getElementById("reservationTime").value = "11:00";

  // Calculate initial pricing
  calculateFormPricing();

  // Focus first field
  document.getElementById("contactName").focus();
}

/**
 * Close the modal
 */
function closeModal() {
  elements.reservationModal.classList.remove("open");
  document.body.style.overflow = "";
}

/**
 * Handle form submission
 * @param {Event} e - Submit event
 */
function handleFormSubmit(e) {
  e.preventDefault();

  // Get form data
  const formData = new FormData(elements.reservationForm);
  const data = Object.fromEntries(formData.entries());

  // Calculate pricing
  const pricing = calculatePricing(data);

  // Create reservation object
  const reservation = {
    ...data,
    ...pricing,
    status: "confirmed",
  };

  // Check if editing or creating
  if (editingId) {
    // Update existing reservation
    reservation.id = editingId;
    reservation.folio = generateFolio(reservation);

    const success = updateReservation(editingId, reservation);

    if (success) {
      // Reload and render
      loadReservations();
      renderReservations();
      closeModal();

      // Reset editing ID
      editingId = null;

      // Reset modal title and button
      const modalTitle =
        elements.reservationModal.querySelector(".modal-header h2");
      if (modalTitle) {
        modalTitle.textContent = "New Reservation";
      }
      const submitBtn = elements.reservationForm.querySelector(
        'button[type="submit"]',
      );
      if (submitBtn) {
        submitBtn.textContent = "Save Reservation";
      }

      console.log("Reservation updated:", reservation.folio);
    } else {
      alert("Error updating reservation. Please try again.");
    }
  } else {
    // Create new reservation
    reservation.id = generateReservationId();
    reservation.folio = generateFolio(reservation);

    // Add to storage
    const success = addReservation(reservation);

    if (success) {
      // Reload and render
      loadReservations();
      renderReservations();
      closeModal();

      // Show success (optional)
      console.log("Reservation created:", reservation.folio);
    } else {
      alert("Error saving reservation. Please try again.");
    }
  }
}

/**
 * Calculate pricing from form inputs
 */
function calculateFormPricing() {
  const hours = parseInt(elements.reservationHours.value) || 4;
  const adults = parseInt(elements.adults.value) || 1;
  const kids = parseInt(elements.kids.value) || 0;
  const infants = parseInt(elements.infants.value) || 0;
  const extraPax = parseInt(elements.extraPax.value) || 0;
  const rate = parseFloat(elements.hourlyRate.value) || 600;
  const extraFee = parseFloat(elements.extraPassengerFee.value) || 100;
  const extraCostAmount = parseFloat(elements.extraCostAmount.value) || 0;
  const priceAdjustment = elements.priceAdjustment
    ? parseFloat(elements.priceAdjustment.value) || 0
    : 0;
  const deposit = parseFloat(elements.deposit.value) || 0;

  const totalPassengers = adults + kids + infants;
  const extraPassengers = Math.max(0, totalPassengers - 14) + extraPax;

  const basePrice = rate * hours;
  const extraCost = extraPassengers * extraFee;
  const total = basePrice + extraCost + extraCostAmount + priceAdjustment;
  const balance = total - deposit;

  elements.basePrice.value = basePrice.toFixed(2);
  elements.totalPrice.value = total.toFixed(2);
  elements.balance.value = balance.toFixed(2);
}

// ==================== SIDE SHEET ====================
/**
 * Open side sheet with reservation details
 * @param {string} id - Reservation ID or folio
 */
function openSideSheet(id) {
  const reservation = getReservationById(id);

  if (!reservation) {
    console.error("Reservation not found:", id);
    return;
  }

  // Render template
  const template = renderReservationTemplate(reservation);
  elements.sideSheetBody.innerHTML = template;

  // Open side sheet
  elements.sideSheet.classList.add("open");
  document.body.style.overflow = "hidden";

  // Update Title for Printing
  const guestName = reservation.guestName || "N/A";
  const folio = reservation.folio || id;
  document.title = `${guestName} - Reserva: ${folio}`;

  // Update URL
  const url = new URL(window.location);
  url.searchParams.set("reservation", reservation.folio || id);
  window.history.pushState({}, "", url);
}

/**
 * Close side sheet
 */
function closeSideSheet() {
  elements.sideSheet.classList.remove("open");
  document.body.style.overflow = "";

  // Reset Title
  document.title = "Love Shack - Reservations";

  // Update URL
  const url = new URL(window.location);
  url.searchParams.delete("reservation");
  window.history.pushState({}, "", url);
}

/**
 * Render reservation detail template (from loveshack-reservations-examples)
 * @param {Object} reservation - Reservation data
 * @returns {string} HTML template
 */

/**
 * Get food option description from menu options
 * @param {string} foodName - Name of the food option
 * @returns {string} Description or default
 */
function getFoodDescription(foodName) {
  if (!foodName || !menuOptions || !menuOptions.foodOptions) {
    return getDefaultFoodDescription();
  }

  const foodOption = menuOptions.foodOptions.find((f) => {
    const name = typeof f === "string" ? f : f.name;
    return name === foodName;
  });

  if (foodOption && typeof foodOption === "object" && foodOption.description) {
    return foodOption.description;
  }

  return getDefaultFoodDescription();
}

/**
 * Get default food description when no match found
 * @returns {string} Default description
 */
function getDefaultFoodDescription() {
  return "Mixed snacks and muffins; professional fishing gear, snorkeling equipment, 2 Paddle Boards.";
}

/**
 * Format food description text into HTML paragraphs
 * @param {string} description - Description text
 * @returns {string} HTML formatted description
 */
function formatFoodDescription(description) {
  if (!description) {
    return `<p>${getDefaultFoodDescription()}</p>`;
  }

  // Split by periods and create paragraphs
  const parts = description.split(". ").filter((p) => p.trim());
  let html = "";

  parts.forEach((part, index) => {
    // Check if this part contains a colon (like "National Open Bar:")
    if (part.includes(":")) {
      const [title, ...rest] = part.split(":");
      html += `<p><strong>${title}:</strong>${rest.join(":")}</p>`;
    } else {
      html += `<p>${part}${index < parts.length - 1 ? "." : ""}</p>`;
    }
  });

  return html;
}

/**
 * Get SVG Icon based on tour name
 * @param {string} tourName - Name of the tour
 * @returns {string} SVG string
 */
function getTourIcon(tourName) {
  const name = (tourName || "SNORKEL").toUpperCase();

  const snorkelIcon = `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57.43 64.03"><defs><style>.cls-1{fill:#bba764;}</style></defs><g id="Capa_1-2" data-name="Capa 1"><g><path class="cls-1" d="M57.43,29.51c0-3.53-1.38-6.85-3.87-9.34-1.84-1.84-4.12-3.06-6.6-3.58V.75c0-.41-.34-.75-.75-.75h-5.38c-.41,0-.75.34-.75.75v15.55H13.21c-3.53,0-6.84,1.37-9.34,3.87-2.5,2.49-3.87,5.81-3.87,9.34,0,7.28,5.93,13.21,13.21,13.21h8.04c.28,0,.54-.16.67-.41l3.62-7.2h6.37l3.62,7.2c.13.25.39.41.67.41h3.89v10.22c0,2.41-1.96,4.38-4.38,4.38s-4.38-1.96-4.38-4.38v-4.04h3.38c.41,0,.75-.34.75-.75s-.34-.75-.75-.75h-11.99c-.41,0-.75.34-.75.75s.34.75.75.75h2.23v4.12c0,6.07,4.94,11,11,11s11-4.94,11-11v-10.59c5.98-1.26,10.47-6.58,10.47-12.92ZM41.58,1.5h3.88v14.8h-3.88V1.5ZM45.46,53.02c0,5.24-4.26,9.5-9.5,9.5s-9.5-4.26-9.5-9.5v-4.12h3.38v4.04c0,3.24,2.64,5.88,5.88,5.88s5.88-2.64,5.88-5.88v-10.22h2.64c.42,0,.83-.02,1.24-.06v10.36ZM44.22,41.22h-7.58l-3.62-7.2c-.13-.25-.39-.41-.67-.41h-7.29c-.28,0-.54.16-.67.41l-3.62,7.2h-7.58c-6.46,0-11.71-5.25-11.71-11.71,0-3.13,1.22-6.07,3.43-8.28,2.21-2.21,5.15-3.43,8.28-3.43h31.01c3.13,0,6.07,1.22,8.28,3.43,2.21,2.21,3.43,5.15,3.43,8.28,0,6.46-5.25,11.71-11.71,11.71Z"/><path class="cls-1" d="M23.18,23.79l-1.52.76c-.92.46-2,.38-2.84-.21-1.34-.94-3.07-1.04-4.5-.25l-3.4,1.85c-.36.2-.5.65-.3,1.02.14.25.39.39.66.39.12,0,.24-.03.36-.09l3.4-1.85c.93-.51,2.06-.45,2.92.16,1.29.9,2.96,1.02,4.37.32l1.52-.76c.37-.19.52-.64.33-1.01s-.63-.52-1.01-.33Z"/></g></g></svg>`;
  const sunsetIcon = `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 101.47 71.97"><defs><style>.cls-1{fill:#bba764;}</style></defs><g id="Capa_1-2" data-name="Capa 1"><g><path class="cls-1" d="M50.73,23.55c.41,0,.75-.34.75-.75V.75c0-.41-.34-.75-.75-.75s-.75.34-.75.75v22.05c0,.41.34.75.75.75Z"/><path class="cls-1" d="M60.15,24.84c.1.04.2.06.29.06.29,0,.57-.17.69-.46l5.56-13.02c.16-.38-.01-.82-.4-.98-.38-.16-.82.01-.98.39l-5.56,13.02c-.16.38.01.82.4.98Z"/><path class="cls-1" d="M70.49,31.73c.19,0,.38-.07.53-.22l15.59-15.59c.29-.29.29-.77,0-1.06s-.77-.29-1.06,0l-15.59,15.59c-.29.29-.29.77,0,1.06.15.15.34.22.53.22Z"/><path class="cls-1" d="M75.7,39.09c.12.29.4.47.7.47.09,0,.19-.02.28-.05l13.14-5.28c.38-.15.57-.59.42-.98-.15-.39-.59-.57-.98-.42l-13.14,5.28c-.38.15-.57.59-.42.98Z"/><path class="cls-1" d="M100.72,49.98h-28.69c-.4-11.41-9.79-20.58-21.3-20.58s-20.89,9.17-21.29,20.58H6.63s0,0,0,0H.75c-.41,0-.75.34-.75.75s.34.75.75.75h22.05s0,0,0,0h7.34s0,0,0,0h41.17s0,0,0,0h29.4c.41,0,.75-.34.75-.75s-.34-.75-.75-.75ZM50.73,30.91c10.69,0,19.43,8.49,19.83,19.08H30.91c.4-10.59,9.13-19.08,19.82-19.08Z"/><path class="cls-1" d="M10.84,36.15l13.02,5.56c.1.04.2.06.29.06.29,0,.57-.17.69-.46.16-.38-.01-.82-.4-.98l-13.02-5.56c-.38-.16-.82.01-.98.39-.16.38.01.82.4.98Z"/><path class="cls-1" d="M30.45,31.51c.15.15.34.22.53.22s.38-.07.53-.22c.29-.29.29-.77,0-1.06l-15.59-15.59c-.29-.29-.77-.29-1.06,0s-.29.77,0,1.06l15.59,15.59Z"/><path class="cls-1" d="M38.11,25.35c.12.29.4.47.7.47.09,0,.19-.02.28-.05.38-.15.57-.59.42-.98l-5.28-13.14c-.15-.38-.59-.57-.98-.42-.38.15-.57.59-.42.98l5.28,13.14Z"/><path class="cls-1" d="M70.81,54.54H30.15c-.41,0-.75.34-.75.75s.34.75.75.75h40.66c.41,0,.75-.34.75-.75s-.34-.75-.75-.75Z"/><path class="cls-1" d="M69.19,58.69h-37.11c-.41,0-.75.34-.75.75s.34.75.75.75h37.11c.41,0,.75-.34.75-.75s-.34-.75-.75-.75Z"/><path class="cls-1" d="M66.8,62.92h-31.62c-.41,0-.75.34-.75.75s.34.75.75.75h31.62c.41,0,.75-.34.75-.75s-.34-.75-.75-.75Z"/><path class="cls-1" d="M61.37,66.91h-21.01c-.41,0-.75.34-.75.75s.34.75.75.75h21.01c.41,0,.75-.34.75-.75s-.34-.75-.75-.75Z"/><path class="cls-1" d="M54.88,70.47h-8.03c-.41,0-.75.34-.75.75s.34.75.75.75h8.03c.41,0,.75-.34.75-.75s-.34-.75-.75-.75Z"/></g></g></svg>`;
  const fishingIcon = `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 47.61 73.63"><defs><style>.cls-1{fill:#bba764;}</style></defs><g id="Capa_1-2" data-name="Capa 1"><path class="cls-1" d="M35.66,15.81c-.92-.39-1.83-.78-2.69-1.16v-1.41c3.32-.37,5.89-3.18,5.89-6.6,0-3.67-2.97-6.64-6.64-6.64s-6.58,2.92-6.64,6.54c-.27.24-.52.52-.71.87-1.13,2.08.47,4.5,2.56,5.98,1.13.8,2.52,1.52,4.04,2.23v17.23c-4.72,1.3-8.79,2.71-9.5,5.35-.41,1.51.3,3.16,2.18,5.03.15.15.34.22.53.22s.38-.07.53-.22c.29-.29.29-.77,0-1.06-1.44-1.44-2.04-2.64-1.79-3.58.49-1.82,4.04-3.07,8.05-4.19v22.74c0,8.26-6.72,14.99-14.99,14.99s-14.98-6.72-14.98-14.99v-21.11l5.08,5.08c.29.29.77.29,1.06,0s.29-.77,0-1.06l-6.36-6.36c-.21-.21-.54-.28-.82-.16-.28.12-.46.39-.46.69v22.92c0,9.09,7.39,16.49,16.48,16.49s16.49-7.4,16.49-16.49v-23.15c.41-.11.81-.22,1.22-.32,6.6-1.75,13.42-3.55,13.42-8.05,0-4.74-6.07-7.32-11.95-9.81ZM28.3,12.17c-1.17-.83-2.2-2.05-2.28-3.15.87,2.27,2.95,3.95,5.45,4.23v.71c-1.2-.58-2.28-1.16-3.17-1.79ZM33.8,32.22c-.28.07-.56.15-.83.22v-16.15c.69.3,1.39.6,2.11.9,5.42,2.3,11.03,4.68,11.03,8.43,0,3.34-6.54,5.08-12.3,6.6Z"/></g></svg>`;
  const baytripIcon = `<svg id="Capa_2" data-name="Capa 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57.86 61.31"><defs><style>.cls-1{fill:#bba764;}</style></defs><g id="Capa_1-2" data-name="Capa 1"><path class="cls-1" d="M57.11,31.46h-8.75c-.12-.41-.24-.82-.38-1.2-.05-.15-.11-.3-.17-.45l4.05-4.05c.29-.29.29-.77,0-1.06s-.77-.29-1.06,0l-4.39,4.39s0,0,0,0l-2.57,2.57c-.07.07-.12.15-.16.24-.08.18-.08.39,0,.57.08.18.22.33.41.41.09.04.19.06.29.06h2.83c.03.14.07.27.1.42.66,3.37.38,6.85-.81,10.08-.23.62-.45,1.13-.69,1.61-1.87,3.94-5.09,7.11-9.06,8.94-.52.25-1.05.46-1.61.65-.81.29-1.7.53-2.64.72-.92.18-1.86.28-2.79.32V17.58h7.4c.41,0,.75-.34.75-.75s-.34-.75-.75-.75h-7.4v-3.79c3.03-.4,5.37-2.98,5.37-6.12,0-3.41-2.77-6.17-6.17-6.17s-6.18,2.77-6.18,6.17c0,3.17,2.4,5.79,5.48,6.13v3.77h-7.51c-.41,0-.75.34-.75.75s.34.75.75.75h7.51v38.12c-1.96-.07-3.92-.44-5.78-1.13-.64-.25-1.15-.46-1.62-.69-3.94-1.88-7.11-5.1-8.93-9.06-.27-.57-.48-1.09-.66-1.62-.29-.81-.53-1.7-.72-2.64-.5-2.54-.46-5.12.09-7.6h2.94c.1,0,.19-.02.29-.06.18-.08.33-.22.41-.41.08-.18.08-.39,0-.57-.04-.09-.09-.17-.16-.24l-2.66-2.66s0,0,0,0l-4.31-4.31c-.29-.29-.77-.29-1.06,0s-.29.77,0,1.06l3.97,3.97c-.22.57-.41,1.14-.57,1.72H.75c-.41,0-.75.34-.75.75s.34.75.75.75h8.28c-.52,2.59-.55,5.26-.03,7.89.2,1.01.46,1.98.77,2.84.19.57.43,1.15.72,1.76,1.96,4.27,5.38,7.74,9.64,9.78.5.24,1.05.48,1.74.74,2.04.75,4.16,1.14,6.31,1.22v3.37c0,.41.34.75.75.75s.75-.34.75-.75v-3.38c1.03-.04,2.06-.14,3.08-.34,1.02-.2,1.98-.46,2.85-.78.6-.2,1.19-.44,1.75-.71,4.28-1.97,7.75-5.4,9.77-9.64.26-.52.5-1.08.75-1.75,1.29-3.49,1.59-7.25.88-10.89,0-.04-.02-.08-.03-.13h8.39c.41,0,.75-.34.75-.75s-.34-.75-.75-.75ZM24.2,6.17c0-2.58,2.1-4.67,4.68-4.67s4.67,2.1,4.67,4.67-2.1,4.67-4.67,4.67-4.68-2.1-4.68-4.67ZM11.13,30.9l.56.56h-.73c.06-.19.12-.37.18-.56ZM46.17,31.46l.47-.47c.05.15.1.31.15.47h-.62Z"/></g></svg>`;

  if (name.includes("SNORKEL")) return snorkelIcon;
  if (name.includes("SUNSET")) return sunsetIcon;
  if (name.includes("FISHING")) return fishingIcon;
  return baytripIcon; // default for YACHT, PRIVATE, BAYTRIP, BIRTHDAY
}

function renderReservationTemplate(reservation) {
  // Get food description from menu options
  const foodDescription = getFoodDescription(reservation.foodOption);
  // Format date
  // Use parseLocalDate from storage.js to prevent timezone offset issues
  const date = parseLocalDate(reservation.reservationDate);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Format time
  const time = reservation.reservationTime || "11:00";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const isPM = hour >= 12;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  const endHourRaw = hour + (parseInt(reservation.reservationHours) || 4);
  const isEndPM = endHourRaw >= 12 && endHourRaw < 24;
  const displayEndHour =
    endHourRaw > 12 ? endHourRaw - 12 : endHourRaw === 0 ? 12 : endHourRaw;
  const timeStr = `${displayHour}:${minutes} ${isPM ? "PM" : "AM"} — ${displayEndHour}:${minutes} ${isEndPM ? "PM" : "AM"}`;

  // Get values
  const adults = parseInt(reservation.adults) || 0;
  const kids = parseInt(reservation.kids) || 0;
  const infants = parseInt(reservation.infants) || 0;
  const extraPax = parseInt(reservation.extraPax) || 0;
  const totalPax = adults + kids + infants;
  const passengersOver14 = Math.max(0, totalPax - 14);
  const totalExtraPassengers = passengersOver14 + extraPax;
  const hoursVal = parseInt(reservation.reservationHours) || 4;
  const rate = parseFloat(reservation.hourlyRate) || 600;
  const basePrice = rate * hoursVal;
  const extraFee = parseFloat(reservation.extraPassengerFee) || 100;
  const extraCost = totalExtraPassengers * extraFee;
  const extraCostAmount = parseFloat(reservation.extraCostAmount) || 0;
  const priceAdjustment = parseFloat(reservation.priceAdjustment) || 0;
  const total =
    parseFloat(reservation.totalPrice) ||
    basePrice + extraCost + extraCostAmount + priceAdjustment;
  const deposit = parseFloat(reservation.deposit) || 0;
  const balance = total - deposit;

  // Get agent name
  const agentNames = { IG: "Ivan Gonzalez", DR: "Daniel Rios" };
  const agentName = agentNames[reservation.agentCode] || "Ivan Gonzalez";

  return `
    <div class="side-sheet-header" style="justify-content: space-between; align-items: center; width: 100%;">
      <div class="view-toggle" style="margin: 0; transform: scale(0.9); transform-origin: left center;">
        <button class="toggle-btn ${reservation.status === "completed" ? "" : "active"}" data-button-name="status-pending" data-res="${reservation.id}" data-scope="status-toggle" aria-label="Mark as pending">
          <span>Pending</span>
        </button>
        <button class="toggle-btn ${reservation.status === "completed" ? "active" : ""}" data-button-name="status-completed" data-res="${reservation.id}" data-scope="status-toggle" aria-label="Mark as completed">
          <span>Completed</span>
        </button>
        <div class="toggle-slider ${reservation.status === "completed" ? "cards-view" : "list-view"}"></div>
      </div>
      <div class="side-sheet-actions">
        <button class="action-btn print-btn" data-button-name="print" data-scope="action-button" aria-label="Print reservation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Print
        </button>
        <button class="action-btn edit-btn" data-button-name="edit" data-res="${reservation.id}" data-scope="action-button" aria-label="Edit reservation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Edit
        </button>
        <button class="action-btn delete-btn" data-button-name="delete" data-res="${reservation.id}" data-scope="action-button" aria-label="Delete reservation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Delete
        </button>
      </div>
    </div>
    <div class="page">
      <!-- HEADER -->
      <div class="header">
        <div class="logo-box">
          <img src="https://www.loveshackcruises.com/wp-content/uploads/2025/06/newLogo.png" alt="Loveshack Cruises" />
        </div>
        <div class="center-header">
          <div class="tour-title"><div class="tour-name">${reservation.tourName || "SNORKEL"}</div>&nbsp;TOUR <div class="tour-icon">${getTourIcon(reservation.tourName)}</div></div>
        </div>
        <div class="right-header">
          <div class="reservation-number">Reservation: ${reservation.folio || reservation.id}</div>
          Office México: 01-52- 624-105-1238<br />
          Cell Phone: 011-52-624-157-2797
        </div>
      </div>

      <!-- ADDRESS -->
      <div class="address-bar">
        Office Address: Plaza Náutica Loc. E1-B Cabo San Lucas CSL CP: 23450<br />
        e-mail: booking@loveshackcruises.com &nbsp;&nbsp; website: www.loveshackcruises.com
      </div>

      <!-- CLIENT INFO -->
      <div class="info-grid">
        <span class="info-label">Contact:</span>
        <span class="info-value">${reservation.contactName || agentName}</span>
        <span></span><span></span>

        <span class="info-label">Name:</span>
        <span class="info-value gold">${reservation.guestName || "N/A"}</span>
        <span class="info-label" style="text-align: right; padding-right: 4px">Phone:</span>
        <span class="info-value">${reservation.contactPhone || ""}</span>

        <span></span><span></span>
        <span class="info-label" style="text-align: right; padding-right: 4px">Email:</span>
        <span class="info-value">${reservation.contactEmail || ""}</span>

        <span class="info-label">Source:</span>
        <span class="info-value">${reservation.reservationSource || "Contacto Directo"}</span>
        <span></span><span></span>
      </div>

      <!-- RESERVATION DETAILS -->
      <div class="res-details">
        <span class="res-label">Reservation:</span>
        <span class="res-value">${reservation.folio || reservation.id}</span>
        <span class="res-label">Food:</span>
        <span class="res-value">${reservation.foodOption || "MEXICAN BUFFET & NATIONAL OPEN BAR"}</span>

        <span class="res-label">Date:</span>
        <span class="res-value">${dateStr}</span>
        <span class="res-label">Notes:</span>
        <span class="res-value">${reservation.notes || ""}</span>

        <span class="res-label">Time:</span>
        <span class="res-value">${timeStr}</span>
        <span></span><span class="res-value"></span>

        <span class="res-label">Hours:</span>
        <span class="res-value" >${hoursVal} HOURS</span>
        <span></span><span></span>

        <span class="res-label">Tour Name:</span>
        <span class="res-value">${reservation.tourName || "SNORKEL"}</span>
        <span></span><span></span>
      </div>

      <!-- PASSENGERS -->
      <div class="passengers-row">
        <span class="res-label">Passengers:</span>
        <span class="res-value" style="text-align: center">${totalPax} PPL</span>
        <div class="pax-cell">${adults}<br />ADULTS</div>
        <div class="pax-cell">${kids}<br />KIDS</div>
        <div class="pax-cell">${infants}<br />INFANTS</div>
        <div class="pax-cell">${extraPax || "—"}<br />EXTRA PP</div>
      </div>

      <div class="hotel-row"><strong>Hotel:</strong> ${reservation.hotel || ""}</div>

      <!-- NOTICE -->
      <div class="notice-box">
        <div style="font-weight: 700;">Please be at our dock 10 minutes before departure.</div>
        <div>We are located at Blue Marlin Dock #3, next to Breathless Hotel, at the Marina Fundadores</div>
        <div>Don't forget to bring your swimwear, comfortable shoes, sandals, no high heels, sun protection and towels. Wheelchair is not allowed,</div>
        <div>*This trip does not include transportation.</div>
        ${
          reservation.crewTipsEnabled === "on"
            ? `
        <div>
          <span class="crew">CREW TIPS ARE NOT INCLUDED.</span>
          <span style="font-weight: 700">15% to 20% of the total price is recommended.</span>
        </div>
        `
            : ""
        }
      </div>

      <!-- MAIN TABLE -->
      <div class="main-table">
        <div class="left-col">
          <span class="col-title">Reservation payments:</span>

          <div class="payment-row">
            <span style="color: #555">Hourly Rate (up to 14 pax):</span>
            <span>US${rate} / hr</span>
          </div>
          ${
            totalExtraPassengers > 0
              ? `
          <div class="payment-row">
            <span style="color: #555">Extra passengers (${totalExtraPassengers}):</span>
            <span>US${extraCost.toFixed(2)}</span>
          </div>
          `
              : ""
          }
          ${
            extraCostAmount > 0
              ? `
          <!--div class="payment-row">
            <span style="color: #555">Additional charges:</span>
            <span>US${extraCostAmount.toFixed(2)}</span>
          </div>-->
          `
              : ""
          }
          ${
            priceAdjustment !== 0
              ? `
          <div class="payment-row">
            <span style="color: #555">Price Adjustment ${reservation.priceAdjustmentNote ? `(${reservation.priceAdjustmentNote})` : ""}:</span>
            <span>US${priceAdjustment > 0 ? "+" : ""}${priceAdjustment.toFixed(2)}</span>
          </div>
          `
              : ""
          }
          <div class="payment-row">
            
          </div>

          <div class="pricing-breakdown">
            <div class="breakdown-title">Price Breakdown</div>
            <div class="breakdown-row">
              <span>Total hours — ${hoursVal} hrs × ${rate}</span><span>${basePrice.toFixed(2)}</span>
            </div>
            ${
              passengersOver14 > 0 || extraPax > 0
                ? `
            <div class="breakdown-row">
              <span>Extra passengers (${totalExtraPassengers} × ${extraFee})</span><span>${extraCost.toFixed(2)}</span>
            </div>
            ${passengersOver14 > 0 ? `<div class="breakdown-row" style="font-size: 0.85em; color: #666; padding-left: 12px;"><span>  (${passengersOver14} over 14 pax + ${extraPax} extra)</span></div>` : ""}
            `
                : ""
            }
            ${
              extraCostAmount > 0
                ? `
            <div class="breakdown-row">
              <span>Fees</span><span>${extraCostAmount.toFixed(2)}</span>
            </div>
            `
                : ""
            }
            ${
              priceAdjustment !== 0
                ? `
            <div class="breakdown-row">
              <span>Price Adjustment ${reservation.priceAdjustmentNote ? `(${reservation.priceAdjustmentNote})` : ""}</span><span>${priceAdjustment > 0 ? "+" : ""}${priceAdjustment.toFixed(2)}</span>
            </div>
            `
                : ""
            }
            <div class="breakdown-row">
              <span>Food & Beverage (included)</span><span>—</span>
            </div>
            <div class="breakdown-row total">
              <span>TOTAL</span>
              <span class="amount">${total.toFixed(2)} USD</span>
            </div>
          </div>

          <div class="payment-row">
            <span>Amount:</span>
            <span class="amount">$${total.toFixed(2)} USD</span>
          </div>
          <div class="payment-row">
            <span>Deposit ${deposit > 0 ? "(50%)" : ""}: </span>
            <span class="amount">${deposit > 0 ? "$" + deposit.toFixed(2) : ""}</span>
          </div>
          <div class="payment-row">
            <span>Balance:</span>
            <span class="amount">$${balance.toFixed(2)} USD</span>
          </div>

          <div class="balance-warning">
            REMAINING BALANCE MUST BE PAID AT<br />THE CHECK-IN WITH ${reservation.paymentMethod || "CASH"}.
          </div>
        </div>

        <div class="right-col">
          <span class="col-title">THIS TRIP INCLUDE:</span>
          <div class="include-text">
            ${formatFoodDescription(foodDescription)}
            <p><strong>Cancellations:</strong></p>
            <p class="no-show">NO SHOW, NO REFUND</p>
            

             <div class="extras-row">
               <div>
                 <div class="extra-item">Extra Pax: <span>${(parseFloat(reservation.extraPassengerFee) || 100).toFixed(2)}</span></div>
                 <div class="extra-item">Loss of equipment: <span>$40.00</span></div>
               </div>
               <div>
                 <div class="extra-item">Extra hour: <span>${rate.toFixed(2)}</span></div>
               </div>
             </div>

             <!-- Photographer Notice -->
             <div style="margin-top: 12px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9; font-size: 10px; line-height: 1.5;">
               <div style="font-weight: 700; margin-bottom: 4px;">📷 To preserve the memory of your trip, we have a photographer on board.</div>
               <div>Photos are not included in the price and are optional for clients to purchase.</div>
             </div>
           </div>
         </div>
      </div>

      <!-- BOTTOM -->
      <div class="bottom-row">
        <div class="bottom-cell"><em>Amount:</em> &nbsp; $${total.toFixed(2)} USD</div>
        ${deposit > 0 ? `<div class="bottom-cell"><em>Deposit Paid:</em> &nbsp; $${deposit.toFixed(2)} USD</div>` : `<div class="bottom-cell"><em>Balance:</em> &nbsp; $${balance.toFixed(2)} USD</div>`}
      </div>

      <div class="payment-method">
        Payment method of this charter: &nbsp;<strong>${reservation.paymentMethod || "CASH"}</strong>
      </div>

      <!-- FOOTER -->
      <div class="footer">
        Thank you for choosing Love Shack Cruises!
        We look forward to seeing you on board!
      </div>
    </div>
  `;
}

// ==================== EDIT & DELETE FUNCTIONS ====================

/**
 * Current editing reservation ID (null for new reservation)
 */
let editingId = null;

/**
 * Edit an existing reservation
 * @param {string} id - Reservation ID
 */
function editReservation(id) {
  const reservation = getReservationById(id);

  if (!reservation) {
    alert("Reservation not found");
    return;
  }

  // Close side sheet
  closeSideSheet();

  // Set editing ID
  editingId = id;

  // Open modal with data
  openModalForEdit(reservation);
}

/**
 * Open modal for editing a reservation
 * @param {Object} reservation - Reservation data
 */
function openModalForEdit(reservation) {
  elements.reservationModal.classList.add("open");
  document.body.style.overflow = "hidden";

  // Change modal title
  const modalTitle =
    elements.reservationModal.querySelector(".modal-header h2");
  if (modalTitle) {
    modalTitle.textContent = "Edit Reservation";
  }

  // Change submit button text
  const submitBtn = elements.reservationForm.querySelector(
    'button[type="submit"]',
  );
  if (submitBtn) {
    submitBtn.textContent = "Update Reservation";
  }

  // Fill form with reservation data
  document.getElementById("contactName").value = reservation.contactName || "";
  document.getElementById("contactPhone").value =
    reservation.contactPhone || "";
  document.getElementById("contactEmail").value =
    reservation.contactEmail || "";
  document.getElementById("reservationSource").value =
    reservation.reservationSource || "Contacto Directo";
  document.getElementById("guestName").value = reservation.guestName || "";
  document.getElementById("tourName").value = reservation.tourName || "SNORKEL";
  document.getElementById("reservationDate").value =
    reservation.reservationDate || "";
  document.getElementById("reservationTime").value =
    reservation.reservationTime || "11:00";
  document.getElementById("reservationHours").value =
    reservation.reservationHours || 4;
  document.getElementById("agentCode").value = reservation.agentCode || "IG";
  document.getElementById("adults").value = reservation.adults || 1;
  document.getElementById("kids").value = reservation.kids || 0;
  document.getElementById("infants").value = reservation.infants || 0;
  document.getElementById("extraPax").value = reservation.extraPax || 0;
  document.getElementById("foodOption").value =
    reservation.foodOption || "MEXICAN BUFFET & NATIONAL OPEN BAR";
  document.getElementById("hotel").value = reservation.hotel || "";
  document.getElementById("hourlyRate").value = reservation.hourlyRate || 600;
  document.getElementById("extraPassengerFee").value =
    reservation.extraPassengerFee || 100;
  document.getElementById("extraCostAmount").value =
    reservation.extraCostAmount || 0;
  if (document.getElementById("priceAdjustment")) {
    document.getElementById("priceAdjustment").value =
      reservation.priceAdjustment !== undefined
        ? reservation.priceAdjustment
        : "";
  }
  if (document.getElementById("priceAdjustmentNote")) {
    document.getElementById("priceAdjustmentNote").value =
      reservation.priceAdjustmentNote || "";
  }
  document.getElementById("deposit").value = reservation.deposit || 0;
  document.getElementById("notes").value = reservation.notes || "";
  document.getElementById("paymentMethod").value =
    reservation.paymentMethod || "CASH";

  // Calculate pricing
  calculateFormPricing();

  // Focus first field
  document.getElementById("contactName").focus();
}

/**
 * Delete reservation with double verification
 * @param {string} id - Reservation ID
 */
function deleteReservationPrompt(id) {
  const reservation = getReservationById(id);

  if (!reservation) {
    alert("Reservation not found");
    return;
  }

  const guestName = reservation.guestName || "this reservation";
  const folio = reservation.folio || id;

  // First confirmation
  const firstConfirm = confirm(
    `Are you sure you want to delete the reservation for ${guestName} (${folio})?\n\nClick OK to proceed with deletion or Cancel to abort.`,
  );

  if (!firstConfirm) {
    return;
  }

  // Second confirmation with warning
  const secondConfirm = confirm(
    `⚠️ WARNING: This action cannot be undone!\n\nYou are about to permanently delete the reservation for ${guestName} (${folio}).\n\nAre you absolutely sure?`,
  );

  if (!secondConfirm) {
    return;
  }

  // Perform deletion
  const success = deleteReservation(id);

  if (success) {
    // Reload and render
    loadReservations();
    renderReservations();
    closeSideSheet();

    alert(`Reservation for ${guestName} has been deleted.`);
    console.log("Reservation deleted:", folio);
  } else {
    alert("Error deleting reservation. Please try again.");
  }
}

/**
 * Populate form dropdowns with menu options from JSON
 */
function populateFormOptions() {
  if (!menuOptions) return;

  // Food Options (with descriptions)
  const foodOptionSelect = document.getElementById("foodOption");
  if (foodOptionSelect && menuOptions.foodOptions) {
    while (foodOptionSelect.options.length > 1) {
      foodOptionSelect.remove(1);
    }
    menuOptions.foodOptions.forEach((option) => {
      const opt = document.createElement("option");
      // Handle both string and object formats
      const name = typeof option === "string" ? option : option.name;
      const description = typeof option === "object" ? option.description : "";
      opt.value = name;
      opt.textContent = name;
      opt.dataset.description = description || "";
      foodOptionSelect.appendChild(opt);
    });
  }

  // Tour Names
  const tourNameSelect = document.getElementById("tourName");
  if (tourNameSelect && menuOptions.tourNames) {
    while (tourNameSelect.options.length > 1) {
      tourNameSelect.remove(1);
    }
    menuOptions.tourNames.forEach((option) => {
      const opt = document.createElement("option");
      const name = typeof option === "string" ? option : option.name;
      opt.value = name;
      opt.textContent = name;
      tourNameSelect.appendChild(opt);
    });
    // Add event listener for tour name to auto-set hours and food option for Fishing tours
    if (tourNameSelect) {
      tourNameSelect.addEventListener("change", handleTourNameChange);
    }
  }

  // Reservation Sources (with pricing)
  const sourceSelect = document.getElementById("reservationSource");
  if (sourceSelect && menuOptions.reservationSources) {
    while (sourceSelect.options.length > 1) {
      sourceSelect.remove(1);
    }
    menuOptions.reservationSources.forEach((option) => {
      const opt = document.createElement("option");
      // Handle both string and object formats
      const name = typeof option === "string" ? option : option.name;
      const percentage =
        typeof option === "object" ? option.percentage || "0%" : "0%";
      const hourlyRate =
        typeof option === "object" ? option.hourlyRate || "600" : "600";
      const extraFee =
        typeof option === "object" ? option.extraPassengerFee || "100" : "100";

      opt.value = name;
      opt.textContent = `${name} (${percentage})`;
      opt.dataset.percentage = percentage;
      opt.dataset.hourlyRate = hourlyRate;
      opt.dataset.extraPassengerFee = extraFee;
      sourceSelect.appendChild(opt);
    });

    // Add event listener for source selection to auto-fill pricing
    sourceSelect.addEventListener("change", handleSourceChange);
  }

  // Payment Methods
  const paymentSelect = document.getElementById("paymentMethod");
  if (paymentSelect && menuOptions.paymentMethods) {
    while (paymentSelect.options.length > 1) {
      paymentSelect.remove(1);
    }
    menuOptions.paymentMethods.forEach((option) => {
      const opt = document.createElement("option");
      const name = typeof option === "string" ? option : option.name;
      opt.value = name;
      opt.textContent = name;
      paymentSelect.appendChild(opt);
    });
  }

  console.log("Form options populated from JSON:", menuOptions);
}

/**
 * Handle tour name change - auto-configure Fishing tours
 * Sets hours and food option based on Half Day (5hrs) or Full Day (8hrs) selection.
 */
function handleTourNameChange() {
  const tourNameSelect = document.getElementById("tourName");
  const hoursSelect = document.getElementById("reservationHours");
  const foodSelect = document.getElementById("foodOption");

  if (!tourNameSelect || !hoursSelect || !foodSelect) return;

  const selected = tourNameSelect.value;

  if (selected === "FISHING HALF DAY") {
    hoursSelect.value = "5";
    foodSelect.value = "FISHING HALF DAY MENU";
    calculateFormPricing();
  } else if (selected === "FISHING FULL DAY") {
    hoursSelect.value = "8";
    foodSelect.value = "FISHING FULL DAY MENU";
    calculateFormPricing();
  }
}

function handleSourceChange() {
  const sourceSelect = document.getElementById("reservationSource");
  const hourlyRateInput = document.getElementById("hourlyRate");
  const extraFeeInput = document.getElementById("extraPassengerFee");

  if (!sourceSelect || !hourlyRateInput || !extraFeeInput) return;

  const selectedOption = sourceSelect.options[sourceSelect.selectedIndex];
  if (selectedOption && selectedOption.dataset.hourlyRate) {
    hourlyRateInput.value = selectedOption.dataset.hourlyRate;
    extraFeeInput.value = selectedOption.dataset.extraPassengerFee;
    // Recalculate pricing
    calculateFormPricing();
  }
}

/**
 * Update sync status indicator in header
 * @param {Object} syncResult - Result from initializeAutoSync
 */
function updateSyncStatusIndicator(syncResult) {
  const syncOkIcon = document.getElementById("syncOkIcon");
  const syncWarnIcon = document.getElementById("syncWarnIcon");
  const syncStatus = document.getElementById("syncStatus");

  if (!syncOkIcon || !syncWarnIcon || !syncStatus) return;

  if (syncResult.hasWarnings) {
    syncOkIcon.style.display = "none";
    syncWarnIcon.style.display = "block";
    syncStatus.title = `⚠️ ${syncResult.warnings.length} aviso(s) de sincronización`;
  } else {
    syncOkIcon.style.display = "block";
    syncWarnIcon.style.display = "none";
    syncStatus.title = "✓ Sincronizado";
  }
}

// ==================== JSON FILE OPERATIONS ====================

/**
 * Handle Export JSON button click
 */
function handleExportJson() {
  const success = exportReservationsToFile();
  if (success) {
    const count = getReservations().length;
    alert(`Successfully exported ${count} reservation(s) to JSON file.`);
  } else {
    alert("Error exporting reservations. Please try again.");
  }
}

/**
 * Handle Import JSON button click
 */
function handleImportJson() {
  triggerImportDialog(async (file) => {
    const result = await importReservationsFromFile(file);

    if (result.success) {
      // Reload and render
      loadReservations();
      renderReservations();
      alert(
        `Successfully imported ${result.count} reservation(s) from JSON file.`,
      );
    } else {
      alert(`Error importing reservations: ${result.error}`);
    }
  });
}

/**
 * Handle Sync JSON button click - compares localStorage vs JSON file
 */
function handleSyncJson() {
  triggerImportDialog(async (file) => {
    const result = await importAndCompareReservations(file);

    if (!result.success) {
      alert(`Error reading file: ${result.error}`);
      return;
    }

    const comparison = result.comparison;

    if (!comparison.hasWarnings) {
      // No warnings - data is in sync
      alert(
        `✓ Reservations are in sync!\n\nLocal: ${comparison.localCount} | JSON: ${comparison.jsonCount}`,
      );
      return;
    }

    // Show warnings
    const message = generateSyncWarningMessage(comparison);
    const fullMessage =
      `⚠️ SYNC WARNINGS DETECTED\n\n` +
      `LocalStorage: ${comparison.localCount} reservations\n` +
      `JSON File: ${comparison.jsonCount} reservations\n\n` +
      message +
      `\n\n` +
      `Do you want to overwrite localStorage with the JSON data?`;

    const overwrite = confirm(fullMessage);

    if (overwrite) {
      // Import JSON data into localStorage
      const localReservations = getReservations();
      const merged = [...localReservations];

      comparison.onlyInJson.forEach((jsonRes) => {
        if (
          !merged.find((m) => m.id === jsonRes.id || m.folio === jsonRes.folio)
        ) {
          merged.push(jsonRes);
        }
      });

      const success = saveReservations(merged);
      if (success) {
        loadReservations();
        renderReservations();
        alert(
          `Sync complete! LocalStorage now has ${merged.length} reservations.`,
        );
      } else {
        alert("Error saving merged data.");
      }
    }
  });
}

// ==================== INITIALIZE ====================
// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

/**
 * Update reservation status from the side sheet toggle
 * @param {string} id - Reservation ID
 * @param {string} newStatus - New status ('pending' or 'completed')
 */
window.updateStatusFromSheet = function (id, newStatus) {
  const reservation = reservations.find((r) => r.id === id);
  if (!reservation) return;

  if (reservation.status !== newStatus) {
    reservation.status = newStatus;
    if (typeof updateReservation === "function") {
      updateReservation(id, reservation);
      loadReservations();
      renderReservations();
      openSideSheet(id);
    }
  }
};

/**
 * Print the current reservation
 */
function printReservation() {
  window.print();
}
