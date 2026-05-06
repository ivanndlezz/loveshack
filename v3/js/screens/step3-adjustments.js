/**
 * Step 3 — Adjustments & Booking Screen — Love Shack v3
 * Source, discounts, extras, full breakdown, confirm booking
 */

const Step3Screen = {
  container: null,
  reservationId: null,
  calculator: null,

   render(container, params) {
     this.container = container;
     this.reservationId = params.id;

     if (!this.calculator && window.PricingCalculator && window.PRICING_RULES) {
       this.calculator = new window.PricingCalculator(window.PRICING_RULES);
     }

     const reservation = window.Storage.getReservation(this.reservationId);
     if (!reservation) {
       window.App.navigate('#/dashboard');
       return;
     }

     const s1 = reservation.data.step1_pricing;
     const s2 = reservation.data.step2_details;
     const s3 = reservation.data.step3_adjustments || {};
     
     let source = s1?.source || s3.bookingSource || 'direct';
     
     if (s1 && !s1.source && s3.bookingSource) {
       s1.source = s3.bookingSource;
       window.Storage.updateReservation(this.reservationId, 'step1_pricing', s1);
     }

     const isBooked = reservation.status !== 'draft';
     const sources = window.PRICING_RULES?.sources || [
       { id: 'direct', name: '📞 Direct - Call' },
       { id: 'get-my-boat', name: '🐬 Get My Boat' },
       { id: 'viator', name: '✈️ Viator' },
     ];

     const foodOptions = window.PRICING_RULES?.foodOptions || [
       { name: "MEXICAN BUFFET & NATIONAL OPEN BAR" },
       { name: "CHICKEN & VEGETARIAN MENU WITH NATIONAL OPEN BAR" },
       { name: "TACOS & NATIONAL OPEN BAR" },
       { name: "SNACKS & NATIONAL OPEN BAR" }
     ];

    const repriceTypes = [
      { code: '', label: 'None' },
      { code: '%', label: '% Percentage' },
      { code: '#', label: '$ Fixed Discount' },
      { code: '$', label: '$ Fixed Price' },
      { code: 'coupon', label: 'Coupon' },
    ];

    const isFishing = s2.tourType === 'Fishing';

    container.innerHTML = `
      <div class="step-content stagger-children">
        <!-- Reservation Summary -->
        <div class="card" style="margin-bottom: var(--space-4); background: var(--color-surface-alt);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2);">
            <span style="font-size: var(--font-lg); font-weight: var(--weight-bold); color: var(--color-gold);">
              ${this.escapeHtml(s2.customerName || 'Unnamed Quote')}
            </span>
            <span class="badge badge-${reservation.status}">${reservation.status}</span>
          </div>
          <div style="font-size: var(--font-sm); color: var(--color-text-secondary); display: flex; flex-wrap: wrap; gap: var(--space-3);">
            <span>${s2.tourType || 'No tour'}</span>
            <span>·</span>
            <span>${s1.durationHours}h · ${s1.passengers} pax</span>
            ${s2.tripDate ? `<span>·</span><span>${new Date(s2.tripDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>` : ''}
          </div>
        </div>

         <!-- Booking Source -->
         <div class="step-section">
           <div class="step-section-title">Booking Source</div>
           <div class="custom-select-wrapper" id="sourceSelect">
             <div class="custom-select-trigger" id="sourceTrigger">
               <input type="text" class="custom-select-input" id="sourceInput"
                      placeholder="Search sources..."
                      value="${this.getSourceName(source, sources)}"
                      autocomplete="off">
               <svg class="custom-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <polyline points="6 9 12 15 18 9"/>
               </svg>
             </div>
             <div class="custom-select-dropdown" id="sourceDropdown">
               ${sources
                 .map(
                   (s) => `
                 <div class="custom-select-option ${s.id === source ? 'selected' : ''}"
                      data-value="${s.id}">
                   ${s.name}
                 </div>
               `
                 )
                 .join('')}
             </div>
           </div>
         </div>

         <!-- Food Option -->
         <div class="step-section">
           <div class="step-section-title">Food Option</div>
           <div class="custom-select-wrapper" id="foodSelect">
             <div class="custom-select-trigger" id="foodTrigger">
               <input type="text" class="custom-select-input" id="foodInput"
                      placeholder="Search food menus..."
                      value="${s2.foodType || 'No food selected'}"
                      autocomplete="off">
               <svg class="custom-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <polyline points="6 9 12 15 18 9"/>
               </svg>
             </div>
             <div class="custom-select-dropdown" id="foodDropdown">
               ${foodOptions
                 .map(
                   (f) => `
                 <div class="custom-select-option ${f.name === s2.foodType ? 'selected' : ''}"
                      data-value="${this.escapeHtml(f.name)}">
                   ${f.name}
                 </div>
               `
                 )
                 .join('')}
             </div>
           </div>
         </div>

        <!-- Adjustments -->
        <div class="step-section">
          <div class="step-section-title">Price Adjustments</div>
          <div class="input-group">
            <div class="input-group-row">
              <span class="input-group-label">Discount Type</span>
              <div class="input-group-value">
                <select id="repriceType" data-field="repriceType">
                  ${repriceTypes
                    .map(
                      (rt) =>
                        `<option value="${rt.code}" ${s3.repriceType === rt.code ? 'selected' : ''}>${rt.label}</option>`
                    )
                    .join('')}
                </select>
              </div>
            </div>
            <div class="input-group-row" id="repriceValueRow" style="display: ${s3.repriceType ? '' : 'none'}">
              <span class="input-group-label">Discount Value</span>
              <div class="input-group-value">
                <input type="number" id="repriceDiscount" placeholder="0"
                       value="${s3.repriceDiscount || ''}" data-field="repriceDiscount" min="0">
              </div>
            </div>
            <div class="input-group-row">
              <span class="input-group-label">Extras $</span>
              <div class="input-group-value">
                <input type="number" id="extrasAmount" placeholder="0"
                       value="${s3.extrasAmount || ''}" data-field="extrasAmount" min="0">
              </div>
            </div>
            ${isFishing ? `
            <div class="input-group-row">
              <span class="input-group-label">🎣 Licenses</span>
              <div class="input-group-value">
                <input type="number" id="fishingLicenses" placeholder="0"
                       value="${s3.fishingLicenses || ''}" data-field="fishingLicenses" min="0">
              </div>
            </div>
            ` : ''}
            <div class="input-group-row">
              <span class="input-group-label">💵 Deposit</span>
              <div class="input-group-value">
                <input type="number" id="deposit" placeholder="0"
                       value="${s3.deposit || ''}" data-field="deposit" min="0">
              </div>
            </div>
          </div>
        </div>

        <!-- Full Pricing Breakdown -->
        <div class="step-section">
          <div class="step-section-title">Price Breakdown</div>
          <div class="breakdown" id="fullBreakdown">
            <!-- Populated by recalculate() -->
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4);">
          <button class="btn btn-secondary btn-full" onclick="window.App.navigate('#/voucher/${this.reservationId}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Voucher
          </button>

          ${isBooked ? `
            <button class="btn btn-danger btn-full" id="deleteBtn">
              <i class="ti ti-trash"></i> Delete Reservation
            </button>
          ` : ''}
        </div>
      </div>
    `;

    this.bindEvents();
    this.recalculate();
  },

  bindEvents() {
    // Source select
    const srcWrapper = document.getElementById('sourceSelect');
    const srcInput = document.getElementById('sourceInput');
    const srcDropdown = document.getElementById('sourceDropdown');

    this.setupSelect(srcWrapper, srcInput, srcDropdown, (val) => {
      const sources = window.PRICING_RULES?.sources || [];
      srcInput.value = this.getSourceName(val, sources);
      this.recalculate();
    });

    // Food select
    const foodWrapper = document.getElementById('foodSelect');
    const foodInput = document.getElementById('foodInput');
    const foodDropdown = document.getElementById('foodDropdown');

    this.setupSelect(foodWrapper, foodInput, foodDropdown, (val) => {
      foodInput.value = val;
      // Update s2.foodType immediately in storage
      const reservation = window.Storage.getReservation(this.reservationId);
      if (reservation) {
        const s2 = { ...reservation.data.step2_details, foodType: val };
        window.Storage.updateReservation(this.reservationId, 'step2_details', s2);
      }
      this.recalculate();
    });

    const repriceType = document.getElementById('repriceType');
    repriceType?.addEventListener('change', () => {
      const row = document.getElementById('repriceValueRow');
      if(row) row.style.display = repriceType.value ? '' : 'none';
      this.recalculate();
    });

    this.container.querySelectorAll('input[type="number"], select').forEach((el) => {
      el.addEventListener('input', () => this.recalculate());
      el.addEventListener('change', () => this.recalculate());
    });

    document.getElementById('deleteBtn')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this reservation?')) {
        window.Storage.deleteReservation(this.reservationId);
        window.Toast.success('Reservation deleted');
        window.App.navigate('#/dashboard');
      }
    });
  },

  setupSelect(wrapper, input, dropdown, onSelect) {
    if (!wrapper || !input || !dropdown) return;

    input.addEventListener('focus', () => {
      wrapper.classList.add('open');
      input.value = '';
      this.filterOptions(dropdown, '');
    });

    input.addEventListener('input', () => {
      this.filterOptions(dropdown, input.value);
    });

    dropdown.addEventListener('click', (e) => {
      const option = e.target.closest('.custom-select-option');
      if (!option) return;
      const value = option.dataset.value;
      dropdown.querySelectorAll('.custom-select-option').forEach((o) => o.classList.remove('selected'));
      option.classList.add('selected');
      wrapper.classList.remove('open');
      onSelect(value);
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
        const selected = dropdown.querySelector('.selected');
        if (selected && !input.value) {
          input.value = selected.textContent.trim();
        }
      }
    });
  },

  filterOptions(dropdown, query) {
    const q = query.toLowerCase();
    dropdown.querySelectorAll('.custom-select-option').forEach((opt) => {
      const text = opt.textContent.toLowerCase();
      opt.style.display = text.includes(q) ? '' : 'none';
    });
  },

  recalculate() {
    const reservation = window.Storage.getReservation(this.reservationId);
    if (!reservation) return;

    const s1 = reservation.data.step1_pricing;
    const s2 = reservation.data.step2_details;

    const selectedSource = this.container.querySelector('#sourceSelect .custom-select-option.selected');
    const sourceId = selectedSource?.dataset.value || 'direct';
    const repriceType = document.getElementById('repriceType')?.value || '';
    const repriceDiscount = parseFloat(document.getElementById('repriceDiscount')?.value) || 0;
    const extrasAmount = parseFloat(document.getElementById('extrasAmount')?.value) || 0;
    const fishingLicenses = parseInt(document.getElementById('fishingLicenses')?.value) || 0;
    const deposit = parseFloat(document.getElementById('deposit')?.value) || 0;

    let result;
    if (this.calculator) {
      result = this.calculator.calculate({
        trip: {
          tourType: s2.tourType || '',
          duration: s1.durationHours,
          adults: s1.passengers,
        },
        pricingType: s1.pricingType || 'regular',
        source: sourceId,
        extras: {
          fishingLicenses: fishingLicenses,
          amount: extrasAmount,
        },
        reprice: {
          type: repriceType,
          discount: repriceDiscount,
        },
      });
    } else {
      result = {
        summary: { basePrice: s1.estimatedSubtotal || 0, extras: extrasAmount, subtotal: (s1.estimatedSubtotal || 0) + extrasAmount, discount: 0, businessPrice: (s1.estimatedSubtotal || 0) + extrasAmount, fee: 0, customerPrice: (s1.estimatedSubtotal || 0) + extrasAmount },
        basePricing: s1,
        fee: { hasFee: false, sourceName: 'Direct', feeNote: '' },
      };
    }

    const s = result.summary;
    const balance = s.customerPrice - deposit;

    const breakdown = document.getElementById('fullBreakdown');
    if(!breakdown) return;
    let html = '';

    html += this.breakdownRow('Base trip', `${s1.durationHours}h × $${s1.hourlyRate}`, this.fmt(s.basePrice));
    if (s1.extraPassengers > 0) html += this.breakdownRow('Extra passengers', `${s1.extraPassengers} pax`, this.fmt(s1.extraPassengerCharge));
    if (s.extras > 0) html += this.breakdownRow('Extra services', '', this.fmt(s.extras));
    html += this.breakdownRow('Subtotal', '', this.fmt(s.subtotal), 'subtotal');
    if (s.discount > 0) html += this.breakdownRow(`Discount (${repriceType})`, '', '-' + this.fmt(s.discount), 'discount');
    html += this.breakdownRow('Business receives', '', this.fmt(s.businessPrice));
    if (result.fee?.hasFee) html += this.breakdownRow(`Fee (${result.fee.feeNote || ''})`, '', this.fmt(s.fee), 'fee');
    html += `<div class="breakdown-row total"><span class="breakdown-label">Customer Pays</span><span class="breakdown-value">${this.fmt(s.customerPrice)}</span></div>`;
    if (deposit > 0) {
      html += this.breakdownRow('Deposit paid', '', '-' + this.fmt(deposit), 'discount');
      html += `<div class="breakdown-row total"><span class="breakdown-label">Balance Due</span><span class="breakdown-value" style="color: ${balance > 0 ? 'var(--color-warning)' : 'var(--color-success)'}">${this.fmt(balance)}</span></div>`;
    }

    breakdown.innerHTML = html;

     if (reservation.status === 'draft') {
       window.Storage.updateReservation(this.reservationId, 'step3_adjustments', {
         bookingSource: sourceId,
         repriceType,
         repriceDiscount,
         extrasAmount,
         fishingLicenses,
         finalBusinessPrice: s.businessPrice,
         finalCustomerPrice: s.customerPrice,
         feeAmount: s.fee,
         deposit,
         balance,
         paymentMethod: document.getElementById('paymentMethod')?.value || 'cash'
       });
       
       const s1Data = { ...s1, source: sourceId };
       window.Storage.updateReservation(this.reservationId, 'step1_pricing', s1Data);
       window.Storage.updateCurrentStep(this.reservationId, 3);
    }
  },

  autoSave() { this.recalculate(); },

  breakdownRow(label, detail, value, cls = '') {
    return `<div class="breakdown-row ${cls}"><span class="breakdown-label">${label} ${detail ? `<span style="font-size: var(--font-xs); opacity: 0.6;">${detail}</span>` : ''}</span><span class="breakdown-value">${value}</span></div>`;
  },

  confirmBooking() {
    const reservation = window.Storage.getReservation(this.reservationId);
    if (!reservation) return;
    const s2 = reservation.data.step2_details;
    if (!s2.customerName) { window.Toast.warning('Please add a customer name in Step 2'); return; }
    window.Storage.promoteToBooking(this.reservationId);
    window.Toast.success('Booking confirmed! 🎉');
    window.App.navigate('#/dashboard');
  },

  getSourceName(sourceId, sources) {
    const source = sources.find((s) => s.id === sourceId);
    return source ? source.name : sourceId;
  },

  fmt(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  destroy() {
    this.container = null;
    this.reservationId = null;
  },
};

window.Step3Screen = Step3Screen;
