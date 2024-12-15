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
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend", "dist")));

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

// Route Middleware
app.use('/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use("/docupload", authenticateMiddleware, docUploadRoutes);
app.use("/folders", authenticateMiddleware, foldersRoutes);
app.use("/search", authenticateMiddleware, semanticSearchRoutes);
app.use("/passwordReset", passwordResetRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});