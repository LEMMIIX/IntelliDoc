// authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser } = require('../models/userRegistrationToDB');
const { authenticateUser } = require('../models/userAuthenticationToDB');
const User = require('../../database/User');
const UserRole = require('../../database/UserRole');
const UserRoleMapping = require('../../database/UserRoleMapping');

// Registration Route
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userId = await registerUser(username, email, password);
    res.status(201).json({
      message: "User registered successfully. Please log in.",
      userId,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    if (error.message === "Username or email already exists") {
      res.status(400).json({ message: error.message });
    } else if (error.message === "Failed to insert user: No ID returned") {
      res.status(500).json({
        message: "User was created but an error occurred. Please contact support.",
      });
    } else {
      res.status(500).json({
        message: "An unexpected error occurred. Please try again later.",
      });
    }
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await authenticateUser(username, password);
    if (user) {
      req.session.userId = user.id;

      const isAdmin = await UserRoleMapping.findOne({
        where: { user_id: user.id },
        include: [
          {
            model: UserRole,
            where: { role_name: "admin" },
          },
        ],
      });
      
      req.session.isAdmin = isAdmin?.UserRole?.role_name === 'admin';

      res.status(200).json({
        message: "Login successful",
        userId: user.id,
        isAdmin: !!isAdmin,
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});

// Logout Route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).json({ message: "Error logging out" });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });
});

module.exports = router;