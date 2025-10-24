import { API_BASE, getToken, isLoggedIn, redirectToLogin } from './main.js';

console.log('admin.js loaded', { token: getToken(), loggedIn: isLoggedIn() });

/* ---------- helpers ---------- */
function escapeHtml(str){ return String(str ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
function el(id){ return document.getElementById(id); }
function setMessage(msg){ const m = el('admin-message'); if(m) m.textContent = msg; }

function authFetch(path, opts = {}){
  opts.headers = opts.headers || {};
  const token = getToken();
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (!opts.headers['Content-Type'] && !(opts.body instanceof FormData)) opts.headers['Content-Type'] = 'application/json';
  return fetch(`${API_BASE}${path}`, opts);
}

/* ---------- normalizers ---------- */
function normalizeClass(c) {
  const flight = c.Flight || {};
  const flightNum = flight.flightNumber || "Unknown";
  // UPDATED LOGIC: Read from nested Origin/Destination objects
  const origin = flight.Origin?.city || "?";
  const dest = flight.Destination?.city || "?";

  return {
    id: c.id ?? c._id ?? c.classId ?? null,
    name: c.classType ?? c.name ?? c.title ?? c.className ?? c.type ?? "Unnamed Class",
    price: c.price ?? c.fare ?? c.amount ?? "—",
    flightInfo: `${flightNum} (${origin} → ${dest})`,
    raw: c,
  };
}
function normalizeTicket(t) {
  // --- NEW DATA STRUCTURE ---
  const passenger = t.Passenger || {};
  const booking = passenger.Booking || {};
  const user = booking.User || {};
  const flight = t.Flight || {};
  const cls = t.Class || {};
  
  // Get route from Flight's nested Airport objects
  const originCity = flight.Origin?.city ?? "?";
  const destCity = flight.Destination?.city ?? "?";

  return {
    id: t.ticket_id,
    pnr: booking.pnr_no ?? '—',
    passengerName: passenger.name ?? 'N/A',
    seat: t.seat_no ?? 'N/A',
    status: t.status ?? 'Unknown',
    flightNumber: flight.flightNumber ?? 'N/A',
    route: `${originCity} → ${destCity}`,
    classType: cls.classType ?? 'N/A',
    travelDate: t.travel_date ? new Date(t.travel_date).toLocaleString() : 'N/A',
    bookedBy: user.name ?? 'N/A' // Bonus info for admin
  };
}
/* ---------- loaders (declared as functions so hoisted) ---------- */
async function loadUsers(){
  const container = el('users-list'); if(!container) return;
  container.innerHTML = '';
  setMessage('Loading users…');
  try {
    const res = await authFetch('/users');
    const data = await res.json().catch(()=>null);
    console.debug('GET /users response', res.status, data);
    if (res.status === 401 || res.status === 403) {
      container.innerHTML = '<div class="access-denied card">Access denied. Login as admin.</div>';
      setMessage('');
      return;
    }
    if (!res.ok) throw new Error((data && data.message) || res.statusText || 'Failed');
    const users = Array.isArray(data) ? data : (data.data || data.users || []);
    setMessage(`Users: ${users.length}`);
    container.innerHTML = users.length ? users.map(u => `<div class="flight-card"><strong>${escapeHtml(u.name)}</strong> — ${escapeHtml(u.email)} <div class="flight-sub">${escapeHtml(u.role)}</div></div>`).join('') : '<div class="card">No users</div>';
  } catch (err) {
    console.error('loadUsers error', err);
    container.innerHTML = `<div class="card">Error loading users: ${escapeHtml(err.message)}</div>`;
    setMessage('');
  }
}

async function loadAirlines(){
  const container = el('airlines-list');
  if(!container) return;
  container.innerHTML = 'Loading airlines…';
  try {
    const res = await authFetch('/airlines');
    const data = await res.json().catch(()=>null);
    console.debug('GET /airlines response', res.status, data);
    if (!res.ok) throw new Error((data && data.message) || res.statusText || 'Failed');
    const items = Array.isArray(data) ? data : (data.data || data.airlines || []);
    container.innerHTML = items.length ? items.map(a => 
      `<div class="flight-card">
        <strong>${escapeHtml(a.name)}</strong> — ${escapeHtml(a.code||'')}
        <div class="flight-sub">${escapeHtml(a.country||'')}</div>
      </div>`
    ).join('') : '<div class="card">No airlines</div>';
  } catch (err){ 
    console.error('loadAirlines error', err);
    container.innerHTML = `<div class="card">Error: ${escapeHtml(err.message)}</div>`;
  }
}

// Add this new function to admin.js
async function loadFlightOptions() {
  const sel = el("class-flight-select");
  if (!sel) return;
  sel.innerHTML = '<option>Loading flights…</option>';
  try {
    const res = await authFetch("/flights");
    const data = await res.json().catch(() => null);
    console.debug("GET /flights response for options", res.status, data);
    const items = Array.isArray(data) ? data : data.data || data.flights || [];

    sel.innerHTML = items.length
      ? items
          .map((f) => {
            // UPDATED LOGIC: Read from nested Origin/Destination objects
            const originCity = f.Origin?.city ?? "?";
            const destCity = f.Destination?.city ?? "?";
            return `<option value="${escapeHtml(f.id ?? f._id ?? "")}">
               ${escapeHtml(f.flightNumber ?? "-")} (${escapeHtml(originCity)} → ${escapeHtml(destCity)})
             </option>`;
          })
          .join("")
      : '<option value="">No flights found</option>';

    sel.insertAdjacentHTML("afterbegin", '<option value="">-- Select a Flight --</option>');
    sel.value = "";
  } catch (err) {
    console.error("loadFlightOptions error", err);
    sel.innerHTML = "<option>Unable to load flights</option>";
  }
}

async function loadClasses(){
  const container = el('classes-list'); if(!container) return;
  container.innerHTML = 'Loading classes…';
  try {
    const res = await authFetch('/classes');
    const data = await res.json().catch(()=>null);
    console.debug('GET /classes response', res.status, data);
    if (!res.ok) throw new Error((data && data.message) || res.statusText || 'Failed');
    const items = Array.isArray(data) ? data : (data.data || data.classes || []);
    const normalized = items.map(normalizeClass);
    // This is your NEW innerHTML line
container.innerHTML = normalized.length ? normalized.map(c => 
  `<div class="flight-card">
    <strong>${escapeHtml(c.name)}</strong> — ${escapeHtml(String(c.price))}
    <div class="flight-sub">${escapeHtml(c.flightInfo)}</div>
  </div>`
).join('') : '<div class="card">No classes</div>';
  } catch (err){ console.error('loadClasses error', err); container.innerHTML = `<div class="card">Error: ${escapeHtml(err.message)}</div>`; }
}

// REPLACE THIS FUNCTION in admin.js
async function loadFlights() {
  const container = el("flights-list");
  if (!container) return;
  container.innerHTML = "Loading flights…";
  try {
    const res = await authFetch("/flights");
    const data = await res.json().catch(() => null);
    console.debug("GET /flights response", res.status, data);
    if (!res.ok) throw new Error((data && data.message) || "Failed");
    const items = Array.isArray(data) ? data : data.data || data.flights || [];

    container.innerHTML = items.length
      ? items
          .map((f) => {
            // CORRECTED LOGIC: Read from nested Origin/Destination objects
            const originCity = f.Origin?.city ?? "?"; // Use ?. for safety
            const destCity = f.Destination?.city ?? "?"; // Use ?. for safety
            return `<div class="flight-card">
              <div class="flight-meta">
                <div>
                  <div class="flight-title">${escapeHtml(f.Airline?.name ?? "-")} • ${escapeHtml(f.flightNumber ?? "-")}</div>
                  <div class="flight-sub">${escapeHtml(originCity)} → ${escapeHtml(destCity)}</div>
                </div>
                <div style="text-align:right">
                  <div class="price">${escapeHtml(String(f.price ?? ""))}</div>
                </div>
              </div>
            </div>`;
          })
          .join("")
      : '<div class="card">No flights</div>';
  } catch (err) {
    console.error("loadFlights error", err);
    container.innerHTML = `<div class="card">Error: ${escapeHtml(err.message)}</div>`;
  }
}

async function loadTickets() {
  const container = el("tickets-list");
  if (!container) return;
  container.innerHTML = "Loading tickets…";
  try {
    // This fetches from GET /api/tickets/ (the admin route)
    const res = await authFetch("/tickets"); 
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.message) || "Failed");

    const items = Array.isArray(data) ? data : data.data || data.tickets || [];
    const normalized = items.map(normalizeTicket);

    // --- UPDATED HTML ---
    container.innerHTML = normalized.length
      ? normalized
          .map(
            (t) => `
      <div class="ticket-card status-${escapeHtml(t.status.toLowerCase())}">
        <div class="ticket-header">
          <div>
            <small>PNR</small>
            <strong>${escapeHtml(t.pnr)}</strong>
          </div>
          <div class="ticket-status">${escapeHtml(t.status)}</div>
        </div>
        <div class="ticket-body">
          <div class="ticket-passenger">
            <small>Passenger</small>
            <div>${escapeHtml(t.passengerName)} (<span class="ticket-class">${escapeHtml(t.classType)}</span>)</div>
          </div>
          <div class="ticket-info-grid">
            <div class="ticket-flight">
              <small>Flight</small>
              <div>${escapeHtml(t.flightNumber)}</div>
            </div>
            <div class="ticket-seat">
              <small>Seat</small>
              <div>${escapeHtml(t.seat)}</div>
            </div>
          </div>
          <div class="ticket-route">
            <small>Route</small>
            <div>${escapeHtml(t.route)}</div>
          </div>
          <div class="ticket-date">
            <small>Travel Date & Time</small>
            <div>${escapeHtml(t.travelDate)}</div>
          </div>
          <div class="flight-sub" style="font-size: 0.8rem; margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px;">
            Booked By: ${escapeHtml(t.bookedBy)}
          </div>
        </div>
      </div>
    `
          )
          .join("")
      : '<div class="card">No tickets</div>';
  } catch (err) {
    console.error("loadTickets error", err);
    container.innerHTML = `<div class="card">Error: ${escapeHtml(err.message)}</div>`;
  }
}
/* ---------- forms & options ---------- */
function wireForms(){
  const addAirline = el("add-airline-form");
if (addAirline) addAirline.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) return redirectToLogin();

    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    try {
        // CORRECT PAYLOAD
        const payload = {
            name: form.name.value.trim(),
            code: form.code.value.trim(),
            country: form.country.value.trim(),
        };

        // validate
        if (!payload.name) throw new Error("Airline name is required");
        if (!payload.code) throw new Error("Airline code is required");
        if (!payload.country) throw new Error("Country is required");

        console.log("Adding airline:", payload);
        const res = await authFetch("/airlines", {
            method: "POST",
            body: JSON.stringify(payload),
        });

      const data = await res.json().catch(() => null);
      console.log('Server response:', res.status, data);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Failed to add airline');
      }

      form.reset();
      loadAirlines();
      setMessage('Airline added successfully');
    } catch (err) {
      console.error('Add airline error:', err);
      alert(err.message || 'Error adding airline. Check console for details.');
    } finally {
      if(btn) btn.disabled = false;
    }
  });

  const addAirport = el("add-airport-form");
  if (addAirport) {
    addAirport.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const payload = {
        airport_code: form.airport_code.value.trim().toUpperCase(),
        name: form.name.value.trim(),
        city: form.city.value.trim(),
        country: form.country.value.trim(),
      };
      try {
        if (!payload.airport_code || payload.airport_code.length !== 3) {
          throw new Error("Airport code must be 3 characters.");
        }
        const res = await authFetch("/airports", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && data.message) || "Failed");

        form.reset();
        loadAirports(); // Reload the list
        setMessage("Airport added successfully");
      } catch (err) {
        setMessage(`Error: ${err.message}`);
        console.error("Add airport error:", err);
      }
    });
  }

  const addClass = el('add-class-form');
  if(addClass) addClass.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) return redirectToLogin();
    const form = e.target;
    try {
      // NEW, CORRECTED PAYLOAD:
      const payload = { 
        flightId: form.flightId.value,           // Matches backend 'flightId'
        classType: form.classType.value.trim(),  // Matches backend 'classType'
        fare: Number(form.fare.value),            // Matches backend 'fare'
        total_seats: Number(form.total_seats.value)
      };

      // NEW VALIDATION:
      if (!payload.flightId) {
        throw new Error('Please select a flight.');
      }
      if (!payload.classType) {
        throw new Error('Please enter a class name.');
      }
      if (!payload.fare || payload.fare <= 0) {
        throw new Error('Please enter a valid fare.');
      }
      if (!payload.total_seats || payload.total_seats <= 0) { // <-- ADD THIS
        throw new Error('Please enter a valid number of seats.');
      }
      // This part is now fixed because the URL is correct (from Step 1)
      // and the payload is correct.
      const res = await authFetch('/classes', { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json().catch(()=>null);
      if (!res.ok) throw new Error((data && data.message) || res.statusText || 'Failed');
      
      form.reset(); 
      loadClasses(); // This will reload the list with the new item
      loadFlightOptions(); // This re-populates the dropdown
      setMessage('Class added successfully');
    } catch (err) { 
      // We will use a custom message box instead of alert()
      setMessage(`Error: ${err.message}`);
      console.error('Add class error:', err);
    }
  });

 const addFlight = el("add-flight-form");
