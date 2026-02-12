Esta seccion:

````html
<div class="trip-summary" data-duration="2" data-passengers="14">
  <!-- Pricing Display -->
  <input type="checkbox" role="status" id="pricingDisplay" hide="" />
  <label for="pricingDisplay" class="pricing-display">
    <div class="pricing-row">
      <span class="pricing-label">Tarifa base</span>
      <span class="pricing-value" id="baseRate">650/hr</span>
    </div>
    <div class="pricing-row">
      <span class="pricing-label">Duración</span>
      <span class="pricing-value" id="displayDuration">2 hrs</span>
    </div>
    <div class="pricing-row">
      <span class="pricing-label">Pasajeros</span>
      <span class="pricing-value" id="displayPassengers">14</span>
    </div>
    <div class="pricing-row" id="extraPassengersRow" style="display: none">
      <span class="pricing-label"
        >Extra pax (<span id="extraCount">0</span>)</span
      >
      <span class="pricing-value" id="extraPassengerCost">+$0</span>
    </div>
    <div class="pricing-row" id="feeRow" style="display: none">
      <span class="pricing-label">Comisión GMB (11.5%)</span>
      <span class="pricing-value" id="feeCost">+$0</span>
    </div>
    <div class="pricing-row" id="fishingLicensesRow" style="display: none;">
      <span class="pricing-label">Fishing Licenses</span>
      <span class="pricing-value" id="fishingLicensesCost">+$22</span>
    </div>
    <div class="pricing-row" id="extrasRow" style="display: none">
      <span class="pricing-label">Other Extras</span>
      <span class="pricing-value" id="extrasCost">+$0</span>
    </div>
    <div class="pricing-row" id="discountRow" style="display: none">
      <span class="pricing-label">Discount</span>
      <span class="pricing-value" id="discountCost" style="color: #4caf50"
        >-$0</span
      >
    </div>
    <div
      id="businessTotalRow"
      class="pricing-row"
      style="border-bottom: none; margin-top: 8px; padding-top: 12px"
    >
      <span class="pricing-label">Total negocio</span>
      <span class="pricing-value" id="businessTotal">1,300</span>
    </div>
    <div class="pricing-row" id="customerTotalRow" style="display: none">
      <span class="pricing-label">Total cliente</span>
      <span class="pricing-total" id="customerTotal">$1,356</span>
    </div>
  </label>
  <span class="summary-title">Configuración de Viaje</span>
  <div class="summary-details">
    <!-- Design Layer: summary-item triggers with State Layer: data-trigger attribute -->
    <div
      class="summary-item"
      id="triggerDuration"
      data-trigger="duration"
      onclick="openPicker('duration')"
    >
      <i class="ph ph-clock"></i>
      <div class="summary-value">
        <span id="summaryDuration">2</span>
        <span class="summary-label">HRS</span>
      </div>
    </div>
    <div
      class="summary-item"
      id="triggerPassengers"
      data-trigger="passengers"
      onclick="openPicker('passengers')"
    >
      <i class="ph ph-users"></i>
      <div class="summary-value">
        <span id="summaryPassengers">14</span>
        <span class="summary-label">PAX</span>
      </div>
    </div>
  </div>
</div>

``` Debe quedar asi no la muevas, no le agregues ni le quites. el siguiente
bloque ``` html

<div class="summary-item" onclick="openTourTypePicker()">
  <span id="tourTypeIcon" style="font-size: 24px">🌊</span>
  <div class="summary-value">
    <span id="summaryTourType" style="font-size: 14px">Bay</span>
    <span class="summary-label">TOUR</span>
  </div>
</div>

``` debe abrir mejor el bottom sheet u las opciones debe ser un card select con
un buscador arriba. el siquiente bloque debe estar arriba: ``` html
<div class="summary-item" onclick="togglePricingType()">
  <i class="ph ph-tag"></i>
  <div class="summary-value">
    <span id="summaryPricingType" style="font-size: 14px">Regular</span>
    <span class="summary-label">TYPE</span>
  </div>
</div>

``` y debe ser un 2 option tab glider.
````
