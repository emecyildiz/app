/**
 * CinemaHub - Optimized SPA Application
 * Merkezi uygulama modülü - Event Delegation ile
 */

class CinemaHubApp {
    constructor() {
        this.currentPage = null;
        this.isLoading = false;
        this.eventListeners = new Map();
        this.modules = new Map();
        this.cache = new Map();
        this.pageHandlers = new Map();
        
        this.init();
    }

    /**
     * Uygulamayı başlat
     */
    init() {
        this.setupEventDelegation();
        this.loadModules();
        this.setupInitialStyles();
        this.registerPageHandlers();
        // Başlangıçta Home sayfasını yükle
        this.loadPage('Home');
    }

    /**
     * Event delegation sistemi kur
     */
    setupEventDelegation() {
        // Navigation events
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        
        // Form events
        document.addEventListener('submit', this.handleGlobalSubmit.bind(this));
        document.addEventListener('input', this.handleGlobalInput.bind(this));
        document.addEventListener('change', this.handleGlobalChange.bind(this));
        
        // Global events
        document.addEventListener('DOMContentLoaded', this.handleDOMReady.bind(this));
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    /**
     * Sayfa handler'larını kaydet
     */
    registerPageHandlers() {
        // Auth sayfaları için handler'lar
        this.pageHandlers.set('Giriş', this.handleLoginPage.bind(this));
        this.pageHandlers.set('Kayıt', this.handleRegisterPage.bind(this));
        
        // Film sayfası için handler
        this.pageHandlers.set('Filmler', this.handleFilmsPage.bind(this));
        
        // Diğer sayfalar için genel handler
        this.pageHandlers.set('Home', this.handleGeneralPage.bind(this));
        this.pageHandlers.set('Hakkinda', this.handleGeneralPage.bind(this));
        this.pageHandlers.set('Profil', this.handleGeneralPage.bind(this));
    }

    /**
     * Sayfa handler fonksiyonları
     */
    handleLoginPage() {
        console.log('Login page handler called');
        // Login sayfası özel işlemleri
    }

    handleRegisterPage() {
        console.log('Register page handler called');
        // Register sayfası özel işlemleri
    }

    handleFilmsPage() {
        console.log('Films page handler called');
        // Film sayfası özel işlemleri
        if (this.modules.has('films')) {
            this.modules.get('films').init();
        }
    }

    handleGeneralPage() {
        console.log('General page handler called');
        // Genel sayfa işlemleri
    }

    /**
     * Global click event handler
     */
    handleGlobalClick(event) {
        const target = event.target;
        
        // Navigation butonları
        if (target.closest('[data-page]')) {
            const pageElement = target.closest('[data-page]');
            const pageName = pageElement.getAttribute('data-page');
            if (pageName) {
                event.preventDefault();
                this.loadPage(pageName);
                return;
            }
        }
        
        // Password toggle butonları
        if (target.closest('.password-toggle')) {
            const toggle = target.closest('.password-toggle');
            const input = toggle.parentElement.querySelector('.form-input[type="password"], .form-input[type="text"]');
            if (input) {
                this.togglePasswordVisibility(input, toggle);
                return;
            }
        }
        
        // Social login/register butonları
        if (target.closest('.social-btn')) {
            const btn = target.closest('.social-btn');
            const provider = btn.classList.contains('google-btn') ? 'Google' : 'Facebook';
            const action = btn.closest('.auth-container') ? 'login' : 'register';
            this.handleSocialAuth(provider, action);
            return;
        }
        
        // Checkbox'lar
        if (target.closest('.custom-checkbox')) {
            const checkbox = target.closest('.checkbox-wrapper').querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
                return;
            }
        }
        
        // Film kartları
        if (target.closest('.film-card')) {
            const card = target.closest('.film-card');
            this.handleFilmCardClick(card, event);
            return;
        }
        
        // Genre butonları
        if (target.closest('.genre-btn')) {
            const btn = target.closest('.genre-btn');
            const genre = btn.getAttribute('data-genre');
            if (genre) {
                this.handleGenreFilter(genre);
                return;
            }
        }
        
        // Slider butonları
        if (target.closest('.slider-btn')) {
            const btn = target.closest('.slider-btn');
            const direction = btn.classList.contains('prev') ? 'prev' : 'next';
            const slider = btn.closest('.slider-container');
            if (slider) {
                this.handleSliderNavigation(slider, direction);
                return;
            }
        }
    }

