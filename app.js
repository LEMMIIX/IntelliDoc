const cors = require("cors");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const sequelize = require("./sequelize.config.js");

// Import routes
const authRoutes = require('./backend/routes/authRoutes');
const docUploadRoutes = require("./backend/routes/docUploadRoutes");
const foldersRoutes = require("./backend/routes/foldersRoutes");
const semanticSearchRoutes = require('./backend/routes/semanticSearchRoutes');
const adminRoutes = require('./backend/routes/adminRoutes');
const passwordResetRoutes = require('./backend/models/passwordReset');
const {registerUser, verifyUserCode} = require ('./backend/models/userRegistrationToDB.js');
const monitorRoutes = require('./backend/routes/monitorRoutes.js');

// Import models
const User = require("./database/User");
const Folder = require("./database/Folder");
const File = require("./database/File");
const UserRole = require("./database/UserRole");
const UserRoleMapping = require("./database/UserRoleMapping");

const PORT = process.env.PORT || 3000;

// Middleware Configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["POST", "PUT", "GET", "DELETE", "OPTIONS", "HEAD"],
    credentials: true,
  })
);

// Basic security headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' localhost:* ws://localhost:*"
  );
  next();
});

app.use(express.json());

// Session Configuration
app.use(
  session({
    name: "userId",
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: false,
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Database Setup
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection successful.");

    // Define Model Relationships
    User.hasMany(Folder, { foreignKey: "user_id", onDelete: "CASCADE" });
    Folder.belongsTo(User, { foreignKey: "user_id" });

    Folder.hasMany(Folder, { foreignKey: "parent_folder_id", as: "subfolders", onDelete: "SET NULL" });
    Folder.belongsTo(Folder, { foreignKey: "parent_folder_id", as: "parentFolder" });

    User.hasMany(File, { foreignKey: "user_id", onDelete: "CASCADE" });
    File.belongsTo(User, { foreignKey: "user_id" });

    Folder.hasMany(File, { foreignKey: "folder_id", onDelete: "SET NULL" });
    File.belongsTo(Folder, { foreignKey: "folder_id" });

    UserRoleMapping.belongsTo(User, { foreignKey: "user_id" });
    UserRoleMapping.belongsTo(UserRole, { foreignKey: "role_id" });
    
    User.belongsToMany(UserRole, { through: UserRoleMapping, foreignKey: "user_id" });
    UserRole.belongsToMany(User, { through: UserRoleMapping, foreignKey: "role_id" });

    await sequelize.sync();
    console.log("Database synchronization successful.");
  } catch (error) {
    console.error("Database error:", error);
  }
})();

// Authentication Middleware
const authenticateMiddleware = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized: Please log in" });
  }
};

app.use('/api/admin', adminRoutes);

app.get("/api/admin/status", (req, res) => {
  if (req.session.isAdmin) {
    res.json({ isAdmin: true });
  } else {
    res.json({ isAdmin: false });
  }
});

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "html", "login.html"));
});

app.get("/api/current-user", authenticateMiddleware, (req, res) => {
  res.json({
    userId: req.session.userId,
    isAdmin: req.session.isAdmin || false,
  });
});

app.use('/login', (req, res, next) => {
  if (req.method === 'POST') {
    req.url = '/auth/login';
    return app._router.handle(req, res, next);
  }
  next();
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

/// verify code
app.post('/api/verify-code', async (req, res) => {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
        return res.status(400).json({ message: 'Email und verification key sind notwendig' });
    }

    try {
        const result = await verifyUserCode(email, verificationCode);

        if (result.success) {
            res.status(200).json({ message: result.message });
        } else {
            res.status(400).json({ message: result.message });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred during verification' });
    }
});

// Route Middleware
app.use('/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use("/docupload", authenticateMiddleware, docUploadRoutes);
app.use("/folders", authenticateMiddleware, foldersRoutes);
app.use("/search", authenticateMiddleware, semanticSearchRoutes);
app.use("/passwordReset", passwordResetRoutes);
app.use('/monitor', monitorRoutes);

app.use(express.static(path.join(__dirname, "frontend", "dist")));

app.get("*", (req, res) => {
  console.log(`Catch-All Route hit: ${req.url}`);
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
