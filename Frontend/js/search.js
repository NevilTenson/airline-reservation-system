import { API_BASE } from "./main.js";

// --- NEW FUNCTION ---
// Populates the new Origin/Destination dropdowns in index.html
async function populateAirportOptions() {
  const originSel = document.getElementById("origin-select");
  const destSel = document.getElementById("destination-select");
  if (!originSel || !destSel) return; // Only run on search page

  try {
    const res = await fetch(`${API_BASE}/airports`);
    const data = await res.json();
    const airports = Array.isArray(data) ? data : data.data || [];

    const optionsHtml = airports
      .map(
        (a) =>
          `<option value="${a.airport_code}">${a.city} (${a.airport_code})</option>`
      )
      .join("");

    originSel.innerHTML = `<option value="">Select Origin</option>${optionsHtml}`;
    destSel.innerHTML = `<option value="">Select Destination</option>${optionsHtml}`;
  } catch (err) {
    console.error("Failed to load airports", err);
    originSel.innerHTML = '<option value="">Unable to load airports</option>';
    destSel.innerHTML = '<option value="">Unable to load airports</option>';
  }
}

// --- UPDATED FUNCTION ---
async function populateClasses() {
  const select = document.getElementById("class-select");
  if (!select) return;
  try {
    const res = await fetch(`${API_BASE}/classes`);
    const data = await res.json();
    const classes = Array.isArray(data) ? data : (data.data || data.classes || []);
    select.innerHTML = '<option value="">Select class</option>';
    classes.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id ?? c._id ?? c.classId ?? c.id;
      // Use classType (from our refactor)
      opt.textContent = c.classType ?? "Class";
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load classes", err);
    select.innerHTML = '<option value="">Unable to load classes</option>';
  }
}

// --- UPDATED FUNCTION ---
function handleSearch() {
  const form = document.getElementById("search-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Use the new select field names: origin_code and destination_code
    const params = new URLSearchParams({
      origin_code: form.origin_code.value,
      destination_code: form.destination_code.value,
      departureDate: form.departureDate.value, // This key name must match your API
      passengers: form.passengerCount.value,
      classId: form.classId
        ? form.classId.value
        : document.getElementById("class-select")?.value || "",
    });
    // We update the URL of the *current page* to show results, not go to results.html
    // This is simpler.
    window.history.pushState({}, "", `?${params.toString()}`);
    displayResults(); // Call displayResults directly
  });
}

// --- UPDATED FUNCTION ---
// REPLACE this function in js/search.js
function createFlightCard(f, passengers, classId) { // Added classId
  const div = document.createElement("div");
  div.className = "flight-card";
  
  const flightNo = f.flightNumber ?? "—";
  const airline = f.Airline?.name ?? "—";
  const origin = f.Origin?.city ?? "?";
  const dest = f.Destination?.city ?? "?";
  
  const dep = f.departureTime ? new Date(f.departureTime).toLocaleString() : "—";
  const arr = f.arrivalTime ? new Date(f.arrivalTime).toLocaleString() : "—";
  
  const price = f.price ?? 0;
  const flightId = f.id;

  // --- THIS IS THE LINK WE ARE FIXING ---
  const checkoutUrl = `checkout.html?flightId=${encodeURIComponent(
    flightId
  )}&passengers=${encodeURIComponent(
    passengers
  )}&classId=${encodeURIComponent(classId)}`; // Added classId

  div.innerHTML = `
    <div class="flight-meta">
      <div>
        <div class="flight-title">${airline} • ${flightNo}</div>
        <div class="flight-sub">${origin} → ${dest}</div>
        <div class="flight-sub" style="font-size: 0.9em; margin-top: 5px;">
          ${dep} → ${arr}
        </div>
      </div>
      <div style="text-align:right">
        <div class="price">${new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        }).format(price)}</div>
        <div class="flight-sub">${passengers} passenger(s)</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end; margin-top: 12px;">
      <a class="btn primary book-now-btn" href="${checkoutUrl}">Book Now</a>
    </div>
  `;

  // --- ADD THIS LISTENER ---
  // This saves the flight data so the checkout page can read it.
  div.querySelector(".book-now-btn").addEventListener("click", (e) => {
    e.preventDefault(); // Stop the link
    localStorage.setItem("selectedFlightForCheckout", JSON.stringify(f)); // Save data
    location.href = checkoutUrl; // Go to checkout
  });

  return div;
}

// REPLACE this function in js/search.js
async function displayResults() {
  const container = document.getElementById("results-container");
  if (!container) return;
  
  const params = new URLSearchParams(window.location.search);
  if (!params.has("origin_code") || !params.has("destination_code")) {
    container.innerHTML = '<div class="card">Please enter a search to see flights.</div>';
    return;
  }
  
  container.innerHTML = '<div class="card">Searching flights…</div>';
  try {
    const res = await fetch(`${API_BASE}/flights/search?${params.toString()}`);
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.message || "Failed to load flights");
    
    const flights = Array.isArray(payload) ? payload : payload.flights || payload.data || [];
    container.innerHTML = "";
    if (!flights || flights.length === 0) {
      container.innerHTML =
        '<div class="card">No flights found for your search.</div>';
      return;
    }
    
    const passengers = params.get("passengers") || 1;
    // --- PASS classId to createFlightCard ---
    const classId = params.get("classId");
    flights.forEach((f) => container.appendChild(createFlightCard(f, passengers, classId)));
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="card">Error loading flights: ${err.message}</div>`;
  }
}  

// init
document.addEventListener("DOMContentLoaded", () => {
  populateAirportOptions(); // <-- Loads airports into dropdowns
  populateClasses();        // <-- Loads classes into dropdown
  handleSearch();           // <-- Listens for form submit
  displayResults();         // <-- Checks URL and loads results if params exist
});