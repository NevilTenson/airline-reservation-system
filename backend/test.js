import axios from "axios";

// Base URL
const BASE = "http://localhost:5000/api";

// Admin credentials
const admin = {
  "email": "nevil@example.com",
  "password": "1234"
};

// Test user data
const testUser = {
  name: "Test User",
  username: "testuser",
  email: "testuser@example.com",
  password: "testpass123",
  role: "user",
};

// Helper to log results
const log = (name, success, info = "") => {
  console.log(`${success ? "✅" : "❌"} ${name} ${info}`);
};

const runTests = async () => {
  try {
    // --- 1️⃣ Admin login ---
    const loginRes = await axios.post(`${BASE}/users/login`, admin);
    const token = loginRes.data.token;
    log("Admin login", true);

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // --- 2️⃣ Add airline ---
   let airlineId;
try {
  const airlineRes = await axios.post(
    `${BASE}/airlines`,
    { name: "Air India", code: "AI", country: "India" },
    authHeader
  );
  airlineId = airlineRes.data.airline.id;
  log("Add airline", true, `id=${airlineId}`);
} catch (err) {
  // If airline exists, fetch its id
  const airlines = await axios.get(`${BASE}/airlines`);
  const airline = airlines.data.find(a => a.code === "AI");
  airlineId = airline.id;
  log("Add airline (already exists)", true, `id=${airlineId}`);
}

    // --- 3️⃣ Add flight ---
    const flightRes = await axios.post(
      `${BASE}/flights`,
      {
        flightNumber: "AI999",
        origin: "Delhi",
        destination: "Mumbai",
        departureTime: "2025-10-25T10:00:00",
        arrivalTime: "2025-10-25T12:00:00",
        seatsAvailable: 100,
        price: 5000,
        airlineId,
      },
      authHeader
    );
    const flightId = flightRes.data.flight.id;
    log("Add flight", true, `id=${flightId}`);

    // --- 4️⃣ Add classes ---
    const classRes1 = await axios.post(
      `${BASE}/classes/add`,
      { classType: "Economy", fare: 5000, flightId },
      authHeader
    );
    const classRes2 = await axios.post(
      `${BASE}/classes/add`,
      { classType: "Business", fare: 7500, flightId },
      authHeader
    );
    const classIds = [classRes1.data.newClass.id, classRes2.data.newClass.id];
    log("Add classes", true, `ids=${classIds.join(",")}`);

    // --- 5️⃣ Register test user ---
    const userRes = await axios.post(`${BASE}/users/register`, testUser);
    const userId = userRes.data.user.id;
    log("Register test user", true, `id=${userId}`);

    // --- 6️⃣ Book ticket ---
    const ticketRes = await axios.post(`${BASE}/tickets/book`, {
      user_id: userId,
      flight_id: flightId,
      class_id: classIds[0],
      passenger_name: testUser.name,
      seat_no: "1A",
      travel_date: "2025-10-25",
    });
    const ticketId = ticketRes.data.ticket.ticket_id;
    const pnr = ticketRes.data.ticket.pnr_no;
    log("Book ticket", true, `ticket_id=${ticketId}, PNR=${pnr}`);

    // --- 7️⃣ Create payment ---
    const paymentRes = await axios.post(
      `${BASE}/payments`,
      { ticket_id: ticketId, payment_mode: "Credit Card", amount: 5000 },
      authHeader
    );
    const paymentId = paymentRes.data.payment.payment_id;
    log("Create payment", true, `payment_id=${paymentId}`);

    // --- 8️⃣ Fetch all flights ---
    const allFlights = await axios.get(`${BASE}/flights`);
    log("Get flights", allFlights.data.length > 0);

    // --- 9️⃣ Fetch all classes ---
    const allClasses = await axios.get(`${BASE}/classes`);
    log("Get classes", allClasses.data.length > 0);

    // --- 🔟 Fetch ticket by PNR ---
    const ticketByPnr = await axios.get(`${BASE}/tickets/${pnr}`);
    log("Get ticket by PNR", ticketByPnr.data.pnr_no === pnr);

    // --- 1️⃣1️⃣ Fetch payment by ticket ---
    const paymentByTicket = await axios.get(`${BASE}/payments/${ticketId}`, authHeader);
    log("Get payment by ticket", paymentByTicket.data.ticket_id === ticketId);

    console.log("\n🎯 All API tests completed successfully!");
  } catch (err) {
    console.error("❌ Test failed:", err.response ? err.response.data : err.message);
  }
};

runTests();
