// Global logic: nav, auth helpers
const API_BASE = 'http://localhost:5000/api';

export function getToken(){ return localStorage.getItem('token'); }
export function isLoggedIn(){ return !!getToken(); }
export function saveToken(token){ localStorage.setItem('token', token); }
export function clearToken(){ localStorage.removeItem('token'); localStorage.removeItem('user'); }
export function redirectToLogin(){ location.href = 'login.html'; }
export function getUser(){ 
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } 
  catch { return null; } 
}

import { logout as authLogout } from './auth.js'; // per spec: import logout

// toggle nav based on auth state
function updateNav(){
  const loggedIn = isLoggedIn();
  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  const showIf = (selector, show) => {
    const el = document.querySelector(selector);
    if(!el) return;
    el.classList.toggle('hidden', !show);
  };
  showIf('#nav-bookings', loggedIn);
  showIf('#nav-logout', loggedIn);
  showIf('#nav-login', !loggedIn);
  showIf('#nav-register', !loggedIn);

  // admin link - add <li id="nav-admin" class="hidden"><a href="admin.html">Admin</a></li> to nav markup
  showIf('#nav-admin', isAdmin);
}

document.addEventListener('DOMContentLoaded', () => {
  updateNav();
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn){
    logoutBtn.addEventListener('click', async () => {
      if (typeof authLogout === 'function') {
        await authLogout();
      } else {
        clearToken();
        location.href = 'index.html';
      }
    });
  }
});

export { API_BASE };