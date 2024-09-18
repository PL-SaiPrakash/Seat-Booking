const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config(); // Load environment variables from .env file

const app = express();
app.use(express.json());
app.use(cors());


// Connect to MongoDB Atlas using the connection string from the .env file
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define seat schema
const seatSchema = new mongoose.Schema({
  row: Number,
  col: Number,
  booked: Boolean,
});

const Seat = mongoose.model("Seat", seatSchema);

// Initialize the seat layout in MongoDB (only run this once)
const initializeSeats = async () => {
  const seats = [];
  for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 7; col++) {
      seats.push({ row, col, booked: false });
    }
  }
  for (let col = 0; col < 3; col++) {
    seats.push({ row: 11, col, booked: false });
  }
  await Seat.insertMany(seats);
};

// Uncomment this line and run the server once to initialize seats.
//initializeSeats();

// Get all seats
app.get("/api/seats", async (req, res) => {
  try {
    const seats = await Seat.find();
    res.json(seats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching seats" });
  }
});

// Book seats
app.post("/api/book", async (req, res) => {
  const { seatCount } = req.body;

  // Try to find enough available seats
  const availableSeats = await Seat.find({ booked: false }).limit(seatCount);
  if (availableSeats.length < seatCount) {
    return res.status(400).json({ error: "Not enough available seats" });
  }


  // Book the seats
  const bookedSeats = await Seat.updateMany(
    { _id: { $in: availableSeats.map((seat) => seat._id) } },
    { $set: { booked: true } }
  );

  // Return the updated seat layout
  const updatedSeats = await Seat.find();
  res.json(updatedSeats);
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
