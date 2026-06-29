// Global state tracking
let currentUserRole = null;

// Initial application entry view sequence on page load
window.onload = function() {
    renderLoginScreen();
};

// --- AUTHENTICATION & PORTAL ROUTING ---

function renderLoginScreen() {
    currentUserRole = null;
    localStorage.removeItem('token'); // Wipe any expired tokens on logout/reset
    document.getElementById('header-nav').style.display = 'none'; // Hide main nav tabs
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="portal-box" style="max-width: 450px; margin: 80px auto;">
            <h2 style="text-align: center;">🔐 Secure MERN Login</h2>
            <form onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="loginEmail" required placeholder="e.g. admin@hospital.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="loginPassword" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn" style="width: 100%;">Authenticate & Access</button>
            </form>
            <div style="margin-top: 15px; text-align: center; font-size: 0.9rem;">
                <p style="color: #666;">Don't have an account? <a href="#" onclick="renderSignupScreen()" style="color: #005f73; font-weight: bold;">Sign Up Here</a></p>
            </div>
        </div>
    `;
}

function renderSignupScreen() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="portal-box" style="max-width: 450px; margin: 80px auto;">
            <h2 style="text-align: center;">📝 Create Account</h2>
            <form onsubmit="handleSignup(event)">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="signupName" required placeholder="John Doe">
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="signupEmail" required placeholder="john@hospital.com">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="signupPassword" required placeholder="Create a strong password">
                </div>
                <div class="form-group">
                    <label>Assign Account Role (RBAC)</label>
                    <select id="signupRole">
                        <option value="patient">Patient Portal Access</option>
                        <option value="doctor">Medical Staff / Doctor</option>
                        <option value="admin">Hospital Administrator</option>
                    </select>
                </div>
                <button type="submit" class="btn" style="width: 100%;">Complete Registration</button>
            </form>
            <div style="margin-top: 15px; text-align: center; font-size: 0.9rem;">
                <p style="color: #666;">Already have an account? <a href="#" onclick="renderLoginScreen()" style="color: #005f73; font-weight: bold;">Login Here</a></p>
            </div>
        </div>
    `;
}

async function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;

    const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
    });
    const data = await response.json();

    if (response.ok) {
        alert("Registration Successful! You can now log in.");
        renderLoginScreen();
    } else {
        alert(data.error || "Signup Failed");
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (response.ok) {
        // Securely save the JWT token locally in the client browser memory
        localStorage.setItem('token', data.token); 
        currentUserRole = data.role;
        
        // Expose navigation bar and automatically display their assigned role dashboard
        document.getElementById('header-nav').style.display = 'block';
        showDashboard(data.role);
    } else {
        alert(data.error || "Authentication Failed");
    }
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


// --- 1. ADMIN PORTAL (MANAGE STAFF & VIEW TRANSACTIONS) ---

async function renderAdminDashboard(container) {
    // Pack requests with the Authorization JWT Header token
    const token = localStorage.getItem('token');
    
    const docRes = await fetch('/api/doctors', { headers: { 'Authorization': `Bearer ${token}` } });
    const doctors = await docRes.json();
    
    const billRes = await fetch('/api/billing', { headers: { 'Authorization': `Bearer ${token}` } });
    const bills = await billRes.json();
    
    let docRows = doctors.map(doc => `<tr><td>${doc._id || doc.id}</td><td>${doc.name}</td><td>${doc.specialty}</td></tr>`).join('');
    let billRows = bills.map(b => `<tr><td>#${b._id || b.id}</td><td>${b.patientName}</td><td>₹${b.amount}</td><td><span style="color:green;font-weight:bold;">${b.status}</span></td></tr>`).join('');

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
                    <thead><tr><th>Mongo ID</th><th>Name</th><th>Specialty</th></tr></thead>
                    <tbody>${docRows.length ? docRows : '<tr><td colspan="3">No doctors registered yet.</td></tr>'}</tbody>
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
                <h3 style="margin-top:20px;">Recent Transactions Log</h3>
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
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
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
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ patientName, amount })
    });

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


// --- 2. PATIENT PORTAL (SCHEDULE CLINICAL APPOINTMENT) ---

async function renderPatientDashboard(container) {
    const response = await fetch('/api/doctors', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
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
    const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            patientName: document.getElementById('patName').value,
            doctorName: document.getElementById('selectDoc').value,
            date: document.getElementById('appDate').value
        })
    });

    if (response.ok) {
        alert("Appointment successfully registered!");
        showDashboard('patient');
    } else {
        const errData = await response.json();
        alert(`Error booking: ${errData.error}`);
    }
}


// --- 3. DOCTOR PORTAL (APPOINTMENTS QUEUE & WORKFLOW) ---

async function renderDoctorDashboard(container) {
    const response = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const appointments = await response.json();

    let rows = appointments.map(app => {
        let ActionButtons = '';
        if (app.status === 'Scheduled') {
            ActionButtons = `
                <button class="btn-small btn-checkin" onclick="updateStatus('${app._id || app.id}', 'Admitted')">Check In</button>
                <button class="btn-small btn-complete" onclick="updateStatus('${app._id || app.id}', 'Completed')">Complete</button>
            `;
        } else if (app.status === 'Admitted') {
            ActionButtons = `<button class="btn-small btn-complete" onclick="updateStatus('${app._id || app.id}', 'Completed')">Complete</button>`;
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
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
    });
    showDashboard('doctor'); // Instantly re-render table with fresh records
}