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
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/backend", express.static(path.join(__dirname, "backend")));

// Session Configuration
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

    // Folder - Folder (Parent-Child)
    Folder.hasMany(Folder, { foreignKey: "parent_folder_id", as: "subfolders", onDelete: "SET NULL" });
    Folder.belongsTo(Folder, { foreignKey: "parent_folder_id", as: "parentFolder" });

    // User - File (One-to-Many)
    User.hasMany(File, { foreignKey: "user_id", onDelete: "CASCADE" });
    File.belongsTo(User, { foreignKey: "user_id" });

    // Folder - File (One-to-Many)
    Folder.hasMany(File, { foreignKey: "folder_id", onDelete: "SET NULL" });
    File.belongsTo(Folder, { foreignKey: "folder_id" });

    // User - UserRole (Many-to-Many through UserRoleMapping)
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

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* Beispiel für eine geschützte Route mittels session ID ---WICHTIG ZU MERKEN---
app.get('/protected', (req, res) => {
    if (req.session.userId) {
        res.json({ message: 'Access granted to protected resource', userId: req.session.userId });
    } else {
        res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
});*/

// this for working with react

// const cors = require('cors');
// const express = require('express');
// const app = express();
// const bodyParser = require('body-parser');
// const path = require('path');
// const session = require('express-session');
// const { registerUser } = require('./backend/models/userRegistrationToDB');
// const { authenticateUser } = require('./backend/models/userAuthenticationToDB');
// const docUploadRoutes = require('./backend/routes/docUploadRoutes');
// const foldersRoutes = require('./backend/routes/foldersRoutes');

// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Updated for React CORS compatibility
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

// // Session middleware configuration
// app.use(session({
//     secret: 'your_secret_key', // Change this to a secure random string
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//         secure: process.env.NODE_ENV === 'production',
//         maxAge: 24 * 60 * 60 * 1000 // valid for 24 hours
//     }
// }));

// // Authentication middleware
// const authenticateMiddleware = (req, res, next) => {
//     if (req.session.userId) {
//         next();
//     } else {
//         res.status(401).json({ message: 'Unauthorized: Please log in' });
//     }
// };

// // Registration Route
// app.post('/register', async (req, res) => {
//     console.log('Received registration request:', req.body);
//     const { username, email, password } = req.body;

//     try {
//         const userId = await registerUser(username, email, password);
//         console.log('User registered successfully:', userId);
//         res.status(201).json({ message: 'User registered successfully. Please log in.', userId });
//     } catch (error) {
//         console.error('Error registering user:', error);
//         if (error.message === 'Username or email already exists') {
//             res.status(400).json({ message: error.message });
//         } else {
//             res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
//         }
//     }
// });

// // Login Route
// app.post('/login', async (req, res) => {
//     console.log('Received login request:', { ...req.body, password: '[REDACTED]' });
//     const { username, password } = req.body;

//     try {
//         const user = await authenticateUser(username, password);
//         if (user) {
//             req.session.userId = user.id;
//             console.log('User logged in successfully with user_id:', user.id);
//             res.status(200).json({ message: 'Login successful', userId: user.id });
//         } else {
//             console.log('Login failed: Invalid credentials');
//             res.status(401).json({ message: 'Invalid username or password' });
//         }
//     } catch (error) {
//         console.error('Error during login:', error);
//         res.status(500).json({ message: 'An error occurred during login' });
//     }
// });

// // Logout Route
// app.post('/logout', (req, res) => {
//     req.session.destroy((err) => {
//         if (err) {
//             console.error('Error destroying session:', err);
//             res.status(500).json({ message: 'Error logging out' });
//         } else {
//             res.json({ message: 'Logged out successfully' });
//         }
//     });
// });

// // Protected Routes (Example: Document Upload and Folder Management)
// app.use('/docupload', authenticateMiddleware, docUploadRoutes);
// app.use('/folders', authenticateMiddleware, foldersRoutes);

// // Test Current User Session
// app.get('/api/current-user', authenticateMiddleware, (req, res) => {
//     res.json({ userId: req.session.userId });
// });

// // Start server
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });
