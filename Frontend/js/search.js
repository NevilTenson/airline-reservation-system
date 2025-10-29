import { API_BASE } from "./main.js";

// Helper function to escape HTML
function escapeHtml(str){ return String(str ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }

// --- Airport Options ---
async function populateAirportOptions() {
  const originSel = document.getElementById("origin-select");
  const destSel = document.getElementById("destination-select");
  if (!originSel || !destSel) return;

  originSel.disabled = true;
  destSel.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/airports`);
    if (!res.ok) throw new Error('Failed to fetch airports');
    const data = await res.json();
    const airports = Array.isArray(data) ? data : data.data || [];

    if (airports.length === 0) {
        originSel.innerHTML = '<option value="">No airports found</option>';
        destSel.innerHTML = '<option value="">No airports found</option>';
        return;
    }

    const optionsHtml = airports
      .map(
        (a) =>
          `<option value="${escapeHtml(a.airport_code)}">${escapeHtml(a.city)} (${escapeHtml(a.airport_code)})</option>`
      )
      .join("");

    originSel.innerHTML = `<option value="">Select Origin</option>${optionsHtml}`;
    destSel.innerHTML = `<option value="">Select Destination</option>${optionsHtml}`;

  } catch (err) {
    console.error("Failed to load airports", err);
    originSel.innerHTML = '<option value="">Unable to load airports</option>';
    destSel.innerHTML = '<option value="">Unable to load airports</option>';
  } finally {
      originSel.disabled = false;
      destSel.disabled = false;
  }
}

// --- Class Options ---
async function populateClasses() {
  const select = document.getElementById("class-select");
  if (!select) return;
  select.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/classes`);
    if (!res.ok) throw new Error('Failed to fetch classes');
    const data = await res.json();
    const classes = Array.isArray(data) ? data : (data.data || data.classes || []);
    // Get unique class types from all available classes
    const classTypes = [...new Set(classes.map(c => c.classType).filter(Boolean))];

    if (classTypes.length === 0) {
        select.innerHTML = '<option value="">No classes defined</option>';
        return;
    }
    select.innerHTML = '<option value="">Select class</option>';
    classTypes.forEach((type) => {
      const opt = document.createElement("option");
      opt.value = type; // Use the type name (e.g., "Economy") as the value
      opt.textContent = type;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load classes", err);
    select.innerHTML = '<option value="">Unable to load classes</option>';
  } finally {
      select.disabled = false;
  }
}

// --- Available Dates ---
async function populateAvailableDates() {
    const originSel = document.getElementById("origin-select");
    const destSel = document.getElementById("destination-select");
    const dateSel = document.getElementById("departureDate-select");

    if (!originSel || !destSel || !dateSel) return;

    const originCode = originSel.value;
    const destCode = destSel.value;

    if (!originCode || !destCode) {
        dateSel.innerHTML = '<option value="">Select Origin & Destination first</option>';
        dateSel.disabled = true;
        return;
    }
     if (originCode === destCode) {
        dateSel.innerHTML = '<option value="">Origin & Destination same</option>';
        dateSel.disabled = true;
        return;
    }

    dateSel.innerHTML = '<option value="">Loading dates...</option>';
    dateSel.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/flights/available-dates?origin_code=${originCode}&destination_code=${destCode}`);
        if (!res.ok) throw new Error('Failed to fetch dates');
        const dates = await res.json();

        if (dates.length === 0) {
            dateSel.innerHTML = '<option value="">No flights on this route</option>';
            return;
        }

        const optionsHtml = dates.map(dateStr => {
            const date = new Date(dateStr + 'T00:00:00');
            const formatted = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            return `<option value="${escapeHtml(dateStr)}">${escapeHtml(formatted)}</option>`;
        }).join('');

        dateSel.innerHTML = `<option value="">Select Departure Date</option>${optionsHtml}`;
        dateSel.disabled = false;

    } catch (err) {
        console.error("Failed to load available dates:", err);
        dateSel.innerHTML = '<option value="">Error loading dates</option>';
    }
}


// --- Search Form Handler ---
function handleSearch() {
  const form = document.getElementById("search-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const origin = form.origin_code.value;
    const destination = form.destination_code.value;
    const date = form.departureDate.value;
    const passengers = form.passengerCount.value;
    const classType = form.classId.value; // Get selected class type (name="classId" in HTML)

    if (!origin || !destination || !date) {
        alert("Please select Origin, Destination, and Date.");
        return;
    }
    if (origin === destination) {
        alert("Origin and Destination cannot be the same.");
        return;
    }
    if (!classType) { // Also check if class is selected
        alert("Please select a class.");
        return;
    }

    // Pass origin_code, destination_code, date, passengers, classType
    const params = new URLSearchParams({
      origin: origin,         // Keep as 'origin' for consistency with displayResults expectations
      destination: destination, // Keep as 'destination'
      date: date,
      passengers: passengers,
      classType: classType      // Pass the selected class type
    });

    window.location.href = `results.html?${params.toString()}`;
  });
}

// --- Flight Card Creator ---
// Now accepts classType
function createFlightCard(f, passengers, classType) {
  const div = document.createElement("div");
  div.className = "flight-card";

  const flightNo = f.flightNumber ?? "—";
  const airline = f.Airline?.name ?? "—";
  const originCity = f.Origin?.city ?? "?";
  const destCity = f.Destination?.city ?? "?";
  const originCode = f.Origin?.airport_code ?? "?";
  const destCode = f.Destination?.airport_code ?? "?";

  const dep = f.departureTime ? new Date(f.departureTime).toLocaleString() : "—";
  const arr = f.arrivalTime ? new Date(f.arrivalTime).toLocaleString() : "—";

  const price = f.price ?? 0; // Base flight price
  const flightId = f.id;

  // Include classType in the checkout URL
  const checkoutUrl = `checkout.html?flightId=${encodeURIComponent(flightId)}&passengers=${encodeURIComponent(passengers)}&classType=${encodeURIComponent(classType)}`;

  div.innerHTML = `
    <div class="flight-meta">
      <div>
        <div class="flight-title">${escapeHtml(airline)} • ${escapeHtml(flightNo)}</div>
        <div class="flight-sub">${escapeHtml(originCity)} (${escapeHtml(originCode)}) → ${escapeHtml(destCity)} (${escapeHtml(destCode)})</div>
        <div class="flight-sub" style="font-size: 0.9em; margin-top: 5px;">
          ${escapeHtml(dep)} → ${escapeHtml(arr)}
        </div>
      </div>
      <div style="text-align:right">
        <div class="price">${new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        }).format(price)}</div>
        <div class="flight-sub">Base Fare (${escapeHtml(classType)})</div> <!-- Show selected class -->
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end; margin-top: 12px;">
      <a class="btn primary book-now-btn" href="${checkoutUrl}">Book Now</a>
    </div>
  `;

  // Store full flight details + selected classType for checkout
  div.querySelector(".book-now-btn").addEventListener("click", (e) => {
    e.preventDefault();
    const selectedFlightData = { ...f, selectedClassType: classType }; // Add classType to stored data
    localStorage.setItem("selectedFlightForCheckout", JSON.stringify(selectedFlightData));
    window.location.href = checkoutUrl;
  });

  return div;
}

// --- Display Results on results.html ---
async function displayResults() {
  const container = document.getElementById("results-container");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  if (!params.has("origin") || !params.has("destination") || !params.has("date")) {
    return;
  }

  container.innerHTML = '<div class="card">Searching flights…</div>';
  try {
    // Pass origin_code, destination_code, departureDate to backend search
    const searchParams = new URLSearchParams({
        origin_code: params.get("origin"),
        destination_code: params.get("destination"),
        departureDate: params.get("date")
    });

    const res = await fetch(`${API_BASE}/flights/search?${searchParams.toString()}`);
    if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to load flights' }));
        throw new Error(errData.message);
    }
    const payload = await res.json();
    const flights = Array.isArray(payload) ? payload : payload.flights || payload.data || [];

    container.innerHTML = "";
    if (!flights || flights.length === 0) {
      container.innerHTML =
        '<div class="card">No flights found for your search criteria.</div>';
      return;
    }
    const passengers = params.get("passengers") || 1;
    const classType = params.get("classType"); // Get classType from URL

    // Pass classType when creating cards
    flights.forEach((f) => container.appendChild(createFlightCard(f, passengers, classType)));

  } catch (err) {
    console.error("Error displaying flight results:", err);
    container.innerHTML = `<div class="card error-box">Error loading flights: ${escapeHtml(err.message)}</div>`;
  }
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  const pathname = window.location.pathname;

  if (pathname.includes('search.html')) {
    populateAirportOptions(); // Load airports
    populateClasses();      // Load unique class types
    handleSearch();         // Add submit listener

    const originSel = document.getElementById("origin-select");
    const destSel = document.getElementById("destination-select");
    if (originSel) originSel.addEventListener('change', populateAvailableDates);
    if (destSel) destSel.addEventListener('change', populateAvailableDates);

  } else if (pathname.includes('results.html')) {
    displayResults();       // Fetch and display results
  }
});
