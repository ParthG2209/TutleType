// Import Firebase modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    sendPasswordResetEmail,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase configuration - VERIFIED
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

// Set persistence
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('Firebase auth persistence set');
    })
    .catch((error) => {
        console.error('Persistence error:', error);
    });

// Configure Google provider
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
    prompt: 'select_account'
});

// Check if user is already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User already logged in:', user.email);
        // Auto-redirect if user is already authenticated
        // window.location.href = '../index.html';
    } else {
        console.log('No user logged in');
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

// Show success message
function showSuccess(message) {
    clearError();
    errorMessage.style.color = '#22c55e';
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
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
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        toggleLoader(false);
        return;
    }
    
    try {
        console.log('Attempting email/password sign-in for:', email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✓ User logged in successfully:', userCredential.user.email);
        
        showSuccess('Login successful! Redirecting...');
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Login error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Handle specific error codes
        let errorMsg = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMsg = 'Invalid email address format.';
                break;
            case 'auth/user-disabled':
                errorMsg = 'This account has been disabled.';
                break;
            case 'auth/user-not-found':
                errorMsg = 'No account found with this email. Please sign up first.';
                break;
            case 'auth/wrong-password':
                errorMsg = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-credential':
                errorMsg = 'Invalid email or password. Please check and try again.';
                break;
            case 'auth/too-many-requests':
                errorMsg = 'Too many failed attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMsg = 'Network error. Please check your connection.';
                break;
            case 'auth/operation-not-allowed':
                errorMsg = 'Email/password authentication is not enabled. Please contact support.';
                break;
            default:
                errorMsg = error.message || 'An error occurred. Please try again.';
        }
        
        showError(errorMsg);
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
        console.log('✓ User logged in with Google:', result.user.email);
        
        showSuccess('Login successful! Redirecting...');
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Google login error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        googleBtn.disabled = false;
        googleBtn.style.opacity = '1';
        
        let errorMsg = 'Google sign-in failed. Please try again.';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMsg = 'Sign-in popup was closed. Please try again.';
                break;
            case 'auth/cancelled-popup-request':
                clearError();
                return;
            case 'auth/popup-blocked':
                errorMsg = 'Popup was blocked. Please allow popups for this site.';
                break;
            case 'auth/unauthorized-domain':
                errorMsg = 'This domain is not authorized. Please contact support.';
                break;
            case 'auth/operation-not-allowed':
                errorMsg = 'Google sign-in is not enabled. Please contact support.';
                break;
            case 'auth/account-exists-with-different-credential':
                errorMsg = 'An account already exists with this email using a different sign-in method.';
                break;
            default:
                errorMsg = error.message || 'Google sign-in failed. Please try again.';
        }
        
        showError(errorMsg);
    }
});

// Handle forgot password
forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    clearError();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showError('Please enter your email address first.');
        emailInput.focus();
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address.');
        return;
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        showSuccess('Password reset email sent! Check your inbox.');
        console.log('✓ Password reset email sent to:', email);
    } catch (error) {
        console.error('❌ Password reset error:', error);
        
        let errorMsg = 'Failed to send reset email.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMsg = 'Invalid email address.';
                break;
            case 'auth/user-not-found':
                errorMsg = 'No account found with this email.';
                break;
            default:
                errorMsg = error.message || 'Failed to send reset email.';
        }
        
        showError(errorMsg);
    }
});

// Test Firebase connection
console.log('Firebase initialized:', app.name);
console.log('Auth domain:', firebaseConfig.authDomain);