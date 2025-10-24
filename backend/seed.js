import { sequelize, Airline, Flight, Class, User, Ticket, Payment } from "./models/index.js";

const seed = async () => {
  try {
    // Sync all models, force: true ensures tables are dropped and recreated
    await sequelize.sync({ force: true });
    console.log("🌟 Database synced...");

    // ===============================
    // 1️⃣ Seed Airlines
    // ===============================
    const [airline, airlineCreated] = await Airline.findOrCreate({
      where: { name: "Air India" },
      defaults: { code: "AI", country: "India" },
    });
    if (airlineCreated) console.log(`✈️ Airline ${airline.name} created`);

    // ===============================
    // 2️⃣ Seed Flights
    // ===============================
    const flightsData = [
      { flightNumber: "AI101", origin: "Delhi", destination: "Mumbai", departureTime: new Date("2025-10-23T10:00:00"), arrivalTime: new Date("2025-10-23T12:00:00"), seatsAvailable: 100, price: 5000, airline_id: airline.id },
      { flightNumber: "AI102", origin: "Mumbai", destination: "Delhi", departureTime: new Date("2025-10-24T14:00:00"), arrivalTime: new Date("2025-10-24T16:00:00"), seatsAvailable: 100, price: 5200, airline_id: airline.id },
      { flightNumber: "AI201", origin: "Delhi", destination: "Bangalore", departureTime: new Date("2025-10-23T09:00:00"), arrivalTime: new Date("2025-10-23T11:30:00"), seatsAvailable: 120, price: 6000, airline_id: airline.id },
      { flightNumber: "AI202", origin: "Bangalore", destination: "Delhi", departureTime: new Date("2025-10-24T15:00:00"), arrivalTime: new Date("2025-10-24T17:30:00"), seatsAvailable: 120, price: 6100, airline_id: airline.id },
      { flightNumber: "AI301", origin: "Delhi", destination: "Chennai", departureTime: new Date("2025-10-25T08:00:00"), arrivalTime: new Date("2025-10-25T10:30:00"), seatsAvailable: 90, price: 5500, airline_id: airline.id },
      { flightNumber: "AI302", origin: "Chennai", destination: "Delhi", departureTime: new Date("2025-10-26T12:00:00"), arrivalTime: new Date("2025-10-26T14:30:00"), seatsAvailable: 90, price: 5600, airline_id: airline.id },
      { flightNumber: "AI401", origin: "Mumbai", destination: "Bangalore", departureTime: new Date("2025-10-23T07:00:00"), arrivalTime: new Date("2025-10-23T09:00:00"), seatsAvailable: 80, price: 4800, airline_id: airline.id },
      { flightNumber: "AI402", origin: "Bangalore", destination: "Mumbai", departureTime: new Date("2025-10-24T18:00:00"), arrivalTime: new Date("2025-10-24T20:00:00"), seatsAvailable: 80, price: 4900, airline_id: airline.id },
      { flightNumber: "AI501", origin: "Delhi", destination: "Kolkata", departureTime: new Date("2025-10-25T11:00:00"), arrivalTime: new Date("2025-10-25T13:30:00"), seatsAvailable: 110, price: 5700, airline_id: airline.id },
      { flightNumber: "AI502", origin: "Kolkata", destination: "Delhi", departureTime: new Date("2025-10-26T16:00:00"), arrivalTime: new Date("2025-10-26T18:30:00"), seatsAvailable: 110, price: 5800, airline_id: airline.id },
    ];

    const flights = [];
    for (const f of flightsData) {
      const [flight, created] = await Flight.findOrCreate({
        where: { flightNumber: f.flightNumber },
        defaults: f,
      });
      if (created) console.log(`✈️ Flight ${f.flightNumber} created`);
      flights.push(flight);
    }

    // ===============================
    // 3️⃣ Seed Classes (Economy + Business)
    // ===============================
    for (const flight of flights) {
      await Class.findOrCreate({
        where: { flight_id: flight.id, classType: "Economy" },
        defaults: { classType: "Economy", fare: flight.price, flight_id: flight.id },
      });
      await Class.findOrCreate({
        where: { flight_id: flight.id, classType: "Business" },
        defaults: { classType: "Business", fare: flight.price * 1.5, flight_id: flight.id },
      });
    }
    console.log("💺 Classes created for all flights");

    // ===============================
    // 4️⃣ Seed Users
    // ===============================
    const [user, userCreated] = await User.findOrCreate({
      where: { username: "john_doe" },
      defaults: { name: "John Doe", email: "john@example.com", password: "123456", role: "user" },
    });
    if (userCreated) console.log(`👤 User ${user.username} created`);

    // ===============================
    // 5️⃣ Seed Tickets
    // ===============================
    const ticketData = {
      pnr_no: "PNR001",
      passenger_name: "John Doe",
      seat_no: "A1",
      booking_date: new Date(),
      travel_date: new Date("2025-10-23T10:00:00"),
      status: "Booked",
      user_id: user.id,
      flight_id: flights[0].id,
      class_id: 1, // Assuming Economy class id = 1
    };
    const [ticket, ticketCreated] = await Ticket.findOrCreate({
      where: { pnr_no: ticketData.pnr_no },
      defaults: ticketData,
    });
    if (ticketCreated) console.log(`🎫 Ticket ${ticket.pnr_no} created`);

    // ===============================
    // 6️⃣ Seed Payments
    // ===============================
    await Payment.findOrCreate({
      where: { transaction_id: "TXN001" },
      defaults: {
        ticket_id: ticket.ticket_id,
        transaction_id: "TXN001",
        payment_mode: "Credit Card",
        amount: 5000,
        status: "Success",
        payment_date: new Date(),
      },
    });
    console.log("💰 Payment created");

    console.log("✅ Seeding completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seed();
