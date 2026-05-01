/**
 * Step 2 — Trip Details Screen — Love Shack v3
 * Tour type, date, times, customer info
 */

const Step2Screen = {
  container: null,
  reservationId: null,

  render(container, params) {
    this.container = container;
    this.reservationId = params.id;

    const reservation = window.Storage.getReservation(this.reservationId);
    if (!reservation) {
      window.App.navigate('#/dashboard');
      return;
    }

    const s1 = reservation.data.step1_pricing;
    const s2 = reservation.data.step2_details;
    const duration = s1.durationHours || 3;

    // Auto-calculate end time from start time + duration
    let endTime = s2.endTime || '';
    if (s2.startTime && !endTime) {
      endTime = this.addHours(s2.startTime, duration);
    }

    container.innerHTML = `
      <div class="step-content stagger-children">
        <!-- Tour Type -->
        <div class="step-section">
          <div class="step-section-title">Tour Type</div>
          <div class="tour-cards" id="tourTypeCards">
            ${this.renderTourCards(s2.tourType)}
          </div>
        </div>

        <!-- Date & Time -->
        <div class="step-section">
          <div class="step-section-title">Schedule</div>
          <div class="input-group">
            <div class="input-group-row">
              <span class="input-group-label">📅 Trip Date</span>
              <div class="input-group-value">
                <input type="date" id="tripDate" value="${s2.tripDate || ''}" data-field="tripDate">
              </div>
            </div>
            <div class="input-group-row">
              <span class="input-group-label">🕐 Departure</span>
              <div class="input-group-value">
                <input type="time" id="startTime" value="${s2.startTime || ''}" data-field="startTime">
              </div>
            </div>
            <div class="input-group-row">
              <span class="input-group-label">🕓 Return</span>
              <div class="input-group-value">
                <input type="time" id="endTime" value="${endTime}" data-field="endTime">
              </div>
            </div>
          </div>
          <div style="padding: var(--space-2) var(--space-4); font-size: var(--font-xs); color: var(--color-text-tertiary);">
            Duration: ${duration} hours (from Step 1)
          </div>
        </div>

        <!-- Customer Info -->
        <div class="step-section">
          <div class="step-section-title">Customer Information</div>
          <div class="input-group">
            <div class="input-group-row">
              <span class="input-group-label">👤 Name</span>
              <div class="input-group-value">
                <input type="text" id="customerName" placeholder="Customer name"
                       value="${this.escapeAttr(s2.customerName || '')}" data-field="customerName">
              </div>
            </div>
            <div class="input-group-row">
              <span class="input-group-label">📱 Phone</span>
              <div class="input-group-value">
                <input type="tel" id="customerPhone" placeholder="+1 555 1234"
                       value="${this.escapeAttr(s2.customerPhone || '')}" data-field="customerPhone">
              </div>
            </div>
            <div class="input-group-row">
              <span class="input-group-label">✉️ Email</span>
              <div class="input-group-value">
                <input type="email" id="customerEmail" placeholder="Optional"
                       value="${this.escapeAttr(s2.customerEmail || '')}" data-field="customerEmail">
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="step-section">
          <div class="step-section-title">Notes</div>
          <textarea id="notes" class="form-input" placeholder="Special requests, notes..."
                    data-field="notes"
                    style="height: 80px; padding: var(--space-3) var(--space-4); resize: vertical; border-radius: var(--radius-lg);"
          >${s2.notes || ''}</textarea>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  renderTourCards(selectedType) {
    const tours = [
      { id: 'Bay Trip', emoji: '🌊', label: 'Bay Trip' },
      { id: 'Whale Watching', emoji: '🐋', label: 'Whale Watch' },
      { id: 'Snorkeling Tour', emoji: '🤿', label: 'Snorkel' },
      { id: 'Sunset Cruise', emoji: '🌅', label: 'Sunset' },
      { id: 'Fishing', emoji: '🎣', label: 'Fishing' },
    ];

    return tours
      .map(
        (t) => `
        <div class="tour-card ${selectedType === t.id ? 'selected' : ''}" data-tour="${t.id}">
          <span class="tour-card-icon">${t.emoji}</span>
          <span class="tour-card-name">${t.label}</span>
        </div>
      `
      )
      .join('');
  },

  bindEvents() {
    // Tour type cards
    this.container.querySelectorAll('.tour-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.container.querySelectorAll('.tour-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.autoSave();
      });
    });

    // Auto-calculate end time when start time changes
    const startTimeInput = document.getElementById('startTime');
    startTimeInput?.addEventListener('change', () => {
      const reservation = window.Storage.getReservation(this.reservationId);
      const duration = reservation?.data.step1_pricing?.durationHours || 3;
      const startTime = startTimeInput.value;
      if (startTime) {
        document.getElementById('endTime').value = this.addHours(startTime, duration);
      }
      this.autoSave();
    });

    // Auto-save on all input changes
    this.container.querySelectorAll('input, textarea').forEach((input) => {
      input.addEventListener('input', () => this.autoSave());
      input.addEventListener('change', () => this.autoSave());
    });
  },

  autoSave() {
    const selectedTour = this.container.querySelector('.tour-card.selected');
    const data = {
      tourType: selectedTour?.dataset.tour || '',
      tripDate: document.getElementById('tripDate')?.value || '',
      startTime: document.getElementById('startTime')?.value || '',
      endTime: document.getElementById('endTime')?.value || '',
      customerName: document.getElementById('customerName')?.value || '',
      customerPhone: document.getElementById('customerPhone')?.value || '',
      customerEmail: document.getElementById('customerEmail')?.value || '',
      notes: document.getElementById('notes')?.value || '',
    };

    window.Storage.updateReservation(this.reservationId, 'step2_details', data);
    window.Storage.updateCurrentStep(this.reservationId, 2);
  },

  addHours(time, hours) {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + hours * 60;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  },

  escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  destroy() {
    this.container = null;
    this.reservationId = null;
  },
};

window.Step2Screen = Step2Screen;
