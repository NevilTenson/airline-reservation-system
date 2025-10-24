// js/checkout.js
import { API_BASE, getToken, isLoggedIn, redirectToLogin } from "./main.js";

// Helper to get URL query parameters
function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Helper for displaying messages
function setMessage(msg, isError = false) {
    const el = document.getElementById('checkout-message');
    if (el) {
        el.textContent = msg;
        el.style.color = isError ? 'var(--danger)' : 'var(--success)';
    }
}

// 1. Load flight summary from localStorage
function loadFlightSummary(flight, passengerCount) {
  const summary = document.getElementById("flight-summary");
  
  const flightNo = flight.flightNumber ?? "—";
  const airline = flight.Airline?.name ?? "—";
  const origin = flight.Origin?.city ?? "?";
  const dest = flight.Destination?.city ?? "?";
  const dep = flight.departureTime ? new Date(flight.departureTime).toLocaleString() : "—";
  const arr = flight.arrivalTime ? new Date(f.arrivalTime).toLocaleString() : "—";
  const price = flight.price ?? 0;

  summary.innerHTML = `<div class="flight-card">
    <div class="flight-meta">
      <div>
        <div class="flight-title">${airline} • ${flightNo}</div>
        <div class="flight-sub">${origin} → ${dest}</div>
        <div class="flight-sub" style="font-size: 0.9em; margin-top: 5px;">${dep} → ${arr}</div>
      </div>
      <div style="text-align:right">
        <div class="price">${new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        }).format(price)}</div>
        <div class="flight-sub">${passengerCount} passenger(s)</div>
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

// 3. Handle the final booking
function handleBooking(flight, classId) {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Stop form from reloading page
    if (!isLoggedIn()) return redirectToLogin();

    const btn = document.getElementById("confirm-btn");
    btn.disabled = true;
    btn.textContent = "Processing…";
    setMessage("Processing your booking...");

    try {
      // A. Build the passengers array
      const passengers = [];
      const passengerForms = document.querySelectorAll(".passenger-form-group");
      
      for (const pForm of passengerForms) {
        const name = pForm.querySelector(".passenger-name").value.trim();
        const age = pForm.querySelector(".passenger-age").value;
        const gender = pForm.querySelector(".passenger-gender").value;
        const seat_no = pForm.querySelector(".passenger-seat").value.trim();

        if (!name || !age || !gender || !seat_no) {
          throw new Error("Please fill in all details for every passenger.");
        }

        passengers.push({
          name: name,
          age: Number(age),
          gender: gender,
          seat_no: seat_no,
        });
      }
      
      // B. Build the payment_details object
      const payment_details = {
        transaction_id: document.getElementById("card-number").value.trim(),
        payment_mode: document.getElementById("payment-mode").value,
      };

      // C. Build the final payload for the API
      const bookingPayload = {
        flight_id: flight.id,
        class_id: classId,
        passengers: passengers,
        payment_details: payment_details,
      };

      // D. Make the ONE API call
      const res = await fetch(`${API_BASE}/tickets/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer "  + getToken(),
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Booking failed");
      }

      // Success! Redirect to confirmation
      setMessage("Booking successful! Redirecting...");
      // We can pass the new PNR to the confirmation page
      location.href = `confirmation.html?pnr=${data.booking.pnr_no}`;

    } catch (err) {
      console.error("Booking Error:", err);
      setMessage(err.message, true); // Show error message
      btn.disabled = false;
      btn.textContent = "Confirm and Pay";
    }
  });
}

// 4. Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  if (!isLoggedIn()) {
    redirectToLogin();
    return;
  }

  // Get data from URL and localStorage
  const passengerCount = Number(qs("passengers") || 1);
  const classId = qs("classId");
  const flightJson = localStorage.getItem("selectedFlightForCheckout");

  if (!flightJson || !classId) {
    document.querySelector("main.container").innerHTML = 
      '<div class="card">Error: Flight data or class not found. Please <a href="search.html">start over</a>.</div>';
    return;
  }

  const flight = JSON.parse(flightJson);

  // Run all setup functions
  loadFlightSummary(flight, passengerCount);
  generatePassengerForms(passengerCount);
  handleBooking(flight, classId);
});