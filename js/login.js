// Modern Login JavaScript - CinemaHub
// Global function for SPA compatibility
function initializeLoginForm() {
    console.log('Initializing login form...');
    
    try {
        // Password toggle functionality
        const passwordToggle = document.getElementById('passwordToggle');
        const passwordInput = document.getElementById('password');
        
        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', function() {
                togglePasswordVisibility(passwordInput, this);
            });
            console.log('Password toggle initialized');
        }
        
        // Form submission with loading state
        const loginForm = document.getElementById('loginForm');
        const authButton = document.querySelector('.auth-button');
        
        if (loginForm && authButton) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleLoginSubmit(authButton);
            });
            console.log('Form submission initialized');
        }
        
        // Input focus effects
        setupInputFocusEffects();
        
        // Social login buttons
        setupSocialLoginButtons();
        
        console.log('Login form initialization completed');
    } catch (error) {
        console.error('Error initializing login form:', error);
    }
}

// DOMContentLoaded event listener for direct page access
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a login page (either standalone or in SPA)
    if (document.getElementById('loginForm')) {
        console.log('Login page detected, initializing...');
        initializeLoginForm();
    }
});

function togglePasswordVisibility(input, toggleButton) {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    
    const icon = toggleButton.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
    
    // Add animation effect
    toggleButton.style.transform = 'scale(1.1)';
    setTimeout(() => {
        toggleButton.style.transform = 'scale(1)';
    }, 150);
}

function handleLoginSubmit(button) {
    // Add loading state
    button.classList.add('loading');
    
    // Get form data
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Validate form
    if (!username || !password) {
        showError('Lütfen tüm alanları doldurun');
        button.classList.remove('loading');
        return;
    }
    
    // Simulate form processing
    setTimeout(() => {
        button.classList.remove('loading');
        
        // Simulate successful login
        showSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
        
        // Redirect to home page after successful login
        setTimeout(() => {
            if (typeof loadPage === 'function') {
                loadPage('Home');
            }
        }, 1500);
        
    }, 2000);
}

function setupInputFocusEffects() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Add floating label effect
        if (this.value) {
            this.parentElement.classList.add('focused');
        }
    });
}

function setupSocialLoginButtons() {
    const googleBtn = document.querySelector('.google-btn');
    const facebookBtn = document.querySelector('.facebook-btn');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            handleSocialLogin('Google');
        });
    }
    
    if (facebookBtn) {
        facebookBtn.addEventListener('click', function() {
            handleSocialLogin('Facebook');
        });
    }
}

function handleSocialLogin(provider) {
    const button = event.target.closest('.social-btn');
    
    // Add loading state to button
    const originalText = button.innerHTML;
    button.innerHTML = '<div class="spinner"></div>';
    button.disabled = true;
    
    // Simulate social login
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        
        showSuccess(`${provider} ile giriş başarılı!`);
        
        // Redirect to home page
        setTimeout(() => {
            if (typeof loadPage === 'function') {
                loadPage('Home');
            }
        }, 1500);
    }, 2000);
}

function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'auth-notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    showNotification(notification);
}

function showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'auth-notification success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    showNotification(notification);
}

function showNotification(notification) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.auth-notification');
    existingNotifications.forEach(n => n.remove());
    
    // Add new notification
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Add notification styles
const notificationStyles = `
<style>
.auth-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
}

.auth-notification.show {
    transform: translateX(0);
}

.auth-notification.error {
    border-left: 4px solid #ef4444;
    color: #ef4444;
}

.auth-notification.success {
    border-left: 4px solid #10b981;
    color: #10b981;
}

.auth-notification i {
    font-size: 1.2rem;
}

@media (max-width: 480px) {
    .auth-notification {
        right: 10px;
        left: 10px;
        max-width: none;
    }
}
</style>
`;

// Inject notification styles
if (!document.querySelector('#auth-notification-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'auth-notification-styles';
    styleElement.innerHTML = notificationStyles;
    document.head.appendChild(styleElement);
}