/**
 * Stepper Bar — Love Shack v3
 * Progress indicator for the 3-step booking flow
 */

const StepperBar = {
  /**
   * Render the stepper bar into the header area
   * @param {number} currentStep - 1, 2, or 3
   * @returns {string} HTML string
   */
  render(currentStep) {
    const steps = [
      { num: 1, label: 'Pricing' },
      { num: 2, label: 'Details' },
      { num: 3, label: 'Booking' },
    ];

    let html = '<div class="stepper-bar">';

    steps.forEach((step, i) => {
      const isActive = step.num === currentStep;
      const isCompleted = step.num < currentStep;

      // Dot
      let dotClass = 'stepper-dot';
      if (isActive) dotClass += ' active';
      else if (isCompleted) dotClass += ' completed';

      const dotContent = isCompleted
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
        : step.num;

      html += `<div class="stepper-step">`;
      html += `<div class="${dotClass}">${dotContent}</div>`;

      // Line (not after last step)
      if (i < steps.length - 1) {
        const lineFilled = step.num < currentStep;
        html += `<div class="stepper-line ${lineFilled ? 'filled' : ''}"></div>`;
      }

      html += `</div>`;
    });

    html += '</div>';
    return html;
  },

  /**
   * Render step labels separately
   * @param {number} currentStep
   * @returns {string} HTML
   */
  renderLabels(currentStep) {
    const labels = ['Pricing', 'Details', 'Booking'];
    return `<div class="stepper-labels">${labels
      .map((label, i) => {
        let cls = 'stepper-label';
        if (i + 1 === currentStep) cls += ' active';
        else if (i + 1 < currentStep) cls += ' completed';
        return `<span class="${cls}">${label}</span>`;
      })
      .join('')}</div>`;
  },
};

window.StepperBar = StepperBar;