if (addFlight) {
  addFlight.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) return redirectToLogin();
    const form = e.target;

    try {
      // NEW PAYLOAD matching the backend
      const payload = {
        airline_id: form.airline_id.value,
        flightNumber: form.flightNumber.value.trim(),
        origin_code: form.origin_code.value, // <-- CHANGED
        destination_code: form.destination_code.value, // <-- CHANGED
        departureTime: form.departureTime.value
          ? new Date(form.departureTime.value).toISOString()
          : null,
        arrivalTime: form.arrivalTime.value
          ? new Date(form.arrivalTime.value).toISOString()
          : null,
        price: Number(form.price.value),
      };

      // Validation
      if (!payload.airline_id) throw new Error("Please select an airline.");
      if (!payload.origin_code) throw new Error("Please select an origin.");
      if (!payload.destination_code) throw new Error("Please select a destination.");
      if (payload.origin_code === payload.destination_code) {
         throw new Error("Origin and Destination cannot be the same.");
      }
      if (!payload.departureTime || !payload.arrivalTime)
        throw new Error("Please provide departure and arrival date/time");
      // ... (rest of validation)

      const res = await authFetch("/flights", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.message) || "Failed");

      form.reset();
      loadFlights(); // Reload the flights list
      setMessage("Flight added successfully");
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      console.error("Add flight error:", err);
    }
  });
}
}
async function loadAirlineOptions(){
  const sel = el('airline-select'); if(!sel) return;
  sel.innerHTML = '<option>Loading…</option>';
  try {
    const res = await authFetch('/airlines');
    const data = await res.json().catch(()=>null);
    console.debug('GET /airlines response for options', res.status, data);
    const items = Array.isArray(data) ? data : (data.data || data.airlines || []);
    sel.innerHTML = items.length ? items.map(a => `<option value="${escapeHtml(a.id ?? a._id ?? '')}">${escapeHtml(a.name)}</option>`).join('') : '<option value="">No airlines</option>';
  } catch (err) {
    console.error('loadAirlineOptions error', err);
    sel.innerHTML = '<option>Unable to load</option>';
  }
}