    /**
     * Global submit event handler
     */
    handleGlobalSubmit(event) {
        const form = event.target;
        
        // Login form
        if (form.id === 'loginForm') {
            event.preventDefault();
            this.handleLoginSubmit(form);
            return;
        }
        
        // Register form
        if (form.id === 'registerForm') {
            event.preventDefault();
            this.handleRegisterSubmit(form);
            return;
        }
    }

    /**
     * Global input event handler
     */
    handleGlobalInput(event) {
        const input = event.target;
        
        // Username validation
        if (input.id === 'username' && input.closest('#registerForm')) {
            this.handleUsernameValidation(input);
            return;
        }
        
        // Password strength
        if (input.id === 'password' && input.closest('#registerForm')) {
            this.handlePasswordStrength(input);
            return;
        }
        
        // Password match
        if (input.id === 'confirmPassword') {
            this.handlePasswordMatch();
            return;
        }
    }

    /**
     * Global change event handler
     */
    handleGlobalChange(event) {
        const input = event.target;
        
        // Checkbox changes
        if (input.type === 'checkbox') {
            this.handleCheckboxChange(input);
            return;
        }
    }

    /**
     * Başlangıç stillerini ayarla
     */
    setupInitialStyles() {
        // Varsayılan arka plan rengini ayarla - mor-mavi tema
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        document.body.style.color = '#ffffff';
        document.body.style.transition = 'all 0.3s ease';
    }

    /**
     * Modülleri yükle
     */
    loadModules() {
        // Modülleri güvenli şekilde yükle
        try {
            if (typeof NavigationModule !== 'undefined') {
                this.modules.set('navigation', new NavigationModule(this));
            }
            if (typeof FilmsModule !== 'undefined') {
                this.modules.set('films', new FilmsModule(this));
            }
            if (typeof UIModule !== 'undefined') {
                this.modules.set('ui', new UIModule(this));
            }
        } catch (error) {
            console.error('Module loading error:', error);
        }
    }

    /**
     * Sayfa yükleme - optimize edilmiş
     */
    async loadPage(pageName) {
        if (this.isLoading || this.currentPage === pageName) return;
        
        console.log('Loading page:', pageName);
        this.isLoading = true;
        this.showLoading();

        try {
            const content = await this.fetchPageContent(pageName);
            this.updateContent(content);
            this.applyPageStyles(pageName);
            this.initializePageModules(pageName);
            this.currentPage = pageName;
            
            // Navigation'ı güncelle
            this.updateActiveNavigation(pageName);
            
        } catch (error) {
            console.error('Page load error:', error);
            this.showError('Sayfa yüklenirken bir hata oluştu');
        } finally {
            this.hideLoading();
            this.isLoading = false;
        }
    }

