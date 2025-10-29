// Fix the import path to be relative to js folder
import { API_BASE, getToken, isLoggedIn, redirectToLogin } from './main.js'; // Use root path

console.log('admin.js loaded', { token: getToken(), loggedIn: isLoggedIn() });

/* ---------- helpers ---------- */
function escapeHtml(str){ return String(str ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }
function el(id){ return document.getElementById(id); }

// Updated setMessage to use classes and hide automatically
function setMessage(msg, isError = false){
  const m = el('admin-message');
  if(m) {
    m.textContent = msg;
    m.className = isError ? 'message-box error' : 'message-box success'; // Use classes
    m.classList.remove('hidden'); // Make sure it's visible
    // Simple remove after 4 seconds
    setTimeout(() => { if (m) m.className = 'message-box hidden'; }, 4000);
  } else {
      console.warn("Admin message element not found.");
  }
}

// Updated authFetch with better error handling and logging
function authFetch(path, opts = {}){
  opts.headers = opts.headers || {};
  const token = getToken();
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (!opts.headers['Content-Type'] && !(opts.body instanceof FormData)) opts.headers['Content-Type'] = 'application/json';
  console.log(`authFetch: Requesting ${opts.method || 'GET'} ${path}`);

  return fetch(`${API_BASE}${path}`, opts)
    .then(async res => {
        if (!res.ok) {
            // Try to parse error message from server, fallback to status text
            const errData = await res.json().catch(() => ({ message: `HTTP error! status: ${res.status}` }));
            console.error(`authFetch Error (${res.status}) for ${path}:`, errData.message);
            throw new Error(errData.message); // Throw error with message from server
        }
         // Check for empty response body before parsing JSON
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1 && res.status !== 204) { // 204 No Content
             return res.json();
        }
        return null; // Return null for non-JSON or empty responses (like DELETE success)
    })
    .catch(networkError => { // Catch network errors (fetch itself failed)
        console.error(`authFetch: Network error for ${path}:`, networkError);
        // Rethrow a clearer error for UI display
        throw new Error(`Network error: Could not connect to the server. (${networkError.message})`);
    });
}


/* ---------- normalizers ---------- */
function normalizeClass(c) {
  const flight = c.Flight || {};
  const flightNum = flight.flightNumber || "Unknown";
  const origin = flight.Origin?.city || "?";
  const dest = flight.Destination?.city || "?";
  return {
    id: c.id ?? null,
    name: c.classType ?? "Unnamed Class",
    price: c.fare ?? c.price ?? "—",
    total_seats: c.total_seats ?? 'N/A',
    flightInfo: `${flightNum} (${origin} → ${dest})`,
    raw: c,
  };
}

function normalizeTicket(t) {
  const passenger = t.Passenger || {};
  const booking = passenger.Booking || {};
  const user = booking.User || {};
  const flight = t.Flight || {};
  const cls = t.Class || {};
  const originCity = flight.Origin?.city ?? "?";
  const destCity = flight.Destination?.city ?? "?";
  const airlineName = flight.Airline?.name ?? "?";
  return {
    id: t.ticket_id,
    pnr: booking.pnr_no ?? '—',
    passengerName: passenger.name ?? 'N/A',
    seat: t.seat_no ?? 'N/A',
    status: t.status ?? 'Unknown',
    flightNumber: flight.flightNumber ?? 'N/A',
    airline: airlineName,
    route: `${originCity} → ${destCity}`,
    classType: cls.classType ?? 'N/A',
    travelDate: t.travel_date ? new Date(t.travel_date).toLocaleString() : 'N/A',
    bookedBy: user.name ?? 'N/A' // User who made the booking
  };
}

