/**
 * Step 2 — Trip Details Screen — Love Shack v3
 * Tour type, date/time (via DateTimePicker), customer info
 */

const Step2Screen = {
  container: null,
  reservationId: null,
  picker: null,

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

    container.innerHTML = `
      <div class="step-content stagger-children">
        <!-- Tour Type -->
        <div class="step-section">
          <div class="step-section-title">Tour Type</div>
          <div class="tour-cards" id="tourTypeCards">
            ${this.renderTourCards(s2.tourType)}
          </div>
        </div>

        <!-- Date & Time — DateTimePicker -->
        <div class="step-section">
          <div class="step-section-title">Schedule</div>
          <div id="datetime-picker-mount"></div>
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

    this.bindEvents(s2, duration);
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

  bindEvents(s2, duration) {
    // Tour type cards
    this.container.querySelectorAll('.tour-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.container.querySelectorAll('.tour-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        this.autoSave();
      });
    });

    // Initialize DateTimePicker
    const mountEl = document.getElementById('datetime-picker-mount');
    if (mountEl && window.DateTimePicker) {
      this.picker = new DateTimePicker(mountEl, {
        initialDate: s2.tripDate || '',
        initialFrom: s2.startTime || '',
        initialTo: s2.endTime || '',
        duration: duration,
        onChange: () => this.autoSave()
      });
    }

    // Auto-save on all input changes (customer info + notes)
    this.container.querySelectorAll('input, textarea').forEach((input) => {
      input.addEventListener('input', () => this.autoSave());
      input.addEventListener('change', () => this.autoSave());
    });
  },

  autoSave() {
    const selectedTour = this.container.querySelector('.tour-card.selected');
    const pickerValues = this.picker ? this.picker.getValue() : {};

    const data = {
      tourType: selectedTour?.dataset.tour || '',
      tripDate: pickerValues.tripDate || '',
      startTime: pickerValues.startTime || '',
      endTime: pickerValues.endTime || '',
      customerName: document.getElementById('customerName')?.value || '',
      customerPhone: document.getElementById('customerPhone')?.value || '',
      customerEmail: document.getElementById('customerEmail')?.value || '',
      notes: document.getElementById('notes')?.value || '',
    };

    window.Storage.updateReservation(this.reservationId, 'step2_details', data);
    window.Storage.updateCurrentStep(this.reservationId, 2);
  },

  escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  destroy() {
    if (this.picker) { this.picker.destroy(); this.picker = null; }
    this.container = null;
    this.reservationId = null;
  },
};

window.Step2Screen = Step2Screen;
