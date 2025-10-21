let token = '';
let userId = '';
let role = '';

const flightIdSelect = document.getElementById('flightId');
const classIdSelect = document.getElementById('classId');
const ticketList = document.getElementById('ticketList');
const bookingResult = document.getElementById('bookingResult');

const userDashboard = document.getElementById('user-dashboard');
const adminDashboard = document.getElementById('admin-dashboard');

const airlineSelect = document.getElementById('airlineSelect');
const allTicketsList = document.getElementById('allTicketsList');

let classMap = {}; // maps class type to backend _id

// ------------------- LOGIN -------------------
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('http://localhost:5000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.token) {
    token = data.token;
    userId = data.userId;
    role = data.role || 'user';

    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';

    if (role === 'admin') {
      adminDashboard.style.display = 'block';
      userDashboard.style.display = 'none';
      await loadAirlines();
      await loadAllTickets();
    } else {
      userDashboard.style.display = 'block';
      adminDashboard.style.display = 'none';
      await loadClasses();
      await loadFlights();
      viewTickets();
    }
  } else {
    alert(data.message || 'Login failed');
  }
}

// ------------------- USER FUNCTIONS -------------------

// LOAD CLASSES
async function loadClasses() {
  const res = await fetch('http://localhost:5000/api/classes');
  const classes = await res.json();

  // Map classType -> _id
  classes.forEach(c => classMap[c.classType.toLowerCase()] = c._id);

  // Populate select options
  classIdSelect.innerHTML = '';
  ['economy', 'business'].forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    classIdSelect.appendChild(opt);
  });
}

// LOAD FLIGHTS
async function loadFlights() {
  const res = await fetch('http://localhost:5000/api/flights/');
  const flights = await res.json();

  flightIdSelect.innerHTML = `<option value="">Select Flight</option>`;
  flights.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f._id;
    opt.dataset.source = f.source;
    opt.dataset.destination = f.destination;
    opt.textContent = `${f.flightName} (${f.source} → ${f.destination})`;
    flightIdSelect.appendChild(opt);
  });
}

// AUTO-FILL SOURCE & DESTINATION
function fillSourceDestination() {
  const selectedOption = flightIdSelect.selectedOptions[0];
  if (!selectedOption) return;
  document.getElementById('source').value = selectedOption.dataset.source;
  document.getElementById('destination').value = selectedOption.dataset.destination;
}

// BOOK TICKET
document.getElementById('bookTicketBtn').addEventListener('click', async () => {
  const selectedClass = classIdSelect.value;
  const classId = classMap[selectedClass.toLowerCase()];

  const data = {
    userId,
    flightId: flightIdSelect.value,
    classId,
    passengerName: document.getElementById('passengerName').value,
    seatNumber: document.getElementById('seatNumber').value,
    source: document.getElementById('source').value,
    destination: document.getElementById('destination').value
  };

  const res = await fetch('http://localhost:5000/api/tickets/book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  bookingResult.textContent = result.message || JSON.stringify(result);

  // Clear form fields
  document.getElementById('passengerName').value = '';
  document.getElementById('seatNumber').value = '';

  viewTickets();
});

// VIEW TICKETS
async function viewTickets() {
  if (!userId) return;
  const res = await fetch(`http://localhost:5000/api/tickets/user/${userId}`);
  const tickets = await res.json();

  // User tickets
  ticketList.innerHTML = tickets.map(t => `
    <li class="user-ticket">
      PNR: ${t.PNR} | Flight: ${t.flightId.flightName} (${t.flightId.source} → ${t.flightId.destination}) | Class: ${t.classId.classType} | Seat: ${t.seatNumber} | Ticket ID: ${t._id}
    </li>
  `).join('');
}

// CANCEL TICKET
async function cancelTicket() {
  const ticketId = document.getElementById('cancelTicketId').value;
  if (!ticketId) return alert('Enter Ticket ID');

  const res = await fetch(`http://localhost:5000/api/tickets/cancel/${ticketId}`, { method: 'DELETE' });
  const result = await res.json();
  alert(result.message || JSON.stringify(result));
  viewTickets();
}

// MAKE PAYMENT
async function makePayment() {
  const ticketId = document.getElementById('payTicketId').value;
  const amount = document.getElementById('payAmount').value;
  const paymentMode = document.getElementById('payMode').value;

  if (!ticketId || !amount) return alert('Enter Ticket ID and Amount');

  await fetch('http://localhost:5000/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketId, amount, paymentMode })
  });
  alert('Payment processed (no confirmation for simplicity)');
}

// ------------------- ADMIN FUNCTIONS -------------------

// LOAD AIRLINES
async function loadAirlines() {
  const res = await fetch('http://localhost:5000/api/airlines');
  const airlines = await res.json();

  airlineSelect.innerHTML = `<option value="">Select Airline</option>`;
  airlines.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a._id;
    opt.textContent = a.airlineName;
    airlineSelect.appendChild(opt);
  });
}

// ADD AIRLINE
async function addAirline() {
  const name = document.getElementById('airlineName').value;
  const contact = document.getElementById('airlineContact').value;
  if (!name || !contact) return alert('Fill all fields');

  const res = await fetch('http://localhost:5000/api/airlines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ airlineName: name, contactNumber: contact })
  });
  const result = await res.json();
  alert(result.message || JSON.stringify(result));
  loadAirlines();
}

// ADD FLIGHT
async function addFlight() {
  const flightData = {
    airlineId: document.getElementById('airlineSelect').value,
    flightNumber: document.getElementById('flightNumber').value,
    flightName: document.getElementById('flightName').value,
    source: document.getElementById('sourceInput').value,
    destination: document.getElementById('destinationInput').value,
    arrivalTime: document.getElementById('arrivalTime').value,
    departureTime: document.getElementById('departureTime').value,
    seatAvailability: document.getElementById('seatAvailability').value,
    distance: document.getElementById('distance').value
  };

  const res = await fetch('http://localhost:5000/api/flights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(flightData)
  });
  const result = await res.json();
  alert(result.message || JSON.stringify(result));
  await loadFlights(); // refresh flight list
}

// VIEW ALL TICKETS (Admin)
async function loadAllTickets() {
  const res = await fetch('http://localhost:5000/api/tickets');
  const tickets = await res.json();

  allTicketsList.innerHTML = tickets.map(t => `
    <li class="admin-ticket">
      PNR: ${t.PNR} | Flight: ${t.flightId.flightName} | User: ${t.userId.username} | Class: ${t.classId.classType} | Seat: ${t.seatNumber}
    </li>
  `).join('');
}
