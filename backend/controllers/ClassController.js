import ClassModel from "../models/Class.js";

// Admin adds a class
export const addClass = async (req, res) => {
  try {
    const { classType, fare, flightId } = req.body;
    const newClass = new ClassModel({ classType, fare, flightId });
    await newClass.save();
    res.status(201).json({ message: "Class added successfully", newClass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Everyone can view classes
export const getClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find().populate("flightId", "flightNumber flightName");
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
