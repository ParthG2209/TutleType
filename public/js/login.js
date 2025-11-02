// Import Firebase modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    sendPasswordResetEmail,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8W9yY_T5r-gU2iZSFRGo3x3lv95Ldoao",
  authDomain: "tutletype.firebaseapp.com",
  projectId: "tutletype",
  storageBucket: "tutletype.firebasestorage.app",
  messagingSenderId: "576421686799",
  appId: "1:576421686799:web:29411c65938e55b7643d7a",
  measurementId: "G-VRR26Z9PKZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Configure Google provider
provider.setCustomParameters({
    prompt: 'select_account'
});

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User already logged in:', user.email);
        // Uncomment to auto-redirect logged-in users
        // window.location.href = '/dashboard.html';
    }
});

// DOM elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const googleBtn = document.getElementById('googleBtn');
const errorMessage = document.getElementById('errorMessage');
const forgotPasswordLink = document.getElementById('forgotPassword');
const signupLink = document.getElementById('signupLink');

// Show/hide loader
function toggleLoader(show) {
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoader = loginBtn.querySelector('.btn-loader');
    
    if (show) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
        loginBtn.disabled = true;
    } else {
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
        loginBtn.disabled = false;
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Clear error message
function clearError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
}

// Handle email/password login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    toggleLoader(true);
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        showError('Please enter both email and password.');
        toggleLoader(false);
        return;
    }
    
    try {
        console.log('Attempting email/password sign-in...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user.email);
        
        // Show success message
        showError('');
        const successMsg = document.createElement('div');
        successMsg.style.color = '#22c55e';
        successMsg.textContent = 'Login successful! Redirecting...';
        errorMessage.parentNode.insertBefore(successMsg, errorMessage.nextSibling);
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error code:', error.code);
        
        // Handle specific error codes
        switch (error.code) {
            case 'auth/invalid-email':
                showError('Invalid email address format.');
                break;
            case 'auth/user-disabled':
                showError('This account has been disabled.');
                break;
            case 'auth/user-not-found':
                showError('No account found with this email. Please sign up.');
                break;
            case 'auth/wrong-password':
                showError('Incorrect password. Please try again.');
                break;
            case 'auth/invalid-credential':
                showError('Invalid email or password. Please check and try again.');
                break;
            case 'auth/too-many-requests':
                showError('Too many failed attempts. Please try again later.');
                break;
            case 'auth/network-request-failed':
                showError('Network error. Please check your connection.');
                break;
            default:
                showError(`Login failed: ${error.message}`);
        }
        toggleLoader(false);
    }
});

// Handle Google sign-in
googleBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    clearError();
    googleBtn.disabled = true;
    googleBtn.style.opacity = '0.6';
    
    try {
        console.log('Attempting Google sign-in...');
        const result = await signInWithPopup(auth, provider);
        console.log('User logged in with Google:', result.user.email);
        
        // Show success message
        showError('');
        const successMsg = document.createElement('div');
        successMsg.style.color = '#22c55e';
        successMsg.textContent = 'Login successful! Redirecting...';
        errorMessage.parentNode.insertBefore(successMsg, errorMessage.nextSibling);
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Google login error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        googleBtn.disabled = false;
        googleBtn.style.opacity = '1';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                showError('Sign-in popup was closed. Please try again.');
                break;
            case 'auth/cancelled-popup-request':
                clearError();
                break;
            case 'auth/popup-blocked':
                showError('Popup was blocked. Please allow popups for this site.');
                break;
            case 'auth/unauthorized-domain':
                showError('This domain is not authorized. Please add it in Firebase Console.');
                break;
            case 'auth/operation-not-allowed':
                showError('Google sign-in is not enabled. Please enable it in Firebase Console.');
                break;
            default:
                showError(`Failed to sign in with Google: ${error.message}`);
        }
    }
});

// Handle forgot password
forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    clearError();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showError('Please enter your email address first.');
        return;
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        showError(''); // Clear error
        alert('Password reset email sent! Check your inbox.');
    } catch (error) {
        console.error('Password reset error:', error);
        
        switch (error.code) {
            case 'auth/invalid-email':
                showError('Invalid email address.');
                break;
            case 'auth/user-not-found':
                showError('No account found with this email.');
                break;
            default:
                showError('Failed to send reset email.');
        }
    }
});

// Handle sign-up link (you can implement this later)
signupLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Redirect to signup page
    window.location.href = '/signup.html'; // Change this to your signup page
});