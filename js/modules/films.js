/**
 * Films Module
 * Film kartları, slider'lar ve genre filtrelerini yönetir
 */

class FilmsModule {
    constructor(app) {
        this.app = app;
        this.filmData = this.initializeFilmData();
        this.currentGenre = 'all';
        this.sliders = new Map();
        this.renderedCards = new Set();
    }

    init() {
        this.setupEventDelegation();
        this.loadFilmCards();
        this.initializeGenreTabs();
        this.initializeSliders();
    }

    /**
     * Film verilerini başlat
     */
    initializeFilmData() {
        return {
            romantik: [
                { id: 1, title: "Titanic", year: 1997, rating: 8.5, image: "../img/kom.png", genre: "Romantik", reviews: 1250000 },
                { id: 2, title: "La La Land", year: 2016, rating: 8.0, image: "../img/han.png", genre: "Romantik", reviews: 450000 },
                { id: 3, title: "500 Days of Summer", year: 2009, rating: 7.7, image: "../img/nine.png", genre: "Romantik", reviews: 380000 },
                { id: 4, title: "The Notebook", year: 2004, rating: 7.8, image: "../img/terr.png", genre: "Romantik", reviews: 520000 }
            ],
            korku: [
                { id: 5, title: "The Shining", year: 1980, rating: 8.4, image: "../img/kom.png", genre: "Korku", reviews: 890000 },
                { id: 6, title: "A Nightmare on Elm Street", year: 1984, rating: 7.5, image: "../img/han.png", genre: "Korku", reviews: 320000 },
                { id: 7, title: "Halloween", year: 1978, rating: 7.7, image: "../img/nine.png", genre: "Korku", reviews: 280000 },
                { id: 8, title: "The Exorcist", year: 1973, rating: 8.0, image: "../img/terr.png", genre: "Korku", reviews: 410000 }
            ],
            komedi: [
                { id: 9, title: "The Hangover", year: 2009, rating: 7.7, image: "../img/kom.png", genre: "Komedi", reviews: 680000 },
                { id: 10, title: "Superbad", year: 2007, rating: 7.6, image: "../img/han.png", genre: "Komedi", reviews: 420000 },
                { id: 11, title: "Bridesmaids", year: 2011, rating: 6.8, image: "../img/nine.png", genre: "Komedi", reviews: 310000 },
                { id: 12, title: "The 40-Year-Old Virgin", year: 2005, rating: 7.3, image: "../img/terr.png", genre: "Komedi", reviews: 380000 }
            ],
            anime: [
                { id: 13, title: "Spirited Away", year: 2001, rating: 8.6, image: "../img/kom.png", genre: "Anime", reviews: 720000 },
                { id: 14, title: "My Neighbor Totoro", year: 1988, rating: 8.2, image: "../img/han.png", genre: "Anime", reviews: 280000 },
                { id: 15, title: "Akira", year: 1988, rating: 8.0, image: "../img/nine.png", genre: "Anime", reviews: 190000 },
                { id: 16, title: "Ghost in the Shell", year: 1995, rating: 8.0, image: "../img/terr.png", genre: "Anime", reviews: 210000 }
            ],
            macera: [
                { id: 17, title: "Indiana Jones", year: 1981, rating: 8.4, image: "../img/kom.png", genre: "Macera", reviews: 950000 },
                { id: 18, title: "The Mummy", year: 1999, rating: 7.0, image: "../img/han.png", genre: "Macera", reviews: 420000 },
                { id: 19, title: "National Treasure", year: 2004, rating: 6.9, image: "../img/nine.png", genre: "Macera", reviews: 380000 },
                { id: 20, title: "The Goonies", year: 1985, rating: 7.8, image: "../img/terr.png", genre: "Macera", reviews: 310000 }
            ],
            aksiyon: [
                { id: 21, title: "Die Hard", year: 1988, rating: 8.2, image: "../img/kom.png", genre: "Aksiyon", reviews: 780000 },
                { id: 22, title: "Mad Max: Fury Road", year: 2015, rating: 8.1, image: "../img/han.png", genre: "Aksiyon", reviews: 890000 },
                { id: 23, title: "John Wick", year: 2014, rating: 7.4, image: "../img/nine.png", genre: "Aksiyon", reviews: 520000 },
                { id: 24, title: "The Matrix", year: 1999, rating: 8.7, image: "../img/terr.png", genre: "Aksiyon", reviews: 1800000 }
            ],
            dram: [
                { id: 25, title: "The Shawshank Redemption", year: 1994, rating: 9.3, image: "../img/kom.png", genre: "Dram", reviews: 2500000 },
                { id: 26, title: "Forrest Gump", year: 1994, rating: 8.8, image: "../img/han.png", genre: "Dram", reviews: 1200000 },
                { id: 27, title: "The Green Mile", year: 1999, rating: 8.6, image: "../img/nine.png", genre: "Dram", reviews: 1100000 },
                { id: 28, title: "Schindler's List", year: 1993, rating: 8.9, image: "../img/terr.png", genre: "Dram", reviews: 1400000 }
            ]
        };
    }

