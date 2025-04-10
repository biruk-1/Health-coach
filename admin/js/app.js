// Configuration
const API_URL = 'https://wtszbjtbfctwgnprzows.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0c3pianRiZmN0d2ducHJ6b3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MDc3NDYsImV4cCI6MjA1NjE4Mzc0Nn0.igEZ9IUTNl_SCS6xFOZb7tTHtcZRPoyebD8HizvOI0o';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// DOM Elements
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const dashboard = document.getElementById('dashboard');
const userDetailsView = document.getElementById('user-details');
const usersTableBody = document.getElementById('users-table-body');
const userCount = document.getElementById('user-count');
const userDetailsContent = document.getElementById('user-details-content');
const logoutBtn = document.getElementById('logout-btn');
const logoutBtnDetails = document.getElementById('logout-btn-details');
const backToDashboard = document.getElementById('back-to-dashboard');

// State
let isAuthenticated = false;
let currentUser = null;

// Check if user is already authenticated
function checkAuth() {
  const token = localStorage.getItem('admin_token');
  if (token) {
    isAuthenticated = true;
    showDashboard();
    loadUsers();
  }
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

// Show success message
function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = 'block';
  setTimeout(() => {
    successMessage.style.display = 'none';
  }, 5000);
}

// Show dashboard
function showDashboard() {
  document.querySelector('.login-container').style.display = 'none';
  dashboard.style.display = 'block';
  userDetailsView.style.display = 'none';
}

// Show login
function showLogin() {
  document.querySelector('.login-container').style.display = 'block';
  dashboard.style.display = 'none';
  userDetailsView.style.display = 'none';
}

// Show user details
function showUserDetails() {
  document.querySelector('.login-container').style.display = 'none';
  dashboard.style.display = 'none';
  userDetailsView.style.display = 'block';
}

// Format date
function formatDate(dateString) {
  return moment(dateString).format('MMM D, YYYY h:mm A');
}

