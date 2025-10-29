import { API_BASE, getToken, isLoggedIn, redirectToLogin, getUser, escapeHtml } from '/main.js'; // Ensure correct path and escapeHtml is exported or defined

// Function to display messages on the pilot dashboard
function setMessage(msg, isError = false) {
    const el = document.getElementById('pilot-flights-message');
    if (el) {
        el.textContent = msg;
        el.className = isError ? 'message-box error' : 'message-box info'; // Use appropriate classes
        el.classList.remove('hidden');
    }
}

// Function to fetch and display assigned flights
async function loadAssignedFlights() {
    if (!isLoggedIn()) {
        return redirectToLogin();
    }

    const user = getUser();
    // Double-check if the user is actually a pilot on the frontend
    if (!user || user.role !== 'pilot') {
        setMessage('Access Denied: This page is for pilots only.', true);
        document.getElementById('pilot-flights-list').innerHTML = ''; // Clear list area
        // Optional: Redirect non-pilots away
        // window.location.href = 'home.html';
        return;
    }

    const container = document.getElementById('pilot-flights-list');
    if (!container) return;
    container.innerHTML = ''; // Clear previous content
    setMessage('Loading assigned flights...');

    try {
        const res = await fetch(`${API_BASE}/users/my-assigned-flights`, {
            headers: { 'Authorization': 'Bearer ' + getToken() }
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({ message: `HTTP error! status: ${res.status}` }));
            throw new Error(errData.message);
        }

        const flights = await res.json();

        if (!flights || flights.length === 0) {
            setMessage('You have no flights assigned currently.', false);
            container.innerHTML = '<div class="card info-box">No assigned flights found.</div>';
            return;
        }

        setMessage(`Displaying ${flights.length} assigned flight(s).`, false); // Clear loading message

        // Generate HTML for each flight
        container.innerHTML = flights.map(flight => {
            const airline = flight.Airline?.name ?? 'N/A';
            const flightNum = flight.flightNumber;
            const originCity = flight.Origin?.city ?? '?';
            const originCode = flight.Origin?.airport_code ?? '?';
            const destCity = flight.Destination?.city ?? '?';
            const destCode = flight.Destination?.airport_code ?? '?';
            const depTime = new Date(flight.departureTime).toLocaleString();
            const arrTime = new Date(flight.arrivalTime).toLocaleString();

            return `
                <div class="flight-list-item card">
                    <h4>${escapeHtml(airline)} ${escapeHtml(flightNum)}</h4>
                    <div class="flight-details">
                        <span><strong>Route:</strong> ${escapeHtml(originCity)} (${escapeHtml(originCode)}) → ${escapeHtml(destCity)} (${escapeHtml(destCode)})</span><br>
                        <span><strong>Departure:</strong> ${escapeHtml(depTime)}</span><br>
                        <span><strong>Arrival:</strong> ${escapeHtml(arrTime)}</span>
                    </div>
                    {/* Add more details if needed */}
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Error loading assigned flights:", err);
        setMessage(`Error loading flights: ${escapeHtml(err.message)}`, true);
        container.innerHTML = `<div class="card error-box">Could not load assigned flights. ${escapeHtml(err.message)}</div>`;
    }
}

// Initial load when the page is ready
document.addEventListener('DOMContentLoaded', loadAssignedFlights);