/* ---------- Report Display ---------- */
function displayReport(data) {
  const container = el("reports-result");
  if (!container) return;
  const user = data.user || {};
  const tickets = data.bookings || []; // Backend sends tickets under 'bookings' key

  let html = `
    <div class="report-user-card card">
      <h3>User Details</h3>
      <p><strong>ID:</strong> ${escapeHtml(user.id)}</p>
      <p><strong>Name:</strong> ${escapeHtml(user.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
      <p><strong>Role:</strong> ${escapeHtml(user.role)}</p>
      <p><strong>Total Tickets Found:</strong> ${data.totalBookings}</p>
    </div>
  `;

  if (tickets.length > 0) {
    html += `<h3>Booked Tickets (${tickets.length})</h3>`;
    tickets.forEach(ticketData => {
      const t = normalizeTicket(ticketData); // Use existing normalizer
      html += `
        <div class="ticket-card status-${escapeHtml(t.status.toLowerCase())}">
        
          <div class="ticket-header">
            <div><small>PNR</small><strong>${escapeHtml(t.pnr)}</strong></div>
            <div class="ticket-status">${escapeHtml(t.status)}</div>
          </div>
          <div class="ticket-body">
            <div class="ticket-passenger"><small>Passenger</small><div>${escapeHtml(t.passengerName)} (<span class="ticket-class">${escapeHtml(t.classType)}</span>)</div></div>
            <div class="ticket-info-grid">
              <div class="ticket-flight"><small>Flight</small><div>${escapeHtml(t.airline)} ${escapeHtml(t.flightNumber)}</div></div>
              <div class="ticket-seat"><small>Seat</small><div>${escapeHtml(t.seat)}</div></div>
            </div>
            <div class="ticket-route"><small>Route</small><div>${escapeHtml(t.route)}</div></div>
            <div class="ticket-date"><small>Travel Date & Time</small><div>${escapeHtml(t.travelDate)}</div></div>
          </div>
        </div>`;
    });
  } else {
    // Only add this message if there were no assigned flights either (for pilots)
    if (!data.assignedFlights || data.assignedFlights.length === 0) {
        html += `<div class="card info-box">No activity found for this user.</div>`;
    }
  }

  // Add Pilot Assigned Flights section if applicable
  if (data.assignedFlights && data.assignedFlights.length > 0) {
      html += `<h3>Assigned Flights (${data.assignedFlights.length})</h3>`;
      data.assignedFlights.forEach(flight => {
          const originCity = flight.Origin?.city ?? "?";
          const destCity = flight.Destination?.city ?? "?";
          const airlineName = flight.Airline?.name ?? "?";
          const flightNum = flight.flightNumber ?? "?";
          const depTime = flight.departureTime ? new Date(flight.departureTime).toLocaleString() : 'N/A';
          html += `
              <div class="list-item-card">
                  <div>
                      <strong>${escapeHtml(airlineName)} ${escapeHtml(flightNum)}</strong>
                      <div class="flight-sub">${escapeHtml(originCity)} → ${escapeHtml(destCity)}</div>
                      <div class="flight-sub">Departure: ${escapeHtml(depTime)}</div>
                  </div>
                  {/* No actions needed in report view */}
              </div>`;
      });
  }

  container.innerHTML = html;
}

/* ---------- loaders ---------- */
async function loadUsers(){
  const container = el('users-list'); if(!container) return;
  container.innerHTML = '<div class="card info-box">Loading users...</div>'; // Better loading state
  // setMessage('Loading users…'); // Message area is separate
  console.log("loadUsers: Starting function...");

  try {
    console.log("loadUsers: Attempting to fetch /api/users...");
    // Fetch needs await
    const users = await authFetch('/users'); // authFetch returns parsed JSON or throws
    console.log("loadUsers: Fetched users:", users);

    // No need to parse JSON again or check status here, authFetch handles it

    // const users = Array.isArray(data) ? data : (data.data || data.users || []);
    setMessage(`Users loaded: ${users.length}`, false); // Use success state

    container.innerHTML = users.length ? users.map(u => `
    <div class="list-item-card">
      <div>
        <strong>${escapeHtml(u.name)}</strong> (${escapeHtml(u.id)}) — ${escapeHtml(u.email)}
        <div class="flight-sub">Role: ${escapeHtml(u.role)}</div>
      </div>
      <div class="actions">
        <button class="btn danger delete-user" data-id="${escapeHtml(u.id)}">Remove</button>
      </div>
    </div>`).join('') : '<div class="card info-box">No users found.</div>'; // Info state

    // wireUserDelete(); // Wire-up is now done once in DOMContentLoaded
    console.log("loadUsers: Successfully rendered users.");

  } catch (err) {
    console.error('loadUsers: CATCH block error:', err);
    container.innerHTML = `<div class="card error-box">Error loading users: ${escapeHtml(err.message)}</div>`;
    setMessage(`Error loading users: ${escapeHtml(err.message)}`, true);
  }
}

