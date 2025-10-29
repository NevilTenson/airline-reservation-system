// Global logic: nav, auth helpers
const API_BASE = 'http://localhost:5000/api';

// --- Core Auth Functions ---
export function getToken(){ return localStorage.getItem('authToken'); } // Use 'authToken' consistently
export function isLoggedIn(){ return !!getToken(); }
export function saveToken(token){ localStorage.setItem('authToken', token); }
// Save user data (like ID, name, role) to localStorage after login
export function saveUser(user){
    if (user) {
        localStorage.setItem('user', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email, // Optional, but useful
            role: user.role
        }));
    } else {
        localStorage.removeItem('user');
    }
}
export function clearToken(){
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
}
export function redirectToLogin(){ window.location.href = 'login.html'; }
export function getUser(){
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
}

// --- JWT Decoding (Basic - does NOT verify signature) ---
// You might have a more robust version in auth.js or use a library
export function decodeToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null; // Handle cases with invalid token format
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const decoded = JSON.parse(jsonPayload);
    // Add name from localStorage if not in token (adjust if needed)
    const localUser = getUser();
    if (localUser && !decoded.name) {
        decoded.name = localUser.name;
    }
    return decoded; // Should contain { id, role, name (optional) }
  } catch (e) {
    console.error("Error decoding token:", e);
    clearToken(); // Clear invalid token
    return null;
  }
}


// --- Profile Avatar Helper ---
function getUserInitial(userName) {
    if (!userName || typeof userName !== 'string' || userName.length === 0) {
        // Try getting name from stored user data as fallback
        const user = getUser();
        userName = user?.name;
        if (!userName || typeof userName !== 'string' || userName.length === 0) {
            return '?'; // Default if name still not found
        }
    }
    return userName.charAt(0).toUpperCase(); // Get first letter, uppercase
}

// --- Update Navigation Bar ---
export function updateNav(){ // Export it so profile.js can call it
  const loggedIn = isLoggedIn();
  const user = getUser(); // Get user data
  const isAdmin = user && user.role === 'admin';
  // const tokenData = decodeToken(); // Can use 'user' instead if it has role/name

  const showIf = (selector, show) => {
    const el = document.querySelector(selector);
    if(!el) {
        // console.warn(`Element not found for selector: ${selector}`); // Optional warning
        return;
    }
    el.classList.toggle('hidden', !show);
  };

  showIf('#nav-search', true); // Always show search? Adjust if needed
  showIf('#nav-bookings', loggedIn);
  showIf('#nav-logout', loggedIn);
  showIf('#nav-login', !loggedIn);
  showIf('#nav-register', !loggedIn);
  showIf('#nav-admin', isAdmin); // Show admin link only if user exists and role is admin

   // Update profile avatar visibility and initial
   const profileLi = document.getElementById('nav-profile');
   if (profileLi) {
       profileLi.classList.toggle('hidden', !loggedIn); // Show only if logged in
       if (loggedIn && user) { // Use user data from getUser()
           const initialSpan = document.getElementById('nav-profile-initial');
           if (initialSpan) {
               initialSpan.textContent = getUserInitial(user.name); // Use user.name
           }
       }
   } else {
       // console.warn("Profile avatar element (#nav-profile) not found in HTML."); // Optional warning
   }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  updateNav(); // Update nav on initial page load

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn){
    logoutBtn.addEventListener('click', () => { // Removed async/await as authLogout might not be needed
        // Just clear tokens and redirect
        clearToken();
        updateNav(); // Update nav immediately
        window.location.href = 'login.html'; // Redirect to login
    });
  }
});

// --- Export API_BASE ---
export { API_BASE };
