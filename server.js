const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

const db = new sqlite3.Database('./hospital.db', (err) => {
    if (err) console.error(err.message);
});

// Initialize Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS doctors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, specialty TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS appointments (id INTEGER PRIMARY KEY AUTOINCREMENT, patientName TEXT, doctorName TEXT, date TEXT, status TEXT DEFAULT 'Scheduled')`);
    db.run(`CREATE TABLE IF NOT EXISTS billing (id INTEGER PRIMARY KEY AUTOINCREMENT, patientName TEXT, amount REAL, status TEXT)`);
});

// --- API Endpoints ---
app.get('/api/doctors', (req, res) => {
    db.all("SELECT * FROM doctors", [], (err, rows) => res.json(rows));
});

app.post('/api/doctors', (req, res) => {
    const { name, specialty } = req.body;
    db.run("INSERT INTO doctors (name, specialty) VALUES (?, ?)", [name, specialty], function() {
        res.json({ id: this.lastID, name, specialty });
    });
});

app.get('/api/appointments', (req, res) => {
    db.all("SELECT * FROM appointments", [], (err, rows) => res.json(rows));
});

app.post('/api/appointments', (req, res) => {
    const { patientName, doctorName, date } = req.body;
    db.run("INSERT INTO appointments (patientName, doctorName, date, status) VALUES (?, ?, ?, 'Scheduled')", [patientName, doctorName, date], function() {
        res.json({ id: this.lastID, patientName, doctorName, date });
    });
});

// Update appointment status (Check In / Complete)
app.put('/api/appointments/:id', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE appointments SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updated: this.changes });
    });
});

// Create an invoice
app.post('/api/billing', (req, res) => {
    const { patientName, amount } = req.body;
    db.run("INSERT INTO billing (patientName, amount, status) VALUES (?, ?, 'Paid')", [patientName, amount], function() {
        res.json({ id: this.lastID, patientName, amount });
    });
});

app.get('/api/billing', (req, res) => {
    db.all("SELECT * FROM billing", [], (err, rows) => res.json(rows));
});

app.listen(PORT, () => console.log(`Server running smoothly at http://localhost:${PORT}`));