async function loadAirlines(){
  const container = el('airlines-list');
  if(!container) return;
  container.innerHTML = '<div class="card info-box">Loading airlines…</div>';
  try {
    const items = await authFetch('/airlines'); // authFetch handles errors and JSON
    container.innerHTML = items.length ? items.map(a =>
      `<div class="list-item-card">
        <div>
          <strong>${escapeHtml(a.name)}</strong> (${escapeHtml(a.id)}) — ${escapeHtml(a.code||'')}
          <div class="flight-sub">${escapeHtml(a.country||'')}</div>
        </div>
        <div class="actions">
          <button class="btn danger delete-airline" data-id="${escapeHtml(a.id)}">Remove</button>
        </div>
      </div>`
    ).join('') : '<div class="card info-box">No airlines found.</div>';
    // wireAirlineDelete(); // Moved to init
  } catch (err){
    console.error('loadAirlines error', err);
    setMessage(`Error loading airlines: ${err.message}`, true);
    if(container) container.innerHTML = `<div class="card error-box">Error: ${escapeHtml(err.message)}</div>`;
  }
}

async function loadFlightOptions() {
  const sel = el("class-flight-select");
  if (!sel) return;
  sel.innerHTML = '<option value="">Loading flights…</option>';
  try {
    const items = await authFetch("/flights"); // authFetch handles errors/JSON
    sel.innerHTML = items.length
      ? items
          .map((f) => {
            const originCity = f.Origin?.city ?? "?";
            const destCity = f.Destination?.city ?? "?";
            return `<option value="${escapeHtml(f.id ?? "")}">
              ${escapeHtml(f.flightNumber ?? "-")} (${escapeHtml(originCity)} → ${escapeHtml(destCity)})
            </option>`;
          })
          .join("")
      : '<option value="">No flights found</option>';
    sel.insertAdjacentHTML("afterbegin", '<option value="">-- Select a Flight --</option>');
    sel.value = "";
  } catch (err) {
    console.error("loadFlightOptions error", err);
    if(sel) sel.innerHTML = "<option value=''>Unable to load flights</option>";
    setMessage(`Error loading flight options: ${err.message}`, true);
  }
}

async function loadClasses(){
  const container = el('classes-list'); if(!container) return;
  container.innerHTML = '<div class="card info-box">Loading classes…</div>';
  try {
    const items = await authFetch('/classes'); // authFetch handles errors/JSON
    const normalized = items.map(normalizeClass);
    container.innerHTML = normalized.length ? normalized.map(c =>
    `<div class="list-item-card">
      <div>
        <strong>${escapeHtml(c.name)}</strong> (${escapeHtml(c.id)}) — $${escapeHtml(String(c.price))}
         <div class="flight-sub">Seats: ${escapeHtml(c.total_seats)}</div>
        <div class="flight-sub">${escapeHtml(c.flightInfo)}</div>
      </div>
      <div class="actions">
        <button class="btn danger delete-class" data-id="${escapeHtml(c.id)}">Remove</button>
      </div>
    </div>`
    ).join('') : '<div class="card info-box">No classes found.</div>';
    // wireClassDelete(); // Moved to init
  } catch (err){
    console.error('loadClasses error', err);
    setMessage(`Error loading classes: ${err.message}`, true);
    if(container) container.innerHTML = `<div class="card error-box">Error: ${escapeHtml(err.message)}</div>`;
   }
}

async function loadFlights() {
  const container = el("flights-list");
  if (!container) return;
  container.innerHTML = '<div class="card info-box">Loading flights…</div>';
  try {
    // Request pilot info inclusion
    const items = await authFetch("/flights?includePilot=true"); // authFetch handles errors/JSON

    if (items.length === 0) {
        container.innerHTML = '<div class="card info-box">No flights added yet.</div>';
        return;
    }

    container.innerHTML = items.map((f) => {
        const originCity = f.Origin?.city ?? "?";
        const destCity = f.Destination?.city ?? "?";
        const airlineName = f.Airline?.name ?? "-";
        const flightNum = f.flightNumber ?? "-";
        const price = f.price ?? "";
        const currentPilot = f.Pilot; // Pilot data included from backend { id, name }
        const pilotDropdownId = `pilot-select-${f.id}`;

        // Asynchronously load pilots for this dropdown *after* it's added to DOM
        setTimeout(() => loadPilotsDropdown(pilotDropdownId, currentPilot?.id), 0);

        return `<div class="list-item-card">
              <div class="flight-meta" style="flex-grow: 1; margin-right: 15px;">
                <div>
                  <div class="flight-title">${escapeHtml(airlineName)} • ${escapeHtml(flightNum)} (${escapeHtml(f.id)})</div>
                  <div class="flight-sub">${escapeHtml(originCity)} → ${escapeHtml(destCity)}</div>
                  <div class="flight-sub">Base Price: $${escapeHtml(String(price))}</div>
                  <div class="flight-sub" style="margin-top: 5px;">
                    Currently Assigned Pilot: <strong id="current-pilot-${f.id}">${currentPilot ? escapeHtml(currentPilot.name) : 'None'}</strong>
                  </div>
                </div>
              </div>
            
              <div class="actions form-row" style="min-width: 300px;">
                 <select id="${pilotDropdownId}" name="pilotId" class="pilot-assign-select" style="flex-grow: 2;">
                    <option value="">Loading pilots...</option> {/* Initial state */}
                 </select>
                 <button class="btn primary assign-pilot-btn" data-flight-id="${escapeHtml(f.id)}" data-select-id="${pilotDropdownId}" style="flex-grow: 1;">Assign</button>
              </div>

              <div class="actions" style="margin-left: 10px;">
                <button class="btn danger delete-flight" data-id="${escapeHtml(f.id)}">Remove</button>
              </div>
            </div>`;
        }).join("");

    // wireFlightDelete(); // Moved to init
    // wireAssignPilot(); // Moved to init using event delegation

  } catch (err) {
    console.error("loadFlights error:", err);
    setMessage(`Error loading flights: ${err.message}`, true);
    if(container) container.innerHTML = `<div class="card error-box">Error: ${escapeHtml(err.message)}</div>`;
  }
}

