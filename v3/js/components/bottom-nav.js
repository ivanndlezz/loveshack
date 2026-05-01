/**
 * Bottom Navigation — Love Shack v3
 * Dynamic bottom nav renderer
 */

const BottomNav = {
  el: null,

  init() {
    this.el = document.getElementById('bottom-nav');
  },

  /**
   * Render default navigation tabs
   * @param {string} activeTab - 'dashboard' | 'history' | 'settings'
   */
  renderDefault(activeTab = 'dashboard') {
    if (!this.el) return;

    const tabs = [
      {
        id: 'dashboard',
        label: 'Home',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        hash: '#/dashboard',
      },
      {
        id: 'history',
        label: 'History',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        hash: '#/dashboard?filter=completado',
      },
      {
        id: 'settings',
        label: 'Data',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        hash: '#/data',
      },
    ];

    this.el.innerHTML = tabs
      .map(
        (tab) => `
        <a href="${tab.hash}" class="nav-item ${activeTab === tab.id ? 'active' : ''}" data-nav="${tab.id}">
          ${tab.icon}
          <span>${tab.label}</span>
        </a>
      `
      )
      .join('');

    this.el.style.display = '';
  },

  /**
   * Hide the bottom nav (used during stepper flow)
   */
  hide() {
    if (this.el) this.el.style.display = 'none';
  },

  show() {
    if (this.el) this.el.style.display = '';
  },
};

window.BottomNav = BottomNav;
