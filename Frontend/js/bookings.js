// js/bookings.js
import { API_BASE, getToken, isLoggedIn, redirectToLogin } from "./main.js";

async function loadBookings() {
  if (!isLoggedIn()) return redirectToLogin();
  const container = document.getElementById("bookings-container");
  if (!container) return;
  container.innerHTML = "Loading bookings…";

  try {
    const res = await fetch(`${API_BASE}/users/my-bookings`, {
      headers: { Authorization: "Bearer " + getToken() },
    });

    const payload = await res.json();
    if (!res.ok) throw new Error(payload.message || "Failed to load bookings");

    const bookings = Array.isArray(payload) ? payload : payload.data || [];
    if (!bookings.length) {
      container.innerHTML = '<div class="card">You have no bookings yet.</div>';
      return;
    }

    container.innerHTML = bookings
      .map((booking) => {
        // --- NEW DATA STRUCTURE ---
        const pnr = booking.pnr_no;
        const bookingStatus = booking.status;
        const totalAmount = booking.total_amount;
        const paymentStatus = booking.Payment ? booking.Payment.status : "Pending";
        
        // Passengers are now an array
        const passengers = booking.Passengers || [];
        if (passengers.length === 0) return ""; // Skip if no passengers

        // Get flight/class info from the first passenger's ticket
        const firstTicket = passengers[0].Ticket;
        if (!firstTicket) return ""; // Skip if no ticket

        const flightInfo = firstTicket.Flight;
        const classInfo = firstTicket.Class;
        
        // Create the list of passengers
        const passengerListHtml = passengers.map(
          (passenger) => `
          <li class="passenger-item">
            <span>${escapeHtml(passenger.name)} (Age: ${passenger.age})</span>
            <span>Seat: ${escapeHtml(passenger.Ticket.seat_no)}</span>
          </li>
        `
        ).join("");

        // Assemble the card
        return `
        <div class="booking-card status-${escapeHtml(bookingStatus.toLowerCase())}">
          <div class="booking-header">
            <div>
              <small>PNR</small>
              <strong>${escapeHtml(pnr)}</strong>
            </div>
            <div class="booking-status">${escapeHtml(bookingStatus)}</div>
          </div>

          <div class="booking-body">
            <div class="booking-flight-info">
              <div class="flight-route">
                <strong>${escapeHtml(flightInfo.origin_code)}</strong> → <strong>${escapeHtml(flightInfo.destination_code)}</strong>
              </div>
              <div class="flight-sub">${escapeHtml(
                flightInfo.flightNumber
              )} • ${escapeHtml(classInfo.classType)}</div>
            </div>

            <div class="passenger-list">
              <small>Passengers (${passengers.length})</small>
              <ul>${passengerListHtml}</ul>
            </div>

            <div class="booking-footer">
              <div>
                <small>Total Fare</small>
                <div>₹${escapeHtml(totalAmount)}</div>
              </div>
              <div class="payment-status status-${escapeHtml(paymentStatus.toLowerCase())}">
                Payment: ${escapeHtml(paymentStatus)}
              </div>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="card">Error loading bookings: ${err.message}</div>`;
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

document.addEventListener("DOMContentLoaded", loadBookings);