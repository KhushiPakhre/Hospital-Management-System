// Function to dynamically switch between different user views
function showDashboard(role) {
    const mainContent = document.getElementById('main-content');
    
    if (role === 'admin') {
        mainContent.innerHTML = `
            <div class="portal-box">
                <h2>Admin Dashboard</h2>
                <p>Manage doctors, view total patient counts, and hospital analytics.</p>
                <hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;">
                <button style="padding: 8px 15px; background: #005f73; color: white; border: none; border-radius: 4px; cursor: pointer;">Add New Doctor</button>
            </div>
        `;
    } else if (role === 'doctor') {
        mainContent.innerHTML = `
            <div class="portal-box">
                <h2>Doctor Dashboard</h2>
                <p>View your scheduled appointments and update patient medical histories.</p>
            </div>
        `;
    } else if (role === 'patient') {
        mainContent.innerHTML = `
            <div class="portal-box">
                <h2>Patient Portal</h2>
                <p>Book appointments, search for specialists, and view prescriptions.</p>
            </div>
        `;
    }
}