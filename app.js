// Local mock data arrays to keep track of system data dynamically
let appointments = [];
let doctors = [
    { id: 1, name: "Dr. A. Sharma", specialty: "Cardiology" },
    { id: 2, name: "Dr. P. Patel", specialty: "Pediatrics" }
];

// Handles switching tabs between panels
function showDashboard(role) {
    const mainContent = document.getElementById('main-content');
    
    if (role === 'admin') {
        renderAdminDashboard(mainContent);
    } else if (role === 'doctor') {
        renderDoctorDashboard(mainContent);
    } else if (role === 'patient') {
        renderPatientDashboard(mainContent);
    }
}

// 1. ADMIN MODULE UI
function renderAdminDashboard(container) {
    let rows = doctors.map(doc => `<tr><td>${doc.id}</td><td>${doc.name}</td><td>${doc.specialty}</td></tr>`).join('');
    container.innerHTML = `
        <div class="portal-box">
            <h2>Admin Portal - Manage Staff</h2>
            <form id="doctorForm" onsubmit="addDoctor(event)">
                <div class="form-group">
                    <label>Doctor Name</label>
                    <input type="text" id="docName" required placeholder="e.g. Dr. Jane Doe">
                </div>
                <div class="form-group">
                    <label>Specialization</label>
                    <input type="text" id="docSpecialty" required placeholder="e.g. Neurology">
                </div>
                <button type="submit" class="btn">Register New Doctor</button>
            </form>
            <h3 style="margin-top: 30px; color:#005f73;">Active Doctors Directory</h3>
            <table>
                <thead><tr><th>ID</th><th>Name</th><th>Specialization</th></tr></thead>
                <tbody id="doctorTableBody">${rows}</tbody>
            </table>
        </div>
    `;
}

function addDoctor(event) {
    event.preventDefault();
    const name = document.getElementById('docName').value;
    const specialty = document.getElementById('docSpecialty').value;
    const newDoc = { id: doctors.length + 1, name, specialty };
    
    doctors.push(newDoc);
    renderAdminDashboard(document.getElementById('main-content'));
}

// 2. PATIENT MODULE UI
function renderPatientDashboard(container) {
    let docOptions = doctors.map(doc => `<option value="${doc.name}">${doc.name} (${doc.specialty})</option>`).join('');
    container.innerHTML = `
        <div class="portal-box">
            <h2>Patient Portal - Schedule Appointment</h2>
            <form id="appointmentForm" onsubmit="bookAppointment(event)">
                <div class="form-group">
                    <label>Patient Name</label>
                    <input type="text" id="patName" required placeholder="Your full name">
                </div>
                <div class="form-group">
                    <label>Select Doctor</label>
                    <select id="selectDoc">${docOptions}</select>
                </div>
                <div class="form-group">
                    <label>Preferred Date</label>
                    <input type="date" id="appDate" required>
                </div>
                <button type="submit" class="btn">Confirm Booking</button>
            </form>
        </div>
    `;
}

function bookAppointment(event) {
    event.preventDefault();
    const patientName = document.getElementById('patName').value;
    const doctorName = document.getElementById('selectDoc').value;
    const date = document.getElementById('appDate').value;
    
    appointments.push({ patientName, doctorName, date, status: 'Scheduled' });
    alert(`Appointment Confirmed for ${patientName} with ${doctorName} on ${date}!`);
    document.getElementById('appointmentForm').reset();
}

// 3. DOCTOR MODULE UI
function renderDoctorDashboard(container) {
    let rows = appointments.map(app => `
        <tr>
            <td>${app.patientName}</td>
            <td>${app.doctorName}</td>
            <td>${app.date}</td>
            <td style="color: green; font-weight: bold;">${app.status}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div class="portal-box">
            <h2>Doctor Portal - Appointments Queue</h2>
            <p>Live schedule for tracking upcoming patient checkups.</p>
            <table>
                <thead><tr><th>Patient Name</th><th>Assigned Doctor</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>${rows.length ? rows : '<tr><td colspan="4" style="text-align:center;">No upcoming appointments booked yet.</td></tr>'}</tbody>
            </table>
        </div>
    `;
}