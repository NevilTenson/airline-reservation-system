import { API_BASE, getToken, isLoggedIn, redirectToLogin, decodeToken } from './main.js'; // Assuming main.js exports these

const profileForm = document.getElementById('profile-form');
const messageEl = document.getElementById('profile-message');
let currentUserId = null;

// Helper to show messages
function showMessage(message, isError = false) {
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = isError ? 'message-box error' : 'message-box success';
    messageEl.classList.remove('hidden');
    // Simple remove after a few seconds
    setTimeout(() => { if (messageEl) messageEl.className = 'message-box hidden'; }, 4000);
  } else {
    // Fallback if message box not found
    console.log(isError ? "Error:" : "Success:", message);
  }
}

// Re-usable authFetch (Specific to profile page needs, could also be imported from main.js if identical)
async function authFetch(path, opts = {}){
  opts.headers = opts.headers || {};
  const token = getToken();
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (!opts.headers['Content-Type'] && !(opts.body instanceof FormData)) opts.headers['Content-Type'] = 'application/json';

  try {
      const res = await fetch(`${API_BASE}${path}`, opts);
      // Check for empty response body before parsing JSON
      const contentType = res.headers.get("content-type");
      const text = await res.text(); // Read body once

      if (!res.ok) {
          let errorData = { message: `HTTP error! status: ${res.status}` };
          try {
              if (text) errorData = JSON.parse(text); // Try parsing error JSON
          } catch (e) {
              // Ignore if parsing fails, use default message
          }
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      // If response is OK and has JSON content, parse it
      if (text && contentType && contentType.indexOf("application/json") !== -1) {
          return JSON.parse(text);
      }
      return null; // Return null for non-JSON or empty successful responses

  } catch (err) {
      console.error(`authFetch Error (${opts.method || 'GET'} ${path}):`, err);
      throw err; // Re-throw the error for calling function to handle
  }
}

// 1. Load user data on page load
async function loadProfile() {
  if (!isLoggedIn()) {
    return redirectToLogin();
  }

  // Assuming decodeToken function is available (imported or defined in main.js)
  const tokenData = decodeToken ? decodeToken() : null;
  if (!tokenData || !tokenData.id) {
    // Try getting user from localStorage as fallback
    const localUser = getUser ? getUser() : null;
    if (localUser && localUser.id) {
        currentUserId = localUser.id;
    } else {
        return showMessage('Could not find user ID from token or local storage.', true);
    }
  } else {
    currentUserId = tokenData.id;
  }


  console.log("Loading profile for user ID:", currentUserId);

  try {
    // Fetch user details using the ID
    // Assuming GET /api/users/:id exists and returns user data (excluding password)
    const user = await authFetch(`/users/${currentUserId}`);
    if (!user) throw new Error('Failed to fetch profile data. User might not exist.');

    // Populate the form fields
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';

  } catch (err) {
    console.error("Error loading profile:", err);
    showMessage(`Error loading profile: ${err.message}`, true);
  }
}

// 2. Handle form submission for updating profile
async function handleProfileUpdate(event) {
  event.preventDefault(); // Prevent default form submission
  if (!currentUserId) {
      showMessage('User ID not found. Cannot update.', true);
      return;
  }

  const form = event.target; // The form element itself
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value; // Don't trim passwords
  const confirmPassword = form.confirmPassword.value;
  const submitButton = form.querySelector('button[type="submit"]');

  // Basic client-side validation
  if (!name || !email) {
      return showMessage('Name and Email cannot be empty.', true);
  }
  // Simple email format check
  if (!/\S+@\S+\.\S+/.test(email)) {
       return showMessage('Please enter a valid email address.', true);
  }


  const payload = { name, email };

  // --- Password Validation ---
  if (password) { // Only include password if user entered something
    if (password.length < 6) {
      return showMessage('Password must be at least 6 characters.', true);
    }
    if (password !== confirmPassword) {
      return showMessage('New passwords do not match.', true);
    }
    payload.password = password; // Add password to payload only if valid and provided
  } else if (confirmPassword) {
      // If only confirm is filled, it's likely a mistake
      return showMessage('Please enter the new password in both fields if you wish to change it.', true);
  }

  // Disable button while processing
  if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Updating...';
  }
  showMessage('Updating profile...'); // Show neutral message

  try {
    // Send PUT request to update user
    // Assuming PUT /api/users/:id exists and handles name, email, password updates
    await authFetch(`/users/${currentUserId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    showMessage('Profile updated successfully!', false); // Show success
    // Clear password fields after successful update
    form.password.value = '';
    form.confirmPassword.value = '';

    // OPTIONAL: Update user data in localStorage if name changed
    const currentUserData = getUser ? getUser() : null;
    if (currentUserData && currentUserData.name !== name && typeof saveUser === 'function') {
        saveUser({...currentUserData, name: name }); // Assumes saveUser exists in main.js
        // Also update the nav immediately if possible
        if (typeof updateNav === 'function') updateNav();
    }


  } catch (err) {
    console.error("Error updating profile:", err);
    showMessage(`Update failed: ${err.message}`, true); // Show specific error
  } finally {
      // Re-enable button
      if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Update Profile';
      }
  }
}

// --- Initial setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Make sure basic auth functions exist before proceeding
    if (typeof isLoggedIn !== 'function' || typeof redirectToLogin !== 'function' || typeof decodeToken !== 'function' || typeof getUser !== 'function') {
        console.error("Essential auth functions (isLoggedIn, redirectToLogin, decodeToken, getUser) are missing. Check main.js import.");
        document.body.innerHTML = "Error: Authentication system failed to load.";
        return;
    }

    loadProfile(); // Load profile data when page loads

    // Attach submit listener to the form
    const form = document.getElementById('profile-form');
    if (form) {
        form.addEventListener('submit', handleProfileUpdate);
    } else {
        console.error("Profile form not found!");
        showMessage("Error: Could not find profile form.", true);
    }
});

