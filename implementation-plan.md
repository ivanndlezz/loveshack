Comparar la nueva app que se esta desarrollando en @pricing-calculator/index.html
con respecto a la anterior en @old-index.html

En la nueva implementacion ya se resolvio solo una capa, la mas importante, la de la logica de negocio o capa de pricing.

Falta resolver 2 capas mas:

la capa de informacion de tour o tour type and specs.

y una tercera capa que es la capa de cliente o customer info.

En la capa de pricing solo falta agregar el tour source, que afecta al pricing, por el tema de comisiones y fees fijp, por ejemplo el de get my bot.

Reemplazar el toggle actual de get my boat que solo era para hacer pruebas por lo siguiente

````html
<div class="form-group">
  <label>Booking Source</label>
  <div class="custom-select custom-select-searchable" id="sourceSelect">
    <input type="hidden" id="source" data-field="source" value="direct" />
    <div class="custom-select-trigger">
      <input
        type="text"
        class="custom-select-input"
        id="sourceInput"
        placeholder="Search sources..."
        oninput="handleSelectSearch('source', this.value)"
        onfocus="openSelectDropdown('sourceSelect')"
      />
      <button
        class="custom-select-toggle"
        onclick="toggleSelect('sourceSelect')"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
    </div>
    <div class="custom-select-dropdown">
      <div class="custom-select-options" id="sourceOptions">
        <div class="custom-select-option" data-value="direct">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          📞 Direct - Call
        </div>
        <div class="custom-select-option" data-value="get-my-boat">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          🐬 Get My Boat
        </div>
        <div class="custom-select-option" data-value="viator">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ✈️ Viator
        </div>
        <div class="custom-select-option" data-value="fareharbor">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          🚦 Fareharbor
        </div>
        <div class="custom-select-option" data-value="travel-cabo-tours">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          🌴 Travel Cabo Tours
        </div>
        <div class="custom-select-option" data-value="anchor-rides">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ⚓ Anchor Rides
        </div>
        <div class="custom-select-option" data-value="andres-lopez">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          👤 Andres Lopez
        </div>
        <div class="custom-select-option" data-value="mauricio-bojorquez">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          👤 Mauricio Bojorquez
        </div>
        <div class="custom-select-option" data-value="jose-ferron">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          👤 Jose Ferron
        </div>
        <div class="custom-select-option" data-value="ramiro-munguia">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          👤 Ramiro Munguia
        </div>
        <div class="custom-select-option" data-value="adriana-transcabo">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          👩 Adriana Transcabo
        </div>
        <div class="custom-select-option" data-value="grand-solmar">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          🏨 Grand Solmar - Luis Roberts
        </div>
        <div class="custom-select-option" data-value="eduardo-araujo">
          <svg
            class="custom-select-option-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          👤 Eduardo Araujo
        </div>
      </div>
    </div>
  </div>
</div>

``` contemplando como el source afecta al pricing, por ejemplo el de get my boat
que tiene un fee fijo de 50 dlls, y el de viator que tiene un fee variable del
15%.
````
