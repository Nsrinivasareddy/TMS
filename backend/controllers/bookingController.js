import Booking from '../models/BillModel.js'; // మీ మోడల్ ని ఇంపోర్ట్ చేయండి

// బుకింగ్ సేవ్ చేసే ఫంక్షన్
export const saveBooking = async (req, res) => {
    try {
        const newBooking = new Booking(req.body);
        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking); // డేటాబేస్ లో సేవ్ అయ్యాక సక్సెస్ రెస్పాన్స్
    } catch (error) {
        res.status(500).json({ message: "సేవ్ చేయడంలో లోపం: " + error.message });
    }
};

// బిల్లులు తెచ్చుకునే ఫంక్షన్
export const getPendingBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ isPrinted: false });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};