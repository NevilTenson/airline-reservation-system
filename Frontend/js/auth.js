// Auth logic: register, login, logout
import { saveToken, saveUser, clearToken, API_BASE } from './main.js'; // <-- ADDED saveUser import

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
    // Basic frontend validation (optional but good)
    if (!data.name || !data.username || !data.email || !data.password) {
        alert("Please fill in all fields.");
        return;
    }
     if (data.password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }
     if (!/\S+@\S+\.\S+/.test(data.email)) {
        alert('Please enter a valid email address.');
        return;
    }

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
      // Display specific backend error message if available
      alert(err.message || 'Registration error. Please check details and try again.');
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
    if (!data.email || !data.password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || 'Login failed');

      const token = payload.token; // Removed unnecessary check
      if (!token) throw new Error('Authentication failed: No token received.');
      saveToken(token);

      // --- ADDED THIS LINE ---
      // Save user details (id, name, role) to localStorage
      if (payload.user) {
         saveUser(payload.user); // Use the imported saveUser function
      } else {
          // Handle case where user object might be missing in response
          console.warn("User details missing in login response.");
          // Optionally try decoding token if saveUser fails, but ideally backend sends user data
      }
      // --- END ADDED LINE ---


      // Redirect to home page (or dashboard based on role?)
      window.location.href = 'home.html'; // Redirect to home.html after login

    } catch (err) {
      console.error(err);
      alert(err.message || 'Login error. Please check your credentials.');
    }
  });
}

// Export logout if it's meant to be called from elsewhere (e.g., main.js)
// If it's only called by the button listener in main.js, this export isn't strictly needed.
export function logout(){ // Changed from async as clearToken is synchronous
  clearToken();
  window.location.href = 'login.html'; // Redirect to login after logout
}

// init based on presence of forms
document.addEventListener('DOMContentLoaded', () => {
  handleRegister();
  handleLogin();
});
