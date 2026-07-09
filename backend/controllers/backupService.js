import mongoose from 'mongoose';
import archiver from 'archiver';
import fs from 'fs';

const sourceURI = "mongodb+srv://nsreddy:Nsreddy98765@cluster0.wjtou.mongodb.net/TMD_database";

// ఇక్కడ డేటాబేస్ పేరును 'TMS_Database' గా మార్చాను
const targetURI = "mongodb://127.0.0.1:27017/TMS_Database"; 

async function runProcess() {
    let sourceConn, targetConn;
    try {
        console.log("🚀 కనెక్షన్స్ ఏర్పాటు చేస్తున్నాము...");
        
        // మూలం (Source) కనెక్షన్ - Atlas
        sourceConn = await mongoose.createConnection(sourceURI).asPromise();
        // గమ్యం (Target) కనెక్షన్ - Local Compass
        targetConn = await mongoose.createConnection(targetURI).asPromise();

        const collections = await sourceConn.db.listCollections().toArray();

        console.log("🚀 డేటా ట్రాన్స్‌ఫర్ మొదలైంది...");

        // జిప్ ఫైల్ క్రియేషన్
        const output = fs.createWriteStream('full_backup.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(output);

        for (let col of collections) {
            const colName = col.name;
            const data = await sourceConn.db.collection(colName).find({}).toArray();

            // 1. లోకల్ కంపాస్‌లోని TMS_Database లోకి కాపీ చేయడం
            if (data.length > 0) {
                // పాత డేటాను తీసేసి కొత్తది వేయడం (దీనివల్ల కంపాస్‌లో లేటెస్ట్ డేటా కనిపిస్తుంది)
                await targetConn.db.collection(colName).deleteMany({});
                await targetConn.db.collection(colName).insertMany(data);
                console.log(`✅ ${colName}: లోకల్ 'TMS_Database' లోకి కాపీ అయ్యింది.`);
            }

            // 2. జిప్ ఫైల్ కోసం డేటాను సిద్ధం చేయడం
            archive.append(JSON.stringify(data, null, 2), { name: `${colName}.json` });
        }

        await archive.finalize();
        console.log("🎉 సక్సెస్! లోకల్ కంపాస్ అప్‌డేట్ అయ్యింది మరియు 'full_backup.zip' రెడీగా ఉంది.");

    } catch (err) {
        console.error("❌ ఎర్రర్:", err);
    } finally {
        if (sourceConn) await sourceConn.close();
        if (targetConn) await targetConn.close();
    }
}

runProcess();