async function loadAirports() {
  const container = el("airports-list");
  if (!container) return;
  container.innerHTML = "Loading airports…";
  try {
    const res = await authFetch("/airports");
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.message) || "Failed");

    const items = Array.isArray(data) ? data : data.data || [];
    container.innerHTML = items.length
      ? items
          .map(
            (a) =>
              `<div class="flight-card">
                 <strong>${escapeHtml(a.city)} (${escapeHtml(a.airport_code)})</strong>
                 <div class="flight-sub">${escapeHtml(a.name)}, ${escapeHtml(a.country)}</div>
               </div>`
          )
          .join("")
      : '<div class="card">No airports added yet.</div>';
  } catch (err) {
    console.error("loadAirports error", err);
    container.innerHTML = `<div class="card">Error: ${escapeHtml(err.message)}</div>`;
  }
}

// Populates the Origin/Destination dropdowns in the 'Add Flight' form
async function loadAirportOptions() {
  const originSel = el("flight-origin-select");
  const destSel = el("flight-destination-select");
  if (!originSel || !destSel) return; // Not on the right tab

  originSel.innerHTML = '<option value="">Loading...</option>';
  destSel.innerHTML = '<option value="">Loading...</option>';

  try {
    const res = await authFetch("/airports");
    const data = await res.json().catch(() => null);
    const items = Array.isArray(data) ? data : data.data || [];

    const optionsHtml = items.length
      ? items
          .map(
            (a) =>
              `<option value="${escapeHtml(a.airport_code)}">
                 ${escapeHtml(a.city)} (${escapeHtml(a.airport_code)})
               </option>`
          )
          .join("")
      : '<option value="">No airports</option>';

    originSel.innerHTML = `<option value="">-- Select Origin --</option>${optionsHtml}`;
    destSel.innerHTML = `<option value="">-- Select Destination --</option>${optionsHtml}`;
  } catch (err) {
    console.error("loadAirportOptions error", err);
    originSel.innerHTML = "<option>Unable to load</option>";
    destSel.innerHTML = "<option>Unable to load</option>";
  }
}
/* ---------- tabs + init ---------- */
function wireTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const panel = btn.dataset.panel;
      document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === `panel-${panel}`));
      if(panel === 'users') loadUsers();
      if(panel === 'airlines') { loadAirlines(); loadAirlineOptions(); }
      if(panel === 'classes') {
        loadClasses();
        loadFlightOptions(); // Also load the flight dropdown
      }
      if(panel === 'flights') { loadFlights(); loadAirlineOptions(); loadAirportOptions();}
      if(panel === 'tickets') loadTickets();
      if (panel === "airports") loadAirports();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    wireTabs();
    wireForms();

    if (!isLoggedIn()) {
      console.warn('Not logged in — redirecting to login');
      return redirectToLogin();
    }

    // initial load (server will enforce admin)
    loadUsers();
    loadAirlines();
    loadClasses();
    loadFlights();
    loadTickets();
    loadAirlineOptions();
  } catch (err) {
    console.error('admin init error', err);
    setMessage('Admin UI initialization failed. See console.');
  }
});