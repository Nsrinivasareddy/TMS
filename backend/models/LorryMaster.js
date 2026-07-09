const mongoose = require('mongoose');

const lorryMasterSchema = new mongoose.Schema({
    lorry_no: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true,
        uppercase: true 
    },
    lorry_category: { 
        type: String, 
        enum: ['CO', 'OWN_MGMT', 'ATTACHED'], 
        required: true 
    }, 
    current_status: { 
        type: String, 
        enum: ['IN_SHED', 'ON_TRIP', 'UNDER_REPAIR'], 
        default: 'IN_SHED' 
    },
    // 5 సెక్షన్ల ఆటోమేటిక్ కంట్రోల్ ఫ్లాగ్స్
    has_hire_prep: { type: Boolean, default: false },        // TMENT/LCO లో ఉపయోగపడుతుంది
    has_driver_expenses: { type: Boolean, default: true },   // MAINACS లో ఉపయోగపడుతుంది
    repair_ledger_type: { 
        type: String, 
        enum: ['VEHICLE_REPAIR', 'SHED_REPAIR', 'NONE'], 
        default: 'VEHICLE_REPAIR' 
    },
    permits_fitness_expiry: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('LorryMaster', lorryMasterSchema);