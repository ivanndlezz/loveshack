# Plan: Add Save & Sync Buttons Above Print Voucher in Step 3

## Objective
Add a compact action bar with **Save** and **Sync** buttons above the existing "Print Voucher" button in Step 3's action buttons section.

## Location
- **File**: `v3/js/screens/step3-adjustments.js`
- **Lines**: 333-353 (Action Buttons section)

## Current Code (lines 333-353)
```js
        <!-- Action Buttons -->
        <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4);">
          <button class="btn btn-secondary btn-full" onclick="window.App.navigate('#/voucher/${this.reservationId}')">
            ...
            Print Voucher
          </button>

          ${
            isBooked
              ? `
            <button class="btn btn-danger btn-full" id="deleteBtn">
              ...
              Delete Reservation
            </button>
          `
              : ""
          }
        </div>
```

## Proposed Change
Replace lines 333-353 with the following:

```js
        <!-- Action Buttons -->
        <div style="display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4);">
          <div style="display: flex; align-items: center; background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: 20px; height: 32px; overflow: hidden; margin-bottom: var(--space-3);">
            <button onclick="window.Step3Screen.autoSave(); window.App.navigate('#/dashboard')" style="background: transparent; border: none; color: var(--color-accent); font-size: 13px; font-weight: 500; height: 100%; padding: 0 12px; display: flex; align-items: center; gap: 4px; cursor: pointer;">
              Save
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <div style="width: 1px; height: 20px; background: var(--color-border);"></div>
            <button onclick="window.App.openSyncSheet('${this.reservationId}')" style="background: transparent; border: none; color: var(--color-accent); height: 100%; padding: 0 8px; display: flex; align-items: center; cursor: pointer;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          <button class="btn btn-secondary btn-full" onclick="window.App.navigate('#/voucher/${this.reservationId}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Voucher
          </button>

          ${
            isBooked
              ? `
            <button class="btn btn-danger btn-full" id="deleteBtn">
              <i class="ti ti-trash"></i> Delete Reservation
            </button>
          `
              : ""
          }
        </div>
```

## Key Points
- New compact action bar inserted **above** the Print Voucher button
- Uses CSS variables already present: `--color-surface-alt`, `--color-border`, `--color-accent`
- `this.reservationId` is used dynamically for the sync button
- Existing Print Voucher and Delete buttons remain unchanged
