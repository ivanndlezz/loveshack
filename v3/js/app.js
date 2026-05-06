/**
 * App Orchestrator — Love Shack v3
 * Hash-based router + screen lifecycle management
 */

(function () {
  'use strict';

  const App = {
    currentScreen: null,
    currentScreenName: null,

    /**
     * Initialize the app
     */
    init() {
      // Initialize components
      window.FAB.init();

      // Listen for hash changes
      window.addEventListener('hashchange', () => this.route());

      // Initial route
      if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = '#/dashboard';
      } else {
        this.route();
      }
    },

    /**
     * Navigate to a hash route
     * @param {string} hash - e.g. '#/dashboard', '#/new/uuid'
     */
    navigate(hash) {
      window.location.hash = hash;
    },

    /**
     * Main router — matches hash to screens
     */
    route() {
      const hash = window.location.hash || '#/dashboard';
      const container = document.getElementById('app');
      const mainEl = document.querySelector('.app-main');

      // Destroy current screen
      if (this.currentScreen && this.currentScreen.destroy) {
        this.currentScreen.destroy();
      }

      // Parse route
      let screen = null;
      let params = {};
      let headerHTML = '';
      let showFab = false;
      let showBottomNav = true;
      let stepNumber = 0;
      let inStepper = false;

      if (hash.match(/^#\/new\/([^/]+)\/adjustments/)) {
        // Step 3: #/new/:id/adjustments
        const id = hash.match(/^#\/new\/([^/]+)\/adjustments/)[1];
        screen = window.Step3Screen;
        params = { id };
        stepNumber = 3;
        inStepper = true;
        showBottomNav = false;

        const reservation = window.Storage.getReservation(id);
        const isBooked = reservation && reservation.status !== 'draft';

        headerHTML = this.renderStepperHeader(3, id, isBooked);
      } else if (hash.match(/^#\/new\/([^/]+)\/details/)) {
        // Step 2: #/new/:id/details
        const id = hash.match(/^#\/new\/([^/]+)\/details/)[1];
        screen = window.Step2Screen;
        params = { id };
        stepNumber = 2;
        inStepper = true;
        showBottomNav = false;
        headerHTML = this.renderStepperHeader(2, id);
      } else if (hash.match(/^#\/new\/([^/]+)/)) {
        // Step 1: #/new/:id
        const id = hash.match(/^#\/new\/([^/]+)/)[1];
        screen = window.Step1Screen;
        params = { id };
        stepNumber = 1;
        inStepper = true;
        showBottomNav = false;
        headerHTML = this.renderStepperHeader(1, id);
      } else if (hash.match(/^#\/data/)) {
        // Data management screen (simple)
        screen = null; // We'll render inline
        showFab = false;
        showBottomNav = true;
        headerHTML = this.renderDefaultHeader();
      } else if (hash === '#/source-list') {
        screen = window.SourceListScreen;
        showFab = false;
        showBottomNav = true;
        headerHTML = this.renderDefaultHeader();
      } else if (hash === '#/clients-list') {
        screen = window.ClientsListScreen;
        showFab = false;
        showBottomNav = true;
        headerHTML = this.renderDefaultHeader();
      } else if (hash === '#/food-menu') {
        screen = window.FoodMenuScreen;
        showFab = false;
        showBottomNav = true;
        headerHTML = this.renderDefaultHeader();
      } else if (hash === '#/filter') {
        screen = window.FilterScreen;
        showFab = false;
        showBottomNav = true;
        headerHTML = this.renderDefaultHeader();
      } else if (hash === '#/settings') {
        screen = window.SettingsScreen;
        showFab = false;
        showBottomNav = true;
        headerHTML = this.renderDefaultHeader();
      } else {
         // Dashboard: #/dashboard or #/
         screen = window.DashboardScreen;
         showFab = true;
         showBottomNav = true;
         headerHTML = this.renderDefaultHeader();

         // Auto-import legacy reservations if localStorage is empty
         const existingCount = window.Storage.getAllReservations().length;
         if (existingCount === 0) {
           window.Storage.autoImportLegacy().then(result => {
             if (result.imported > 0) {
               window.Toast.success(`Imported ${result.imported} historical reservations`);
               // Refresh dashboard to show new data
               this.route();
             }
           });
         }
      }

      // Update header
      document.getElementById('app-header').innerHTML = headerHTML;

      // Check sync status on dashboard load (after header render)
      if (hash === '#/dashboard' || hash === '' || hash === '#/') {
        window.Storage.checkSyncStatus().then(status => {
          window.AppState = window.AppState || {};
          window.AppState.syncStatus = status;
          if (status.hasWarnings) {
            this.showSyncWarning(status);
          }
          // Refresh dashboard list to show sync icons on cards
          if (hash === '#/dashboard' || hash === '' || hash === '#/') {
            const listEl = document.getElementById('reservationList');
            if (listEl && window.DashboardScreen) {
              const currentFilter = listEl.getAttribute('data-active-filter') || 'all';
              const reservations = window.Storage.getAllReservations();
              listEl.innerHTML = window.DashboardScreen.renderList(reservations, currentFilter);
              window.DashboardScreen.bindCardEvents();
            }
          }
        });
      }

      // Attach theme toggle
      const initThemeToggle = () => {
        const toggles = document.querySelectorAll("#theme-toggle, #header-theme-toggle");
        if (toggles.length === 0) return;

        const updateUI = (isDark) => {
          document.body.classList.toggle("theme-dark", isDark);
          document.documentElement.classList.toggle("theme-dark", isDark);
          
          toggles.forEach(toggle => {
            const iconUse = toggle.querySelector("use");
            if (iconUse) {
              iconUse.setAttribute("href", isDark ? "#icon-moon" : "#icon-sun");
            }
            toggle.setAttribute("aria-checked", isDark.toString());
            toggle.setAttribute("aria-label", isDark ? "Activate light mode" : "Activate dark mode");
            
            // If it's the island toggle, update the label text
            const label = toggle.querySelector("#theme-label");
            if (label) {
              label.textContent = isDark ? "Dark Mode" : "Light Mode";
            }
          });
          
          // Persistence
          localStorage.setItem("theme", isDark ? "dark" : "light");
        };

        const isDark = document.body.classList.contains("theme-dark") || localStorage.getItem("theme") === "dark";
        updateUI(isDark);

        toggles.forEach(toggle => {
          toggle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentlyDark = document.body.classList.contains("theme-dark");
            updateUI(!currentlyDark);
          });
        });
      };
      
      initThemeToggle();

      // Update FAB
      if (showFab) {
        window.FAB.show();
      } else {
        window.FAB.hide();
      }

      // Update main padding
      if (inStepper) {
        mainEl.classList.add('in-stepper');
      } else {
        mainEl.classList.remove('in-stepper');
      }

      // Render screen
      if (screen) {
        // Set data-step attribute for hydration/debugging (e.g., "step1", "step2", "step3")
        container.dataset.step = `step${stepNumber}`;
        screen.render(container, params);
        this.currentScreen = screen;
      } else if (hash.match(/^#\/data/)) {
        container.dataset.step = 'data';
        this.renderDataScreen(container);
      } else {
        container.dataset.step = 'dashboard';
      }

      // Render step footer for stepper mode
      this.renderStepFooter(stepNumber, params.id);
    },

    /**
     * Show a sync warning on the dashboard
     */
    showSyncWarning(status) {
      const existing = document.getElementById('sync-warning');
      if (existing) existing.remove();

      if (!status.hasWarnings) return;

      const msg = status.onlyInLocal.length > 0 
        ? `${status.onlyInLocal.length} unbacked-up items`
        : 'Data out of sync';

      const warningHtml = `
        <button id="sync-warning" class="header-action-btn sync-warning-icon animate-jump-in" 
                onclick="window.App.navigate('#/data')" 
                title="${msg}"
                style="color: var(--color-warning); background: var(--color-warning-muted); border-radius: 50%; padding: 4px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </button>
      `;

      // Insert into header-actions
      const headerActions = document.querySelector('.header-actions');
      if (headerActions) {
        headerActions.insertAdjacentHTML('afterbegin', warningHtml);
      }
    },

    /**
     * Render default header (Dashboard)
     */
    renderDefaultHeader() {
      return `
        <span class="header-title"><img src="https://www.loveshackcruises.com/wp-content/uploads/2025/06/newLogo.png" alt="Love Shack Cruises"></span>
        <div class="header-right">
          <div class="header-actions">
            <button class="header-theme-toggle" id="header-theme-toggle" aria-label="Activate dark mode" role="switch" aria-checked="false">
              <div class="toggle-theme-left">
                <svg class="icon" aria-hidden="true">
                  <use id="theme-icon-use" href="#icon-sun"></use>
                </svg>
              </div>
            </button>
            <button class="header-action-btn" onclick="window.App.navigate('#/data')" title="Manage Data">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    },

    /**
     * Render stepper header with back button + progress bar
     */
    renderStepperHeader(step, id, isViewOnly = false) {
      const backHash = '#/dashboard';
      const saveExitAction = step === 1 ? 'window.Step1Screen.autoSave()' : step === 2 ? 'window.Step2Screen.autoSave()' : 'window.Step3Screen.autoSave()';

      return `
        <a href="${backHash}" class="header-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </a>
        ${isViewOnly ? '<span class="header-title" style="font-size: var(--font-md);">Reservation</span>' : window.StepperBar.render(step, id)}
        <button class="header-save-exit" onclick="${saveExitAction}; window.App.navigate('#/dashboard')">
          Save
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      `;
    },

     /**
      * Render step footer with navigation buttons
      * Footer order: [Back (icon-only)] [Save & Exit] [Continue/Confirm]
      */
     renderStepFooter(step, id) {
       // Remove existing footer
       const existing = document.getElementById('step-footer');
       if (existing) existing.remove();

       if (step === 0) return; // Not in stepper

       const reservation = id ? window.Storage.getReservation(id) : null;
       const isBooked = reservation && reservation.status !== 'draft';

       let footerHtml = '<div class="step-footer" id="step-footer"><div class="step-footer-inner">';

       if (step === 1) {
         // Step 1: Continue
         footerHtml += `
           <button class="btn btn-primary btn-full" onclick="window.Storage.updateCurrentStep('${id}', 2); window.App.navigate('#/new/${id}/details')">
             Continue to Details
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><polyline points="9 18 15 12 9 6"/></svg>
           </button>
         `;
       } else if (step === 2) {
         // Step 2: Back (icon) + Continue
         footerHtml += `
           <button class="btn btn-secondary" style="flex: 0 0 60px;" onclick="window.App.navigate('#/new/${id}')" aria-label="Back">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><polyline points="15 18 9 12 15 6"/></svg>
           </button>
           <button class="btn btn-primary" onclick="window.Step2Screen.autoSave(); window.Storage.updateCurrentStep('${id}', 3); window.App.navigate('#/new/${id}/adjustments')">
             Continue to Pricing
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><polyline points="9 18 15 12 9 6"/></svg>
           </button>
         `;
       } else if (step === 3) {
         if (isBooked) {
           // Booked: single button back to dashboard
           footerHtml += `
             <button class="btn btn-secondary btn-full" onclick="window.App.navigate('#/dashboard')">
               ← Back to Dashboard
             </button>
           `;
         } else {
           // Step 3: Back (icon) + Confirm Booking
           footerHtml += `
             <button class="btn btn-secondary" style="flex: 0 0 60px;" onclick="window.App.navigate('#/new/${id}/details')" aria-label="Back">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px"><polyline points="15 18 9 12 15 6"/></svg>
             </button>
             <button class="btn btn-primary" onclick="window.Step3Screen.confirmBooking()" style="background: var(--color-success);">
               ✓ Confirm Booking
             </button>
           `;
         }
       }

       footerHtml += '</div></div>';
       document.body.insertAdjacentHTML('beforeend', footerHtml);
     },

    /**
     * Render a simple data management screen
     */
    renderDataScreen(container) {
      const counts = window.Storage.getCounts();

      container.innerHTML = `
        <div class="step-content stagger-children">
          <div class="step-section">
            <div class="step-section-title">Data Management</div>
            <div class="input-group">
              <div class="input-group-row">
                <span class="input-group-label">Total Records</span>
                <div class="input-group-value">
                  <span style="font-weight: var(--weight-bold); color: var(--color-accent);">${counts.total}</span>
                </div>
              </div>
              <div class="input-group-row">
                <span class="input-group-label">Drafts</span>
                <div class="input-group-value"><span>${counts.draft}</span></div>
              </div>
              <div class="input-group-row">
                <span class="input-group-label">Reserved</span>
                <div class="input-group-value"><span>${counts.reservado}</span></div>
              </div>
            </div>
          </div>

          <div class="step-section">
            <div class="step-section-title">Export / Import</div>
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              <button class="btn btn-secondary btn-full" id="exportBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export JSON
              </button>
              <button class="btn btn-secondary btn-full" id="importBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Import JSON
              </button>
              <input type="file" id="importFile" accept=".json" style="display: none;">

              <div class="divider"></div>

              <button class="btn btn-danger btn-full" id="clearDraftsBtn">
                Clear All Drafts
              </button>
            </div>
          </div>

          <div class="step-section">
            <div class="step-section-title">External JSON Sync (Double Storage)</div>
            <div style="display: flex; flex-direction: column; gap: var(--space-3);">
              <p style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">
                Sync your browser data with the local disk JSON file.
              </p>
              <button class="btn btn-primary btn-full" id="pushSyncBtn">
                Push Local to JSON File
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </button>
              <button class="btn btn-secondary btn-full" id="pullSyncBtn">
                Pull from JSON File
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;

      // Export button
      document.getElementById('exportBtn')?.addEventListener('click', () => {
        const json = window.Storage.exportJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `loveshack_v3_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.Toast.success('Exported successfully');
      });

      // Import button
      document.getElementById('importBtn')?.addEventListener('click', () => {
        document.getElementById('importFile')?.click();
      });

      document.getElementById('importFile')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = window.Storage.importJSON(ev.target.result);
          window.Toast.success(`Imported ${result.imported} records (${result.duplicates} duplicates)`);
          this.route(); // Refresh
        };
        reader.readAsText(file);
      });

      // Push Sync
      document.getElementById('pushSyncBtn')?.addEventListener('click', async () => {
        const reservations = window.Storage.getAllReservations();
        const success = await window.Storage.saveToJSON(reservations);
        if (success) {
          window.Toast.success('Successfully backed up to JSON file');
          // Clear warning
          const warning = document.getElementById('sync-warning');
          if (warning) warning.remove();
          if (window.AppState) window.AppState.syncStatus = { hasWarnings: false };
        } else {
          window.Toast.error('Save server not running (localhost:8765)');
        }
      });

      // Pull Sync
      document.getElementById('pullSyncBtn')?.addEventListener('click', async () => {
        const jsonItems = await window.Storage.loadFromJSON();
        if (jsonItems.length > 0) {
          const result = window.Storage.importJSON(JSON.stringify(jsonItems));
          window.Toast.success(`Synced ${result.imported} new items from file.`);
          this.route();
        } else {
          window.Toast.error('Could not load or file is empty');
        }
      });

      // Clear drafts
      document.getElementById('clearDraftsBtn')?.addEventListener('click', () => {
        if (!confirm('Delete all draft reservations?')) return;
        const all = window.Storage.getAllReservations();
        const filtered = all.filter((r) => r.status !== 'draft');
        localStorage.setItem('loveshack_v3_reservations', JSON.stringify(filtered));
        window.Toast.success('Drafts cleared');
        this.route();
      });
     },
   };

   // Export globally
   window.App = App;

   // Boot when DOM ready
   document.addEventListener('DOMContentLoaded', () => {
     App.init();
   });
 })();