// Load users
async function loadUsers() {
  try {
    const response = await fetch(`${API_URL}/rest/v1/users?select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const users = await response.json();
    
    // Update user count
    userCount.textContent = `${users.length} users`;
    
    // Clear table
    usersTableBody.innerHTML = '';
    
    // Sort users by creation date (newest first)
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (users.length === 0) {
      usersTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4">No users found</td>
        </tr>
      `;
      return;
    }
    
    // Populate table
    users.forEach(user => {
      const row = document.createElement('tr');
      
      // Determine badge class based on role
      let badgeClass = 'badge-secondary';
      if (user.role === 'user') badgeClass = 'badge-user';
      if (user.role === 'psychic') badgeClass = 'badge-psychic';
      if (user.role === 'admin') badgeClass = 'badge-admin';
      
      row.innerHTML = `
        <td>${user.full_name || 'N/A'}</td>
        <td>${user.email}</td>
        <td>
          <span class="badge badge-role ${badgeClass}">
            ${user.role || 'User'}
          </span>
        </td>
        <td>${formatDate(user.created_at)}</td>
        <td>
          <button class="btn btn-sm btn-outline-light view-user" data-id="${user.id}">
            <i class="bi bi-eye"></i> View
          </button>
        </td>
      `;
      
      usersTableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-user').forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.getAttribute('data-id');
        loadUserDetails(userId);
      });
    });
    
  } catch (error) {
    console.error('Error loading users:', error);
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center py-4 text-danger">
          <i class="bi bi-exclamation-triangle"></i> Failed to load users: ${error.message}
        </td>
      </tr>
    `;
  }
}

// Load user details
async function loadUserDetails(userId) {
  try {
    showUserDetails();
    userDetailsContent.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading user details...</p>
      </div>
    `;
    
    // Fetch user data
    const userResponse = await fetch(`${API_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user details');
    }
    
    const users = await userResponse.json();
    if (users.length === 0) {
      throw new Error('User not found');
    }
    
    const user = users[0];
    
    // Fetch psychic details if user is a psychic
    let psychicDetails = null;
    if (user.role === 'psychic') {
      const psychicResponse = await fetch(`${API_URL}/rest/v1/psychics?user_id=eq.${userId}&select=*`, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      if (psychicResponse.ok) {
        const psychics = await psychicResponse.json();
        if (psychics.length > 0) {
          psychicDetails = psychics[0];
        }
      }
    }
    
    // Fetch user's favorites
    let favorites = [];
    const favoritesResponse = await fetch(
      `${API_URL}/rest/v1/favorites?user_id=eq.${userId}&select=psychic_id,psychics(id,specialties,rating,total_reviews,profile_image,user_id)`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (favoritesResponse.ok) {
      favorites = await favoritesResponse.json();
      
      // For each favorite, fetch the psychic's user details to get the name
      for (const favorite of favorites) {
        if (favorite.psychics && favorite.psychics.user_id) {
          const psychicUserResponse = await fetch(
            `${API_URL}/rest/v1/users?id=eq.${favorite.psychics.user_id}&select=full_name`, {
            headers: {
              'apikey': API_KEY,
              'Authorization': `Bearer ${API_KEY}`
            }
          });
          
          if (psychicUserResponse.ok) {
            const psychicUsers = await psychicUserResponse.json();
            if (psychicUsers.length > 0) {
              favorite.psychics.users = { full_name: psychicUsers[0].full_name };
            }
          }
        }
      }
    }
    
    // Render user details
    renderUserDetails(user, psychicDetails, favorites);
    
  } catch (error) {
    console.error('Error loading user details:', error);
    userDetailsContent.innerHTML = `
      <div class="col-12 text-center py-5 text-danger">
        <i class="bi bi-exclamation-triangle" style="font-size: 3rem;"></i>
        <p class="mt-3">Failed to load user details: ${error.message}</p>
        <button id="back-to-dashboard-error" class="btn btn-outline-light mt-3">
          <i class="bi bi-arrow-left"></i> Back to Dashboard
        </button>
      </div>
    `;
    
    document.getElementById('back-to-dashboard-error').addEventListener('click', () => {
      showDashboard();
    });
  }
}

// Render user details
function renderUserDetails(user, psychicDetails, favorites) {
  // Determine badge class based on role
  let badgeClass = 'badge-secondary';
  if (user.role === 'user') badgeClass = 'badge-user';
  if (user.role === 'psychic') badgeClass = 'badge-psychic';
  if (user.role === 'admin') badgeClass = 'badge-admin';
  
  // Create HTML for user details
  let html = `
    <div class="col-md-6">
      <div class="card mb-4">
        <div class="card-header">
          Basic Information
        </div>
        <div class="card-body">
          <div class="text-center mb-4">
  `;
  
  // Profile image
  if (user.role === 'psychic' && psychicDetails && psychicDetails.profile_image) {
    html += `<img src="${psychicDetails.profile_image}" alt="${user.full_name}" class="profile-image mb-3">`;
  } else {
    html += `
      <div class="profile-image d-flex align-items-center justify-content-center mb-3 mx-auto" style="background-color: #6366f1;">
        <span style="font-size: 2rem; color: white;">${user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}</span>
      </div>
    `;
  }
  
  html += `
            <h2 class="h4 mb-1">${user.full_name || 'N/A'}</h2>
            <span class="badge badge-role ${badgeClass}">
              ${user.role || 'User'}
            </span>
          </div>

          <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between">
              <span>Email:</span>
              <span>${user.email}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Phone:</span>
              <span>${user.phone || 'Not provided'}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Registered:</span>
              <span>${formatDate(user.created_at)}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Last Updated:</span>
              <span>${formatDate(user.updated_at)}</span>
            </li>
          </ul>
        </div>
      </div>
  `;
  
  // Birth information
  if (user.birth_date || user.birth_time || user.birth_location) {
    html += `
      <div class="card mb-4">
        <div class="card-header">
          Birth Information
        </div>
        <div class="card-body">
          <ul class="list-group list-group-flush">
    `;
    
    if (user.birth_date) {
      html += `
        <li class="list-group-item d-flex justify-content-between">
          <span>Birth Date:</span>
          <span>${formatDate(user.birth_date)}</span>
        </li>
      `;
    }
    
    if (user.birth_time) {
      html += `
        <li class="list-group-item d-flex justify-content-between">
          <span>Birth Time:</span>
          <span>${user.birth_time}</span>
        </li>
      `;
    }
    
    if (user.birth_location) {
      html += `
        <li class="list-group-item d-flex justify-content-between">
          <span>Birth Location:</span>
          <span>${user.birth_location}</span>
        </li>
      `;
    }
    
    html += `
          </ul>
        </div>
      </div>
    `;
  }
  
  html += `</div><div class="col-md-6">`;
  
  // Psychic profile
  if (user.role === 'psychic' && psychicDetails) {
    html += `
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span>Psychic Profile</span>
    `;
    
    if (psychicDetails.is_verified) {
      html += `
        <span class="verification-badge verified">
          <i class="bi bi-check-circle-fill"></i> Verified
        </span>
      `;
    } else {
      html += `
        <span class="verification-badge unverified">
          <i class="bi bi-x-circle-fill"></i> Unverified
        </span>
      `;
    }
    
    html += `
        </div>
        <div class="card-body">
          <ul class="list-group list-group-flush">
            <li class="list-group-item">
              <strong>Bio:</strong>
              <p class="mt-2 mb-0">${psychicDetails.bio || 'No bio provided'}</p>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Specialties:</span>
              <span>${psychicDetails.specialties || 'Not specified'}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Experience:</span>
              <span>${psychicDetails.experience_years || '0'} years</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Hourly Rate:</span>
              <span>$${psychicDetails.hourly_rate || '0'}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Rating:</span>
              <span>
                ${psychicDetails.rating || '0'}/5
                (${psychicDetails.total_reviews || '0'} reviews)
              </span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Location:</span>
              <span>${psychicDetails.location || 'Not specified'}</span>
            </li>
          </ul>
    `;
    
    if (!psychicDetails.is_verified) {
      html += `
        <div class="mt-3">
          <button class="btn btn-primary w-100 verify-psychic" data-id="${psychicDetails.id}" data-user-id="${user.id}">
            <i class="bi bi-check-circle"></i> Verify Psychic
          </button>
        </div>
      `;
    }
    
    html += `
        </div>
      </div>
    `;
  }
  
  // Favorites
  if (favorites && favorites.length > 0) {
    html += `
      <div class="card mb-4">
        <div class="card-header">
          Favorite Psychics
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table mb-0">
              <thead>
                <tr>
                  <th>Psychic</th>
                  <th>Specialties</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
    `;
    
    favorites.forEach(favorite => {
      html += `
        <tr>
          <td>${favorite.psychics?.users?.full_name || 'Unknown'}</td>
          <td>${favorite.psychics?.specialties || 'Not specified'}</td>
          <td>
            ${favorite.psychics?.rating || '0'}/5
            (${favorite.psychics?.total_reviews || '0'})
          </td>
        </tr>
      `;
    });
    
    html += `
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
  
  // Interests
  if (user.interests && user.interests.length > 0) {
    html += `
      <div class="card mb-4">
        <div class="card-header">
          Interests
        </div>
        <div class="card-body">
          <div class="d-flex flex-wrap gap-2">
    `;
    
    user.interests.forEach(interest => {
      html += `<span class="badge bg-secondary">${interest}</span>`;
    });
    
    html += `
          </div>
        </div>
      </div>
    `;
  }
  
  html += `</div>`;
  
  // Update the content
  userDetailsContent.innerHTML = html;
  
  // Add event listeners to verify buttons
  document.querySelectorAll('.verify-psychic').forEach(button => {
    button.addEventListener('click', async () => {
      const psychicId = button.getAttribute('data-id');
      const userId = button.getAttribute('data-user-id');
      await verifyPsychic(psychicId, userId);
    });
  });
}

// Verify psychic
async function verifyPsychic(psychicId, userId) {
  try {
    const response = await fetch(`${API_URL}/rest/v1/psychics?id=eq.${psychicId}`, {
      method: 'PATCH',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        is_verified: true
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to verify psychic');
    }
    
    // Reload user details
    loadUserDetails(userId);
    
    // Show success message
    alert('Psychic verified successfully!');
    
  } catch (error) {
    console.error('Error verifying psychic:', error);
    alert(`Failed to verify psychic: ${error.message}`);
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated
  checkAuth();
  
  // Login form submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple authentication for demo purposes
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_token', 'demo_token');
      isAuthenticated = true;
      showDashboard();
      loadUsers();
    } else {
      showError('Invalid username or password');
    }
  });
  
  // Logout buttons
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('admin_token');
    isAuthenticated = false;
    showLogin();
  });
  
  logoutBtnDetails.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('admin_token');
    isAuthenticated = false;
    showLogin();
  });
  
  // Back to dashboard button
  backToDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    showDashboard();
  });
});