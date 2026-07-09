import Station from '../models/Station.js'; // .js మర్చిపోకండి

export const getAllStations = async (req, res) => {
    try {
        const stations = await Station.find({});
        res.status(200).json(stations);
    } catch (err) {
        res.status(500).json({ message: "Error", error: err.message });
    }
};