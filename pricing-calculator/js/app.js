/**
 * Pricing Calculator App
 * Handles UI interactions and real-time calculations
 */

(function () {
  "use strict";

  // Initialize calculator with rules
  const calculator = new PricingCalculator(window.PRICING_RULES);

  // DOM Elements
  const elements = {
    // Form inputs
    tourType: document.getElementById("tourType"),
    pricingType: document.getElementById("pricingType"),
    duration: document.getElementById("duration"),
    passengers: document.getElementById("passengers"),
    source: document.getElementById("source"),
    fishingLicenses: document.getElementById("fishingLicenses"),
    extrasAmount: document.getElementById("extrasAmount"),
    repriceType: document.getElementById("repriceType"),
    repriceDiscount: document.getElementById("repriceDiscount"),
    discountPrefix: document.getElementById("discountPrefix"),

    // Summary elements
    summaryDuration: document.getElementById("summaryDuration"),
    summaryRate: document.getElementById("summaryRate"),
    durationValue: document.getElementById("durationValue"),
    totalPassengers: document.getElementById("totalPassengers"),
    baseTripPrice: document.getElementById("baseTripPrice"),
    extraPassengersRow: document.getElementById("extraPassengersRow"),
    extraCount: document.getElementById("extraCount"),
    extraPassengerPrice: document.getElementById("extraPassengerPrice"),
    extrasRow: document.getElementById("extrasRow"),
    extrasPrice: document.getElementById("extrasPrice"),
    subtotalPrice: document.getElementById("subtotalPrice"),
    discountRow: document.getElementById("discountRow"),
    discountType: document.getElementById("discountType"),
    discountAmount: document.getElementById("discountAmount"),
    businessPrice: document.getElementById("businessPrice"),
    feeRow: document.getElementById("feeRow"),
    feeSource: document.getElementById("feeSource"),
    feeAmount: document.getElementById("feeAmount"),
    feeNotice: document.getElementById("feeNotice"),
    feeNoticeText: document.getElementById("feeNoticeText"),
    customerPrice: document.getElementById("customerPrice"),

    // Buttons
    resetBtn: document.getElementById("resetBtn"),
    copyBtn: document.getElementById("copyBtn"),

    // Validation
    validationMessages: document.getElementById("validationMessages"),
  };

  /**
   * Initialize the app
   */
  function init() {
    populateFormOptions();
    bindEventListeners();
    updateDurationSlider(); // Initialize slider display
    calculate(); // Initial calculation
    initInquiryManager(); // Initialize inquiry manager
  }

  /**
   * Populate select options from rules
   */
  function populateFormOptions() {
    // Tour Type - now using Tab Group (hardcoded in HTML)

    // Pricing Type - now using Tab Group (hardcoded in HTML)

    // Source Custom Select options
    const sources = calculator.getSources();
    const sourceOptions = document.getElementById("sourceOptions");
    sources.forEach((source) => {
      const option = document.createElement("div");
      option.className = "custom-select-option";
      option.dataset.value = source.id;
      option.innerHTML = `
        <svg class="custom-select-option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        ${source.name}
      `;
      option.onclick = () =>
        selectOptionValue("source", source.id, source.name);
      sourceOptions.appendChild(option);
    });
  }

  /**
   * Bind event listeners to form elements
   */
  function bindEventListeners() {
    // All form inputs trigger recalculation
    const inputs = [
      elements.tourType,
      elements.pricingType,
      elements.duration,
      elements.passengers,
      elements.source,
      elements.fishingLicenses,
      elements.extrasAmount,
      elements.repriceType,
      elements.repriceDiscount,
      // Customer fields
      document.getElementById("customerName"),
      document.getElementById("customerEmail"),
      document.getElementById("customerPhone"),
      document.getElementById("tripDate"),
    ];

    inputs.forEach((input) => {
      if (input) {
        input.addEventListener("input", handleInputChange);
        input.addEventListener("change", handleInputChange);
      }
    });

    // Keyboard shortcuts for desktop
    document.addEventListener("keydown", handleKeyboardShortcuts);

    // Reset button (check if exists)
    if (elements.resetBtn) {
      elements.resetBtn.addEventListener("click", resetForm);
    }

    // Copy button (check if exists)
    if (elements.copyBtn) {
      elements.copyBtn.addEventListener("click", copySummary);
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyboardShortcuts(e) {
    // Check for Ctrl key
    if (!e.ctrlKey && !e.metaKey) return;

    // Don't trigger when typing in inputs
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      // Allow only for arrow keys in number inputs
      if (e.target.type !== "number") return;
    }

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        adjustPassengers(1);
        break;
      case "ArrowDown":
        e.preventDefault();
        adjustPassengers(-1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        adjustDuration(-1);
        break;
      case "ArrowRight":
        e.preventDefault();
        adjustDuration(1);
        break;
    }
  }

  /**
   * Adjust passengers value
   */
  function adjustPassengers(delta) {
    const currentValue = parseInt(elements.passengers.value) || 1;
    const min = parseInt(elements.passengers.min) || 1;
    const max = parseInt(elements.passengers.max) || 50;
    const newValue = Math.max(min, Math.min(max, currentValue + delta));
    elements.passengers.value = newValue;
    calculate();
    showToast(`Passengers: ${newValue}`);
  }

  /**
   * Adjust duration value
   */
  function adjustDuration(delta) {
    const currentValue = parseInt(elements.duration.value) || 3;
    const min = parseInt(elements.duration.min) || 2;
    const max = parseInt(elements.duration.max) || 8;
    const newValue = Math.max(min, Math.min(max, currentValue + delta));
    elements.duration.value = newValue;
    updateDurationSlider();
    calculate();
    showToast(`Duration: ${newValue}h`);
  }

  /**
   * Handle input changes
   */
  function handleInputChange(e) {
    // If duration slider changed, update its display
    if (e.target.id === "duration") {
      updateDurationSlider();
    }
    calculate();
  }

  /**
   * Update duration slider display and background
   */
  function updateDurationSlider() {
    const duration = parseInt(elements.duration.value) || 3;
    const min = parseInt(elements.duration.min) || 2;
    const max = parseInt(elements.duration.max) || 8;

    // Calculate percentage for background gradient
    const percent = ((duration - min) / (max - min)) * 100;
    elements.duration.style.setProperty("--value-percent", `${percent}%`);

    // Update displayed value
    if (elements.durationValue) {
      elements.durationValue.textContent = duration;
    }
  }

  /**
   * Get current form data
   */
  function getFormData() {
    return {
      trip: {
        tourType: elements.tourType.value,
        duration: parseInt(elements.duration.value) || 2,
        adults: parseInt(elements.passengers.value) || 1,
        date: document.getElementById("tripDate")?.value || "",
      },
      customer: {
        name: document.getElementById("customerName")?.value || "",
        email: document.getElementById("customerEmail")?.value || "",
        phone: document.getElementById("customerPhone")?.value || "",
      },
      pricingType: elements.pricingType.value,
      source: elements.source.value,
      extras: {
        fishingLicenses: elements.fishingLicenses.value,
        amount: elements.extrasAmount.value,
      },
      reprice: {
        type: elements.repriceType.value,
        discount: elements.repriceDiscount.value,
      },
    };
  }

  /**
   * Calculate and update display
   */
  function calculate() {
    const data = getFormData();
    const result = calculator.calculate(data);

    updateSummary(result);
    validateForm(data);
  }

  /**
   * Update summary display
   */
  function updateSummary(result) {
    const { basePricing, extrasPricing, reprice, fee, summary } = result;

    // Update total passengers
    elements.totalPassengers.textContent = basePricing.passengers;

    // Update base pricing display
    elements.summaryDuration.textContent = basePricing.duration;
    elements.summaryRate.textContent = calculator.formatCurrency(
      basePricing.hourlyRate,
    );
    elements.baseTripPrice.textContent = calculator.formatCurrency(
      basePricing.baseTripCost,
    );

    // Update sticky bottom bar
    document.getElementById("stickyPassengers").textContent =
      basePricing.passengers;
    document.getElementById("stickyDuration").textContent =
      basePricing.duration;
    document.getElementById("stickyBusinessPrice").textContent =
      calculator.formatCurrency(summary.businessPrice);
    document.getElementById("stickyCustomerPrice").textContent =
      calculator.formatCurrency(summary.customerPrice);

    // Extra passengers
    if (basePricing.extraPassengers > 0) {
      elements.extraPassengersRow.style.display = "flex";
      elements.extraCount.textContent = basePricing.extraPassengers;
      elements.extraPassengerPrice.textContent = calculator.formatCurrency(
        basePricing.extraPassengerCharge,
      );
    } else {
      elements.extraPassengersRow.style.display = "none";
    }

    // Extras
    if (extrasPricing.total > 0) {
      elements.extrasRow.style.display = "flex";
      elements.extrasPrice.textContent = calculator.formatCurrency(
        extrasPricing.total,
      );
    } else {
      elements.extrasRow.style.display = "none";
    }

    // Subtotal
    elements.subtotalPrice.textContent = calculator.formatCurrency(
      summary.subtotal,
    );

    // Discount
    if (summary.discount > 0) {
      elements.discountRow.style.display = "flex";
      elements.discountType.textContent = reprice.repriceType;
      elements.discountAmount.textContent =
        "-" + calculator.formatCurrency(summary.discount);
    } else {
      elements.discountRow.style.display = "none";
    }

    // Business price
    elements.businessPrice.textContent = calculator.formatCurrency(
      summary.businessPrice,
    );

    // Fee
    if (fee.hasFee) {
      elements.feeRow.style.display = "flex";
      elements.feeSource.textContent = fee.sourceName;
      elements.feeAmount.textContent = calculator.formatCurrency(summary.fee);
      elements.feeNotice.style.display = "flex";
      elements.feeNoticeText.textContent = `${fee.sourceName} ${fee.feeNote}`;
    } else {
      elements.feeRow.style.display = "none";
      elements.feeNotice.style.display = "none";
    }

    // Customer price
    elements.customerPrice.textContent = calculator.formatCurrency(
      summary.customerPrice,
    );
  }

  /**
   * Validate form data
   */
  function validateForm(data) {
    const validation = calculator.validate({
      trip: data.trip,
      pricingType: data.pricingType,
      source: data.source,
      reprice: data.reprice,
    });

    if (!validation.isValid) {
      if (elements.validationMessages) {
        elements.validationMessages.style.display = "block";
        elements.validationMessages.innerHTML = validation.errors
          .map((error) => `<div class="validation-message">⚠️ ${error}</div>`)
          .join("");
        elements.validationMessages.classList.remove("success");
        elements.validationMessages.classList.add("error");
      }
    } else {
      if (elements.validationMessages) {
        elements.validationMessages.style.display = "none";
      }
    }
  }

  /**
   * Reset form to defaults
   */
  function resetForm() {
    // Reset form fields
    elements.tourType.value = "";
    elements.pricingType.value = "regular";
    elements.duration.value = "3";
    elements.passengers.value = "14";
    elements.source.value = "direct";
    elements.fishingLicenses.value = "0";
    elements.extrasAmount.value = "0";
    elements.repriceType.value = "";
    elements.repriceDiscount.value = "";

    // Reset customer fields
    document.getElementById("customerName").value = "";
    document.getElementById("customerEmail").value = "";
    document.getElementById("customerPhone").value = "";
    document.getElementById("tripDate").value = "";

    // Reset Tour Type tab
    document.querySelectorAll("#tourTypeTab .tab-option").forEach((btn) => {
      btn.classList.remove("active");
    });

    // Reset Pricing Type tab
    document.querySelectorAll("#pricingTypeTab .tab-option").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector("#pricingTypeTab .tab-option[data-value='regular']")
      .classList.add("active");

    // Reset Reprice Type tab
    document.querySelectorAll("#repriceTypeTab .tab-option").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector("#repriceTypeTab .tab-option[data-value='']")
      .classList.add("active");

    // Reset Source custom select
    document.getElementById("sourceInput").value = "Direct";

    // Reset discount prefix
    elements.discountPrefix.textContent = "$";
    document.getElementById("repriceDiscount").placeholder = "0";

    // Update slider display
    updateDurationSlider();

    // Clear editing state
    clearEditingInquiry();

    // Recalculate
    calculate();

    // Show feedback
    showToast("Form reset");
  }

  /**
   * Copy summary to clipboard
   */
  function copySummary() {
    const data = getFormData();
    const result = calculator.calculate(data);

    const summaryText = generateSummaryText(data, result);

    navigator.clipboard
      .writeText(summaryText)
      .then(() => {
        showToast("Summary copied to clipboard");
      })
      .catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = summaryText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        showToast("Summary copied to clipboard");
      });
  }

  /**
   * Generate summary text for clipboard
   */
  function generateSummaryText(data, result) {
    const { basePricing, extrasPricing, reprice, fee, summary } = result;

    let text = "📋 Reservation Pricing Summary\n";
    text += "═".repeat(30) + "\n\n";

    text += `Tour: ${data.trip.tourType || "Not selected"}\n`;
    text += `Pricing: ${basePricing.pricingTypeName}\n`;
    text += `Duration: ${basePricing.duration} hours\n`;
    text += `Passengers: ${basePricing.passengers}\n`;
    text += `Source: ${basePricing.sourceName}\n\n`;

    text += "Pricing Breakdown:\n";
    text += `  Base Trip: ${calculator.formatCurrency(basePricing.baseTripCost)}\n`;

    if (basePricing.extraPassengers > 0) {
      text += `  Extra Passengers: ${calculator.formatCurrency(basePricing.extraPassengerCharge)}\n`;
    }

    if (extrasPricing.total > 0) {
      text += `  Extra Services: ${calculator.formatCurrency(extrasPricing.total)}\n`;
    }

    text += `  Subtotal: ${calculator.formatCurrency(summary.subtotal)}\n`;

    if (summary.discount > 0) {
      text += `  Discount: -${calculator.formatCurrency(summary.discount)}\n`;
    }

    text += "\n";
    text += `Business Receives: ${calculator.formatCurrency(summary.businessPrice)}\n`;

    if (fee.hasFee) {
      text += `${fee.sourceName} Fee: ${calculator.formatCurrency(summary.fee)}\n`;
      text += `Customer Pays: ${calculator.formatCurrency(summary.customerPrice)}\n`;
    }

    return text;
  }

  /**
   * Show toast notification
   */
  function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector(".toast");
    if (existingToast) {
      existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show
    setTimeout(() => toast.classList.add("show"), 10);

    // Hide after delay
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // ============================================
  // INQUIRY MANAGEMENT FUNCTIONS
  // ============================================

  /**
   * Inquiry Manager Instance
   */
  let inquiryManager = null;

  /**
   * Initialize Inquiry Manager
   */
  function initInquiryManager() {
    if (typeof window.InquiryManager !== "undefined") {
      inquiryManager = new window.InquiryManager();

      // Set up callbacks
      inquiryManager.onChange(updateInquiryCountBadge);
      inquiryManager.onAutoSave((data) => {
        console.log("Auto-saved at", data.timestamp);
      });

      // Restore auto-saved data if exists
      restoreAutoSave();

      // Update count badge
      updateInquiryCountBadge();
    }
  }

  /**
   * Update inquiry count badge
   */
  function updateInquiryCountBadge() {
    const badge = document.getElementById("inquiryCountBadge");
    if (badge && inquiryManager) {
      const count = inquiryManager.getInquiries().length;
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }
  }

  /**
   * Save current form as inquiry/quote
   */
  function saveCurrentQuote() {
    if (!inquiryManager) return;

    const data = getFormData();
    const result = calculator.calculate(data);

    // Prompt for customer name
    const customerName = prompt("Customer name:", data.customer?.name || "");
    if (customerName === null) return; // Cancelled

    const inquiryData = {
      customer: {
        name: customerName,
        email: data.customer?.email || "",
        phone: data.customer?.phone || "",
        language: data.customer?.language || "en",
      },
    };

    // Check if editing existing
    const editingId = document.getElementById("currentInquiryId")?.value;
    if (editingId) {
      inquiryData.id = editingId;
    }

    const id = inquiryManager.saveInquiry(inquiryData, data, result);
    showToast(`Quote saved: ${customerName}`);

    // Update editing state
    setEditingInquiry(id, customerName);

    // Stop auto-save for this quote
    inquiryManager.stopAutoSave();
  }

  /**
   * Load inquiry into form
   */
  function loadInquiry(id) {
    if (!inquiryManager) return;

    const inquiry = inquiryManager.getInquiry(id);
    if (!inquiry) {
      showToast("Quote not found");
      return;
    }

    // Load customer data first
    if (inquiry.customer) {
      if (inquiry.customer.name) {
        document.getElementById("customerName").value = inquiry.customer.name;
      }
      if (inquiry.customer.email) {
        document.getElementById("customerEmail").value = inquiry.customer.email;
      }
      if (inquiry.customer.phone) {
        document.getElementById("customerPhone").value = inquiry.customer.phone;
      }
    }

    // Load trip data
    if (inquiry.trip) {
      if (inquiry.trip.tourType) {
        setTourType(inquiry.trip.tourType);
      }
      if (inquiry.trip.duration) {
        elements.duration.value = inquiry.trip.duration;
        updateDurationSlider();
      }
      if (inquiry.trip.passengers) {
        elements.passengers.value = inquiry.trip.passengers;
      }
      if (inquiry.trip.date) {
        document.getElementById("tripDate").value = inquiry.trip.date;
      }
    }

    // Load pricing data
    if (inquiry.pricing) {
      if (inquiry.pricing.pricingType) {
        setPricingType(inquiry.pricing.pricingType);
      }
      if (inquiry.pricing.source) {
        setSource(inquiry.pricing.source);
      }
      if (inquiry.pricing.extras) {
        if (inquiry.pricing.extras.fishingLicenses) {
          elements.fishingLicenses.value =
            inquiry.pricing.extras.fishingLicenses;
        }
        if (inquiry.pricing.extras.amount !== undefined) {
          elements.extrasAmount.value = inquiry.pricing.extras.amount;
        }
      }
      if (inquiry.pricing.reprice) {
        if (inquiry.pricing.reprice.type) {
          setRepriceType(inquiry.pricing.reprice.type);
        }
        if (inquiry.pricing.reprice.discount) {
          elements.repriceDiscount.value = inquiry.pricing.reprice.discount;
        }
      }
    }

    // Recalculate
    calculate();

    // Set editing state
    setEditingInquiry(inquiry.id, inquiry.customer.name);

    // Close panel if open
    closeInquiryPanel();

    // Start auto-save
    inquiryManager.startAutoSave(getFormData, calculator);

    showToast(`Loaded: ${inquiry.customer.name}`);
  }

  /**
   * Set editing inquiry indicator
   */
  function setEditingInquiry(id, customerName) {
    let indicator = document.getElementById("editingIndicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "editingIndicator";
      indicator.className = "editing-indicator";
      indicator.innerHTML = `<span>Editing: ${customerName}</span><button onclick=\"clearEditingInquiry()\">×</button>`;
      document.querySelector(".calculator-container").prepend(indicator);
    }
    indicator.innerHTML = `<span>Editing: ${customerName}</span><button onclick=\"clearEditingInquiry()\" title=\"Clear editing state\">×</button>`;
    indicator.style.display = "flex";

    // Store current ID
    if (!document.getElementById("currentInquiryId")) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.id = "currentInquiryId";
      input.value = id;
      document.body.appendChild(input);
    } else {
      document.getElementById("currentInquiryId").value = id;
    }
  }

  /**
   * Clear editing state
   */
  function clearEditingInquiry() {
    const indicator = document.getElementById("editingIndicator");
    if (indicator) {
      indicator.style.display = "none";
    }

    const hiddenInput = document.getElementById("currentInquiryId");
    if (hiddenInput) {
      hiddenInput.remove();
    }

    // Stop auto-save
    if (inquiryManager) {
      inquiryManager.stopAutoSave();
    }
  }

  /**
   * Open inquiry panel
   */
  function openInquiryPanel() {
    const panel = document.getElementById("inquiryPanel");
    if (panel) {
      panel.classList.add("open");
      renderInquiryList();
    }
  }

  /**
   * Close inquiry panel
   */
  function closeInquiryPanel() {
    const panel = document.getElementById("inquiryPanel");
    if (panel) {
      panel.classList.remove("open");
    }
  }

  /**
   * Toggle inquiry panel
   */
  function toggleInquiryPanel() {
    const panel = document.getElementById("inquiryPanel");
    if (panel && panel.classList.contains("open")) {
      closeInquiryPanel();
    } else {
      openInquiryPanel();
    }
  }

  /**
   * Render inquiry list
   */
  function renderInquiryList() {
    const container = document.getElementById("inquiryListContainer");
    if (!container || !inquiryManager) return;

    const inquiries = inquiryManager.getInquiries({ sortBy: "date" });

    if (inquiries.length === 0) {
      container.innerHTML =
        '<div class="inquiry-empty">' +
        '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
        '<polyline points="14 2 14 8 20 8"/>' +
        '<line x1="12" y1="18" x2="12" y2="12"/>' +
        '<line x1="9" y1="15" x2="15" y2="15"/>' +
        "</svg>" +
        "<p>No saved quotes yet</p>" +
        "<small>Save a quote to see it here</small>" +
        "</div>";
      return;
    }

    container.innerHTML = inquiries
      .map((inq) => {
        const name = inq.customer.name || "Unnamed";
        const tour = inq.trip.tourType || "No tour";
        const price = calculator.formatCurrency(inq.result.customerPrice || 0);
        const date = formatDate(inq.createdAt);
        const id = inq.id;
        const status = inq.status;

        return (
          '<div class="inquiry-card" data-id="' +
          id +
          '" onclick="loadInquiry(\'' +
          id +
          "')\">" +
          '<div class="inquiry-card-header">' +
          '<span class="inquiry-customer">' +
          name +
          "</span>" +
          '<span class="inquiry-status status-' +
          status +
          '">' +
          status +
          "</span>" +
          "</div>" +
          '<div class="inquiry-card-body">' +
          '<div class="inquiry-tour">' +
          tour +
          "</div>" +
          '<div class="inquiry-meta">' +
          "<span>" +
          inq.trip.passengers +
          " ppl</span>" +
          "<span>" +
          inq.trip.duration +
          "h</span>" +
          "</div>" +
          '<div class="inquiry-price">' +
          price +
          "</div>" +
          "</div>" +
          '<div class="inquiry-card-footer">' +
          '<span class="inquiry-date">' +
          date +
          "</span>" +
          '<div class="inquiry-actions">' +
          "<button onclick=\"event.stopPropagation(); duplicateInquiry('" +
          id +
          '\')" title="Duplicate">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
          '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
          "</svg>" +
          "</button>" +
          "<button onclick=\"event.stopPropagation(); exportInquiry('" +
          id +
          '\')" title="Export">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>' +
          '<polyline points="7 10 12 15 17 10"/>' +
          '<line x1="12" y1="15" x2="12" y2="3"/>' +
          "</svg>" +
          "</button>" +
          "<button onclick=\"event.stopPropagation(); deleteInquiry('" +
          id +
          '\')" title="Delete" class="delete-btn">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<polyline points="3 6 5 6 21 6"/>' +
          '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
          "</svg>" +
          "</button>" +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  /**
   * Format date for display
   */
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Duplicate inquiry
   */
  function duplicateInquiry(id) {
    if (!inquiryManager) return;

    const newInquiry = inquiryManager.duplicateInquiry(id);
    if (newInquiry) {
      loadInquiry(newInquiry.id);
      showToast("Quote duplicated");
    }
  }

  /**
   * Delete inquiry
   */
  function deleteInquiry(id) {
    if (!inquiryManager) return;

    if (confirm("Delete this quote?")) {
      const deleted = inquiryManager.deleteInquiry(id);
      if (deleted) {
        renderInquiryList();
        updateInquiryCountBadge();
        showToast("Quote deleted");

        // Clear editing if this was being edited
        const editingId = document.getElementById("currentInquiryId")?.value;
        if (editingId === id) {
          clearEditingInquiry();
        }
      }
    }
  }

  /**
   * Export single inquiry
   */
  function exportInquiry(id) {
    if (!inquiryManager) return;

    const inquiry = inquiryManager.getInquiry(id);
    if (inquiry) {
      const json = JSON.stringify(inquiry, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `quote-${inquiry.customer.name || "unnamed"}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("Quote exported");
    }
  }

  /**
   * Export all inquiries
   */
  function exportAllInquiries() {
    if (!inquiryManager) return;
    inquiryManager.downloadExport();
    showToast("All quotes exported");
  }

  /**
   * Import inquiries
   */
  function importInquiries() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = inquiryManager.importFromJSON(event.target.result);
          if (result.success) {
            showToast(`Imported ${result.imported} quotes`);
            renderInquiryList();
            updateInquiryCountBadge();
          } else {
            showToast("Import failed: " + result.error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  /**
   * Restore auto-saved data
   */
  function restoreAutoSave() {
    if (!inquiryManager) return;

    const autoSave = inquiryManager.getAutoSave();
    if (autoSave && confirm("Found auto-saved data. Restore it?")) {
      // Load basic data
      if (autoSave.formData) {
        const data = autoSave.formData;
        if (data.trip) {
          if (data.trip.duration) {
            elements.duration.value = data.trip.duration;
            updateDurationSlider();
          }
          if (data.trip.passengers) {
            elements.passengers.value = data.trip.passengers;
          }
        }
        if (data.pricingType) {
          setPricingType(data.pricingType);
        }
        calculate();
      }
      showToast("Auto-save restored");
    }

    // Clear auto-save after restore attempt
    if (autoSave) {
      inquiryManager.clearAutoSave();
    }
  }

  /**
   * Update inquiry status
   */
  function updateInquiryStatus(id, status) {
    if (!inquiryManager) return;
    inquiryManager.updateStatus(id, status);
    renderInquiryList();
  }

  // Helper functions for setting values
  function setTourType(value) {
    const btn = document.querySelector(
      `#tourTypeTab .tab-option[data-value="${value}"]`,
    );
    if (btn) {
      selectTourType(value, btn);
    }
  }

  function setPricingType(value) {
    const btn = document.querySelector(
      `#pricingTypeTab .tab-option[data-value="${value}"]`,
    );
    if (btn) {
      selectPricingType(value, btn);
    }
  }

  function setSource(value) {
    const hiddenInput = document.getElementById("source");
    hiddenInput.value = value;
    document.getElementById("sourceInput").value =
      document
        .querySelector(`.custom-select-option[data-value="${value}"]`)
        ?.textContent?.trim() || "";
  }

  function setRepriceType(value) {
    const btn = document.querySelector(
      `#repriceTypeTab .tab-option[data-value="${value}"]`,
    );
    if (btn) {
      selectRepriceType(value, btn);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// ============================================
// INQUIRY MANAGEMENT FUNCTIONS
// ============================================

/**
 * Inquiry Manager Instance
 */
let inquiryManager = null;

/**
 * Initialize Inquiry Manager
 */
function initInquiryManager() {
  if (typeof window.InquiryManager !== "undefined") {
    inquiryManager = new window.InquiryManager();

    // Set up callbacks
    inquiryManager.onChange(updateInquiryCountBadge);
    inquiryManager.onAutoSave((data) => {
      console.log("Auto-saved at", data.timestamp);
    });

    // Restore auto-saved data if exists
    restoreAutoSave();

    // Update count badge
    updateInquiryCountBadge();
  }
}

/**
 * Update inquiry count badge
 */
function updateInquiryCountBadge() {
  const badge = document.getElementById("inquiryCountBadge");
  if (badge && inquiryManager) {
    const count = inquiryManager.getInquiries().length;
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
}

/**
 * Save current form as inquiry/quote
 */
function saveCurrentQuote() {
  if (!inquiryManager) return;

  const data = getFormData();
  const result = calculator.calculate(data);

  // Prompt for customer name
  const customerName = prompt("Customer name:", data.customer?.name || "");
  if (customerName === null) return; // Cancelled

  const inquiryData = {
    customer: {
      name: customerName,
      email: data.customer?.email || "",
      phone: data.customer?.phone || "",
      language: data.customer?.language || "en",
    },
  };

  // Check if editing existing
  const editingId = document.getElementById("currentInquiryId")?.value;
  if (editingId) {
    inquiryData.id = editingId;
  }

  const id = inquiryManager.saveInquiry(inquiryData, data, result);
  showToast(`Quote saved: ${customerName}`);

  // Update editing state
  setEditingInquiry(id, customerName);

  // Stop auto-save for this quote
  inquiryManager.stopAutoSave();
}

/**
 * Load inquiry into form
 */
function loadInquiry(id) {
  if (!inquiryManager) return;

  const inquiry = inquiryManager.getInquiry(id);
  if (!inquiry) {
    showToast("Quote not found");
    return;
  }

  // Load customer data first
  if (inquiry.customer) {
    if (inquiry.customer.name) {
      document.getElementById("customerName").value = inquiry.customer.name;
    }
    if (inquiry.customer.email) {
      document.getElementById("customerEmail").value = inquiry.customer.email;
    }
    if (inquiry.customer.phone) {
      document.getElementById("customerPhone").value = inquiry.customer.phone;
    }
  }

  // Load trip data
  if (inquiry.trip) {
    if (inquiry.tourType) {
      setTourType(inquiry.trip.tourType);
    }
    if (inquiry.trip.duration) {
      elements.duration.value = inquiry.trip.duration;
      updateDurationSlider();
    }
    if (inquiry.trip.passengers) {
      elements.passengers.value = inquiry.trip.passengers;
    }
    if (inquiry.trip.date) {
      document.getElementById("tripDate").value = inquiry.trip.date;
    }
  }

  // Load pricing data
  if (inquiry.pricing) {
    if (inquiry.pricing.pricingType) {
      setPricingType(inquiry.pricing.pricingType);
    }
    if (inquiry.pricing.source) {
      setSource(inquiry.pricing.source);
    }
    if (inquiry.pricing.extras) {
      if (inquiry.pricing.extras.fishingLicenses) {
        elements.fishingLicenses.value = inquiry.pricing.extras.fishingLicenses;
      }
      if (inquiry.pricing.extras.amount !== undefined) {
        elements.extrasAmount.value = inquiry.pricing.extras.amount;
      }
    }
    if (inquiry.pricing.reprice) {
      if (inquiry.pricing.reprice.type) {
        setRepriceType(inquiry.pricing.reprice.type);
      }
      if (inquiry.pricing.reprice.discount) {
        elements.repriceDiscount.value = inquiry.pricing.reprice.discount;
      }
    }
  }

  // Recalculate
  calculate();

  // Set editing state
  setEditingInquiry(inquiry.id, inquiry.customer.name);

  // Close panel if open
  closeInquiryPanel();

  // Start auto-save
  inquiryManager.startAutoSave(getFormData, calculator);

  showToast(`Loaded: ${inquiry.customer.name}`);
}

/**
 * Set editing inquiry indicator
 */
function setEditingInquiry(id, customerName) {
  let indicator = document.getElementById("editingIndicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "editingIndicator";
    indicator.className = "editing-indicator";
    indicator.innerHTML = `<span>Editing: ${customerName}</span><button onclick="clearEditingInquiry()">×</button>`;
    document.querySelector(".calculator-container").prepend(indicator);
  }
  indicator.innerHTML = `<span>Editing: ${customerName}</span><button onclick="clearEditingInquiry()" title="Clear editing state">×</button>`;
  indicator.style.display = "flex";

  // Store current ID
  if (!document.getElementById("currentInquiryId")) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.id = "currentInquiryId";
    input.value = id;
    document.body.appendChild(input);
  } else {
    document.getElementById("currentInquiryId").value = id;
  }
}

/**
 * Clear editing state
 */
function clearEditingInquiry() {
  const indicator = document.getElementById("editingIndicator");
  if (indicator) {
    indicator.style.display = "none";
  }

  const hiddenInput = document.getElementById("currentInquiryId");
  if (hiddenInput) {
    hiddenInput.remove();
  }

  // Stop auto-save
  if (inquiryManager) {
    inquiryManager.stopAutoSave();
  }
}

/**
 * Open inquiry panel
 */
function openInquiryPanel() {
  const panel = document.getElementById("inquiryPanel");
  if (panel) {
    panel.classList.add("open");
    renderInquiryList();
  }
}

/**
 * Close inquiry panel
 */
function closeInquiryPanel() {
  const panel = document.getElementById("inquiryPanel");
  if (panel) {
    panel.classList.remove("open");
  }
}

/**
 * Toggle inquiry panel
 */
function toggleInquiryPanel() {
  const panel = document.getElementById("inquiryPanel");
  if (panel && panel.classList.contains("open")) {
    closeInquiryPanel();
  } else {
    openInquiryPanel();
  }
}

/**
 * Render inquiry list
 */
function renderInquiryList() {
  const container = document.getElementById("inquiryListContainer");
  if (!container || !inquiryManager) return;

  const inquiries = inquiryManager.getInquiries({ sortBy: "date" });

  if (inquiries.length === 0) {
    container.innerHTML = `
      <div class="inquiry-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <p>No saved quotes yet</p>
        <small>Save a quote to see it here</small>
      </div>
    `;
    return;
  }

  container.innerHTML = inquiries
    .map(
      (inq) => `
    <div class="inquiry-card" data-id="${inq.id}" onclick="loadInquiry('${inq.id}')">
      <div class="inquiry-card-header">
        <span class="inquiry-customer">${inq.customer.name || "Unnamed"}</span>
        <span class="inquiry-status status-${inq.status}">${inq.status}</span>
      </div>
      <div class="inquiry-card-body">
        <div class="inquiry-tour">${inq.trip.tourType || "No tour"}</div>
        <div class="inquiry-meta">
          <span>${inq.trip.passengers} ppl</span>
          <span>${inq.trip.duration}h</span>
        </div>
        <div class="inquiry-price">
          ${calculator.formatCurrency(inq.result.customerPrice || 0)}
        </div>
      </div>
      <div class="inquiry-card-footer">
        <span class="inquiry-date">${formatDate(inq.createdAt)}</span>
        <div class="inquiry-actions">
          <button onclick="event.stopPropagation(); duplicateInquiry('${inq.id}')" title="Duplicate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button onclick="event.stopPropagation(); exportInquiry('${inq.id}')" title="Export">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
          <button onclick="event.stopPropagation(); deleteInquiry('${inq.id}')" title="Delete" class="delete-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString();
}

/**
 * Duplicate inquiry
 */
function duplicateInquiry(id) {
  if (!inquiryManager) return;

  const newInquiry = inquiryManager.duplicateInquiry(id);
  if (newInquiry) {
    loadInquiry(newInquiry.id);
    showToast("Quote duplicated");
  }
}

/**
 * Delete inquiry
 */
function deleteInquiry(id) {
  if (!inquiryManager) return;

  if (confirm("Delete this quote?")) {
    const deleted = inquiryManager.deleteInquiry(id);
    if (deleted) {
      renderInquiryList();
      updateInquiryCountBadge();
      showToast("Quote deleted");

      // Clear editing if this was being edited
      const editingId = document.getElementById("currentInquiryId")?.value;
      if (editingId === id) {
        clearEditingInquiry();
      }
    }
  }
}

/**
 * Export single inquiry
 */
function exportInquiry(id) {
  if (!inquiryManager) return;

  const inquiry = inquiryManager.getInquiry(id);
  if (inquiry) {
    const json = JSON.stringify(inquiry, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `quote-${inquiry.customer.name || "unnamed"}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Quote exported");
  }
}

/**
 * Export all inquiries
 */
function exportAllInquiries() {
  if (!inquiryManager) return;
  inquiryManager.downloadExport();
  showToast("All quotes exported");
}

/**
 * Import inquiries
 */
function importInquiries() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = inquiryManager.importFromJSON(event.target.result);
        if (result.success) {
          showToast(`Imported ${result.imported} quotes`);
          renderInquiryList();
          updateInquiryCountBadge();
        } else {
          showToast("Import failed: " + result.error);
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

/**
 * Restore auto-saved data
 */
function restoreAutoSave() {
  if (!inquiryManager) return;

  const autoSave = inquiryManager.getAutoSave();
  if (autoSave && confirm("Found auto-saved data. Restore it?")) {
    // Load basic data
    if (autoSave.formData) {
      const data = autoSave.formData;
      if (data.trip) {
        if (data.trip.duration) {
          elements.duration.value = data.trip.duration;
          updateDurationSlider();
        }
        if (data.trip.passengers) {
          elements.passengers.value = data.trip.passengers;
        }
      }
      if (data.pricingType) {
        setPricingType(data.pricingType);
      }
      calculate();
    }
    showToast("Auto-save restored");
  }

  // Clear auto-save after restore attempt
  if (autoSave) {
    inquiryManager.clearAutoSave();
  }
}

/**
 * Update inquiry status
 */
function updateInquiryStatus(id, status) {
  if (!inquiryManager) return;
  inquiryManager.updateStatus(id, status);
  renderInquiryList();
}

// Helper functions for setting values
function setTourType(value) {
  const btn = document.querySelector(
    `#tourTypeTab .tab-option[data-value="${value}"]`,
  );
  if (btn) {
    selectTourType(value, btn);
  }
}

function setPricingType(value) {
  const btn = document.querySelector(
    `#pricingTypeTab .tab-option[data-value="${value}"]`,
  );
  if (btn) {
    selectPricingType(value, btn);
  }
}

function setSource(value) {
  const hiddenInput = document.getElementById("source");
  hiddenInput.value = value;
  document.getElementById("sourceInput").value =
    document
      .querySelector(`.custom-select-option[data-value="${value}"]`)
      ?.textContent?.trim() || "";
}

function setRepriceType(value) {
  const btn = document.querySelector(
    `#repriceTypeTab .tab-option[data-value="${value}"]`,
  );
  if (btn) {
    selectRepriceType(value, btn);
  }
}
