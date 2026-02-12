/**
 * Inquiry Manager Module
 * Handles local storage operations for quotes/inquiries
 *
 * Features:
 * - CRUD operations for inquiries
 * - Auto-save functionality
 * - Import/Export to JSON
 * - Search and filter capabilities
 * - Duplicate inquiries
 */

(function () {
  "use strict";

  const STORAGE_KEY = "loveshack_inquiries";
  const STORAGE_META_KEY = "loveshack_inquiries_metadata";
  const AUTO_SAVE_KEY = "loveshack_autosave";
  const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  // Inquiry Status Enum
  const InquiryStatus = {
    DRAFT: "draft",
    PENDING: "pending",
    SENT: "sent",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
  };

  // Inquiry Default Template
  const defaultInquiry = {
    id: null,
    createdAt: null,
    updatedAt: null,
    status: InquiryStatus.DRAFT,
    customer: {
      name: "",
      email: "",
      phone: "",
      language: "en",
    },
    trip: {
      tourType: "",
      date: "",
      duration: 3,
      passengers: 14,
      time: "",
    },
    pricing: {
      pricingType: "regular",
      source: "direct",
      extras: {
        fishingLicenses: 0,
        amount: 0,
      },
      reprice: {
        type: "",
        discount: "",
      },
    },
    result: {
      basePrice: 0,
      extras: 0,
      subtotal: 0,
      discount: 0,
      businessPrice: 0,
      fee: 0,
      customerPrice: 0,
    },
    notes: "",
    tags: [],
  };

  /**
   * Generate UUID v4
   */
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }

  /**
   * Get all inquiries from localStorage
   */
  function getAllInquiries() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading inquiries:", e);
      return [];
    }
  }

  /**
   * Save all inquiries to localStorage
   */
  function saveAllInquiries(inquiries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inquiries));
      updateMetadata({ lastModified: new Date().toISOString() });
      return true;
    } catch (e) {
      console.error("Error saving inquiries:", e);
      return false;
    }
  }

  /**
   * Get storage metadata
   */
  function getMetadata() {
    try {
      const data = localStorage.getItem(STORAGE_META_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Update storage metadata
   */
  function updateMetadata(updates) {
    const meta = getMetadata();
    Object.assign(meta, updates);
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
  }

  /**
   * InquiryManager Class
   */
  class InquiryManager {
    constructor() {
      this.autoSaveTimer = null;
      this.onAutoSaveCallback = null;
      this.onChangeCallback = null;
      this.init();
    }

    /**
     * Initialize the manager
     */
    init() {
      // Ensure storage exists
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, "[]");
      }
    }

    /**
     * Create a new inquiry from form data
     */
    createInquiry(formData, pricingResult = null) {
      const inquiry = JSON.parse(JSON.stringify(defaultInquiry));

      inquiry.id = generateUUID();
      const now = new Date().toISOString();
      inquiry.createdAt = now;
      inquiry.updatedAt = now;

      // Merge form data
      if (formData.customer) {
        Object.assign(inquiry.customer, formData.customer);
      }
      if (formData.trip) {
        Object.assign(inquiry.trip, formData.trip);
      }
      if (formData.pricing) {
        Object.assign(inquiry.pricing, formData.pricing);
      }
      if (formData.notes !== undefined) {
        inquiry.notes = formData.notes;
      }
      if (formData.tags) {
        inquiry.tags = formData.tags;
      }

      // Store pricing result if provided
      if (pricingResult && pricingResult.summary) {
        inquiry.result = {
          basePrice: pricingResult.summary.basePrice || 0,
          extras: pricingResult.summary.extras || 0,
          subtotal: pricingResult.summary.subtotal || 0,
          discount: pricingResult.summary.discount || 0,
          businessPrice: pricingResult.summary.businessPrice || 0,
          fee: pricingResult.summary.fee || 0,
          customerPrice: pricingResult.summary.customerPrice || 0,
        };
      }

      return inquiry;
    }

    /**
     * Save a new inquiry or update existing
     */
    saveInquiry(inquiryData, formData = null, pricingResult = null) {
      const inquiries = getAllInquiries();

      // If existing inquiry (has ID), update it
      if (inquiryData.id) {
        const index = inquiries.findIndex((i) => i.id === inquiryData.id);
        if (index !== -1) {
          const updatedInquiry = {
            ...inquiries[index],
            ...inquiryData,
            updatedAt: new Date().toISOString(),
          };
          // Merge nested objects
          if (inquiryData.customer) {
            updatedInquiry.customer = {
              ...inquiries[index].customer,
              ...inquiryData.customer,
            };
          }
          if (inquiryData.trip) {
            updatedInquiry.trip = {
              ...inquiries[index].trip,
              ...inquiryData.trip,
            };
          }
          if (inquiryData.pricing) {
            updatedInquiry.pricing = {
              ...inquiries[index].pricing,
              ...inquiryData.pricing,
            };
          }
          if (formData) {
            if (formData.customer) {
              updatedInquiry.customer = {
                ...updatedInquiry.customer,
                ...formData.customer,
              };
            }
            if (formData.trip) {
              updatedInquiry.trip = {
                ...updatedInquiry.trip,
                ...formData.trip,
              };
            }
            if (formData.pricing) {
              updatedInquiry.pricing = {
                ...updatedInquiry.pricing,
                ...formData.pricing,
              };
            }
          }
          if (pricingResult && pricingResult.summary) {
            updatedInquiry.result = {
              ...updatedInquiry.result,
              ...pricingResult.summary,
            };
          }
          inquiries[index] = updatedInquiry;
        } else {
          // ID not found, treat as new
          const newInquiry = this.createInquiry(
            formData || inquiryData,
            pricingResult,
          );
          newInquiry.id = inquiryData.id;
          inquiries.push(newInquiry);
        }
      } else {
        // Create new
        const newInquiry = this.createInquiry(
          formData || inquiryData,
          pricingResult,
        );
        inquiries.push(newInquiry);
      }

      saveAllInquiries(inquiries);
      this.triggerChange();
      return inquiryData.id || this.getInquiryId(formData || inquiryData);
    }

    /**
     * Get inquiry ID from data
     */
    getInquiryId(data) {
      return data.id || generateUUID();
    }

    /**
     * Get all inquiries
     */
    getInquiries(options = {}) {
      let inquiries = getAllInquiries();

      // Filter by status
      if (options.status) {
        if (Array.isArray(options.status)) {
          inquiries = inquiries.filter((i) =>
            options.status.includes(i.status),
          );
        } else {
          inquiries = inquiries.filter((i) => i.status === options.status);
        }
      }

      // Filter by date range
      if (options.startDate) {
        inquiries = inquiries.filter(
          (i) => new Date(i.createdAt) >= new Date(options.startDate),
        );
      }
      if (options.endDate) {
        inquiries = inquiries.filter(
          (i) => new Date(i.createdAt) <= new Date(options.endDate),
        );
      }

      // Search
      if (options.search) {
        const query = options.search.toLowerCase();
        inquiries = inquiries.filter(
          (i) =>
            i.customer.name.toLowerCase().includes(query) ||
            i.customer.email.toLowerCase().includes(query) ||
            i.trip.tourType.toLowerCase().includes(query) ||
            (i.notes && i.notes.toLowerCase().includes(query)),
        );
      }

      // Sort
      if (options.sortBy) {
        inquiries.sort((a, b) => {
          switch (options.sortBy) {
            case "date":
              return new Date(b.createdAt) - new Date(a.createdAt);
            case "dateAsc":
              return new Date(a.createdAt) - new Date(b.createdAt);
            case "customer":
              return a.customer.name.localeCompare(b.customer.name);
            case "price":
              return (
                (b.result?.customerPrice || 0) - (a.result?.customerPrice || 0)
              );
            case "status":
              return a.status.localeCompare(b.status);
            default:
              return new Date(b.updatedAt) - new Date(a.updatedAt);
          }
        });
      } else {
        // Default sort by updated date descending
        inquiries.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      }

      // Pagination
      if (options.limit) {
        const offset = options.offset || 0;
        inquiries = inquiries.slice(offset, offset + options.limit);
      }

      return inquiries;
    }

    /**
     * Get single inquiry by ID
     */
    getInquiry(id) {
      const inquiries = getAllInquiries();
      return inquiries.find((i) => i.id === id) || null;
    }

    /**
     * Update an inquiry
     */
    updateInquiry(id, updates) {
      const inquiries = getAllInquiries();
      const index = inquiries.findIndex((i) => i.id === id);

      if (index === -1) {
        console.warn(`Inquiry with ID ${id} not found`);
        return false;
      }

      inquiries[index] = {
        ...inquiries[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Merge nested objects
      if (updates.customer) {
        inquiries[index].customer = {
          ...inquiries[index].customer,
          ...updates.customer,
        };
      }
      if (updates.trip) {
        inquiries[index].trip = { ...inquiries[index].trip, ...updates.trip };
      }
      if (updates.pricing) {
        inquiries[index].pricing = {
          ...inquiries[index].pricing,
          ...updates.pricing,
        };
      }
      if (updates.result) {
        inquiries[index].result = {
          ...inquiries[index].result,
          ...updates.result,
        };
      }

      saveAllInquiries(inquiries);
      this.triggerChange();
      return true;
    }

    /**
     * Update inquiry status
     */
    updateStatus(id, status) {
      if (!Object.values(InquiryStatus).includes(status)) {
        console.error(`Invalid status: ${status}`);
        return false;
      }
      return this.updateInquiry(id, { status });
    }

    /**
     * Delete an inquiry
     */
    deleteInquiry(id) {
      let inquiries = getAllInquiries();
      const initialLength = inquiries.length;
      inquiries = inquiries.filter((i) => i.id !== id);

      if (inquiries.length !== initialLength) {
        saveAllInquiries(inquiries);
        this.triggerChange();
        return true;
      }
      return false;
    }

    /**
     * Duplicate an inquiry
     */
    duplicateInquiry(id) {
      const inquiry = this.getInquiry(id);
      if (!inquiry) {
        console.warn(`Inquiry with ID ${id} not found`);
        return null;
      }

      const newInquiry = JSON.parse(JSON.stringify(inquiry));
      newInquiry.id = generateUUID();
      newInquiry.status = InquiryStatus.DRAFT;
      newInquiry.createdAt = new Date().toISOString();
      newInquiry.updatedAt = new Date().toISOString();
      newInquiry.notes = newInquiry.notes
        ? `Duplicated from ${new Date(inquiry.createdAt).toLocaleDateString()}\n${newInquiry.notes}`
        : `Duplicated from ${new Date(inquiry.createdAt).toLocaleDateString()}`;

      const inquiries = getAllInquiries();
      inquiries.push(newInquiry);
      saveAllInquiries(inquiries);
      this.triggerChange();

      return newInquiry;
    }

    /**
     * Get inquiry count by status
     */
    getCountByStatus() {
      const inquiries = getAllInquiries();
      const counts = {
        [InquiryStatus.DRAFT]: 0,
        [InquiryStatus.PENDING]: 0,
        [InquiryStatus.SENT]: 0,
        [InquiryStatus.CONFIRMED]: 0,
        [InquiryStatus.CANCELLED]: 0,
      };

      inquiries.forEach((i) => {
        if (counts[i.status] !== undefined) {
          counts[i.status]++;
        }
      });

      return counts;
    }

    /**
     * Get storage statistics
     */
    getStorageStats() {
      const inquiries = getAllInquiries();
      const rawSize = localStorage.getItem(STORAGE_KEY)?.length || 0;
      const metadata = getMetadata();

      return {
        count: inquiries.length,
        size: rawSize,
        sizeFormatted: this.formatBytes(rawSize),
        lastModified: metadata.lastModified || null,
      };
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    /**
     * Export all inquiries to JSON
     */
    exportToJSON() {
      const inquiries = getAllInquiries();
      const metadata = getMetadata();

      const exportData = {
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        metadata: metadata,
        inquiries: inquiries,
      };

      return JSON.stringify(exportData, null, 2);
    }

    /**
     * Download exported JSON
     */
    downloadExport(filename = null) {
      const json = this.exportToJSON();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        filename ||
        `loveshack-inquiries-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    /**
     * Import inquiries from JSON
     */
    importFromJSON(jsonString, merge = false) {
      try {
        const data = JSON.parse(jsonString);

        if (!data.inquiries || !Array.isArray(data.inquiries)) {
          throw new Error("Invalid JSON format: missing inquiries array");
        }

        // Validate each inquiry
        const validInquiries = data.inquiries.filter((i) => {
          return i.id && i.trip && i.pricing;
        });

        if (validInquiries.length === 0) {
          throw new Error("No valid inquiries found in JSON");
        }

        if (merge) {
          // Merge with existing, overwriting by ID
          const existing = getAllInquiries();
          const existingMap = new Map(existing.map((i) => [i.id, i]));

          validInquiries.forEach((imported) => {
            existingMap.set(imported.id, {
              ...existingMap.get(imported.id),
              ...imported,
              updatedAt: new Date().toISOString(),
            });
          });

          saveAllInquiries(Array.from(existingMap.values()));
        } else {
          // Replace all
          saveAllInquiries(validInquiries);
        }

        this.triggerChange();
        return { success: true, imported: validInquiries.length };
      } catch (e) {
        console.error("Import error:", e);
        return { success: false, error: e.message };
      }
    }

    /**
     * Clear all inquiries
     */
    clearAll() {
      if (
        confirm(
          "Are you sure you want to delete all inquiries? This cannot be undone.",
        )
      ) {
        localStorage.setItem(STORAGE_KEY, "[]");
        updateMetadata({ lastCleared: new Date().toISOString() });
        this.triggerChange();
        return true;
      }
      return false;
    }

    /**
     * Auto-save current form state
     */
    autoSave(formData, pricingResult) {
      const autoSaveData = {
        formData,
        pricingResult: pricingResult?.summary || null,
        timestamp: new Date().toISOString(),
      };

      try {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoSaveData));

        if (this.onAutoSaveCallback) {
          this.onAutoSaveCallback(autoSaveData);
        }

        return true;
      } catch (e) {
        console.error("Auto-save failed:", e);
        return false;
      }
    }

    /**
     * Get auto-saved data
     */
    getAutoSave() {
      try {
        const data = localStorage.getItem(AUTO_SAVE_KEY);
        if (!data) return null;

        const parsed = JSON.parse(data);

        // Check if auto-save is not too old (7 days)
        const age = Date.now() - new Date(parsed.timestamp).getTime();
        const maxAge = 7 * 24 * 60 * 60 * 1000;

        if (age > maxAge) {
          this.clearAutoSave();
          return null;
        }

        return parsed;
      } catch (e) {
        return null;
      }
    }

    /**
     * Clear auto-save
     */
    clearAutoSave() {
      localStorage.removeItem(AUTO_SAVE_KEY);
    }

    /**
     * Start auto-save timer
     */
    startAutoSave(formDataGetter, calculator) {
      this.stopAutoSave();

      this.autoSaveTimer = setInterval(() => {
        const formData = formDataGetter();
        if (formData) {
          const result = calculator ? calculator.calculate(formData) : null;
          this.autoSave(formData, result);
        }
      }, AUTO_SAVE_INTERVAL);
    }

    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
        this.autoSaveTimer = null;
      }
    }

    /**
     * Set callback for auto-save events
     */
    onAutoSave(callback) {
      this.onAutoSaveCallback = callback;
    }

    /**
     * Set callback for data change events
     */
    onChange(callback) {
      this.onChangeCallback = callback;
    }

    /**
     * Trigger change callback
     */
    triggerChange() {
      if (this.onChangeCallback) {
        this.onChangeCallback(this.getInquiries());
      }
    }
  }

  // Export to global scope
  window.InquiryManager = InquiryManager;
  window.InquiryStatus = InquiryStatus;

  // Also support module exports
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { InquiryManager, InquiryStatus };
  }
})();
