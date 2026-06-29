// Keep track of current user authorization state
let currentUserRole = null;

// Initial application entry view sequence
window.onload = function() {
    renderLoginScreen();
};

function renderLoginScreen() {
    currentUserRole = null;
    document.getElementById('header-nav').style.display = 'none'; // Hide portal dashboard tabs
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="portal-box" style="max-width: 450px; margin: 80px auto;">
            <h2 style="text-align: center;">🔐 System User Login</h2>
            <form onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label>Select Workspace Role</label>
                    <select id="loginRole">
                        <option value="admin">Hospital Administrator</option>
                        <option value="doctor">Medical Staff / Doctor</option>
                        <option value="patient">Patient Portal Access</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Security Password</label>
                    <input type="password" id="loginPassword" required placeholder="Enter any password to continue">
                </div>
                <button type="submit" class="btn" style="width: 100%;">Access Portal</button>
            </form>
        </div>
    `;
}

function handleLogin(event) {
    event.preventDefault();
    const role = document.getElementById('loginRole').value;
    
    currentUserRole = role;
    document.getElementById('header-nav').style.display = 'block'; // Show portal dashboard navigation tabs
    showDashboard(role);
}

function logOut() {
    renderLoginScreen();
}

async function showDashboard(role) {
    if (!currentUserRole) return renderLoginScreen();
    const mainContent = document.getElementById('main-content');
    
    if (role === 'admin') await renderAdminDashboard(mainContent);
    else if (role === 'doctor') await renderDoctorDashboard(mainContent);
    else if (role === 'patient') await renderPatientDashboard(mainContent);
}

// 1. ADMIN MODULE - Staff Records & Invoice Engine
async function renderAdminDashboard(container) {
    const docRes = await fetch('/api/doctors');
    const doctors = await docRes.json();
    const billRes = await fetch('/api/billing');
    const bills = await billRes.json();
    
    let docRows = doctors.map(doc => `<tr><td>${doc.id}</td><td>${doc.name}</td><td>${doc.specialty}</td></tr>`).join('');
    let billRows = bills.map(b => `<tr><td>#${b.id}</td><td>${b.patientName}</td><td>₹${b.amount}</td><td><span style="color:green;font-weight:bold;">${b.status}</span></td></tr>`).join('');

    container.innerHTML = `
        <div class="dashboard-grid">
            <div class="portal-box">
                <h2>Manage Staff Directory</h2>
                <form onsubmit="addDoctor(event)">
                    <div class="form-group"><label>Doctor Name</label><input type="text" id="docName" required></div>
                    <div class="form-group"><label>Specialization</label><input type="text" id="docSpecialty" required></div>
                    <button type="submit" class="btn">Register Doctor</button>
                </form>
                <table>
                    <thead><tr><th>ID</th><th>Name</th><th>Specialty</th></tr></thead>
                    <tbody>${docRows}</tbody>
                </table>
            </div>
            
            <div class="portal-box">
                <h2>Patient Billing & Invoices</h2>
                <form onsubmit="generateInvoice(event)">
                    <div class="form-group"><label>Patient Name</label><input type="text" id="billPatientName" required></div>
                    <div class="form-group"><label>Total Billable Amount (₹)</label><input type="number" id="billAmount" required></div>
                    <button type="submit" class="btn">Generate & Process Invoice</button>
                </form>
                <div id="invoicePrintArea"></div>
                <h3>Recent Transactions Log</h3>
                <table>
                    <thead><tr><th>Invoice</th><th>Patient</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>${billRows}</tbody>
                </table>
            </div>
        </div>
    `;
}

async function addDoctor(event) {
    event.preventDefault();
    await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: document.getElementById('docName').value, specialty: document.getElementById('docSpecialty').value })
    });
    showDashboard('admin');
}

async function generateInvoice(event) {
    event.preventDefault();
    const patientName = document.getElementById('billPatientName').value;
    const amount = document.getElementById('billAmount').value;

    await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName, amount })
    });

    // Render interactive invoice receipt slip component view
    document.getElementById('invoicePrintArea').innerHTML = `
        <div class="invoice-print-box">
            <h4>CarePulse Invoice Receipt</h4>
            <p><strong>Patient:</strong> ${patientName}</p>
            <p><strong>Amount Due:</strong> ₹${amount}</p>
            <p><strong>Status:</strong> Clear / Paid</p>
            <button class="btn-small btn-complete" onclick="window.print()" style="margin-top:10px;">Print Slip</button>
        </div>
    `;
    showDashboard('admin');
}

// 2. PATIENT MODULE - Booking interface panel
async function renderPatientDashboard(container) {
    const response = await fetch('/api/doctors');
    const doctors = await response.json();
    let docOptions = doctors.map(doc => `<option value="${doc.name}">${doc.name} (${doc.specialty})</option>`).join('');

    container.innerHTML = `
        <div class="portal-box" style="max-width: 600px; margin: 0 auto;">
            <h2>Schedule Clinical Appointment</h2>
            <form onsubmit="bookAppointment(event)">
                <div class="form-group"><label>Patient Full Name</label><input type="text" id="patName" required></div>
                <div class="form-group"><label>Select Specialist</label><select id="selectDoc">${docOptions}</select></div>
                <div class="form-group"><label>Preferred Appointment Date</label><input type="date" id="appDate" required></div>
                <button type="submit" class="btn" style="width:100%;">Confirm Booking Slot</button>
            </form>
        </div>
    `;
}

async function bookAppointment(event) {
    event.preventDefault();
    await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            patientName: document.getElementById('patName').value,
            doctorName: document.getElementById('selectDoc').value,
            date: document.getElementById('appDate').value
        })
    });
    alert("Appointment successfully registered!");
    showDashboard('patient');
}

// 3. DOCTOR MODULE - Dynamic Status Workflow Actions
async function renderDoctorDashboard(container) {
    const response = await fetch('/api/appointments');
    const appointments = await response.json();

    let rows = appointments.map(app => {
        let ActionButtons = '';
        if (app.status === 'Scheduled') {
            ActionButtons = `
                <button class="btn-small btn-checkin" onclick="updateStatus(${app.id}, 'Admitted')">Check In</button>
                <button class="btn-small btn-complete" onclick="updateStatus(${app.id}, 'Completed')">Complete</button>
            `;
        } else if (app.status === 'Admitted') {
            ActionButtons = `<button class="btn-small btn-complete" onclick="updateStatus(${app.id}, 'Completed')">Complete</button>`;
        } else {
            ActionButtons = `<span>-</span>`;
        }

        return `
            <tr>
                <td>${app.patientName}</td>
                <td>${app.doctorName}</td>
                <td>${app.date}</td>
                <td><span style="font-weight:bold; color:${app.status==='Completed'?'green':app.status==='Admitted'?'orange':'#005f73'}">${app.status}</span></td>
                <td>${ActionButtons}</td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="portal-box">
            <h2>Doctor Portal - Appointments Queue & Status Tracking</h2>
            <table>
                <thead><tr><th>Patient Name</th><th>Assigned Doctor</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${rows.length ? rows : '<tr><td colspan="5" style="text-align:center;">No upcoming checkups found.</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

async function updateStatus(id, newStatus) {
    await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    showDashboard('doctor'); // Instantly re-render table with updated database values
}