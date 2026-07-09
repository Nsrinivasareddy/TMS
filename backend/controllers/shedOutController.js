import mongoose from 'mongoose';

// ==========================================
// 1. GET AVAILABLE RESOURCES (లారీలు, డ్రైవర్ల లిస్ట్ కోసం)
// ==========================================
export const getAvailableResources = async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const mastersCollection = db.collection('masters');

        // మీ మాస్టర్స్ కలెక్షన్ నుండి లారీలు, డ్రైవర్ల అకౌంట్ కోడ్స్ తెచ్చుకుంటుంది
        const resources = await mastersCollection.find({ 
            ac_type: { $in: ["LORRY", "DRIVER", "CLEANER"] } 
        }).toArray();

        return res.status(200).json({
            success: true,
            data: resources
        });
    } catch (error) {
        console.error("❌ Error in getAvailableResources:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// 2. UNIVERSAL LORRY MOVEMENT DISPATCH CONTROLLER
// ==========================================
export const saveShedOutDispatch = async (req, res) => {
    try {
        console.log("📥 Receiving Universal Lorry Movement Data...");
        const db = mongoose.connection.db;
        const tripsCollection = db.collection('trips');
        const mastersCollection = db.collection('masters');

        // req.body నుండి డేటా తీసుకుంటున్నాం
        const {
            invoiceNo, 
            lorryAcCode, 
            lorryNo,
            driverAcCode, 
            driverName, 
            cleanerAcCode, 
            cleanerName,
            openingMeterReading, 
            operatorId,
            stationCode,
            incomingDate, 
            incomingTime, 
            incomingMeterReading,
            outgoingDate, 
            outgoingTime,
            
            // రూట్ వివరాలు
            routeFrom,
            routeTo,
            viaStations,

            // లోడింగ్, అన్‌లోడింగ్ & హమాలీ వివరాలు
            loadingWeight, 
            unloadingWeight, 
            hamaliLoadCharges, 
            hamaliUnloadCharges, 
            materialType, 
            currentSection 
        } = req.body;

        // డేటాబేస్ లో రికార్డ్ స్ట్రక్చర్
        const movementRecord = {
            invoiceNo: String(invoiceNo).replace(/\D/g, ""), 
            lorryAcCode: parseInt(lorryAcCode),
            lorryNo: lorryNo,
            driverAcCode: parseInt(driverAcCode),
            driverName: driverName,
            cleanerAcCode: cleanerAcCode || "N/A",
            cleanerName: cleanerName || "No Cleaner",
            operatorId: operatorId,
            createdAt: new Date(),
            section: currentSection || "SHED", 
            stationCode: stationCode || "HOVZA", 

            routeDetails: {
                from: routeFrom || "HOVZA",
                to: routeTo || "N/A",
                via: viaStations || ""
            },

            incomingDetails: {
                date: incomingDate || "N/A",
                time: incomingTime || "00:00",
                meterReading: incomingMeterReading ? parseInt(incomingMeterReading) : null
            },

            outgoingDetails: {
                date: outgoingDate || new Date().toISOString().split('T')[0],
                time: outgoingTime || "00:00",
                meterReading: parseInt(openingMeterReading) 
            },

            loadingDetails: {
                material: materialType || "GENERAL GOODS",
                loadWeight: parseFloat(loadingWeight) || 0,
                unloadWeight: parseFloat(unloadingWeight) || 0,
                hamaliLoad: parseFloat(hamaliLoadCharges) || 0,
                hamaliUnload: parseFloat(hamaliUnloadCharges) || 0
            },

            status: "ROUTE-ACTIVE", 
            type: `${currentSection || 'SHED'}-OUT`
        };

        const result = await tripsCollection.insertOne(movementRecord);
        console.log(`✅ Universal Record Saved Successfully! ID: ${result.insertedId}`);

        // Lorry Master అప్‌డేట్
        await mastersCollection.updateOne(
            { ac_code: parseInt(lorryAcCode) },
            { 
                $set: { 
                    current_driver: driverName, 
                    last_km: parseInt(openingMeterReading),
                    last_station: stationCode || "HOVZA",
                    last_section: currentSection || "SHED",
                    current_route: `${routeFrom || 'HOVZA'} TO ${routeTo || 'N/A'}`
                } 
            }
        );

        return res.status(201).json({
            success: true,
            message: `✓ ${currentSection || 'SHED'} అవుట్ మరియు లోడింగ్ వివరాలు విజయవంతంగా సేవ్ అయ్యాయి!`
        });

    } catch (error) {
        console.error("❌ Error in saveShedOutDispatch:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