    /**
     * Sayfa içeriğini fetch et - cache ile
     */
    async fetchPageContent(pageName) {
        const cacheKey = `page_${pageName}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const response = await fetch(`/pages/${pageName}.html`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const content = await response.text();
        this.cache.set(cacheKey, content);
        
        return content;
    }

    /**
     * İçeriği güncelle - optimize edilmiş DOM manipülasyonu
     */
    updateContent(content) {
        const contentElement = document.getElementById('content');
        if (!contentElement) return;

        // DocumentFragment kullanarak performansı artır
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }

        // Tek seferde DOM güncelle
        contentElement.innerHTML = '';
        contentElement.appendChild(fragment);
    }

    /**
     * Sayfa stillerini uygula
     */
    applyPageStyles(pageName) {
        const styles = {
            Home: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#ffffff' },
            Filmler: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#ffffff' },
            Hakkinda: { background: 'linear-gradient(135deg, #5a67d8 0%, #667eea 100%)', color: '#ffffff' },
            Profil: { background: 'linear-gradient(135deg, #5a67d8 0%, #667eea 100%)', color: '#ffffff' },
            Kayıt: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#ffffff' },
            Giriş: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#ffffff' }
        };

        const style = styles[pageName] || styles.Home;
        Object.assign(document.body.style, style);
    }

    /**
     * Sayfa modüllerini başlat
     */
    initializePageModules(pageName) {
        console.log('Initializing modules for page:', pageName);
        
        // Sayfa özel modülleri başlat
        switch(pageName.toLowerCase()) {
            case 'filmler':
                if (this.modules.has('films')) {
                    this.modules.get('films').init();
                }
                break;
            case 'giriş':
                // Auth sayfaları için özel başlatma
                this.initializeAuthPage('login');
                break;
            case 'kayıt':
                // Auth sayfaları için özel başlatma
                this.initializeAuthPage('register');
                break;
            case 'profil':
                if (this.modules.has('ui')) {
                    this.modules.get('ui').init();
                }
                break;
            default:
                // Genel modülleri başlat
                this.modules.forEach((module, name) => {
                    if (typeof module.init === 'function') {
                        module.init();
                    }
                });
                break;
        }
    }

    /**
     * Auth sayfalarını başlat
     */
    initializeAuthPage(type) {
        console.log('Initializing auth page:', type);
        
        // Auth CSS dosyasını dinamik olarak yükle
        this.loadAuthCSS();
        
        // Auth JS dosyasını dinamik olarak yükle
        this.loadAuthJS(type);
        
        // Auth fonksiyonlarını başlat - daha uzun timeout
        setTimeout(() => {
            if (type === 'login' && typeof initializeLoginForm === 'function') {
                console.log('Calling initializeLoginForm...');
                initializeLoginForm();
            } else if (type === 'register' && typeof initializeRegisterForm === 'function') {
                console.log('Calling initializeRegisterForm...');
                initializeRegisterForm();
            } else {
                console.error('Auth function not found:', type);
            }
        }, 500);
    }

    /**
     * Auth CSS dosyasını dinamik olarak yükle
     */
    loadAuthCSS() {
        // CSS dosyasının zaten yüklenip yüklenmediğini kontrol et
        if (document.querySelector('link[href*="auth.css"]')) {
            console.log('Auth CSS already loaded');
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/auth.css';
        link.onload = () => console.log('Auth CSS loaded successfully');
        link.onerror = () => console.error('Failed to load auth CSS');
        document.head.appendChild(link);
    }

    /**
     * Auth JS dosyasını dinamik olarak yükle
     */
    loadAuthJS(type) {
        const scriptId = type === 'login' ? 'login-js' : 'register-js';
        const scriptSrc = type === 'login' ? 'js/login.js' : 'js/register.js';
        
        // Script dosyasının zaten yüklenip yüklenmediğini kontrol et
        if (document.getElementById(scriptId)) {
            console.log(`${type} JS already loaded`);
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = scriptSrc;
        script.onload = () => console.log(`${type} JS loaded successfully`);
        script.onerror = () => console.error(`Failed to load ${type} JS`);
        document.head.appendChild(script);
    }

    /**
     * DOM ready handler
     */
    handleDOMReady() {
        console.log('DOM ready, initializing modules...');
        this.modules.forEach((module, name) => {
            if (typeof module.onDOMReady === 'function') {
                module.onDOMReady();
            }
        });
        
        // Navigation modülünü başlat
        if (this.modules.has('navigation')) {
            this.modules.get('navigation').init();
        }
    }

    /**
     * Resize handler - debounced
     */
    handleResize() {
        this.modules.forEach(module => {
            if (typeof module.onResize === 'function') {
                module.onResize();
            }
        });
    }

    /**
     * Keyboard handler
     */
    handleKeydown(event) {
        if (event.key === 'Escape') {
            this.closeModals();
        }
    }

    /**
     * Loading göstergesi
     */
    showLoading() {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.querySelector('.loading-overlay');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * Hata göstergesi
     */
    showError(message) {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `<div class="error-message">${message}</div>`;
        }
    }

    /**
     * Aktif navigation'ı güncelle
     */
    updateActiveNavigation(pageName) {
        // Tüm aktif sınıfları temizle
        document.querySelectorAll('.nav-link.active, .mobile-nav-link.active').forEach(link => {
            link.classList.remove('active');
        });

        // Mevcut sayfayı aktif yap
        const activeLinks = document.querySelectorAll(`[data-page="${pageName}"]`);
        activeLinks.forEach(link => {
            link.classList.add('active');
        });
    }

    /**
     * Modal'ları kapat
     */
    closeModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Debounce utility
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Event listener yönetimi
     */
    addEventListener(element, event, handler, options = {}) {
        const key = `${element}_${event}`;
        if (this.eventListeners.has(key)) {
            element.removeEventListener(event, this.eventListeners.get(key));
        }
        element.addEventListener(event, handler, options);
        this.eventListeners.set(key, handler);
    }

    removeEventListener(element, event) {
        const key = `${element}_${event}`;
        const handler = this.eventListeners.get(key);
        if (handler) {
            element.removeEventListener(event, handler);
            this.eventListeners.delete(key);
        }
    }

    /**
     * Auth işlemleri
     */
    togglePasswordVisibility(input, toggle) {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        const icon = toggle.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
        
        // Animation effect
        toggle.style.transform = 'scale(1.1)';
        setTimeout(() => {
            toggle.style.transform = 'scale(1)';
        }, 150);
    }

    handleSocialAuth(provider, action) {
        console.log(`${provider} ${action} initiated`);
        this.showNotification(`${provider} ile ${action} başlatılıyor...`, 'info');
        
        // Simulate social auth
        setTimeout(() => {
            this.showNotification(`${provider} ile ${action} başarılı!`, 'success');
            setTimeout(() => {
                this.loadPage('Home');
            }, 1500);
        }, 2000);
    }

    handleLoginSubmit(form) {
        const button = form.querySelector('.auth-button');
        button.classList.add('loading');
        
        const username = form.querySelector('#username').value;
        const password = form.querySelector('#password').value;
        const remember = form.querySelector('#remember')?.checked || false;
        
        // Validation
        if (!username || !password) {
            this.showNotification('Lütfen tüm alanları doldurun', 'error');
            button.classList.remove('loading');
            return;
        }
        
        // Simulate login
        setTimeout(() => {
            button.classList.remove('loading');
            this.showNotification('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
            setTimeout(() => {
                this.loadPage('Home');
            }, 1500);
        }, 2000);
    }

    handleRegisterSubmit(form) {
        const button = form.querySelector('.auth-button');
        button.classList.add('loading');
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Validation
        if (!data.firstName || !data.lastName || !data.username || !data.email || !data.password || !data.confirmPassword) {
            this.showNotification('Lütfen tüm alanları doldurun', 'error');
            button.classList.remove('loading');
            return;
        }
        
        if (data.password !== data.confirmPassword) {
            this.showNotification('Şifreler eşleşmiyor', 'error');
            button.classList.remove('loading');
            return;
        }
        
        // Simulate registration
        setTimeout(() => {
            button.classList.remove('loading');
            this.showNotification('Hesap başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...', 'success');
            setTimeout(() => {
                this.loadPage('Giriş');
            }, 1500);
        }, 2000);
    }

    handleUsernameValidation(input) {
        const value = input.value;
        const hint = document.getElementById('usernameHint');
        
        if (!hint) return;
        
        if (value.length > 0) {
            hint.classList.add('show');
            if (value.length >= 3) {
                hint.classList.add('success');
                hint.classList.remove('error');
                hint.innerHTML = '<i class="fas fa-check-circle"></i> Kullanıcı adı uygun';
            } else {
                hint.classList.add('error');
                hint.classList.remove('success');
                hint.innerHTML = '<i class="fas fa-exclamation-circle"></i> En az 3 karakter olmalıdır';
            }
        } else {
            hint.classList.remove('show', 'success', 'error');
        }
    }

    handlePasswordStrength(input) {
        const password = input.value;
        const strength = document.getElementById('passwordStrength');
        
        if (!strength) return;
        
        if (password.length > 0) {
            strength.classList.add('show');
            const strengthLevel = this.calculatePasswordStrength(password);
            this.updatePasswordStrength(strengthLevel, strength);
        } else {
            strength.classList.remove('show');
        }
    }

    handlePasswordMatch() {
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const matchHint = document.getElementById('passwordMatch');
        
        if (!matchHint) return;
        
        if (confirmPassword.length > 0) {
            matchHint.classList.add('show');
            if (password === confirmPassword) {
                matchHint.classList.add('success');
                matchHint.classList.remove('error');
                matchHint.innerHTML = '<i class="fas fa-check-circle"></i> Şifreler eşleşiyor';
            } else {
                matchHint.classList.add('error');
                matchHint.classList.remove('success');
                matchHint.innerHTML = '<i class="fas fa-exclamation-circle"></i> Şifreler eşleşmiyor';
            }
        } else {
            matchHint.classList.remove('show', 'success', 'error');
        }
    }

    handleCheckboxChange(checkbox) {
        const wrapper = checkbox.closest('.checkbox-wrapper');
        if (wrapper) {
            const customCheckbox = wrapper.querySelector('.custom-checkbox');
            if (customCheckbox) {
                customCheckbox.classList.toggle('checked', checkbox.checked);
            }
        }
    }

    /**
     * Film işlemleri
     */
    handleFilmCardClick(card, event) {
        const filmTitle = card.querySelector('.film-title')?.textContent;
        if (filmTitle) {
            this.showNotification(`${filmTitle} filmi seçildi`, 'info');
        }
    }

    handleGenreFilter(genre) {
        console.log('Genre filter:', genre);
        // Genre filtreleme işlemi
        if (this.modules.has('films')) {
            this.modules.get('films').filterByGenre(genre);
        }
    }

    handleSliderNavigation(slider, direction) {
        const sliderWrapper = slider.querySelector('.slider-wrapper');
        if (!sliderWrapper) return;
        
        const scrollAmount = 300;
        const currentScroll = sliderWrapper.scrollLeft;
        const newScroll = direction === 'next' 
            ? currentScroll + scrollAmount 
            : currentScroll - scrollAmount;
        
        sliderWrapper.scrollTo({
            left: newScroll,
            behavior: 'smooth'
        });
    }

    /**
     * Utility fonksiyonları
     */
    calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        if (strength <= 2) return 'weak';
        if (strength <= 3) return 'fair';
        if (strength <= 4) return 'good';
        return 'strong';
    }

    updatePasswordStrength(strength, strengthElement) {
        const fill = strengthElement.querySelector('.strength-fill');
        const text = strengthElement.querySelector('.strength-text');
        
        if (fill) {
            fill.className = `strength-fill ${strength}`;
        }
        
        if (text) {
            const strengthTexts = {
                weak: 'Zayıf',
                fair: 'Orta',
                good: 'İyi',
                strong: 'Güçlü'
            };
            text.textContent = strengthTexts[strength] || 'Şifre gücü';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add styles if not exists
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    padding: 1rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    max-width: 300px;
                    animation: slideIn 0.3s ease;
                }
                .notification-success { border-left: 4px solid #10b981; }
                .notification-error { border-left: 4px solid #ef4444; }
                .notification-info { border-left: 4px solid #3b82f6; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Global app instance
window.app = new CinemaHubApp(); 