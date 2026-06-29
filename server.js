require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// 1. DATABASE CONNECTION (MongoDB)
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital')
    .then(() => console.log('🛡️ MongoDB Database connected successfully.'))
    .catch(err => console.error('Database connection error:', err));

// 2. DATABASE SCHEMAS (User & Appointment)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'doctor', 'patient'], required: true }
});

const appointmentSchema = new mongoose.Schema({
    patientName: String,
    doctorName: String,
    date: String,
    status: { type: String, default: 'Scheduled' }
});

const User = mongoose.model('User', userSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

// 3. SECURITY MIDDLEWARE (JWT Verification & RBAC)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: "Access Denied: Missing Token" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid or Expired Token" });
        req.user = user; // Stores decrypted token payload containing id and role
        next();
    });
};

// Role authorization gate check
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden: Unauthorized account tier access" });
        }
        next();
    };
};

// 4. AUTHENTICATION ENDPOINTS (Signup / Login)
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await User.create({ name, email, password: hashedPassword, role });
        res.status(201).json({ message: "Registration successful!", userId: newUser._id });
    } catch (err) {
        res.status(400).json({ error: "Email already registered." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials matches" });
    }

    // Generate JWT Token embedded with user identifier and role authority
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: user.role, name: user.name });
});

// 5. SECURE REST API ENDPOINTS (Protected via RBAC Gates)
app.get('/api/appointments', authenticateToken, authorizeRoles('admin', 'doctor'), async (req, res) => {
    const appointments = await Appointment.find();
    res.json(appointments);
});

app.post('/api/appointments', authenticateToken, authorizeRoles('patient', 'admin'), async (req, res) => {
    const { patientName, doctorName, date } = req.body;
    const newAppointment = await Appointment.create({ patientName, doctorName, date });
    res.status(201).json(newAppointment);
});

app.listen(process.env.PORT, () => console.log(`🚀 MERN Backend Engine running on port ${process.env.PORT}`));