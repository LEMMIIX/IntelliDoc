const cors = require("cors");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const { registerUser } = require("./backend/models/userRegistrationToDB");
const { authenticateUser } = require("./backend/models/userAuthenticationToDB");
const docUploadRoutes = require("./backend/routes/docUploadRoutes");
const foldersRoutes = require("./backend/routes/foldersRoutes");

const PORT = process.env.PORT || 3000;

// Middleware

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["POST", "PUT", "GET", "DELETE", "OPTIONS", "HEAD"],
    credentials: true,
  })
);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/backend", express.static(path.join(__dirname, "backend")));


app.use(
  session({
    name: "userId",
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      // secure: process.env.NODE_ENV === 'production', // Secure only in production

      sameSite: false,
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours expiration
    },
  })
);

// Authentication middleware
const authenticateMiddleware = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized: Please log in" });
  }
};

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "html", "login.html"));
});

app.get("/api/current-user", authenticateMiddleware, (req, res) => {
  res.json({ userId: req.session.userId });
});

// Registration Route
app.post("/register", async (req, res) => {
  console.log("Received registration request:", req.body);
  const { username, email, password } = req.body;

  try {
    const userId = await registerUser(username, email, password);
    console.log("User registered successfully:", userId);
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
        message:
          "User was created but an error occurred. Please contact support.",
      });
    } else {
      res.status(500).json({
        message: "An unexpected error occurred. Please try again later.",
      });
    }
  }
});

// Login Route
app.post("/login", async (req, res) => {
  console.log("Received login request:", {
    ...req.body,
    password: "[REDACTED]",
  });
  const { username, password } = req.body;

  try {
    const user = await authenticateUser(username, password);
    if (user) {
      /////// user_id wird in der session gespeichert/genutzt, nach erfolgreicher Authentifizierung
      req.session.userId = user.id;
      ///////
      console.log("User logged in successfully with user_id:", user.id);
      res.status(200).json({ message: "Login successful", userId: user.id });
      res.send(req.session.sessionID);
    } else {
      console.log("Login failed: Invalid credentials");
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});
/*
app.get('/dashboard', authenticateMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'html', 'dashboard.html'));
});*/

app.use("/docupload", authenticateMiddleware, docUploadRoutes);
app.use("/folders", authenticateMiddleware, foldersRoutes);

// Logout route

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).json({ message: "Error logging out" });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});