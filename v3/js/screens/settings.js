/**
 * Settings Screen — Love Shack v3
 * App preferences and information
 */

const SettingsScreen = {
  container: null,

  render(container) {
    this.container = container;
    container.innerHTML = `
      <div class="step-content stagger-children">
        <div class="step-section">
          <div class="step-section-title">Preferencias de App</div>
          <div class="input-group">
            <div class="input-group-row">
              <span class="input-group-label">Versión</span>
              <div class="input-group-value">v3.1.0-beta</div>
            </div>
            <div class="input-group-row">
              <span class="input-group-label">Desarrollado por</span>
              <div class="input-group-value">DeepMind Coding Assistant</div>
            </div>
          </div>
        </div>

        <div class="step-section">
          <div class="step-section-title">Acciones de Sistema</div>
          <button class="btn btn-secondary btn-full" onclick="localStorage.clear(); location.reload();" style="color: var(--color-danger);">
            Borrar Todo (Reset Fábrica)
          </button>
          <p style="font-size: 11px; color: var(--color-text-tertiary); margin-top: 8px; text-align: center;">
            ¡Cuidado! Esta acción borrará todas las reservas locales permanentemente.
          </p>
        </div>
      </div>
    `;
  },

  destroy() {
    this.container = null;
  }
};

window.SettingsScreen = SettingsScreen;