async function loadTickets() {
  const container = el("tickets-list");
  if (!container) return;
  container.innerHTML = '<div class="card info-box">Loading tickets…</div>';
  try {
    const items = await authFetch("/tickets"); // Admin route, authFetch handles errors/JSON
    const normalized = items.map(normalizeTicket);

    container.innerHTML = normalized.length
      ? normalized
          .map(
            (t) => `
    <div class="ticket-card status-${escapeHtml(t.status.toLowerCase())}">
      <div class="actions">
        <button class="btn danger delete-ticket" data-id="${escapeHtml(t.id)}">Remove</button>
      </div>
      <div class="ticket-header">
        <div><small>PNR</small><strong>${escapeHtml(t.pnr)}</strong></div>
        <div class="ticket-status">${escapeHtml(t.status)}</div>
      </div>
      <div class="ticket-body">
        <div class="ticket-passenger"><small>Passenger</small><div>${escapeHtml(t.passengerName)} (<span class="ticket-class">${escapeHtml(t.classType)}</span>)</div></div>
        <div class="ticket-info-grid">
          <div class="ticket-flight"><small>Flight</small><div>${escapeHtml(t.airline)} ${escapeHtml(t.flightNumber)}</div></div>
          <div class="ticket-seat"><small>Seat</small><div>${escapeHtml(t.seat)}</div></div>
        </div>
        <div class="ticket-route"><small>Route</small><div>${escapeHtml(t.route)}</div></div>
        <div class="ticket-date"><small>Travel Date & Time</small><div>${escapeHtml(t.travelDate)}</div></div>
        <div class="flight-sub" style="font-size: 0.8rem; margin-top: 8px; border-top: 1px solid #eee; padding-top: 8px;">
          Booked By: ${escapeHtml(t.bookedBy)}
        </div>
      </div>
    </div>`
          )
          .join("")
      : '<div class="card info-box">No tickets found.</div>';

      // wireTicketDelete(); // Moved to init
  } catch (err) {
    console.error("loadTickets error", err);
     setMessage(`Error loading tickets: ${err.message}`, true);
    if(container) container.innerHTML = `<div class="card error-box">Error: ${escapeHtml(err.message)}</div>`;
  }
}

async function loadAirports() {
  const container = el("airports-list");
  if (!container) return;
  container.innerHTML = '<div class="card info-box">Loading airports…</div>';
  try {
    const items = await authFetch("/airports"); // authFetch handles errors/JSON
    container.innerHTML = items.length
      ? items
          .map(
            (a) =>
              `<div class="list-item-card">
                <div>
                  <strong>${escapeHtml(a.city)} (${escapeHtml(a.airport_code)})</strong> (${escapeHtml(a.id)}) 
                  <div class="flight-sub">${escapeHtml(a.name)}, ${escapeHtml(a.country)}</div>
                </div>
                <div class="actions">
                  <button class="btn danger delete-airport" data-id="${escapeHtml(a.airport_code)}">Remove</button>
                </div>
              </div>`
          )
          .join("")
      : '<div class="card info-box">No airports added yet.</div>';

      // wireAirportDelete(); // Moved to init
  } catch (err) {
    console.error("loadAirports error", err);
    setMessage(`Error loading airports: ${err.message}`, true);
    if(container) container.innerHTML = `<div class="card error-box">Error: ${escapeHtml(err.message)}</div>`;
  }
}

