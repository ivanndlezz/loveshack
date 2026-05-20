/**
 * SHUM API Sync Manager — Love Shack v3
 * Handles synchronization between LocalStorage and Airtable via SHUM API
 */

const SyncManager = {
  config: null,
  isInitialized: false,

  async init() {
    if (this.isInitialized) return;
    try {
      const response = await fetch('./js/config.json');
      if (response.ok) {
        this.config = await response.json();
        this.isInitialized = true;
      } else {
        console.warn('SyncManager: Could not load config.json');
      }
    } catch (e) {
      console.warn('SyncManager: Error loading config.json', e);
    }
  },

  async shumRequest(action, params) {
    if (!this.isInitialized) await this.init();
    if (!this.config || !this.config.api.baseId) {
      throw new Error('SyncManager: Missing configuration or baseId');
    }

    try {
      const response = await fetch(this.config.api.shumEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'API request failed');
      }

      return result.data;
    } catch (error) {
      console.error("SHUM API Error:", error);
      throw error;
    }
  },

  /**
   * Maps an internal tourType string to the exact Airtable Single Select option name.
   * Keys = values stored in localStorage / step2_details.tourType
   * Values = exact option labels configured in the Airtable field.
   *
   * If the tourType doesn't match any key, it is passed through as-is so that
   * legacy/free-text values still reach Airtable (they'll create a new option
   * if the field allows it, or you can add them here to remap them).
   */
  TOUR_TYPE_MAP: {
    "Bay Trip":        "Bay Trip",
    "Whale Watching":  "Whale Watching",
    "Snorkeling Tour": "Snorkeling Tour",
    "Sunset Cruise":   "Sunset Cruise",
    "Fishing":         "Fishing",
  },

  normalizeTourType(raw) {
    if (!raw || raw.trim() === "") return null;  // Single Select: null = no value
    return this.TOUR_TYPE_MAP[raw] ?? raw;       // fallback: pass through as-is
  },

  mapReservationToAirtable(r) {
    const s1 = r.data?.step1_pricing || {};
    const s2 = r.data?.step2_details || {};
    const s3 = r.data?.step3_adjustments || {};

    return {
      "UUID": r.id || "",
      "status": r.status || "draft",
      "name": s2.customerName || "",
      "email": s2.customerEmail || "",
      "phone": s2.customerPhone || "",
      "TOUR_type": this.normalizeTourType(s2.tourType),  // Single Select — null when empty
      "trip_DATE": s2.tripDate || "",
      "START_time": s2.startTime || "",
      "END_time": s2.endTime || "",
      "DURATION_hours": String(s1.durationHours || "0"),
      "pax": String(s1.passengers || "0"),
      "source": String(s3.bookingSource || ""),
      "pricing_TYPE": String(s1.pricingType || ""),
      "manual_HOURLY_rate": s3.manualHourlyRate ? String(s3.manualHourlyRate) : "",
      "manual_PAX_rate": s3.manualExtraPaxRate ? String(s3.manualExtraPaxRate) : "",
      "DISCOUNT_type": String(s3.repriceType || ""),
      "DISCOUNT_value": String(s3.repriceDiscount || "0"),
      "EXTRAS_amount": String(s3.extrasAmount || "0"),
      "fishing_LICENSES": String(s3.fishingLicenses || "0"),
      "BUSINESS_price": Number(s3.finalBusinessPrice) || 0,
      "CUSTOMER_price": Number(s3.finalCustomerPrice) || 0,
      "fee": Number(s3.feeAmount) || 0,
      "deposit": Number(s3.deposit) || 0,
      "balance": Number(s3.balance) || 0,
      "PAYMENT_method": s3.paymentMethod || "",
      "notes": s2.notes || "",
      "CREATED_at": r.createdAt || "",
      "UPDATED_at": r.updatedAt || "",
    };
  },

  async syncReservation(reservationId) {
    if (!this.isInitialized) await this.init();
    if (!this.config || !this.config.settings.autoSyncOnConfirm) return null;

    const r = window.Storage.getReservation(reservationId);
    if (!r) throw new Error("Reservation not found in local storage");

    // Auto-reconcile/link: If not synced locally, check if it already exists in Airtable by UUID
    if (!r.airtable_id) {
      try {
        const listResult = await this.shumRequest('list', {
          baseId: this.config.api.baseId,
          table: this.config.api.tableName,
          filter: {
            filterByFormula: `{UUID} = '${r.id}'`
          }
        });
        const existing = listResult && listResult.records ? listResult.records : [];
        if (existing.length > 0 && existing[0].id) {
          r.airtable_id = existing[0].id;
          r.sync_status = "synced";
          console.log("SyncManager: Found existing Airtable record, auto-linking ID:", r.airtable_id);
        }
      } catch (e) {
        console.warn("SyncManager: Failed to check for existing record by UUID", e);
      }
    }

    const mappedData = this.mapReservationToAirtable(r);

    let result;
    try {
      if (r.airtable_id) {
        // Update existing record
        result = await this.shumRequest('update', {
          baseId: this.config.api.baseId,
          table: this.config.api.tableName,
          recordId: r.airtable_id,
          data: mappedData
        });
      } else {
        // Create new record
        result = await this.shumRequest('create', {
          baseId: this.config.api.baseId,
          table: this.config.api.tableName,
          data: mappedData
        });

        // Save new airtable_id back to local storage (handling Airtable response format correctly)
        const records = result && result.records ? result.records : [];
        if (records.length > 0 && records[0].id) {
          r.airtable_id = records[0].id;
          r.sync_status = "synced";
          r.lastSyncedAt = new Date().toISOString();
          
          // Save using Storage method (raw save to prevent recursion/side-effects)
          const all = window.Storage.getAllReservations();
          const idx = all.findIndex((item) => item.id === r.id);
          if (idx !== -1) {
            all[idx] = r;
            window.Storage.saveAll(all);
          }
        }
      }

      // Update sync status for existing
      if (r.airtable_id) {
        r.sync_status = "synced";
        r.lastSyncedAt = new Date().toISOString();
        const all = window.Storage.getAllReservations();
        const idx = all.findIndex((item) => item.id === r.id);
        if (idx !== -1) {
          all[idx] = r;
          window.Storage.saveAll(all);
        }
      }

      return result;
    } catch (error) {
      console.error("Failed to sync reservation", error);
      
      // Mark as failed sync
      r.sync_status = "failed";
      const all = window.Storage.getAllReservations();
      const idx = all.findIndex((item) => item.id === r.id);
      if (idx !== -1) {
        all[idx] = r;
        window.Storage.saveAll(all);
      }
      
      throw error;
    }
  },

  async syncAllReservations() {
    if (!this.isInitialized) await this.init();
    const all = window.Storage.getAllReservations();
    if (all.length === 0) {
      window.Toast.warning("No reservations to sync.");
      return;
    }

    const progressToast = window.Toast.info(
      `Sincronizando ${all.length} reservaciones con la Nube...`,
      -1
    );

    try {
      // Separa los que ya tienen ID de Airtable y los que no
      const unsynced = all.filter((r) => !r.airtable_id);
      const synced = all.filter((r) => r.airtable_id);

      // Si hay reservas sin airtable_id local, verificamos si ya existen en la Nube buscando por UUID
      if (unsynced.length > 0) {
        const checkChunks = [];
        for (let i = 0; i < unsynced.length; i += 10) {
          checkChunks.push(unsynced.slice(i, i + 10));
        }

        for (const chunk of checkChunks) {
          const formula =
            "OR(" + chunk.map((r) => `{UUID} = '${r.id}'`).join(", ") + ")";
          try {
            const listRes = await this.shumRequest("list", {
              baseId: this.config.api.baseId,
              table: this.config.api.tableName,
              filter: {
                filterByFormula: formula,
              },
            });
            const records =
              listRes && listRes.records ? listRes.records : [];
            records.forEach((rec) => {
              const uuid = rec.fields.UUID;
              const r = chunk.find((item) => item.id === uuid);
              if (r) {
                r.airtable_id = rec.id;
                r.sync_status = "synced";
                const idx = unsynced.indexOf(r);
                if (idx !== -1) unsynced.splice(idx, 1);
                synced.push(r);
              }
            });
          } catch (e) {
            console.warn("SyncAll: Falló chequeo de duplicados en la Nube", e);
          }
        }
      }

      // Crear nuevas reservas de forma paralela (llamadas individuales altamente concurrentes y seguras)
      if (unsynced.length > 0) {
        const createPromises = unsynced.map(async (r) => {
          const mappedData = this.mapReservationToAirtable(r);
          try {
            const result = await this.shumRequest("create", {
              baseId: this.config.api.baseId,
              table: this.config.api.tableName,
              data: mappedData,
            });
            if (result && result.id) {
              r.airtable_id = result.id;
              r.sync_status = "synced";
              r.lastSyncedAt = new Date().toISOString();
            }
          } catch (err) {
            console.error(`SyncAll: Falló creación de ${r.id}`, err);
            r.sync_status = "failed";
          }
        });
        await Promise.all(createPromises);
      }

      // Actualizar reservas existentes de forma paralela
      if (synced.length > 0) {
        const updatePromises = synced.map(async (r) => {
          const mappedData = this.mapReservationToAirtable(r);
          try {
            await this.shumRequest("update", {
              baseId: this.config.api.baseId,
              table: this.config.api.tableName,
              recordId: r.airtable_id,
              data: mappedData,
            });
            r.sync_status = "synced";
            r.lastSyncedAt = new Date().toISOString();
          } catch (err) {
            console.error(`SyncAll: Falló actualización de ${r.id}`, err);
            r.sync_status = "failed";
          }
        });
        await Promise.all(updatePromises);
      }

      // Guardar todos los estados actualizados en LocalStorage
      window.Storage.saveAll(all);

      // Remover Toast de carga y mostrar éxito
      progressToast.querySelector(".toast-close")?.click();
      window.Toast.success(
        `¡Sincronizadas todas las reservaciones (${all.length}) con éxito! 🎉`,
        3000
      );

      // Disparar evento personalizado para notificar a otras pantallas del cambio
      document.dispatchEvent(new CustomEvent("sync-complete"));
    } catch (error) {
      console.error("Bulk Sync Error:", error);
      progressToast.querySelector(".toast-close")?.click();
      window.Toast.error(
        "Error al sincronizar todas las reservas. Revisa la consola.",
        4000
      );
    }
  },

  async deleteReservationFromAirtable(reservationId) {
    if (!this.isInitialized) await this.init();

    const r = window.Storage.getReservation(reservationId);
    if (!r) throw new Error("Reservation not found in local storage");
    if (!r.airtable_id) throw new Error("This reservation is not linked to Airtable");

    try {
      await this.shumRequest('delete', {
        baseId: this.config.api.baseId,
        table: this.config.api.tableName,
        recordId: r.airtable_id
      });

      // Clear Airtable link in LocalStorage
      const all = window.Storage.getAllReservations();
      const idx = all.findIndex((item) => item.id === r.id);
      if (idx !== -1) {
        all[idx].airtable_id = null;
        all[idx].sync_status = "pending";
        delete all[idx].lastSyncedAt;
        window.Storage.saveAll(all);
      }
      
      // Dispatch sync-complete event
      document.dispatchEvent(new CustomEvent("sync-complete"));
      return true;
    } catch (error) {
      console.error("Failed to delete reservation from Airtable", error);
      throw error;
    }
  }
};

window.SyncManager = SyncManager;