    /**
     * Event delegation kurulumu
     */
    setupEventDelegation() {
        document.addEventListener('click', this.handleFilmEvents.bind(this));
        document.addEventListener('mouseenter', this.handleFilmHover.bind(this));
        document.addEventListener('mouseleave', this.handleFilmLeave.bind(this));
    }

    /**
     * Genre filtreleme - App.js'den çağrılır
     */
    filterByGenre(genre) {
        console.log('Filtering by genre:', genre);
        this.currentGenre = genre;
        this.showGenre(genre);
    }

    /**
     * Film event handler
     */
    handleFilmEvents(event) {
        const target = event.target;

        // Film kartı tıklama
        const filmCard = target.closest('.film-card');
        if (filmCard) {
            const filmId = filmCard.getAttribute('data-film-id');
            this.handleFilmCardClick(filmId, event);
        }

        // Genre tab tıklama
        const genreTab = target.closest('.genre-tab');
        if (genreTab) {
            event.preventDefault();
            const genre = genreTab.getAttribute('data-genre');
            this.showGenre(genre);
        }

        // Slider buton tıklama
        const sliderBtn = target.closest('.slider-btn');
        if (sliderBtn) {
            event.preventDefault();
            const direction = sliderBtn.classList.contains('prev-btn') ? 'prev' : 'next';
            const genre = this.getSliderGenre(sliderBtn);
            if (genre) {
                this.slideGenre(genre, direction);
            }
        }
    }

    /**
     * Film hover handler
     */
    handleFilmHover(event) {
        const filmCard = event.target.closest('.film-card');
        if (filmCard) {
            filmCard.classList.add('hover');
        }
    }

    /**
     * Film leave handler
     */
    handleFilmLeave(event) {
        const filmCard = event.target.closest('.film-card');
        if (filmCard) {
            filmCard.classList.remove('hover');
        }
    }

    /**
     * Film kartı tıklama
     */
    handleFilmCardClick(filmId, event) {
        console.log('Film kartına tıklandı:', filmId);
        // Film detay sayfasına yönlendir
        // this.app.loadPage('FilmDetay');
    }

    /**
     * Film kartlarını yükle - optimize edilmiş
     */
    loadFilmCards() {
        console.log('Film kartları yükleniyor...');
        
        Object.keys(this.filmData).forEach(genre => {
            const slider = document.getElementById(`${genre}-slider`);
            if (slider) {
                this.renderFilmCards(genre, slider);
            }
        });
    }

