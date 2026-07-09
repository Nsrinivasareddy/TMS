TMS/
│
├── run_project.bat (Root batch file to run both)
│
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   └── Station.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── stationRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── stationController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   └── validations/
│       └── userValidation.js
│
└── frontend/
    ├── package.json
    ├── public/
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── SectionNavbar.jsx
    │   │   └── GlassButton.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Registration.jsx
    │   │   └── ResetPassword.jsx
    │   └── styles/
    │       ├── global.css
    │       └── glassmorphism.css