async function loadAirportOptions() {
  const originSel = el("flight-origin-select");
  const destSel = el("flight-destination-select");
  // Only load if both selects exist (i.e., on Flights tab)
  if (!originSel || !destSel) return;

  originSel.innerHTML = '<option value="">Loading...</option>';
  destSel.innerHTML = '<option value="">Loading...</option>';

  try {
    const items = await authFetch("/airports"); // authFetch handles errors/JSON
    const optionsHtml = items.length
      ? items
          .map(
            (a) =>
              `<option value="${escapeHtml(a.airport_code)}">
                ${escapeHtml(a.city)} (${escapeHtml(a.airport_code)})
              </option>`
          )
          .join("")
      : '<option value="">No airports found</option>';

    originSel.innerHTML = `<option value="">-- Select Origin --</option>${optionsHtml}`;
    destSel.innerHTML = `<option value="">-- Select Destination --</option>${optionsHtml}`;
  } catch (err) {
    console.error("loadAirportOptions error", err);
     if(originSel) originSel.innerHTML = "<option value=''>Unable to load</option>";
    if(destSel) destSel.innerHTML = "<option value=''>Unable to load</option>";
    setMessage(`Error loading airport options: ${err.message}`, true);
  }
}

async function loadAirlineOptions(){
  const sel = el('airline-select'); if(!sel) return;
  sel.innerHTML = '<option value="">Loading…</option>';
  try {
    const items = await authFetch('/airlines'); // authFetch handles errors/JSON
    sel.innerHTML = items.length ? items.map(a => `<option value="${escapeHtml(a.id ?? '')}">${escapeHtml(a.name)}</option>`).join('') : '<option value="">No airlines found</option>';
    sel.insertAdjacentHTML("afterbegin", '<option value="">-- Select Airline --</option>');
    sel.value = "";
  } catch (err) {
    console.error('loadAirlineOptions error', err);
    if(sel) sel.innerHTML = '<option value="">Unable to load</option>';
     setMessage(`Error loading airline options: ${err.message}`, true);
  }
}


/* ---------- Delete Button Wire-up Functions ---------- */
// Generic delete helper
async function handleDelete(e, entityName, loadFunction) {
    // Prevent default if triggered by a form element inside the list item
    e.preventDefault();
    if (!confirm(`Are you sure you want to delete this ${entityName}? This action might be irreversible.`)) return; // Added warning

    const btn = e.target.closest('button'); // Ensure we get the button element
    if (!btn) return; // Exit if the click wasn't on a button

    const id = btn.dataset.id;
    if (!id) {
        console.error(`Delete button for ${entityName} is missing data-id attribute.`);
        setMessage(`Cannot delete ${entityName}: Missing ID.`, true);
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Deleting...';
    setMessage(`Deleting ${entityName}...`, false); // Use info style if available

    try {
        // Construct URL carefully, airport uses code, others use ID
        // Note: Backend Airport route expects code, not id
        const urlId = entityName === 'airport' ? id : id; // Use the id from data-id
        const url = `/${entityName}s/${urlId}`;

        console.log(`Attempting DELETE ${url}`); // Log the request URL

        await authFetch(url, { method: "DELETE" }); // authFetch handles response check and parsing

        setMessage(`${entityName.charAt(0).toUpperCase() + entityName.slice(1)} removed successfully.`, false); // Success state
        if (loadFunction) loadFunction(); // Refresh the list

        // Refresh relevant dropdowns if needed
        if (entityName === 'airline') { loadAirlineOptions(); loadFlightOptions(); }
        if (entityName === 'airport') { loadAirportOptions(); loadFlightOptions(); }
        if (entityName === 'flight') { loadFlightOptions(); loadClasses(); } // Refresh classes if flight deleted
        if (entityName === 'class') { loadClasses(); } // Refresh only classes
        // No dropdowns depend directly on users or tickets

    } catch (err) {
        console.error(`Failed to delete ${entityName}:`, err);
        setMessage(`Failed to delete ${entityName}: ${err.message}`, true); // Error state
    } finally {
        // Ensure button is re-enabled even if it was removed from DOM during refresh
        const potentiallyNewBtn = document.querySelector(`[data-id="${id}"].delete-${entityName}`);
        if(potentiallyNewBtn) {
            potentiallyNewBtn.disabled = false;
            potentiallyNewBtn.textContent = originalText;
        } else if (btn) { // Fallback to original button if still exists
             btn.disabled = false;
             btn.textContent = originalText;
        }
    }
}


// --- Use Event Delegation for Delete Buttons ---
function wireDeleteButtons() {
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => {
        panel.addEventListener('click', (e) => {
            const button = e.target.closest('button'); // Find the closest button clicked
            if (!button) return;

            if (button.classList.contains('delete-user')) handleDelete(e, 'user', loadUsers);
            else if (button.classList.contains('delete-airline')) handleDelete(e, 'airline', loadAirlines);
            else if (button.classList.contains('delete-airport')) handleDelete(e, 'airport', loadAirports);
            else if (button.classList.contains('delete-flight')) handleDelete(e, 'flight', loadFlights);
            else if (button.classList.contains('delete-class')) handleDelete(e, 'class', loadClasses);
            else if (button.classList.contains('delete-ticket')) handleDelete(e, 'ticket', loadTickets);
        });
    });
}


