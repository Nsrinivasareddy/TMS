const nodemailer = require('nodemailer');

// 1. ట్రాన్స్‌పోర్టర్ సెటప్ (Gmail ఉపయోగిస్తున్నట్లయితే)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // 465 కి true ఉండాలి
    auth: {
        user: 'nelaturisrinivasareddy@gmail.com', // మీ మెయిల్ ID
        pass: 'hvaq ikpw vhss gyep' // ఇక్కడ ఆ 16 అంకెల కోడ్ (స్పేస్ లేకుండా) ఇవ్వండి
    },
    tls: {
        rejectUnauthorized: false // సెల్ఫ్-సైన్డ్ సర్టిఫికెట్ ఎర్రర్ రాకుండా ఉండటానికి
    }
});

// 2. కనెక్షన్‌ని వెరిఫై చేయడం (ఇది సర్వర్ స్టార్ట్ అయినప్పుడు ఆటోమేటిక్‌గా రన్ అవుతుంది)
transporter.verify((error, success) => {
    if (error) {
        console.log("❌ Nodemailer Error: ", error.message);
    } else {
        console.log("✅ Mail Server is Ready to Send Passwords");
    }
});

module.exports = transporter;