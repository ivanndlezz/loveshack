/**
 * Step 1 — Quick Pricing Screen — Love Shack v3
 * Duration slider, passenger counter, pricing type toggle, live price
 */

const Step1Screen = {
  container: null,
  reservationId: null,
  calculator: null,

  render(container, params) {
    this.container = container;
    this.reservationId = params.id;

    // Initialize calculator
    if (!this.calculator && window.PricingCalculator && window.PRICING_RULES) {
      this.calculator = new window.PricingCalculator(window.PRICING_RULES);
    }

    // Load existing draft data
    const reservation = window.Storage.getReservation(this.reservationId);
    if (!reservation) {
      window.App.navigate('#/dashboard');
      return;
    }

    const s1 = reservation.data.step1_pricing;
    const duration = s1.durationHours || 3;
    const passengers = s1.passengers || 14;
    const pricingType = s1.pricingType || 'regular';

    // Calculate initial price
    const price = this.calculatePrice(duration, passengers, pricingType);
    const sliderFill = ((duration - 2) / (8 - 2)) * 100;

    container.innerHTML = `
      <div class="step-content stagger-children">
        <!-- Price Hero -->
        <div class="price-hero">
          <div class="price-hero-label">Estimated Price</div>
          <div class="price-hero-amount" id="priceHero">${this.formatCurrency(price.subtotal)}</div>
          <div class="price-hero-subtitle" id="priceSubtitle">${duration}h · ${passengers} pax · ${price.hourlyRate}/hr</div>
        </div>

        <!-- Duration Slider -->
        <div class="step-section">
          <div class="slider-field">
            <div class="slider-header">
              <span class="slider-label">Duration</span>
              <span class="slider-display" id="durationDisplay">${duration}<small> hrs</small></span>
            </div>
            <input type="range" class="form-slider" id="durationSlider"
                   min="2" max="8" step="1" value="${duration}"
                   style="--slider-fill: ${sliderFill}%">
            <div class="slider-ticks">
              ${[2, 3, 4, 5, 6, 7, 8]
                .map((v) => `<span class="slider-tick ${v === duration ? 'active' : ''}">${v}h</span>`)
                .join('')}
            </div>
          </div>
        </div>

        <!-- Passengers Counter -->
        <div class="step-section">
          <div class="slider-field">
            <div class="slider-header">
              <span class="slider-label">Passengers</span>
              <span class="slider-display" id="paxDisplay">${passengers}<small> pax</small></span>
            </div>
            <div class="counter" style="justify-content: center; padding: var(--space-4) 0;">
              <button class="counter-btn" id="paxMinus" ${passengers <= 1 ? 'disabled' : ''}>−</button>
              <span class="counter-value" id="paxValue">${passengers}</span>
              <button class="counter-btn" id="paxPlus" ${passengers >= 50 ? 'disabled' : ''}>+</button>
            </div>
            <div style="text-align: center;">
              <span style="font-size: var(--font-xs); color: var(--color-text-tertiary);">
                ${passengers > 14 ? `+${passengers - 14} extra passengers ($${(passengers - 14) * this.getExtraRate(pricingType)})` : 'Up to 14 pax included'}
              </span>
            </div>
          </div>
        </div>

        <!-- Pricing Type Toggle -->
        <div class="step-section">
          <div class="step-section-title">Pricing Tier</div>
          <div class="tab-glider" id="pricingTypeToggle">
            <div class="tab-glider-indicator" id="pricingIndicator"
                 style="width: 50%; transform: translateX(${pricingType === 'snack' ? '100%' : '0%'});"></div>
            <div class="tab-glider-option ${pricingType === 'regular' ? 'active' : ''}" data-value="regular">
              Regular · $600/hr
            </div>
            <div class="tab-glider-option ${pricingType === 'snack' ? 'active' : ''}" data-value="snack">
              Snack · $450/hr
            </div>
          </div>
        </div>

        <!-- Quick Breakdown -->
        <div class="breakdown" id="quickBreakdown">
          <div class="breakdown-row">
            <span class="breakdown-label">Base trip (<span id="bkHours">${duration}</span>h × $<span id="bkRate">${price.hourlyRate}</span>)</span>
            <span class="breakdown-value" id="bkBase">${this.formatCurrency(price.baseTripCost)}</span>
          </div>
          <div class="breakdown-row" id="bkExtraRow" style="display: ${price.extraPassengers > 0 ? '' : 'none'}">
            <span class="breakdown-label">Extra pax (<span id="bkExtraCount">${price.extraPassengers}</span> × $<span id="bkExtraRate">${this.getExtraRate(pricingType)}</span>)</span>
            <span class="breakdown-value" id="bkExtraPrice">${this.formatCurrency(price.extraPassengerCharge)}</span>
          </div>
          <div class="breakdown-row total">
            <span class="breakdown-label">Subtotal</span>
            <span class="breakdown-value" id="bkTotal">${this.formatCurrency(price.subtotal)}</span>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const durationSlider = document.getElementById('durationSlider');
    const paxMinus = document.getElementById('paxMinus');
    const paxPlus = document.getElementById('paxPlus');
    const pricingToggle = document.getElementById('pricingTypeToggle');

    // Duration slider
    durationSlider?.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      const fill = ((val - 2) / (8 - 2)) * 100;
      e.target.style.setProperty('--slider-fill', `${fill}%`);
      document.getElementById('durationDisplay').innerHTML = `${val}<small> hrs</small>`;

      // Update tick marks
      this.container.querySelectorAll('.slider-tick').forEach((tick, i) => {
        tick.classList.toggle('active', i + 2 === val);
      });

      this.recalculate();
    });

    // Passenger counter
    paxMinus?.addEventListener('click', () => {
      const current = parseInt(document.getElementById('paxValue').textContent);
      if (current > 1) {
        document.getElementById('paxValue').textContent = current - 1;
        document.getElementById('paxDisplay').innerHTML = `${current - 1}<small> pax</small>`;
        paxMinus.disabled = current - 1 <= 1;
        paxPlus.disabled = false;
        this.recalculate();
      }
    });

    paxPlus?.addEventListener('click', () => {
      const current = parseInt(document.getElementById('paxValue').textContent);
      if (current < 50) {
        document.getElementById('paxValue').textContent = current + 1;
        document.getElementById('paxDisplay').innerHTML = `${current + 1}<small> pax</small>`;
        paxPlus.disabled = current + 1 >= 50;
        paxMinus.disabled = false;
        this.recalculate();
      }
    });

    // Pricing type toggle
    pricingToggle?.querySelectorAll('.tab-glider-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const value = opt.dataset.value;
        pricingToggle.querySelectorAll('.tab-glider-option').forEach((o) => o.classList.remove('active'));
        opt.classList.add('active');
        const indicator = document.getElementById('pricingIndicator');
        indicator.style.transform = value === 'snack' ? 'translateX(100%)' : 'translateX(0%)';
        this.recalculate();
      });
    });
  },

  recalculate() {
    const duration = parseInt(document.getElementById('durationSlider')?.value) || 3;
    const passengers = parseInt(document.getElementById('paxValue')?.textContent) || 14;
    const activeType = this.container.querySelector('.tab-glider-option.active');
    const pricingType = activeType?.dataset.value || 'regular';

    const price = this.calculatePrice(duration, passengers, pricingType);

    // Update hero
    const hero = document.getElementById('priceHero');
    hero.textContent = this.formatCurrency(price.subtotal);
    hero.classList.add('updating');
    setTimeout(() => hero.classList.remove('updating'), 300);

    document.getElementById('priceSubtitle').textContent =
      `${duration}h · ${passengers} pax · $${price.hourlyRate}/hr`;

    // Update breakdown
    document.getElementById('bkHours').textContent = duration;
    document.getElementById('bkRate').textContent = price.hourlyRate;
    document.getElementById('bkBase').textContent = this.formatCurrency(price.baseTripCost);

    const extraRow = document.getElementById('bkExtraRow');
    if (price.extraPassengers > 0) {
      extraRow.style.display = '';
      document.getElementById('bkExtraCount').textContent = price.extraPassengers;
      document.getElementById('bkExtraRate').textContent = this.getExtraRate(pricingType);
      document.getElementById('bkExtraPrice').textContent = this.formatCurrency(price.extraPassengerCharge);
    } else {
      extraRow.style.display = 'none';
    }

    document.getElementById('bkTotal').textContent = this.formatCurrency(price.subtotal);

    // Update extra pax hint
    const paxHint = this.container.querySelector('.counter')?.parentElement?.querySelector('span:last-child');
    // no direct reference, skip

    // Auto-save
    this.saveStep(duration, passengers, pricingType, price);
  },

  calculatePrice(duration, passengers, pricingType) {
    if (this.calculator) {
      const result = this.calculator.calculateBasePrice(
        { duration, adults: passengers },
        pricingType,
        'direct'
      );
      return result;
    }
    // Fallback
    const rate = pricingType === 'snack' ? 450 : 600;
    const extraRate = pricingType === 'snack' ? 75 : 100;
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

  getExtraRate(pricingType) {
    return pricingType === 'snack' ? 75 : 100;
  },

  saveStep(duration, passengers, pricingType, price) {
    window.Storage.updateReservation(this.reservationId, 'step1_pricing', {
      pricingType,
      durationHours: duration,
      passengers,
      extraPassengers: price.extraPassengers,
      hourlyRate: price.hourlyRate,
      baseTripCost: price.baseTripCost,
      extraPassengerCharge: price.extraPassengerCharge,
      estimatedSubtotal: price.subtotal,
    });
  },

  getStepData() {
    const duration = parseInt(document.getElementById('durationSlider')?.value) || 3;
    const passengers = parseInt(document.getElementById('paxValue')?.textContent) || 14;
    const activeType = this.container?.querySelector('.tab-glider-option.active');
    const pricingType = activeType?.dataset.value || 'regular';
    return { duration, passengers, pricingType };
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  },

  destroy() {
    this.container = null;
    this.reservationId = null;
  },
};

window.Step1Screen = Step1Screen;