    /**
     * Film kartlarını render et - DocumentFragment ile optimize
     */
    renderFilmCards(genre, container) {
        const fragment = document.createDocumentFragment();
        
        this.filmData[genre].forEach(film => {
            const cardElement = this.createFilmCardElement(film);
            fragment.appendChild(cardElement);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
        
        console.log(`${genre} türü için ${this.filmData[genre].length} film yüklendi`);
    }

    /**
     * Film kartı elementi oluştur
     */
    createFilmCardElement(film) {
        const card = document.createElement('div');
        card.className = 'film-card';
        card.setAttribute('data-film-id', film.id);
        
        card.innerHTML = `
            <div class="film-poster">
                <img src="${film.image}" alt="${film.title}" loading="lazy">
            </div>
            <div class="film-details">
                <div class="film-info">
                    <h3 class="film-title">${film.title}</h3>
                    <p class="film-genre">${film.genre}</p>
                </div>
                <div class="film-rating">
                    <div class="stars">
                        <i class="fas fa-star"></i>
                        <span>${film.rating}</span>
                    </div>
                    <span class="review-count">${film.reviews.toLocaleString('tr-TR')} değerlendirme</span>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Genre tab'larını başlat
     */
    initializeGenreTabs() {
        const genreTabs = document.querySelectorAll('.genre-tab');
        genreTabs.forEach(tab => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                const genre = tab.getAttribute('data-genre');
                this.showGenre(genre);
            });
        });
    }

    /**
     * Genre göster
     */
    showGenre(genre) {
        console.log(`${genre} türü gösteriliyor...`);
        
        // Aktif tab'ı güncelle
        document.querySelectorAll('.genre-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-genre') === genre);
        });

        if (genre === 'all') {
            this.showAllGenres();
        } else {
            this.showSingleGenre(genre);
        }

        this.currentGenre = genre;
    }

    /**
     * Tüm türleri göster
     */
    showAllGenres() {
        document.querySelectorAll('.genre-section').forEach(section => {
            section.style.display = 'block';
        });
        
        // Slider'ları sıfırla
        this.sliders.forEach((slider, genre) => {
            slider.reset();
        });
    }

    /**
     * Tek tür göster
     */
    showSingleGenre(genre) {
        document.querySelectorAll('.genre-section').forEach(section => {
            section.style.display = section.getAttribute('data-genre') === genre ? 'block' : 'none';
        });

        // Grid görünümü için film kartlarını yeniden render et
        const gridContainer = document.getElementById('active-genre-grid');
        if (gridContainer) {
            this.renderFilmGrid(genre, gridContainer);
        }
    }

    /**
     * Film grid'i render et
     */
    renderFilmGrid(genre, container) {
        const fragment = document.createDocumentFragment();
        
        this.filmData[genre].forEach(film => {
            const cardElement = this.createFilmCardElement(film);
            fragment.appendChild(cardElement);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    /**
     * Slider'ları başlat
     */
    initializeSliders() {
        Object.keys(this.filmData).forEach(genre => {
            const slider = document.getElementById(`${genre}-slider`);
            if (slider) {
                this.sliders.set(genre, new FilmSlider(slider, genre, this));
            }
        });
    }

    /**
     * Slider genre'unu al
     */
    getSliderGenre(button) {
        const slider = button.closest('.slider-container');
        if (slider) {
            const sliderElement = slider.querySelector('.film-slider');
            return sliderElement?.id?.replace('-slider', '');
        }
        return null;
    }

    /**
     * Genre kaydır
     */
    slideGenre(genre, direction) {
        const slider = this.sliders.get(genre);
        if (slider) {
            slider.slide(direction);
        }
    }



    /**
     * Tüm filmleri al
     */
    getAllFilms() {
        const allFilms = [];
        Object.values(this.filmData).forEach(films => {
            allFilms.push(...films);
        });
        return allFilms;
    }

    /**
     * Resize handler
     */
    onResize() {
        this.sliders.forEach(slider => {
            slider.updateLayout();
        });
    }
}

/**
 * Film Slider Class
 */
class FilmSlider {
    constructor(element, genre, module) {
        this.element = element;
        this.genre = genre;
        this.module = module;
        this.currentIndex = 0;
        this.itemsPerView = this.calculateItemsPerView();
        this.totalItems = this.element.children.length;
        
        this.init();
    }

    init() {
        this.updateSliderButtons();
        this.setupTouchSupport();
    }

    calculateItemsPerView() {
        const width = window.innerWidth;
        if (width < 480) return 1;
        if (width < 768) return 2;
        if (width < 1024) return 3;
        return 4;
    }

    slide(direction) {
        if (direction === 'prev') {
            this.currentIndex = Math.max(0, this.currentIndex - 1);
        } else {
            this.currentIndex = Math.min(this.totalItems - this.itemsPerView, this.currentIndex + 1);
        }
        
        this.updateTransform();
        this.updateSliderButtons();
    }

    updateTransform() {
        const translateX = -this.currentIndex * (200 + 24); // card width + gap
        this.element.style.transform = `translateX(${translateX}px)`;
    }

    updateSliderButtons() {
        const prevBtn = this.element.parentElement.querySelector('.prev-btn');
        const nextBtn = this.element.parentElement.querySelector('.next-btn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentIndex === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentIndex >= this.totalItems - this.itemsPerView;
        }
    }

    setupTouchSupport() {
        let startX = 0;
        let currentX = 0;

        this.element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        this.element.addEventListener('touchmove', (e) => {
            currentX = e.touches[0].clientX;
        });

        this.element.addEventListener('touchend', () => {
            const diff = startX - currentX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.slide('next');
                } else {
                    this.slide('prev');
                }
            }
        });
    }

    reset() {
        this.currentIndex = 0;
        this.updateTransform();
        this.updateSliderButtons();
    }

    updateLayout() {
        this.itemsPerView = this.calculateItemsPerView();
        this.updateSliderButtons();
    }
} 