/* ---------- Function to load users into report dropdown ---------- */
async function loadReportOptions(role = 'user') {
  const nameSelect = el('report-name-select');
  if (!nameSelect) return;

  nameSelect.disabled = true;
  nameSelect.innerHTML = `<option value="">Loading ${role}s...</option>`;

  try {
    const users = await authFetch(`/users?role=${role}`); // authFetch handles errors/JSON

    if (users.length === 0) {
      nameSelect.innerHTML = `<option value="">-- No ${role}s found --</option>`;
      return; // Keep disabled
    }

    nameSelect.innerHTML = users.map(user =>
      `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} (${escapeHtml(user.email)})</option>`
    ).join('');

    nameSelect.insertAdjacentHTML('afterbegin', `<option value="">-- Select a ${role} --</option>`);
    nameSelect.value = ''; // Reset selection

  } catch (err) {
    console.error('loadReportOptions error:', err);
    nameSelect.innerHTML = `<option value="">Error loading</option>`;
     setMessage(`Error loading report options: ${err.message}`, true);
  } finally {
    nameSelect.disabled = false;
  }
}

// --- Wire Assign Pilot Buttons ---
// Uses event delegation
function wireAssignPilot() {
    const flightsList = el('flights-list');
    if (!flightsList) return;

    flightsList.addEventListener('click', async (e) => {
        const btn = e.target.closest('.assign-pilot-btn'); // Get button if clicked
        if (!btn) return; // Exit if click wasn't on or inside an assign button

        e.preventDefault(); // Prevent potential form submission if nested

        const flightId = btn.dataset.flightId;
        const selectId = btn.dataset.selectId;
        const pilotSelect = document.getElementById(selectId);
        const pilotId = pilotSelect ? pilotSelect.value : null;

        if (!pilotId) {
            setMessage("Please select a pilot from the dropdown.", true);
            return;
        }
        if (!flightId) {
            console.error("Assign button missing flight ID");
            setMessage("Internal error: Missing flight ID.", true);
            return;
        }

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Assigning...';
        setMessage('Assigning pilot...', false); // Use info style if available

        try {
            const data = await authFetch(`/flights/${flightId}/assign-pilot`, { // authFetch handles errors/JSON
                method: 'PUT',
                body: JSON.stringify({ pilotId: parseInt(pilotId) })
            });

            setMessage(`Pilot assigned successfully to flight ${data.flight?.flightNumber || ''}.`, false);

            // Update the 'Currently Assigned' text dynamically
            const currentPilotEl = document.getElementById(`current-pilot-${flightId}`);
            // The response includes the updated flight with the nested Pilot object
            const assignedPilot = data.flight?.Pilot;
            if (currentPilotEl) {
                currentPilotEl.textContent = assignedPilot ? escapeHtml(assignedPilot.name) : 'None';
            }
             // Update the dropdown selection to match
            if(pilotSelect && assignedPilot) {
                pilotSelect.value = assignedPilot.id;
            } else if (pilotSelect) {
                 pilotSelect.value = ''; // Should not happen on success
            }

        } catch (err) {
            console.error('Assign pilot error:', err);
            setMessage(`Error assigning pilot: ${err.message}`, true);
        } finally {
            // Ensure button is re-enabled
            const potentiallyNewBtn = flightsList.querySelector(`button.assign-pilot-btn[data-flight-id="${flightId}"]`);
             if (potentiallyNewBtn) {
                 potentiallyNewBtn.disabled = false;
                 potentiallyNewBtn.textContent = originalText;
             } else if(btn) { // Fallback
                  btn.disabled = false;
                  btn.textContent = originalText;
             }
        }
    });
}


