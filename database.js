const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();
// Force Node.js to use Google's DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("=================================");
        console.log("✅ MongoDB Connected Successfully");
        console.log("=================================");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed");
        console.error(error);
        process.exit(1);
    }
}
module.exports = connectDB;