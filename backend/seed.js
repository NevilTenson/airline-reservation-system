import {
  sequelize,
  Airline,
  Airport,
  Flight,
  Class,
  User,
  Booking,
  Passenger,
  Ticket,
  Payment,
} from "./models/index.js";
import bcrypt from "bcryptjs";

// Helper function to hash passwords
const hash = (pw) => bcrypt.hashSync(pw, 10);

const seed = async () => {
  try {
    // Sync all models, force: true ensures tables are dropped and recreated
    await sequelize.sync({ force: true });
    console.log("🌟 Database synced...");

    // ===============================
    // 1️⃣ Seed Users
    // ===============================
    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: "admin@airline.com" },
      defaults: {
        name: "Admin",
        username: "admin",
        email: "admin@airline.com",
        password: hash("admin123"),
        role: "admin",
      },
    });
    if (adminCreated) console.log(`👤 Admin user created`);

    const [userNihal, nihalCreated] = await User.findOrCreate({
      where: { email: "nihal@example.com" },
      defaults: {
        name: "Nihal",
        username: "nihal",
        email: "nihal@example.com",
        password: hash("nihal123"),
        role: "user",
      },
    });
    if (nihalCreated) console.log(`👤 User 'Nihal' created`);

    // ===============================
    // 2️⃣ Seed Airlines
    // ===============================
    const [ai, aiCreated] = await Airline.findOrCreate({
      where: { code: "AI" },
      defaults: { name: "Air India", country: "India" },
    });
    const [i6, i6Created] = await Airline.findOrCreate({
      where: { code: "I6" },
      defaults: { name: "IndiGo", country: "India" },
    });
    if (aiCreated || i6Created) console.log("✈️ Airlines created");

    // ===============================
    // 3️⃣ Seed Airports
    // ===============================
    const [del, delCreated] = await Airport.findOrCreate({
      where: { airport_code: "DEL" },
      defaults: {
        name: "Indira Gandhi International Airport",
        city: "Delhi",
        country: "India",
      },
    });
    const [bom, bomCreated] = await Airport.findOrCreate({
      where: { airport_code: "BOM" },
      defaults: {
        name: "Chhatrapati Shivaji Maharaj International Airport",
        city: "Mumbai",
        country: "India",
      },
    });
    const [blr, blrCreated] = await Airport.findOrCreate({
      where: { airport_code: "BLR" },
      defaults: {
        name: "Kempegowda International Airport",
        city: "Bangalore",
        country: "India",
      },
    });
    if (delCreated || bomCreated || blrCreated) console.log("🛫 Airports created");

    // ===============================
    // 4️⃣ Seed Flights
    // ===============================
    const [flight1, f1Created] = await Flight.findOrCreate({
      where: { flightNumber: "AI101" },
      defaults: {
        flightNumber: "AI101",
        origin_code: "DEL",
        destination_code: "BOM",
        departureTime: new Date("2025-11-20T10:00:00"),
        arrivalTime: new Date("2025-11-20T12:00:00"),
        price: 5000,
        airline_id: ai.id,
      },
    });
    const [flight2, f2Created] = await Flight.findOrCreate({
      where: { flightNumber: "I6202" },
      defaults: {
        flightNumber: "I6202",
        origin_code: "BLR",
        destination_code: "DEL",
        departureTime: new Date("2025-11-22T14:00:00"),
        arrivalTime: new Date("2025-11-22T16:30:00"),
        price: 5500,
        airline_id: i6.id,
      },
    });
    if (f1Created || f2Created) console.log("✈️ Flights created");

    // ===============================
    // 5️⃣ Seed Classes (Economy + Business)
    // ===============================
    const [class1Eco, c1eCreated] = await Class.findOrCreate({
      where: { flight_id: flight1.id, classType: "Economy" },
      defaults: {
        classType: "Economy",
        fare: flight1.price,
        total_seats: 50,
        flight_id: flight1.id,
      },
    });
    const [class1Bus, c1bCreated] = await Class.findOrCreate({
      where: { flight_id: flight1.id, classType: "Business" },
      defaults: {
        classType: "Business",
        fare: flight1.price * 2,
        total_seats: 10,
        flight_id: flight1.id,
      },
    });
    const [class2Eco, c2eCreated] = await Class.findOrCreate({
      where: { flight_id: flight2.id, classType: "Economy" },
      defaults: {
        classType: "Economy",
        fare: flight2.price,
        total_seats: 60,
        flight_id: flight2.id,
      },
    });
    console.log("💺 Classes created for all flights");

    // ===============================
    // 6️⃣ Seed Bookings (for Report Testing)
    // ===============================

    // --- BOOKING 1 (User: Nihal, 1 Passenger) ---
    console.log("...Seeding Booking 1 for Nihal");
    const booking1 = await Booking.create({
      user_id: userNihal.id,
      pnr_no: "PNR10001",
      total_amount: class1Eco.fare,
      status: "Confirmed",
    });
    const p1 = await Passenger.create({
      booking_id: booking1.booking_id,
      name: "Nihal",
      age: 25,
      gender: "Male",
    });
    await Payment.create({
      booking_id: booking1.booking_id,
      transaction_id: "TXN10001",
      payment_mode: "Credit Card",
      amount: class1Eco.fare,
      status: "Success",
    });
    await Ticket.create({
      passenger_id: p1.passenger_id,
      flight_id: flight1.id,
      class_id: class1Eco.id,
      seat_no: "10A",
      travel_date: flight1.departureTime,
      status: "Booked",
    });
    console.log("✅ Booking 1 (PNR10001) created for Nihal");

    // --- BOOKING 2 (User: Nihal, 2 Passengers) ---
    console.log("...Seeding Booking 2 for Nihal");
    const booking2 = await Booking.create({
      user_id: userNihal.id,
      pnr_no: "PNR10002",
      total_amount: class2Eco.fare * 2,
      status: "Confirmed",
    });
    // Passenger A
    const p2_A = await Passenger.create({
      booking_id: booking2.booking_id,
      name: "Nihal",
      age: 25,
      gender: "Male",
    });
    await Ticket.create({
      passenger_id: p2_A.passenger_id,
      flight_id: flight2.id,
      class_id: class2Eco.id,
      seat_no: "12B",
      travel_date: flight2.departureTime,
      status: "Booked",
    });
    // Passenger B
    const p2_B = await Passenger.create({
      booking_id: booking2.booking_id,
      name: "Jane Doe",
      age: 28,
      gender: "Female",
    });
    await Ticket.create({
      passenger_id: p2_B.passenger_id,
      flight_id: flight2.id,
      class_id: class2Eco.id,
      seat_no: "12C",
      travel_date: flight2.departureTime,
      status: "Booked",
    });
    // Payment for Booking 2
    await Payment.create({
      booking_id: booking2.booking_id,
      transaction_id: "TXN10002",
      payment_mode: "UPI",
      amount: class2Eco.fare * 2,
      status: "Success",
    });
    console.log("✅ Booking 2 (PNR10002) created for Nihal");

    // --- BOOKING 3 (User: Admin, 1 Passenger) ---
    console.log("...Seeding Booking 3 for Admin");
    const booking3 = await Booking.create({
      user_id: admin.id,
      pnr_no: "PNR20001",
      total_amount: class1Bus.fare,
      status: "Confirmed",
    });
    const p3 = await Passenger.create({
      booking_id: booking3.booking_id,
      name: "Admin User",
      age: 40,
      gender: "Male",
    });
    await Payment.create({
      booking_id: booking3.booking_id,
      transaction_id: "TXN20001",
      payment_mode: "Debit Card",
      amount: class1Bus.fare,
      status: "Success",
    });
    await Ticket.create({
      passenger_id: p3.passenger_id,
      flight_id: flight1.id,
      class_id: class1Bus.id,
      seat_no: "1A",
      travel_date: flight1.departureTime,
      status: "Booked",
    });
    console.log("✅ Booking 3 (PNR20001) created for Admin");

    // ===============================
    // 🎉 DONE
    // ===============================
    console.log("✅ Seeding completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seed();