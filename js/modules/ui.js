/**
 * UI Module
 * Genel UI işlevlerini ve yardımcı fonksiyonları yönetir
 */

class UIModule {
    constructor(app) {
        this.app = app;
        this.toasts = [];
        this.loadingStates = new Map();
    }

    init() {
        this.setupGlobalUI();
        this.setupAnimations();
        this.setupLazyLoading();
    }

    /**
     * Global UI kurulumu
     */
    setupGlobalUI() {
        this.setupScrollToTop();
        this.setupKeyboardShortcuts();
        this.setupThemeSupport();
    }

    /**
     * Scroll to top butonu
     */
    setupScrollToTop() {
        const scrollBtn = document.createElement('button');
        scrollBtn.className = 'scroll-to-top';
        scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollBtn.style.display = 'none';
        document.body.appendChild(scrollBtn);

        // Scroll event listener
        window.addEventListener('scroll', this.app.debounce(() => {
            if (window.pageYOffset > 300) {
                scrollBtn.style.display = 'block';
            } else {
                scrollBtn.style.display = 'none';
            }
        }, 100));

        // Click event
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /**
     * Klavye kısayolları
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + K: Arama
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                this.focusSearch();
            }

            // Ctrl/Cmd + /: Navigasyon
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault();
                this.showNavigationHelp();
            }
        });
    }

    /**
     * Tema desteği - Kaldırıldı
     */
    setupThemeSupport() {
        // Tema özelliği kaldırıldı
    }

    /**
     * Temayı ayarla - Kaldırıldı
     */
    setTheme(theme) {
        // Tema özelliği kaldırıldı
    }

    /**
     * Animasyonları kur
     */
    setupAnimations() {
        // Intersection Observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements with animation classes
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Lazy loading kurulumu
     */
    setupLazyLoading() {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    /**
     * Toast mesajı göster
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // Animasyon
        setTimeout(() => toast.classList.add('show'), 100);

        // Kapatma butonu
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hideToast(toast);
        });

        // Otomatik kapatma
        setTimeout(() => this.hideToast(toast), duration);

        this.toasts.push(toast);
    }

    /**
     * Toast'u gizle
     */
    hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts = this.toasts.filter(t => t !== toast);
        }, 300);
    }

    /**
     * Toast ikonu al
     */
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Loading state yönetimi
     */
    showLoading(element, text = 'Yükleniyor...') {
        const loadingId = Math.random().toString(36);
        this.loadingStates.set(loadingId, { element, originalContent: element.innerHTML });

        element.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <span>${text}</span>
            </div>
        `;

        return loadingId;
    }

    hideLoading(loadingId) {
        const state = this.loadingStates.get(loadingId);
        if (state) {
            state.element.innerHTML = state.originalContent;
            this.loadingStates.delete(loadingId);
        }
    }

    /**
     * Arama alanına odaklan
     */
    focusSearch() {
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    /**
     * Navigasyon yardımı göster
     */
    showNavigationHelp() {
        const helpModal = document.createElement('div');
        helpModal.className = 'help-modal modal active';
        helpModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Klavye Kısayolları</h3>
                    <button class="close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <kbd>Ctrl/Cmd + K</kbd>
                            <span>Arama</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl/Cmd + /</kbd>
                            <span>Bu yardım</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>Modal kapat</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(helpModal);

        // Kapatma olayları
        helpModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('help-modal') || e.target.closest('.close-modal')) {
                helpModal.remove();
            }
        });
    }

    /**
     * Confirmation dialog göster
     */
    showConfirm(message, onConfirm, onCancel) {
        const confirmModal = document.createElement('div');
        confirmModal.className = 'confirm-modal modal active';
        confirmModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Onay</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn">İptal</button>
                    <button class="confirm-btn">Onayla</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmModal);

        // Event listeners
        confirmModal.querySelector('.confirm-btn').addEventListener('click', () => {
            confirmModal.remove();
            if (onConfirm) onConfirm();
        });

        confirmModal.querySelector('.cancel-btn').addEventListener('click', () => {
            confirmModal.remove();
            if (onCancel) onCancel();
        });

        confirmModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('confirm-modal')) {
                confirmModal.remove();
                if (onCancel) onCancel();
            }
        });
    }

    /**
     * Progress bar göster
     */
    showProgress(container, progress = 0) {
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.innerHTML = `
            <div class="progress-fill" style="width: ${progress}%"></div>
            <div class="progress-text">${Math.round(progress)}%</div>
        `;

        container.appendChild(progressBar);
        return progressBar;
    }

    /**
     * Progress bar güncelle
     */
    updateProgress(progressBar, progress) {
        const fill = progressBar.querySelector('.progress-fill');
        const text = progressBar.querySelector('.progress-text');
        
        if (fill) fill.style.width = `${progress}%`;
        if (text) text.textContent = `${Math.round(progress)}%`;
    }

    /**
     * Tooltip göster
     */
    showTooltip(element, text, position = 'top') {
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${position}`;
        tooltip.textContent = text;
        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let left, top;

        switch (position) {
            case 'top':
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                top = rect.top - tooltipRect.height - 8;
                break;
            case 'bottom':
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                top = rect.bottom + 8;
                break;
            case 'left':
                left = rect.left - tooltipRect.width - 8;
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
            case 'right':
                left = rect.right + 8;
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;

        // Otomatik kaldır
        setTimeout(() => tooltip.remove(), 3000);
    }

    /**
     * Resize handler
     */
    onResize() {
        // Responsive davranışları güncelle
        this.updateResponsiveElements();
    }

    /**
     * Responsive elementleri güncelle
     */
    updateResponsiveElements() {
        const width = window.innerWidth;
        
        // Mobile menu'yu kapat
        if (width > 768) {
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
            }
        }

        // Grid layout'u güncelle
        const grids = document.querySelectorAll('.film-grid');
        grids.forEach(grid => {
            if (width < 600) {
                grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else if (width < 900) {
                grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            } else {
                grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
            }
        });
    }
} 