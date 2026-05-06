/**
 * Step 1 — Quick Pricing Screen — Love Shack v3
 * Inspired by the Pricing Calculator interface.
 */

const Step1Screen = {
  container: null,
  reservationId: null,
  calculator: null,

  // Picker state
  picker: {
    mode: "duration", // 'duration' or 'passengers'
    isSyncing: false,
    itemHeight: 54,
    stepAngle: 22, // Matches pricing-calculator STEP_ANGLE
    config: {
      duration: { min: 2, max: 8 },
      passengers: { min: 1, max: 55 },
    },
  },

  render(container, params) {
    this.container = container;
    this.reservationId = params.id;

    if (!this.calculator && window.PricingCalculator && window.PRICING_RULES) {
      this.calculator = new window.PricingCalculator(window.PRICING_RULES);
    }

    const reservation = window.Storage.getReservation(this.reservationId);
    if (!reservation) {
      window.App.navigate("#/dashboard");
      return;
    }

    const s1 = reservation.data.step1_pricing || {};
    const duration = s1.durationHours || 3;
    const passengers = s1.passengers || 14;
    const pricingType = s1.pricingType || "regular";
    const source = s1.source || "direct";

    const price = this.calculatePrice(
      duration,
      passengers,
      pricingType,
      source,
    );

    container.innerHTML = `
      <div class="step-content stagger-children" style="padding-bottom: 300px;">
        
        <!-- Trip Summary & Breakdown (NOW AT TOP) -->
        <div class="trip-summary" data-duration="${duration}" data-passengers="${passengers}" style="position: relative; margin-top: 10px; margin-bottom: 20px;">
          <input type="checkbox" role="status" id="pricingDisplay" hide style="display: none;">
          <label for="pricingDisplay" class="pricing-display">
            <div class="pricing-row">
              <span class="pricing-label">Base Rate</span>
              <span class="pricing-value" id="baseRate">$${price.hourlyRate}/hr</span>
            </div>
            <div class="pricing-row">
              <span class="pricing-label">Duration</span>
              <span class="pricing-value" id="displayDuration">${duration} hrs</span>
            </div>
            <div class="pricing-row">
              <span class="pricing-label">Passengers</span>
              <span class="pricing-value" id="displayPassengers">${passengers}</span>
            </div>
            <div class="pricing-row state-managed" id="extraPassengersRow" data-state="${price.extraPassengers > 0 ? "visible" : "hidden"}">
              <span class="pricing-label">Extra pax (<span id="extraCount">${price.extraPassengers}</span>)</span>
              <span class="pricing-value" id="extraPassengerCost">+$${price.extraPassengerCharge}</span>
            </div>
            <div class="pricing-row state-managed" id="feeRow" data-state="hidden">
              <span class="pricing-label" id="feeLabel">Fee</span>
              <span class="pricing-value" id="feeCost">+$0</span>
            </div>
            <div id="businessTotalRow" class="pricing-row" style="border-bottom: none; margin-top: 8px; padding-top: 12px">
              <span class="pricing-label">Total Business</span>
              <span class="pricing-value" id="businessTotal">${this.formatCurrency(price.subtotal)}</span>
            </div>
             <div class="pricing-row" id="customerTotalRow">
               <span class="pricing-label">Total Customer</span>
               <span class="pricing-total" id="customerTotal">${this.formatCurrency(price.subtotal)}</span>
             </div>
          </label>
        </div>

      </div>

      <!-- Thumb Zone: Pinned controls (Source, Pricing Type, Duration/Pax) -->
      <div class="thumb-zone">
        <div class="thumb-zone-controls">
          <!-- Source Selector -->
          <div class="custom-select-wrapper" id="sourceSelect" style="margin-bottom: 12px;">
            <input type="hidden" id="source" data-field="source" value="${source}">
            <div class="custom-select-trigger" id="sourceTrigger">
              <input type="text" class="custom-select-input" id="sourceInput" placeholder="Select Source" value="${this.getSourceLabel(source)}" autocomplete="off" autocapitalize="none">
              <svg class="custom-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="custom-select-dropdown">
              <div class="custom-select-options" id="sourceOptions">
                ${this.renderSourceOptions(source)}
              </div>
            </div>
          </div>

          <!-- Pricing Type Toggle -->
          <div class="pricing-type-toggle-container" style="margin-bottom: 12px;">
            <button class="pricing-type-tab ${pricingType === "regular" ? "active" : ""}" data-value="regular">Regular Price</button>
            <button class="pricing-type-tab ${pricingType === "snack" ? "active" : ""}" data-value="snack">Snack Price</button>
          </div>

          <div class="summary-details">
            <div class="summary-item" data-trigger="duration">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <div class="summary-value">
                <span id="summaryDuration">${duration}</span>
                <span class="summary-label">HRS</span>
              </div>
            </div>
            <div class="summary-item" data-trigger="passengers">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <div class="summary-value">
                <span id="summaryPassengers">${passengers}</span>
                <span class="summary-label">PAX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>

      <!-- Bottom Sheet Picker -->
      <div class="sheet-overlay" id="sheetOverlay"></div>
      <div class="bottom-sheet" id="bottomSheet" data-open="false">
        <div class="sheet-header">
          <div class="drag-handle"></div>
          <button class="close-sheet-btn" id="closeSheetBtn">×</button>
          <div class="sheet-title" id="sheetTitle">Select</div>
        </div>
        
           <div class="picker-container" id="pickerContainer">
           <div class="visor"></div>
           <input type="number" id="manualInput" class="manual-input" inputmode="numeric" autocomplete="off">
           <div class="input-trigger" onclick="manualInput.focus()"></div>
           <div class="unit-label" id="unitLabel">hrs</div>
          
          <div class="wheel-3d" id="wheel3d">
            <!-- Items injected by JS -->
          </div>
          
          <div class="scroll-wrapper" id="scrollWrapper">
            <div class="scroll-list" id="scrollList">
              <!-- Spacer items injected by JS -->
            </div>
          </div>
        </div>

        <button class="done-btn" id="doneBtn">Confirm</button>
      </div>
    `;

    this.bindEvents();
    this.recalculate();
  },

   bindEvents() {
     const self = this; // Capture component instance
     
     // Expose manualInput globally for inline onclick (matches pricing-calculator pattern)
     window.manualInput = document.getElementById('manualInput');
     console.log('[Step1] window.manualInput set:', !!window.manualInput);
     
     // Pricing Type
     this.container.querySelectorAll('.pricing-type-tab').forEach(tab => {
       tab.addEventListener('click', () => {
         self.container.querySelectorAll('.pricing-type-tab').forEach(t => t.classList.remove('active'));
         tab.classList.add('active');
         self.recalculate();
       });
     });

     const sourceTrigger = document.getElementById('sourceTrigger');
     const sourceSelect = document.getElementById('sourceSelect');
     const sourceInput = document.getElementById('sourceInput');

     sourceTrigger?.addEventListener('click', (e) => {
       e.stopPropagation();
       sourceSelect.classList.add('open');
       sourceInput.focus();
     });
     
     sourceInput?.addEventListener('focus', () => {
       sourceSelect.classList.add('open');
       sourceInput.value = '';
       sourceInput.dispatchEvent(new Event('input'));
     });

     sourceInput?.addEventListener('input', (e) => {
       const val = e.target.value.toLowerCase();
       self.container.querySelectorAll('.custom-select-option').forEach(opt => {
         const text = opt.textContent.toLowerCase();
         if (text.includes(val)) {
           opt.style.display = 'flex';
         } else {
           opt.style.display = 'none';
         }
       });
     });

     document.addEventListener('click', (e) => {
       if (!e.target.closest('#sourceSelect') && sourceSelect?.classList.contains('open')) {
         sourceSelect.classList.remove('open');
         const currentVal = document.getElementById('source').value;
         sourceInput.value = self.getSourceLabel(currentVal);
         self.container.querySelectorAll('.custom-select-option').forEach(opt => opt.style.display = 'flex');
       }
     });

     self.container.querySelectorAll('.custom-select-option').forEach(opt => {
       opt.addEventListener('click', () => {
         const val = opt.dataset.value;
         const text = opt.textContent.trim();
         document.getElementById('source').value = val;
         sourceInput.value = text;
         
         self.container.querySelectorAll('.custom-select-option').forEach(o => {
           o.classList.remove('selected');
           opt.style.display = 'flex';
         });
         opt.classList.add('selected');
         sourceSelect.classList.remove('open');
         self.recalculate();
       });
     });

     // Picker Triggers
     self.container.querySelector('[data-trigger="duration"]')?.addEventListener('click', () => self.openPicker('duration'));
     self.container.querySelector('[data-trigger="passengers"]')?.addEventListener('click', () => self.openPicker('passengers'));

     // Picker specific events
     document.getElementById('sheetOverlay')?.addEventListener('click', () => self.closePicker());
     document.getElementById('closeSheetBtn')?.addEventListener('click', () => self.closePicker());
     document.getElementById('doneBtn')?.addEventListener('click', () => self.closePicker());

     // Multi-digit number buffer state
     let digitBuffer = '';
     let digitBufferTimer = null;

     // Keyboard support for bottom sheet
     document.addEventListener('keydown', (e) => {
       const isOpen = document.getElementById('bottomSheet')?.getAttribute('data-open') === 'true';
       if (!isOpen) return;

       // Escape closes the sheet and clears any pending buffer
       if (e.key === 'Escape') {
         if (digitBufferTimer) clearTimeout(digitBufferTimer);
         digitBuffer = '';
         self.closePicker();
         return;
       }

       const conf = self.picker.config[self.picker.mode];
       const summaryEl = document.getElementById(`summary${self.capitalize(self.picker.mode)}`);

       // Number keys 0-9: multi-digit buffer input
       if (e.key >= '0' && e.key <= '9') {
         e.preventDefault();

         // Append digit to buffer
         digitBuffer += e.key;

         // Parse provisional value
         const provisional = parseInt(digitBuffer);

         // Only apply if within valid range
         if (provisional >= conf.min && provisional <= conf.max) {
           summaryEl.textContent = provisional;
           self.syncPickerToValue(provisional);
           self.recalculate();
         }

         // Reset timer
         if (digitBufferTimer) clearTimeout(digitBufferTimer);

         // After 500ms of inactivity, commit the buffered value
         digitBufferTimer = setTimeout(() => {
           const finalVal = parseInt(digitBuffer);
           if (finalVal >= conf.min && finalVal <= conf.max) {
             summaryEl.textContent = finalVal;
             self.syncPickerToValue(finalVal);
             self.recalculate();
           }
           digitBuffer = '';
         }, 500);

         return;
       }

       // Arrow keys: increment/decrement (clear buffer first)
       if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
         if (digitBufferTimer) clearTimeout(digitBufferTimer);
         digitBuffer = '';

         const currentVal = parseInt(summaryEl.textContent) || conf.min;
         let newVal = currentVal;

         if (e.key === 'ArrowUp') {
           e.preventDefault();
           newVal = Math.min(currentVal + 1, conf.max);
         } else if (e.key === 'ArrowDown') {
           e.preventDefault();
           newVal = Math.max(currentVal - 1, conf.min);
         }

         if (newVal !== currentVal) {
           summaryEl.textContent = newVal;
           self.syncPickerToValue(newVal);
           self.recalculate();
         }
         return;
       }
     });

     const scrollWrapper = document.getElementById('scrollWrapper');
     const manualInput = document.getElementById('manualInput');
     window.manualInput = manualInput; // Expose globally for inline onclick
     
     // Haptic feedback for scroll
     let lastScrollIdx = -1;
     scrollWrapper?.addEventListener('scroll', () => {
       if (self.picker.isSyncing) return;
       const progress = scrollWrapper.scrollTop / self.picker.itemHeight;
       const activeIndex = Math.round(progress);
       const conf = self.picker.config[self.picker.mode];
       const val = activeIndex + conf.min;

       self.updateWheelRotation(progress);
       self.updateActiveClasses(val);
       
       if (val >= conf.min && val <= conf.max) {
         document.getElementById(`summary${self.capitalize(self.picker.mode)}`).textContent = val;
         self.recalculate();
       }

       if (activeIndex !== lastScrollIdx && activeIndex >= 0 && activeIndex <= conf.max - conf.min) {
         if (navigator.vibrate) navigator.vibrate(8);
         lastScrollIdx = activeIndex;
       }
     });

     if (manualInput) {
       manualInput.addEventListener('focus', () => {
         const val = document.getElementById(`summary${self.capitalize(self.picker.mode)}`).textContent;
         manualInput.value = val;
         document.getElementById('pickerContainer').setAttribute('data-input-state', 'typing');
       });

        manualInput.addEventListener('keydown', (e) => {
          console.log('[Step1] manualInput keydown:', e.key, 'code:', e.code, 'keyCode:', e.keyCode);
          if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            console.log('[Step1] Enter detected on manualInput, closing picker');
            // Clear any pending buffer
            if (digitBufferTimer) clearTimeout(digitBufferTimer);
            digitBuffer = '';
            manualInput.blur();
            self.closePicker();
          }
        });

       manualInput.addEventListener('blur', () => {
         // Cancel any pending buffer commit
         if (digitBufferTimer) clearTimeout(digitBufferTimer);
         digitBuffer = '';

         const summaryEl = document.getElementById(`summary${self.capitalize(self.picker.mode)}`);
         let val = parseInt(summaryEl.textContent);
         const conf = self.picker.config[self.picker.mode];

         if (isNaN(val)) val = conf.min;
         if (val < conf.min) val = conf.min;
         if (val > conf.max) val = conf.max;

         document.getElementById('pickerContainer').removeAttribute('data-input-state');
         self.syncPickerToValue(val);
         summaryEl.textContent = val;
         manualInput.value = val;
         self.recalculate();
       });
     }
   },

  openPicker(mode) {
    this.picker.mode = mode;
    const isDuration = mode === "duration";
    const conf = this.picker.config[mode];

    document.getElementById("sheetTitle").textContent = isDuration
      ? "Duration"
      : "Passengers";
    document.getElementById("unitLabel").textContent = isDuration
      ? "hrs"
      : "pax";

    // Build wheel items
    const wheel = document.getElementById("wheel3d");
    const scrollList = document.getElementById("scrollList");
    wheel.innerHTML = "";
    scrollList.innerHTML = "";

    const count = conf.max - conf.min + 1;
    for (let i = 0; i < count; i++) {
      const val = conf.min + i;
      // Wheel item
      const item = document.createElement("div");
      item.className = "wheel-item";
      item.setAttribute("data-wheel-value", val);
      item.setAttribute("data-wheel-active", "false");
      item.textContent = val;
      item.style.setProperty("--angle", i * this.picker.stepAngle);
      wheel.appendChild(item);

      // Scroll item
      const scroller = document.createElement("div");
      scroller.className = "scroll-item";
      scrollList.appendChild(scroller);
    }

    // Current val
    const currentVal =
      parseInt(
        document.getElementById(`summary${this.capitalize(mode)}`).textContent,
      ) || conf.min;

    // Open sheet
    document
      .getElementById("sheetOverlay")
      .setAttribute("data-visible", "true");
    document.getElementById("bottomSheet").setAttribute("data-open", "true");

    // Sync to current val
    setTimeout(() => {
      this.syncPickerToValue(currentVal);
    }, 10);
  },

  closePicker() {
    document
      .getElementById("sheetOverlay")
      .setAttribute("data-visible", "false");
    document.getElementById("bottomSheet").setAttribute("data-open", "false");
  },

  syncPickerToValue(val) {
    this.picker.isSyncing = true;
    const conf = this.picker.config[this.picker.mode];
    const targetScroll = (val - conf.min) * this.picker.itemHeight;

    document.getElementById("scrollWrapper").scrollTop = targetScroll;
    this.updateWheelRotation(val - conf.min);
    this.updateActiveClasses(val);

    setTimeout(() => {
      this.picker.isSyncing = false;
    }, 50);
  },

  updateWheelRotation(progress) {
    const wheel = document.getElementById("wheel3d");
    if (wheel) {
      wheel.style.transform = `rotateX(${progress * this.picker.stepAngle}deg)`;
    }
  },

  updateActiveClasses(activeVal) {
    const items = document.querySelectorAll(".wheel-item");
    const conf = this.picker.config[this.picker.mode];
    items.forEach((item) => {
      const val = parseInt(item.dataset.wheelValue);
      item.removeAttribute("data-wheel-active");
      item.removeAttribute("data-wheel-nearby");

      const distance = Math.abs(val - activeVal);
      if (distance === 0) {
        item.setAttribute("data-wheel-active", "true");
      } else if (distance === 1) {
        item.setAttribute("data-wheel-nearby", "1");
      } else if (distance === 2) {
        item.setAttribute("data-wheel-nearby", "2");
      }
    });
  },

  recalculate() {
    const duration =
      parseInt(document.getElementById("summaryDuration")?.textContent) || 3;
    const passengers =
      parseInt(document.getElementById("summaryPassengers")?.textContent) || 14;
    const activeType = this.container.querySelector(".pricing-type-tab.active");
    const pricingType = activeType?.dataset.value || "regular";
    const source = document.getElementById("source")?.value || "direct";

    const price = this.calculatePrice(
      duration,
      passengers,
      pricingType,
      source,
    );

    // Update displays
    document.getElementById("displayDuration").textContent = `${duration} hrs`;
    document.getElementById("displayPassengers").textContent = passengers;
    document.getElementById("baseRate").textContent = `$${price.hourlyRate}/hr`;

    // Extra pax row
    const extraRow = document.getElementById("extraPassengersRow");
    if (price.extraPassengers > 0) {
      extraRow.setAttribute("data-state", "visible");
      document.getElementById("extraCount").textContent = price.extraPassengers;
      document.getElementById("extraPassengerCost").textContent =
        `+$${price.extraPassengerCharge}`;
    } else {
      extraRow.setAttribute("data-state", "hidden");
    }

    // Totals
    document.getElementById("businessTotal").textContent = this.formatCurrency(
      price.subtotal,
    );
    document.getElementById("customerTotal").textContent = this.formatCurrency(
      price.subtotal,
    ); // Update logic if fee applies

    this.autoSave();
  },

  autoSave() {
    const duration =
      parseInt(document.getElementById("summaryDuration")?.textContent) || 3;
    const passengers =
      parseInt(document.getElementById("summaryPassengers")?.textContent) || 14;
    const activeType = this.container.querySelector(".pricing-type-tab.active");
    const pricingType = activeType?.dataset.value || "regular";
    const source = document.getElementById("source")?.value || "direct";

    const price = this.calculatePrice(
      duration,
      passengers,
      pricingType,
      source,
    );

    this.saveStep(duration, passengers, pricingType, source, price);
    window.Storage.updateCurrentStep(this.reservationId, 1);
  },

  calculatePrice(duration, passengers, pricingType, source) {
    if (this.calculator) {
      // If we want full calculator support
      const result = this.calculator.calculateBasePrice(
        { duration, adults: passengers },
        pricingType,
        source,
      );
      return result;
    }
    // Fallback
    const rate = pricingType === "snack" ? 450 : 600;
    const extraRate = pricingType === "snack" ? 75 : 100;
    const extraPax = Math.max(0, passengers - 14);
    const base = duration * rate;
    const extra = extraPax * extraRate;
    return {
      baseTripCost: base,
      hourlyRate: rate,
      duration,
      passengers,
      extraPassengers: extraPax,
      extraPassengerCharge: extra,
      subtotal: base + extra,
    };
  },

   saveStep(duration, passengers, pricingType, source, price) {
     const s1Data = {
       pricingType,
       source,
       durationHours: duration,
       passengers,
       extraPassengers: price.extraPassengers,
       hourlyRate: price.hourlyRate,
       baseTripCost: price.baseTripCost,
       extraPassengerCharge: price.extraPassengerCharge,
       estimatedSubtotal: price.subtotal,
     };
     window.Storage.updateReservation(this.reservationId, "step1_pricing", s1Data);
     
     // Mirror source to step3_adjustments for cross-step sync
     const reservation = window.Storage.getReservation(this.reservationId);
     if (reservation && reservation.data.step3_adjustments) {
       window.Storage.updateReservation(this.reservationId, "step3_adjustments", {
         ...reservation.data.step3_adjustments,
         bookingSource: source,
       });
     }
   },

  getSourceLabel(val) {
    const sources = {
      direct: "📞 Direct - Call",
      "get-my-boat": "🐬 Get My Boat",
      viator: "✈️ Viator",
      fareharbor: "🚦 Fareharbor",
      "travel-cabo-tours": "🌴 Travel Cabo Tours",
      "anchor-rides": "⚓ Anchor Rides",
      "andres-lopez": "👤 Andres Lopez",
      "mauricio-bojorquez": "👤 Mauricio Bojorquez",
      "jose-ferron": "👤 Jose Ferron",
      "ramiro-munguia": "👤 Ramiro Munguia",
      "adriana-transcabo": "👩 Adriana Transcabo",
      "grand-solmar": "🏨 Grand Solmar",
      "eduardo-araujo": "👤 Eduardo Araujo",
    };
    return sources[val] || sources["direct"];
  },

  renderSourceOptions(current) {
    const sources = [
      { id: "direct", label: "📞 Direct - Call" },
      { id: "get-my-boat", label: "🐬 Get My Boat" },
      { id: "viator", label: "✈️ Viator" },
      { id: "fareharbor", label: "🚦 Fareharbor" },
      { id: "travel-cabo-tours", label: "🌴 Travel Cabo Tours" },
      { id: "anchor-rides", label: "⚓ Anchor Rides" },
      { id: "andres-lopez", label: "👤 Andres Lopez" },
      { id: "mauricio-bojorquez", label: "👤 Mauricio Bojorquez" },
      { id: "jose-ferron", label: "👤 Jose Ferron" },
      { id: "ramiro-munguia", label: "👤 Ramiro Munguia" },
      { id: "adriana-transcabo", label: "👩 Adriana Transcabo" },
      { id: "grand-solmar", label: "🏨 Grand Solmar" },
      { id: "eduardo-araujo", label: "👤 Eduardo Araujo" },
    ];
    return sources
      .map(
        (s) => `
      <div class="custom-select-option ${s.id === current ? "selected" : ""}" data-value="${s.id}">
        ${s.label}
      </div>
    `,
      )
      .join("");
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  destroy() {
    this.container = null;
    this.reservationId = null;
  },
};

window.Step1Screen = Step1Screen;