/* ---------- forms & options ---------- */
function wireForms(){
  // --- Add Airline Form ---
  const addAirlineForm = el("add-airline-form");
  if (addAirlineForm) addAirlineForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) return redirectToLogin();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
        const payload = {
            name: form.name.value.trim(),
            code: form.code.value.trim().toUpperCase(),
            country: form.country.value.trim(),
        };
        if (!payload.name || !payload.code || !payload.country) throw new Error("All fields are required");
        if (payload.code.length > 3 || payload.code.length < 2) throw new Error("Code must be 2 or 3 letters.");

        await authFetch("/airlines", { method: "POST", body: JSON.stringify(payload) }); // authFetch handles response

        form.reset();
        loadAirlines(); // Refresh list
        setMessage('Airline added successfully.', false);
    } catch (err) {
      console.error('Add airline error:', err);
      setMessage(err.message || 'Error adding airline.', true);
    } finally {
      if(btn) btn.disabled = false;
    }
  });

  // --- Add Airport Form ---
  const addAirportForm = el("add-airport-form");
  if (addAirportForm) {
    addAirportForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!isLoggedIn()) return redirectToLogin();
      const form = e.target;
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      const payload = {
        airport_code: form.airport_code.value.trim().toUpperCase(),
        name: form.name.value.trim(),
        city: form.city.value.trim(),
        country: form.country.value.trim(),
      };
      try {
        if (!payload.airport_code || !payload.name || !payload.city || !payload.country) throw new Error("All fields required.");
        if (payload.airport_code.length !== 3) throw new Error("Airport code must be 3 characters.");

        await authFetch("/airports", { method: "POST", body: JSON.stringify(payload) }); // authFetch handles response

        form.reset();
        loadAirports();
        loadAirportOptions(); // Refresh dropdowns that use airports
        setMessage("Airport added successfully", false);
      } catch (err) {
        setMessage(`Error adding airport: ${err.message}`, true);
        console.error("Add airport error:", err);
      } finally {
          if(btn) btn.disabled = false;
      }
    });
  }

  // --- Add Class Form ---
  const addClassForm = el('add-class-form');
  if(addClassForm) addClassForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) return redirectToLogin();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const payload = {
        flightId: form.flightId.value,
        classType: form.classType.value.trim(),
        fare: Number(form.fare.value),
        total_seats: Number(form.total_seats.value)
      };
      if (!payload.flightId || !payload.classType || !payload.fare || !payload.total_seats) throw new Error("All fields required.");
      if (payload.fare <= 0) throw new Error('Fare must be positive.');
      if (payload.total_seats <= 0) throw new Error('Total seats must be positive.');

      await authFetch('/classes', { method: 'POST', body: JSON.stringify(payload) }); // authFetch handles response

      form.reset();
      loadClasses(); // Refresh class list
      setMessage('Class added successfully', false);
    } catch (err) {
      setMessage(`Error adding class: ${err.message}`, true);
      console.error('Add class error:', err);
    } finally {
         if(btn) btn.disabled = false;
    }
  });

  // --- Add Flight Form ---
  const addFlightForm = el("add-flight-form");
  if (addFlightForm) {
    addFlightForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!isLoggedIn()) return redirectToLogin();
      const form = e.target;
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        const payload = {
          airline_id: form.airline_id.value,
          flightNumber: form.flightNumber.value.trim().toUpperCase(),
          origin_code: form.origin_code.value,
          destination_code: form.destination_code.value,
          departureTime: form.departureTime.value ? new Date(form.departureTime.value).toISOString() : null,
          arrivalTime: form.arrivalTime.value ? new Date(form.arrivalTime.value).toISOString() : null,
          price: Number(form.price.value),
        };

        if (!payload.airline_id || !payload.flightNumber || !payload.origin_code || !payload.destination_code || !payload.departureTime || !payload.arrivalTime || !payload.price) throw new Error("All fields required.");
        if (payload.origin_code === payload.destination_code) throw new Error("Origin and Destination cannot be the same.");
        if (payload.price <= 0) throw new Error("Price must be positive.");
        if (new Date(payload.arrivalTime) <= new Date(payload.departureTime)) throw new Error("Arrival time must be after departure time.");


        await authFetch("/flights", { method: "POST", body: JSON.stringify(payload) }); // authFetch handles response

        form.reset();
        loadFlights(); // Refresh flight list
        loadFlightOptions(); // Refresh dropdowns that list flights
        setMessage("Flight added successfully", false);
      } catch (err) {
        setMessage(`Error adding flight: ${err.message}`, true);
        console.error("Add flight error:", err);
      } finally {
          if(btn) btn.disabled = false;
      }
    });
  }

  // --- Wire up Report Search Form (with dropdowns) ---
  const reportForm = el("report-search-form");
  if (reportForm) {
    reportForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userId = el('report-name-select').value; // Get USER ID from value
      if (!userId) {
        setMessage("Please select a user or pilot.", true);
        return;
      }

      const resultContainer = el("reports-result");
      resultContainer.innerHTML = '<div class="card info-box">Loading report...</div>';
      try {
        // Send userId to the backend
        const data = await authFetch(`/reports?userId=${encodeURIComponent(userId)}`); // authFetch handles response

        displayReport(data);
        setMessage("Report generated.", false);

      } catch (err) {
        console.error("Report search error:", err);
        resultContainer.innerHTML = `<div class="card error-box">Error: ${escapeHtml(err.message)}</div>`;
        setMessage(`Error generating report: ${err.message}`, true);
      }
    });
  }

  // --- Add event listener for Role Select in Reports ---
  const roleSelect = el('report-role-select');
  if (roleSelect) {
    roleSelect.addEventListener('change', (e) => {
      loadReportOptions(e.target.value); // Load names for selected role
       const resultContainer = el("reports-result");
       if(resultContainer) resultContainer.innerHTML = '<div class="card info-box">Select a user/pilot to generate a report.</div>'; // Clear results
    });
  }
} // End of wireForms function

