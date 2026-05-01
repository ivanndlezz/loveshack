/**
 * Toast Component — Love Shack v3
 * Lightweight toast notification system
 */

const Toast = {
  /**
   * Show a toast notification
   * @param {string} message - Toast text
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - ms before auto-dismiss
   */
  show(message, type = 'info', duration = 2500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => {
      toast.classList.add('toast-exit');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  },

  success(message, duration) { this.show(message, 'success', duration); },
  error(message, duration)   { this.show(message, 'error', duration); },
  warning(message, duration) { this.show(message, 'warning', duration); },
  info(message, duration)    { this.show(message, 'info', duration); },
};

window.Toast = Toast;
