// Auth logic: register, login, logout
import { saveToken, clearToken, API_BASE } from './main.js';

async function handleRegister(){
  const form = document.getElementById('register-form');
  if(!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: form.name.value.trim(),
      username: form.username?.value.trim(), // include username
      email: form.email.value.trim(),
      password: form.password.value
    };
    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || 'Registration failed');
      alert('Registration successful! Please log in.');
      location.href = 'login.html';
    } catch (err) {
      console.error(err);
      alert(err.message || 'Registration error');
    }
  });
}

async function handleLogin(){
  const form = document.getElementById('login-form');
  if(!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      email: form.email.value.trim(),
      password: form.password.value
    };
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || 'Login failed');
      const token = payload.token || payload.data?.token;
      if (!token) throw new Error('No token returned from server');
      saveToken(token);

      // persist user info including role for UI control
      if (payload.user) {
        localStorage.setItem('user', JSON.stringify(payload.user));
      }

      location.href = 'index.html';
    } catch (err) {
      console.error(err);
      alert(err.message || 'Login error');
    }
  });
}

export async function logout(){
  clearToken();
  location.href = 'index.html';
}

// init based on presence of forms
document.addEventListener('DOMContentLoaded', () => {
  handleRegister();
  handleLogin();
});