/* ---------- tabs + init ---------- */
function wireTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Deactivate other tabs and panels
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

      // Activate clicked tab and corresponding panel
      btn.classList.add('active');
      const panelId = `panel-${btn.dataset.panel}`;
      const panelEl = el(panelId);
      if (panelEl) panelEl.classList.add('active');
      else console.error(`Panel with ID ${panelId} not found.`);


      // Clear message area
      setMessage('', false); // Clear any previous success/error message
      const resultContainer = el("reports-result");
      if(resultContainer && panelId !== 'panel-reports') resultContainer.innerHTML = '';


      // Load content for the newly active tab
      const panel = btn.dataset.panel;
      console.log(`Switching to tab: ${panel}`); // Log tab switch
      if(panel === 'users') loadUsers();
      if(panel === 'airlines') { loadAirlines(); }
      if(panel === 'classes') { loadClasses(); loadFlightOptions(); }
      if(panel === 'flights') { loadFlights(); loadAirlineOptions(); loadAirportOptions(); }
      if(panel === 'tickets') loadTickets();
      if(panel === "airports") { loadAirports(); }
      if(panel === "reports") {
        loadReportOptions(el('report-role-select')?.value || 'user'); // Load initial options using current role value
        if(resultContainer) resultContainer.innerHTML = '<div class="card info-box">Select a user/pilot to generate a report.</div>';
      }
    });
  });
}

// --- Initialize Admin Page ---
document.addEventListener('DOMContentLoaded', () => {
  // Check login status FIRST
  if (!isLoggedIn()) {
      console.warn('Not logged in — redirecting to login');
      return redirectToLogin(); // Stop execution if not logged in
  }

  // Now that we know user is logged in, proceed with setup
  try {
    console.log("Admin page DOM loaded. Initializing..."); // Log init start
    wireTabs();
    wireForms();
    wireDeleteButtons(); // Use event delegation for delete buttons
    wireAssignPilot();   // Use event delegation for assign pilot buttons

    // Initial load for the default active panel
    const activePanelButton = document.querySelector('.tab-btn.active');
    const initialPanel = activePanelButton?.dataset?.panel || 'users'; // Default to 'users' if none active
    console.log(`Initial active panel: ${initialPanel}`); // Log initial panel

    // Trigger the load function for the initial panel
    // This replaces triggering a click, which could cause issues if done too early
    if (initialPanel === 'users') loadUsers();
    else if (initialPanel === 'airlines') loadAirlines();
    else if (initialPanel === 'airports') loadAirports();
    else if (initialPanel === 'flights') { loadFlights(); loadAirlineOptions(); loadAirportOptions(); }
    else if (initialPanel === 'classes') { loadClasses(); loadFlightOptions(); }
    else if (initialPanel === 'tickets') loadTickets();
    else if (initialPanel === 'reports') {
        loadReportOptions(el('report-role-select')?.value || 'user');
        const resultContainer = el("reports-result");
        if(resultContainer) resultContainer.innerHTML = '<div class="card info-box">Select a user/pilot to generate a report.</div>';
    }
     console.log("Admin page initialization complete."); // Log init end

  } catch (err) {
    console.error('💥 Admin page initialization error:', err);
    setMessage(`Admin UI initialization failed: ${err.message}`, true);
  }
});

