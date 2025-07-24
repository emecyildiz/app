// Password toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    // Form submission with loading state
    const loginForm = document.getElementById('loginForm');
    const authButton = document.querySelector('.auth-button');
    
    if (loginForm && authButton) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Add loading state
            authButton.classList.add('loading');
            
            // Simulate form processing
            setTimeout(() => {
                authButton.classList.remove('loading');
                // Here you would handle actual login logic
                console.log('Form submitted');
            }, 2000);
        });
    }
});