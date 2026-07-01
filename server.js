require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const dns = require("dns");
const connectDB = require("./database");
const User = require("./models/User");
const axios = require("axios");
// Force Google DNS for MongoDB Atlas SRV lookup
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const app = express();
// ==========================
// Database
// ==========================
connectDB();
// ==========================
// Middleware
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60
    }
}));
// ==========================
// Static Files
// ==========================
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));
app.get("/admin/login.html", (req, res) => {
    res.redirect("/admin");
});
app.get("/admin/dashboard.html", (req, res) => {
    res.redirect("/dashboard");
});
// ==========================
// Authentication Middleware
// ==========================
function isAuthenticated(req, res, next) {
    if (req.session.loggedIn) {
        return next();
    }
    return res.status(401).json({
        success: false,
        message: "Unauthorized"
    });
}
// ==========================
// Admin Login
// ==========================
app.post("/admin/login", (req, res) => {
    const {
        username,
        password
    } = req.body;
    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {
        req.session.loggedIn = true;
        return res.json({
            success: true
        });
    }
    return res.status(401).json({
        success: false,
        message: "Invalid Credentials"
    });
});
// ==========================
// Admin Logout
// ==========================
app.post("/admin/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({
            success: true
        });
    });
});
// ==========================
// Save User
// ==========================
app.post("/save-user", async (req, res) => {
    try {
        const {
            name,
            latitude,
            longitude,
            city,
            country
        } = req.body;
        if (
            !name ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing Required Fields"
            });
        }
        const user = new User({
            name,
            latitude,
            longitude,
            city,
            country
        });
        await user.save();
        res.json({
            success: true,
            message: "User Saved"
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});
app.get("/weather", async (req, res) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                message: "Latitude and Longitude are required"
            });
        }
        const response = await axios.get(
            `https://wttr.in/${lat},${lon}?format=j1&lang=en`
        );
        res.json(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            success: false,
            message: "Unable to fetch weather"
        });
    }
});
// ==========================
// Get All Users (Protected)
// ==========================
app.get("/users", isAuthenticated, async (req, res) => {
    try {
        const users = await User.find()
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});
// ==========================
// Delete User (Protected)
// ==========================
app.delete("/users/:id", isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});
// ==========================
// Website Routes
// ==========================
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});
app.get("/admin", (req, res) => {
    res.sendFile(
        path.join(__dirname, "admin", "login.html")
    );
});
app.get("/dashboard", (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect("/admin");
    }
    res.sendFile(
        path.join(__dirname, "admin", "dashboard.html")
    );
});
// ==========================
// 404 Handler
// ==========================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found"
    });
});
// ==========================
// Global Error Handler
// ==========================
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});
// ==========================
// Start Server
// ==========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("======================================");
    console.log("🚀 WeatherSphere Server Started");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("======================================");
});