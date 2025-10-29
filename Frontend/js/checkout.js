import { API_BASE, getToken, isLoggedIn, redirectToLogin } from "./main.js";

// Helper to get URL query parameters
function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}
// Helper function to escape HTML
function escapeHtml(str){ return String(str ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;'); }


// Helper for displaying messages
function setMessage(msg, isError = false) {
    const el = document.getElementById('checkout-message');
    if (el) {
        el.textContent = msg;
        el.className = isError ? 'message-box error' : 'message-box success'; // Use classes
        el.classList.remove('hidden');
        // Simple remove after a few seconds
        setTimeout(() => { if (el) el.className = 'message-box hidden'; }, 4000);
    }
}

// --- NEW: Input Formatting Functions ---
function formatCardNumber(input) {
    // Remove non-digits
    let value = input.value.replace(/\D/g, '');
    // Limit to 12 digits
    value = value.substring(0, 12);
    // Add spaces every 4 digits
    let formattedValue = '';
    for (let i = 0; i < value.length; i += 4) {
        formattedValue += value.substring(i, i + 4) + ' ';
    }
    input.value = formattedValue.trim();
}

function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    // Limit length
    if (value.length > 4) {
        value = value.substring(0, 4);
    }
    // Add slash after MM
    if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    input.value = value;
}

function formatCvc(input) {
    // Remove non-digits and limit to 3
    input.value = input.value.replace(/\D/g, '').substring(0, 3);
}
// --- END: Input Formatting Functions ---


// 1. Load flight summary from localStorage
function loadFlightSummary(flight, passengerCount, classType) { // Accept classType
  const summary = document.getElementById("flight-summary");
  if (!summary) return; // Added check

  const flightNo = flight.flightNumber ?? "—";
  const airline = flight.Airline?.name ?? "—";
  const origin = flight.Origin?.city ?? "?";
  const dest = flight.Destination?.city ?? "?";
  const dep = flight.departureTime ? new Date(flight.departureTime).toLocaleString() : "—";
  const arr = flight.arrivalTime ? new Date(flight.arrivalTime).toLocaleString() : "—";
  const price = flight.price ?? 0; // Base price for now

  summary.innerHTML = `<div class="flight-card">
    <div class="flight-meta">
      <div>
        <div class="flight-title">${escapeHtml(airline)} • ${escapeHtml(flightNo)}</div>
        <div class="flight-sub">${escapeHtml(origin)} → ${escapeHtml(dest)}</div>
        <div class="flight-sub" style="font-size: 0.9em; margin-top: 5px;">${escapeHtml(dep)} → ${escapeHtml(arr)}</div>
      </div>
      <div style="text-align:right">
        <div class="price">${new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        }).format(price)}</div>
        <div class="flight-sub">${escapeHtml(passengerCount)} passenger(s) • ${escapeHtml(classType)}</div> <!-- Show class -->
      </div>
    </div>
  </div>`;
}

// 2. Dynamically generate passenger forms
function generatePassengerForms(passengerCount) {
  const container = document.getElementById("passenger-forms-container");
  if (!container) return;

  let formsHtml = "";
  for (let i = 1; i <= passengerCount; i++) {
    formsHtml += `
      <div class="passenger-form-group">
        <h4>Passenger ${i}</h4>
        <div class="passenger-grid">
          <label>
            Full Name
            <input type="text" class="passenger-name" placeholder="Full Name" required>
          </label>
          <label>
            Age
            <input type="number" class="passenger-age" placeholder="Age" min="1" required>
          </label>
          <label>
            Gender
            <select class="passenger-gender" required>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>
        <label style="margin-top: 12px;">
          Seat Number (e.g., A1, 12B)
          <input type="text" class="passenger-seat" placeholder="Seat Number" required>
        </label>
      </div>
    `;
  }
  container.innerHTML = formsHtml;
}

// --- Helper: Fetch Class ID ---
async function getClassId(flightId, classType) {
    if (!flightId || !classType) return null;
    try {
        const res = await fetch(`${API_BASE}/classes`);
        if (!res.ok) throw new Error("Could not fetch classes");
        const classes = await res.json();
        const matchingClass = classes.find(c => c.flight_id === flightId && c.classType === classType);
        return matchingClass ? matchingClass.id : null;
    } catch (err) {
        console.error("Error fetching class ID:", err);
        return null;
    }
}


// 3. Handle the final booking
// Accepts flight object and classType string
async function handleBookingSubmit(event, flight, classType) { // Changed to accept event
    event.preventDefault(); // Prevent default form submission
    if (!isLoggedIn()) return redirectToLogin();

    const btn = document.getElementById("confirm-btn");
    btn.disabled = true;
    btn.textContent = "Processing…";
    setMessage("Processing your booking...");

    try {
      setMessage("Verifying class details...");
      const actualClassId = await getClassId(flight.id, classType);
      if (!actualClassId) {
        throw new Error(`Could not find details for ${classType} class on this flight.`);
      }
      console.log(`Found Class ID: ${actualClassId} for type ${classType}`);

      const passengers = [];
      const passengerForms = document.querySelectorAll(".passenger-form-group");

      for (const pForm of passengerForms) {
        const name = pForm.querySelector(".passenger-name").value.trim();
        const age = pForm.querySelector(".passenger-age").value;
        const gender = pForm.querySelector(".passenger-gender").value;
        const seat_no = pForm.querySelector(".passenger-seat").value.trim().toUpperCase();

        if (!name || !age || !gender || !seat_no) {
          throw new Error("Please fill in all details for every passenger.");
        }
        if (!/^[A-Z]\d{1,2}$/.test(seat_no)) {
             throw new Error(`Invalid seat format "${seat_no}". Use format like A1, B12 etc.`);
        }

        passengers.push({ name, age: Number(age), gender, seat_no });
      }

      const payment_details = {
        transaction_id: document.getElementById("card-number").value.replace(/\s/g, ''), // Remove spaces for backend
        payment_mode: document.getElementById("payment-mode").value,
      };
       if (!payment_details.transaction_id || !payment_details.payment_mode) {
           throw new Error("Please enter payment details.");
       }
       // Add basic validation for card details format (optional but good)
       if (payment_details.payment_mode === "Credit Card" || payment_details.payment_mode === "Debit Card") {
           const expiry = document.getElementById("card-expiry").value;
           const cvc = document.getElementById("card-cvc").value;
           if (!/^\d{12}$/.test(payment_details.transaction_id)) throw new Error("Invalid card number format (must be 12 digits).");
           if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) throw new Error("Invalid expiry date format (MM/YY).");
           if (!/^\d{3}$/.test(cvc)) throw new Error("Invalid CVC format (must be 3 digits).");
       }


      const bookingPayload = {
        flight_id: flight.id,
        class_id: actualClassId,
        passengers: passengers,
        payment_details: payment_details,
      };

      console.log("Sending booking payload:", JSON.stringify(bookingPayload, null, 2));

      setMessage("Confirming booking...");
      const res = await fetch(`${API_BASE}/tickets/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Booking API Error:", data);
        throw new Error(data.message || "Booking failed");
      }

      setMessage("Booking successful! Redirecting...");
      localStorage.removeItem("selectedFlightForCheckout");
      location.href = `confirmation.html?pnr=${data.booking.pnr_no}`;

    } catch (err) {
      console.error("Booking Error:", err);
      setMessage(err.message, true);
      btn.disabled = false;
      btn.textContent = "Confirm and Pay";
    }
}

// 4. Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  if (!isLoggedIn()) {
    redirectToLogin();
    return;
  }

  const passengerCount = Number(qs("passengers") || 1);
  const classType = qs("classType");
  const flightJson = localStorage.getItem("selectedFlightForCheckout");
  const mainContainer = document.querySelector("main.container");

  if (!flightJson || !classType) {
    if (mainContainer) {
        mainContainer.innerHTML =
        '<div class="card error-box"><h2>Booking Error</h2><p>Required flight details or class selection is missing. Please return to the search page and select a flight again.</p><a href="search.html" class="btn primary">Return to Search</a></div>';
    } else {
        document.body.innerHTML = "Error: Flight data or class type not found.";
    }
    return;
  }

  let flight;
  try {
      flight = JSON.parse(flightJson);
      if (!flight || !flight.id) throw new Error("Invalid flight data found.");
  } catch (e) {
      console.error("Error parsing flight data:", e);
       if (mainContainer) {
            mainContainer.innerHTML =
            '<div class="card error-box"><h2>Booking Error</h2><p>Could not load flight details. The stored data might be corrupted. Please return to the search page.</p><a href="search.html" class="btn primary">Return to Search</a></div>';
       } else {
            document.body.innerHTML = "Error: Could not load flight details.";
       }
       return;
  }

  // Run initial setup functions
  loadFlightSummary(flight, passengerCount, classType);
  generatePassengerForms(passengerCount);

  // --- Attach Event Listener for Booking Form Submit ---
  const form = document.getElementById("checkout-form");
  if (form) {
      // Pass flight and classType to the handler via a bound function
      form.addEventListener("submit", (event) => handleBookingSubmit(event, flight, classType));
  } else {
      console.error("Could not find checkout form to attach listener.");
  }

  // --- Attach Input Formatters ---
  const cardNumberInput = document.getElementById('card-number');
  const expiryInput = document.getElementById('card-expiry');
  const cvcInput = document.getElementById('card-cvc');

  if (cardNumberInput) cardNumberInput.addEventListener('input', () => formatCardNumber(cardNumberInput));
  if (expiryInput) expiryInput.addEventListener('input', () => formatExpiryDate(expiryInput));
  if (cvcInput) cvcInput.addEventListener('input', () => formatCvc(cvcInput));

});

