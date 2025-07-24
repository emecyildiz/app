document.addEventListener('DOMContentLoaded', function() {
    // Password toggle functionality
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.form-input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });
    
    // Username validation
    const usernameInput = document.getElementById('username');
    const usernameHint = document.getElementById('usernameHint');
    
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
    
    // Password strength checker
    const passwordInput = document.getElementById('password');
    const passwordStrength = document.getElementById('passwordStrength');
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
    
    // Password match checker
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordMatch = document.getElementById('passwordMatch');
    
    function checkPasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword.length > 0) {
            passwordMatch.classList.add('show');
            if (password === confirmPassword) {
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
    
    // Form submission
    const registerForm = document.getElementById('registerForm');
    const authButton = document.querySelector('.auth-button');
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Add loading state
        authButton.classList.add('loading');
        
        // Simulate form processing
        setTimeout(() => {
            authButton.classList.remove('loading');
            console.log('Registration form submitted');
        }, 2000);
    });
});

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