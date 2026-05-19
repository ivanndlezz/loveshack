/**
 * Data Compare Screen — Love Shack v3
 * Tabla comparativa: LocalStorage vs reservations.json vs Airtable
 */

const DataCompareScreen = {
  container: null,
  localData: [],
  jsonData: [],
  airtableData: [],
  isLoading: false,

  async render(container) {
    this.container = container;
    this.renderSkeleton();
    await this.loadAllSources();
    this.renderTable();
  },

  renderSkeleton() {
    this.container.innerHTML = `
      <div class="step-content stagger-children" id="compare-screen">
        <div class="compare-header">
          <div class="compare-title-row">
            <div>
              <h1 class="compare-title">Data Compare</h1>
              <p class="compare-subtitle">Comparativa de fuentes de datos</p>
            </div>
            <button class="compare-refresh-btn" id="compare-refresh-btn" aria-label="Refresh data">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M21 2v6h-6"/>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                <path d="M3 22v-6h6"/>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
              </svg>
              Refresh
            </button>
          </div>

          <!-- Source Legend -->
          <div class="compare-legend">
            <div class="legend-item">
              <span class="legend-dot local"></span>
              <span>LocalStorage</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot json"></span>
              <span>reservations.json</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot airtable"></span>
              <span>Airtable</span>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="compare-summary-grid" id="compare-summary">
          ${[0,1,2].map(i => `
            <div class="compare-card skeleton-card">
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
            </div>
          `).join('')}
        </div>

        <!-- Loading state -->
        <div class="compare-loading" id="compare-loading">
          <div class="compare-spinner"></div>
          <p>Cargando y comparando datos...</p>
        </div>

        <div id="compare-table-wrapper" style="display:none;"></div>
      </div>
    `;

    document.getElementById('compare-refresh-btn')?.addEventListener('click', async () => {
      await this.refresh();
    });
  },

  async loadAllSources() {
    // 1. LocalStorage
    this.localData = window.Storage.getAllReservations();

    // 2. reservations.json (relative path from /v3/)
    try {
      const resp = await fetch('./data/reservations.json?t=' + Date.now());
      if (resp.ok) {
        this.jsonData = await resp.json();
      } else {
        this.jsonData = [];
      }
    } catch (e) {
      console.warn('DataCompare: Could not load reservations.json', e);
      this.jsonData = [];
    }

    // 3. Airtable — read airtable_id presence from local data
    // We read from localStorage which ones are synced to Airtable
    this.airtableData = this.localData.filter(r => r.airtable_id && r.sync_status === 'synced');
  },

  buildMasterIndex() {
    const map = new Map();

    const addEntry = (id, source, record) => {
      if (!map.has(id)) {
        map.set(id, { id, local: null, json: null, airtable: null });
      }
      map.get(id)[source] = record;
    };

    this.localData.forEach(r => addEntry(r.id, 'local', r));
    this.jsonData.forEach(r => addEntry(r.id, 'json', r));
    this.airtableData.forEach(r => addEntry(r.id, 'airtable', r));

    return Array.from(map.values());
  },

  getStatus(row) {
    const hasLocal = !!row.local;
    const hasJson = !!row.json;
    const hasAirtable = !!row.airtable;

    if (hasLocal && hasJson && hasAirtable) return { label: 'Sincronizado', type: 'synced' };
    if (hasLocal && hasJson && !hasAirtable) return { label: 'Sin Nube', type: 'no-cloud' };
    if (hasLocal && !hasJson && hasAirtable) return { label: 'Sin JSON', type: 'no-json' };
    if (!hasLocal && hasJson && !hasAirtable) return { label: 'Solo JSON', type: 'json-only' };
    if (hasLocal && !hasJson && !hasAirtable) return { label: 'Solo Local', type: 'local-only' };
    if (!hasLocal && !hasJson && hasAirtable) return { label: 'Solo Nube', type: 'cloud-only' };
    return { label: 'Desconocido', type: 'unknown' };
  },

  formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: '2-digit' });
    } catch { return iso; }
  },

  getName(row) {
    const r = row.local || row.json || row.airtable;
    // v3 nested format
    if (r?.data?.step2_details?.customerName) return r.data.step2_details.customerName;
    // Legacy flat format
    return r?.guestName || r?.contactName || r?.name || '—';
  },

  getTripDate(row) {
    const r = row.local || row.json || row.airtable;
    if (r?.data?.step2_details?.tripDate) return r.data.step2_details.tripDate;
    return r?.reservationDate || r?.tripDate || '—';
  },

  getStatusLabel(row) {
    const r = row.local || row.json || row.airtable;
    return r?.status || '—';
  },

  getPrice(row) {
    const r = row.local || row.json || row.airtable;
    const price = r?.data?.step3_adjustments?.finalCustomerPrice || r?.totalPrice || 0;
    if (!price) return '—';
    return `$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  },

  checkMark(hasIt) {
    if (hasIt) return `<span class="check-yes">✓</span>`;
    return `<span class="check-no">✗</span>`;
  },

  renderTable() {
    const loading = document.getElementById('compare-loading');
    const wrapper = document.getElementById('compare-table-wrapper');
    const summaryEl = document.getElementById('compare-summary');

    if (loading) loading.style.display = 'none';
    if (wrapper) wrapper.style.display = '';

    const master = this.buildMasterIndex();
    const total = master.length;
    const fullySynced = master.filter(r => r.local && r.json && r.airtable).length;
    const localOnly = master.filter(r => r.local && !r.json && !r.airtable).length;
    const conflicts = master.filter(r => {
      if (!r.local || !r.json) return false;
      const localUpdated = r.local.updatedAt;
      const jsonUpdated = r.json.updatedAt;
      return localUpdated && jsonUpdated && localUpdated !== jsonUpdated;
    }).length;
    const noCloud = master.filter(r => r.local && !r.airtable).length;

    // Summary cards
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="compare-card">
          <div class="compare-card-value">${total}</div>
          <div class="compare-card-label">Total únicos</div>
        </div>
        <div class="compare-card">
          <div class="compare-card-value" style="color: var(--color-success);">${fullySynced}</div>
          <div class="compare-card-label">Sincronizados</div>
        </div>
        <div class="compare-card">
          <div class="compare-card-value" style="color: var(--color-warning);">${noCloud}</div>
          <div class="compare-card-label">Sin Nube</div>
        </div>
        <div class="compare-card">
          <div class="compare-card-value" style="color: var(--color-danger);">${conflicts}</div>
          <div class="compare-card-label">Conflictos</div>
        </div>
      `;
    }

    // Source count banners
    const sourceBanners = `
      <div class="compare-source-banners">
        <div class="source-banner local">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
          <div>
            <div class="source-banner-count">${this.localData.length}</div>
            <div class="source-banner-label">LocalStorage</div>
          </div>
        </div>
        <div class="source-banner json">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <div>
            <div class="source-banner-count">${this.jsonData.length}</div>
            <div class="source-banner-label">reservations.json</div>
          </div>
        </div>
        <div class="source-banner airtable">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
            <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
          </svg>
          <div>
            <div class="source-banner-count">${this.airtableData.length}</div>
            <div class="source-banner-label">Airtable (Nube)</div>
          </div>
        </div>
      </div>
    `;

    // Filter tabs
    let activeFilter = 'all';
    const renderRows = (filter) => {
      let rows = master;
      if (filter === 'conflicts') rows = master.filter(r => {
        if (!r.local || !r.json) return false;
        return r.local.updatedAt && r.json.updatedAt && r.local.updatedAt !== r.json.updatedAt;
      });
      if (filter === 'missing-cloud') rows = master.filter(r => r.local && !r.airtable);
      if (filter === 'local-only') rows = master.filter(r => r.local && !r.json && !r.airtable);
      if (filter === 'synced') rows = master.filter(r => r.local && r.json && r.airtable);

      if (rows.length === 0) {
        return `<div class="compare-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;color:var(--color-text-tertiary);margin-bottom:12px;">
            <circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
          <p>No hay registros en esta categoría</p>
        </div>`;
      }

      return rows.map(row => {
        const status = this.getStatus(row);
        const name = this.getName(row);
        const tripDate = this.getTripDate(row);
        const statusLabel = this.getStatusLabel(row);
        const price = this.getPrice(row);
        const updatedLocal = this.formatDate(row.local?.updatedAt);
        const updatedJson = this.formatDate(row.json?.updatedAt);

        const hasConflict = row.local && row.json
          && row.local.updatedAt && row.json.updatedAt
          && row.local.updatedAt !== row.json.updatedAt;

        return `
          <tr class="compare-row ${hasConflict ? 'has-conflict' : ''}">
            <td class="compare-cell name-cell">
              <div class="cell-name">${name}</div>
              <div class="cell-id">${row.id?.substring(0, 20)}…</div>
            </td>
            <td class="compare-cell">
              <span class="trip-date">${tripDate !== '—' ? tripDate : '—'}</span>
            </td>
            <td class="compare-cell center">
              ${this.checkMark(!!row.local)}
              ${updatedLocal !== '—' ? `<div class="cell-date-sub">${updatedLocal}</div>` : ''}
            </td>
            <td class="compare-cell center">
              ${this.checkMark(!!row.json)}
              ${updatedJson !== '—' ? `<div class="cell-date-sub">${updatedJson}</div>` : ''}
            </td>
            <td class="compare-cell center">
              ${this.checkMark(!!row.airtable)}
              ${row.airtable ? `<div class="cell-date-sub">linked</div>` : ''}
            </td>
            <td class="compare-cell">
              <span class="sync-badge sync-badge--${status.type}">${status.label}</span>
            </td>
            <td class="compare-cell price-cell">${price}</td>
          </tr>
        `;
      }).join('');
    };

    const tableHtml = `
      <div class="compare-filter-tabs" id="compare-filter-tabs">
        <button class="compare-tab active" data-filter="all">Todos <span class="tab-count">${total}</span></button>
        <button class="compare-tab" data-filter="synced">Sincronizados <span class="tab-count">${fullySynced}</span></button>
        <button class="compare-tab" data-filter="missing-cloud">Sin Nube <span class="tab-count">${noCloud}</span></button>
        <button class="compare-tab" data-filter="conflicts">Conflictos <span class="tab-count">${conflicts}</span></button>
        <button class="compare-tab" data-filter="local-only">Solo Local <span class="tab-count">${localOnly}</span></button>
      </div>

      <div class="compare-table-container">
        <table class="compare-table" id="compare-table">
          <thead>
            <tr>
              <th>Reservación</th>
              <th>Fecha Viaje</th>
              <th class="center source-col local-col">
                <span class="th-dot local"></span>Local
              </th>
              <th class="center source-col json-col">
                <span class="th-dot json"></span>JSON
              </th>
              <th class="center source-col airtable-col">
                <span class="th-dot airtable"></span>Nube
              </th>
              <th>Estado Sync</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody id="compare-tbody">
            ${renderRows('all')}
          </tbody>
        </table>
      </div>
    `;

    wrapper.innerHTML = sourceBanners + tableHtml;

    // Bind filter tabs
    document.getElementById('compare-filter-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-filter]');
      if (!tab) return;
      document.querySelectorAll('.compare-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      const tbody = document.getElementById('compare-tbody');
      if (tbody) tbody.innerHTML = renderRows(filter);
    });
  },

  async refresh() {
    const btn = document.getElementById('compare-refresh-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" class="spinning">
          <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
          <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
        </svg>
        Cargando…
      `;
    }

    await this.loadAllSources();
    this.renderTable();

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
          <path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
        </svg>
        Refresh
      `;
    }
  },

  destroy() {
    this.container = null;
    this.localData = [];
    this.jsonData = [];
    this.airtableData = [];
  }
};

window.DataCompareScreen = DataCompareScreen;
