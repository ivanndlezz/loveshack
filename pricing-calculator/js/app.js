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
    ];

    inputs.forEach((input) => {
      input.addEventListener("input", handleInputChange);
      input.addEventListener("change", handleInputChange);
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

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
