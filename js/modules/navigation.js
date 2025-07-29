/**
 * Navigation Module
 * Navbar ve sayfa geçişlerini yönetir
 */

class NavigationModule {
    constructor(app) {
        this.app = app;
        this.currentActivePage = null;
        this.mobileMenuOpen = false;
    }

    init() {
        this.setupNavbar();
        this.setupMobileMenu();
        this.updateActiveNavigation();
    }

    /**
     * Navbar kurulumu
     */
    setupNavbar() {
        this.setupSearchBar();
        this.setupUserActions();
        this.setupResponsiveBehavior();
    }

    /**
     * Arama çubuğu kurulumu
     */
    setupSearchBar() {
        const searchForm = document.querySelector('form[action=""]');
        if (searchForm) {
            searchForm.addEventListener('submit', this.handleSearch.bind(this));
        }

        // Arama önerileri için debounced input
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.addEventListener('input', this.app.debounce(this.handleSearchInput.bind(this), 300));
        }
    }

    /**
     * Kullanıcı aksiyonları
     */
    setupUserActions() {
        const loginBtn = document.querySelector('.login-btn');
        const registerBtn = document.querySelector('.register-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.app.loadPage('Giriş'));
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.app.loadPage('Kayıt'));
        }
    }

    /**
     * Responsive davranış
     */
    setupResponsiveBehavior() {
        const mobileToggle = document.getElementById('mobileToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }

        // Dışarı tıklama ile menüyü kapat
        document.addEventListener('click', (event) => {
            const navbar = document.querySelector('.modern-navbar');
            const mobileMenu = document.getElementById('mobileMenu');
            
            if (mobileMenu && mobileMenu.classList.contains('active') && 
                !navbar.contains(event.target)) {
                this.closeMobileMenu();
            }
        });
    }

    /**
     * Mobil menü kurulumu
     */
    setupMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            // Mobil menü linklerini ayarla
            const mobileLinks = mobileMenu.querySelectorAll('.mobile-nav-link');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    this.closeMobileMenu();
                });
            });
        }
    }

    /**
     * Aktif navigasyonu güncelle
     */
    updateActiveNavigation() {
        const currentPage = this.app.currentPage;
        if (!currentPage) return;

        // Tüm aktif sınıfları temizle
        document.querySelectorAll('.nav-link.active, .mobile-nav-link.active').forEach(link => {
            link.classList.remove('active');
        });

        // Mevcut sayfayı aktif yap
        const activeLinks = document.querySelectorAll(`[data-page="${currentPage}"]`);
        activeLinks.forEach(link => {
            link.classList.add('active');
        });

        this.currentActivePage = currentPage;
    }

    /**
     * Mobil menüyü aç/kapat
     */
    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileToggle = document.getElementById('mobileToggle');
        
        if (!mobileMenu || !mobileToggle) return;

        this.mobileMenuOpen = !this.mobileMenuOpen;
        
        if (this.mobileMenuOpen) {
            mobileMenu.classList.add('active');
            mobileToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            this.closeMobileMenu();
        }
    }

    /**
     * Mobil menüyü kapat
     */
    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileToggle = document.getElementById('mobileToggle');
        
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
        }
        
        if (mobileToggle) {
            mobileToggle.classList.remove('active');
        }
        
        document.body.style.overflow = '';
        this.mobileMenuOpen = false;
    }

    /**
     * Arama işlemi
     */
    handleSearch(event) {
        event.preventDefault();
        const searchInput = event.target.querySelector('input[type="search"]');
        const query = searchInput?.value.trim();
        
        if (query) {
            this.performSearch(query);
        }
    }

    /**
     * Arama input handler
     */
    handleSearchInput(event) {
        const query = event.target.value.trim();
        if (query.length >= 2) {
            this.showSearchSuggestions(query);
        } else {
            this.hideSearchSuggestions();
        }
    }

    /**
     * Arama yap
     */
    performSearch(query) {
        console.log('Searching for:', query);
        // Arama sonuçları sayfasına yönlendir
        this.app.loadPage('Filmler');
        // TODO: Arama sonuçlarını göster
    }

    /**
     * Arama önerilerini göster
     */
    showSearchSuggestions(query) {
        // Arama önerileri modal'ı göster
        const suggestions = this.getSearchSuggestions(query);
        this.displaySearchSuggestions(suggestions);
    }

    /**
     * Arama önerilerini gizle
     */
    hideSearchSuggestions() {
        const suggestions = document.querySelector('.search-suggestions');
        if (suggestions) {
            suggestions.remove();
        }
    }

    /**
     * Arama önerilerini al
     */
    getSearchSuggestions(query) {
        // Basit öneri sistemi - gerçek uygulamada API'den gelir
        const allFilms = this.getAllFilms();
        return allFilms.filter(film => 
            film.title.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
    }

    /**
     * Tüm filmleri al
     */
    getAllFilms() {
        const filmsModule = this.app.modules.get('films');
        return filmsModule ? filmsModule.getAllFilms() : [];
    }

    /**
     * Arama önerilerini göster
     */
    displaySearchSuggestions(suggestions) {
        this.hideSearchSuggestions();

        const searchContainer = document.querySelector('.navbar-actions form');
        if (!searchContainer) return;

        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'search-suggestions';
        suggestionsDiv.innerHTML = suggestions.map(film => `
            <div class="suggestion-item" data-film-id="${film.id}">
                <img src="${film.image}" alt="${film.title}">
                <div class="suggestion-info">
                    <div class="suggestion-title">${film.title}</div>
                    <div class="suggestion-year">${film.year}</div>
                </div>
            </div>
        `).join('');

        searchContainer.appendChild(suggestionsDiv);

        // Öneri tıklama olayları
        suggestionsDiv.addEventListener('click', (event) => {
            const item = event.target.closest('.suggestion-item');
            if (item) {
                const filmId = item.getAttribute('data-film-id');
                this.selectSearchSuggestion(filmId);
            }
        });
    }

    /**
     * Arama önerisini seç
     */
    selectSearchSuggestion(filmId) {
        this.hideSearchSuggestions();
        // Film detay sayfasına yönlendir
        this.app.loadPage('Filmler');
        // TODO: Film detaylarını göster
    }

    /**
     * Resize handler
     */
    onResize() {
        if (window.innerWidth > 768 && this.mobileMenuOpen) {
            this.closeMobileMenu();
        }
    }
} 