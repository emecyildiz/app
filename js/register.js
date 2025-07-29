// Modern Register JavaScript - CinemaHub
// Global function for SPA compatibility
function initializeRegisterForm() {
    console.log('Initializing register form...');
    
    try {
        // Password toggle functionality
        setupPasswordToggles();
        
        // Username validation
        setupUsernameValidation();
        
        // Password strength checker
        setupPasswordStrength();
        
        // Password match checker
        setupPasswordMatch();
        
        // Form submission
        setupFormSubmission();
        
        // Input focus effects
        setupInputFocusEffects();
        
        // Social register buttons
        setupSocialRegisterButtons();
        
        console.log('Register form initialization completed');
    } catch (error) {
        console.error('Error initializing register form:', error);
    }
}

// DOMContentLoaded event listener for direct page access
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a register page (either standalone or in SPA)
    if (document.getElementById('registerForm')) {
        console.log('Register page detected, initializing...');
        initializeRegisterForm();
    }
});

function setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.form-input');
            togglePasswordVisibility(input, this);
        });
    });
}

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

function setupUsernameValidation() {
    const usernameInput = document.getElementById('username');
    const usernameHint = document.getElementById('usernameHint');
    
    if (usernameInput && usernameHint) {
        usernameInput.addEventListener('input', function() {
            const value = this.value;
            if (value.length > 0) {
                usernameHint.classList.add('show');
                if (value.length >= 3) {
                    usernameHint.classList.add('success');
                    usernameHint.classList.remove('error');
                    usernameHint.innerHTML = '<i class="fas fa-check-circle"></i> Kullanıcı adı uygun';
                } else {
                    usernameHint.classList.add('error');
                    usernameHint.classList.remove('success');
                    usernameHint.innerHTML = '<i class="fas fa-exclamation-circle"></i> En az 3 karakter olmalıdır';
                }
            } else {
                usernameHint.classList.remove('show', 'success', 'error');
            }
        });
    }
}

function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const passwordStrength = document.getElementById('passwordStrength');
    
    if (passwordInput && passwordStrength) {
        const strengthFill = passwordStrength.querySelector('.strength-fill');
        const strengthText = passwordStrength.querySelector('.strength-text');
        
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            if (password.length > 0) {
                passwordStrength.classList.add('show');
                const strength = calculatePasswordStrength(password);
                updatePasswordStrength(strength, strengthFill, strengthText);
            } else {
                passwordStrength.classList.remove('show');
            }
        });
    }
}

function setupPasswordMatch() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordMatch = document.getElementById('passwordMatch');
    
    if (confirmPasswordInput && passwordMatch) {
        function checkPasswordMatch() {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (confirmPassword.length > 0) {
                passwordMatch.classList.add('show');
                if (password === confirmPassword && password.length > 0) {
                    passwordMatch.classList.add('success');
                    passwordMatch.classList.remove('error');
                    passwordMatch.innerHTML = '<i class="fas fa-check-circle"></i> Şifreler eşleşiyor';
                } else {
                    passwordMatch.classList.add('error');
                    passwordMatch.classList.remove('success');
                    passwordMatch.innerHTML = '<i class="fas fa-exclamation-circle"></i> Şifreler eşleşmiyor';
                }
            } else {
                passwordMatch.classList.remove('show', 'success', 'error');
            }
        }
        
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
        passwordInput.addEventListener('input', checkPasswordMatch);
    }
}

function setupFormSubmission() {
    const registerForm = document.getElementById('registerForm');
    const authButton = document.querySelector('.auth-button');
    
    if (registerForm && authButton) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegisterSubmit(authButton);
        });
    }
}

function handleRegisterSubmit(button) {
    // Add loading state
    button.classList.add('loading');
    
    // Get form data
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    const newsletter = document.getElementById('newsletter').checked;
    
    // Validate form
    if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
        showError('Lütfen tüm zorunlu alanları doldurun');
        button.classList.remove('loading');
        return;
    }
    
    if (!terms) {
        showError('Kullanım şartlarını kabul etmelisiniz');
        button.classList.remove('loading');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Şifreler eşleşmiyor');
        button.classList.remove('loading');
        return;
    }
    
    if (username.length < 3) {
        showError('Kullanıcı adı en az 3 karakter olmalıdır');
        button.classList.remove('loading');
        return;
    }
    
    // Simulate form processing
    setTimeout(() => {
        button.classList.remove('loading');
        
        // Simulate successful registration
        showSuccess('Hesap başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...');
        
        // Redirect to login page after successful registration
        setTimeout(() => {
            if (typeof loadPage === 'function') {
                loadPage('Giriş');
            }
        }, 2000);
        
    }, 2500);
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

function setupSocialRegisterButtons() {
    const googleBtn = document.querySelector('.google-btn');
    const facebookBtn = document.querySelector('.facebook-btn');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            handleSocialRegister('Google');
        });
    }
    
    if (facebookBtn) {
        facebookBtn.addEventListener('click', function() {
            handleSocialRegister('Facebook');
        });
    }
}

function handleSocialRegister(provider) {
    const button = event.target.closest('.social-btn');
    
    // Add loading state to button
    const originalText = button.innerHTML;
    button.innerHTML = '<div class="spinner"></div>';
    button.disabled = true;
    
    // Simulate social registration
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        
        showSuccess(`${provider} ile kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...`);
        
        // Redirect to login page
        setTimeout(() => {
            if (typeof loadPage === 'function') {
                loadPage('Giriş');
            }
        }, 2000);
    }, 2500);
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    return Math.min(score, 4);
}

function updatePasswordStrength(strength, fillElement, textElement) {
    const classes = ['weak', 'fair', 'good', 'strong'];
    const texts = ['Zayıf', 'Orta', 'İyi', 'Güçlü'];
    
    // Remove all strength classes
    fillElement.classList.remove(...classes);
    
    if (strength > 0) {
        fillElement.classList.add(classes[strength - 1]);
        textElement.textContent = `Şifre gücü: ${texts[strength - 1]}`;
    }
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

// Add notification styles (if not already added)
if (!document.querySelector('#auth-notification-styles')) {
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
    
    const styleElement = document.createElement('div');
    styleElement.id = 'auth-notification-styles';
    styleElement.innerHTML = notificationStyles;
    document.head.appendChild(styleElement);
}