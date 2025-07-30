// Filmler Page Specific JavaScript

// Film data - örnek veriler
const filmData = {
    romantik: [
        { id: 1, title: "Aşk Hikayesi", genre: "Romantik", year: 2023, rating: 4.5, image: "img/kom.png" },
        { id: 2, title: "Kalp Atışları", genre: "Romantik", year: 2022, rating: 4.2, image: "img/han.png" },
        { id: 3, title: "Sonsuz Aşk", genre: "Romantik", year: 2023, rating: 4.7, image: "img/nine.png" },
        { id: 4, title: "Güzel Hikaye", genre: "Romantik", year: 2022, rating: 4.0, image: "img/terr.png" },
        { id: 5, title: "Aşk Masalı", genre: "Romantik", year: 2023, rating: 4.3, image: "img/kom.png" }
    ],
    korku: [
        { id: 6, title: "Karanlık Gece", genre: "Korku", year: 2023, rating: 4.1, image: "img/han.png" },
        { id: 7, title: "Gizli Tehlike", genre: "Korku", year: 2022, rating: 4.4, image: "img/nine.png" },
        { id: 8, title: "Korku Tüneli", genre: "Korku", year: 2023, rating: 3.9, image: "img/terr.png" },
        { id: 9, title: "Gece Korkusu", genre: "Korku", year: 2022, rating: 4.2, image: "img/kom.png" },
        { id: 10, title: "Karanlık Sırlar", genre: "Korku", year: 2023, rating: 4.0, image: "img/han.png" }
    ],
    komedi: [
        { id: 11, title: "Güldür Güldür", genre: "Komedi", year: 2023, rating: 4.6, image: "img/nine.png" },
        { id: 12, title: "Kahkaha Gecesi", genre: "Komedi", year: 2022, rating: 4.3, image: "img/terr.png" },
        { id: 13, title: "Eğlenceli Macera", genre: "Komedi", year: 2023, rating: 4.1, image: "img/kom.png" },
        { id: 14, title: "Gülme Krizi", genre: "Komedi", year: 2022, rating: 4.4, image: "img/han.png" },
        { id: 15, title: "Komik Hikaye", genre: "Komedi", year: 2023, rating: 4.2, image: "img/nine.png" }
    ],
    anime: [
        { id: 16, title: "Anime Dünyası", genre: "Anime", year: 2023, rating: 4.8, image: "img/terr.png" },
        { id: 17, title: "Fantastik Anime", genre: "Anime", year: 2022, rating: 4.5, image: "img/kom.png" },
        { id: 18, title: "Anime Macerası", genre: "Anime", year: 2023, rating: 4.3, image: "img/han.png" },
        { id: 19, title: "Anime Kahramanı", genre: "Anime", year: 2022, rating: 4.6, image: "img/nine.png" },
        { id: 20, title: "Anime Hikayesi", genre: "Anime", year: 2023, rating: 4.4, image: "img/terr.png" }
    ],
    macera: [
        { id: 21, title: "Büyük Macera", genre: "Macera", year: 2023, rating: 4.7, image: "img/kom.png" },
        { id: 22, title: "Tehlikeli Yol", genre: "Macera", year: 2022, rating: 4.2, image: "img/han.png" },
        { id: 23, title: "Macera Dünyası", genre: "Macera", year: 2023, rating: 4.4, image: "img/nine.png" },
        { id: 24, title: "Heyecan Dolu", genre: "Macera", year: 2022, rating: 4.1, image: "img/terr.png" },
        { id: 25, title: "Macera Ruhu", genre: "Macera", year: 2023, rating: 4.3, image: "img/kom.png" }
    ],
    aksiyon: [
        { id: 26, title: "Aksiyon Dolu", genre: "Aksiyon", year: 2023, rating: 4.6, image: "img/han.png" },
        { id: 27, title: "Hızlı ve Öfkeli", genre: "Aksiyon", year: 2022, rating: 4.4, image: "img/nine.png" },
        { id: 28, title: "Aksiyon Gecesi", genre: "Aksiyon", year: 2023, rating: 4.2, image: "img/terr.png" },
        { id: 29, title: "Aksiyon Kahramanı", genre: "Aksiyon", year: 2022, rating: 4.5, image: "img/kom.png" },
        { id: 30, title: "Aksiyon Dünyası", genre: "Aksiyon", year: 2023, rating: 4.3, image: "img/han.png" }
    ],
    dram: [
        { id: 31, title: "Dramatik Hikaye", genre: "Dram", year: 2023, rating: 4.8, image: "img/nine.png" },
        { id: 32, title: "Duygusal Yol", genre: "Dram", year: 2022, rating: 4.5, image: "img/terr.png" },
        { id: 33, title: "Dram Dünyası", genre: "Dram", year: 2023, rating: 4.3, image: "img/kom.png" },
        { id: 34, title: "Dramatik An", genre: "Dram", year: 2022, rating: 4.6, image: "img/han.png" },
        { id: 35, title: "Dram Hikayesi", genre: "Dram", year: 2023, rating: 4.4, image: "img/nine.png" }
    ]
};

// Film kartı oluşturma fonksiyonu
function createFilmCard(film) {
    const stars = '★'.repeat(Math.floor(film.rating)) + '☆'.repeat(5 - Math.floor(film.rating));
    
    return `
        <div class="film-card" data-film-id="${film.id}" onclick="openRatingModal(${film.id})">
            <div class="film-poster">
                <img src="${film.image}" alt="${film.title}" loading="lazy">
            </div>
            <div class="film-details">
                <div class="film-title">${film.title}</div>
                <div class="film-genre">${film.genre}</div>
                <div class="film-rating">
                    <div class="stars">${stars}</div>
                    <div class="review-count">${film.rating}/5</div>
                </div>
            </div>
        </div>
    `;
}

// Tüm genre slider'larını doldur
function fillAllGenreSliders() {
    Object.keys(filmData).forEach(genre => {
        const slider = document.getElementById(`${genre}-slider`);
        if (slider) {
            slider.innerHTML = '';
            filmData[genre].forEach(film => {
                slider.innerHTML += createFilmCard(film);
            });
        }
    });
}

// Film kartlarına tıklama olayları ekle
function attachFilmCardEvents() {
    const filmCards = document.querySelectorAll('.film-card');
    filmCards.forEach(card => {
        card.addEventListener('click', function(e) {
            const filmId = this.dataset.filmId;
            openRatingModal(filmId);
        });
    });
}

// Rating modal'ını aç
function openRatingModal(filmId) {
    const film = findFilmById(filmId);
    if (!film) return;

    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('modalFilmTitle').textContent = film.title;
        document.getElementById('modalFilmId').value = filmId;
        
        // Rating yıldızlarını sıfırla
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => star.classList.remove('active'));
    }
}

// Film ID'sine göre film bul
function findFilmById(filmId) {
    for (const genre in filmData) {
        const film = filmData[genre].find(f => f.id == filmId);
        if (film) return film;
    }
    return null;
}

// Genre tab'larına tıklama olayları ekle
function attachGenreTabEvents() {
    const genreTabs = document.querySelectorAll('.genre-tab');
    genreTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const genre = this.dataset.genre;
            showGenre(genre);
        });
    });
}

// Genre gösterme fonksiyonu
function showGenre(genre) {
    // Tüm tab'ların active class'ını kaldır
    document.querySelectorAll('.genre-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Tıklanan tab'ı active yap
    const clickedTab = document.querySelector(`[data-genre="${genre}"]`);
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
    
    // Tüm genre section'larını gizle
    document.querySelectorAll('.genre-section').forEach(section => {
        section.style.display = 'none';
    });
    
    if (genre === 'all') {
        // Tüm genre'leri göster
        document.querySelectorAll('.genre-section').forEach(section => {
            section.style.display = 'block';
        });
        document.getElementById('all-genres-section').style.display = 'block';
        document.querySelector('.single-genre-section').style.display = 'none';
    } else {
        // Sadece seçilen genre'ü göster
        document.getElementById('all-genres-section').style.display = 'none';
        const singleGenreSection = document.querySelector('.single-genre-section');
        singleGenreSection.style.display = 'block';
        
        const genreTitle = document.getElementById('active-genre-title');
        const genreGrid = document.getElementById('active-genre-grid');
        
        if (genreTitle && genreGrid) {
            genreTitle.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
            genreGrid.innerHTML = '';
            
            if (filmData[genre]) {
                filmData[genre].forEach(film => {
                    genreGrid.innerHTML += createFilmCard(film);
                });
            }
        }
    }
}

// Filmler sayfasını başlat
function initializeFilms() {
    console.log('Filmler sayfası başlatılıyor...');
    
    // Film verilerini yükle
    fillAllGenreSliders();
    
    // Event listener'ları ekle
    attachFilmCardEvents();
    attachGenreTabEvents();
    
    // Slider'ları başlat
    if (typeof initializeSliders === 'function') {
        initializeSliders();
    }
    
    // Slider butonlarına event listener'ları ekle
    attachSliderButtonEvents();
    
    console.log('Filmler sayfası başlatma tamamlandı');
}

// Slider butonlarına event listener'ları ekle
function attachSliderButtonEvents() {
    const sliderButtons = document.querySelectorAll('.slider-btn');
    sliderButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const sliderContainer = this.closest('.slider-container');
            const slider = sliderContainer.querySelector('.film-slider');
            const genre = slider.id.replace('-slider', '');
            const direction = this.classList.contains('prev-btn') ? 'prev' : 'next';
            
            console.log('Slider button clicked:', genre, direction);
            slideGenre(genre, direction);
        });
    });
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', function() {
    // Filmler sayfasında mıyız kontrol et
    if (document.querySelector('.films-page')) {
        console.log('Filmler sayfası tespit edildi, başlatılıyor...');
        setTimeout(() => {
            initializeFilms();
        }, 100);
    }
});

// Slider fonksiyonu
function slideGenre(genre, direction) {
    console.log('slideGenre called:', genre, direction);
    
    const slider = document.getElementById(`${genre}-slider`);
    if (!slider) {
        console.error('Slider not found:', genre);
        return;
    }

    const cards = slider.querySelectorAll('.film-card');
    const totalCards = cards.length;
    
    if (totalCards === 0) {
        console.log('No cards found in slider');
        return;
    }
    
    const cardWidth = cards[0].offsetWidth;
    const gap = 24; // 1.5rem = 24px
    const moveDistance = cardWidth + gap;

    // Slider state'ini kontrol et
    if (!window.genreSliders) {
        window.genreSliders = {};
    }
    if (!window.genreSliders[genre]) {
        window.genreSliders[genre] = { currentIndex: 0, itemsPerView: 5 };
    }

    let currentIndex = window.genreSliders[genre].currentIndex;

    // Ekranda kaç kart tam olarak görünüyor?
    const sliderContainer = slider.closest('.slider-container');
    const containerWidth = sliderContainer.offsetWidth;
    const visibleCards = Math.floor((containerWidth + gap) / moveDistance);
    const maxIndex = Math.max(0, totalCards - visibleCards);

    // Artık bir tıklamada tüm görünür kart kadar kaydır
    const step = visibleCards > 0 ? visibleCards : 1;

    if (direction === 'next') {
        if (currentIndex < maxIndex) {
            currentIndex = Math.min(currentIndex + step, maxIndex);
        }
    } else if (direction === 'prev') {
        if (currentIndex > 0) {
            currentIndex = Math.max(currentIndex - step, 0);
        }
    }

    window.genreSliders[genre].currentIndex = currentIndex;
    const translateX = -currentIndex * moveDistance;
    slider.style.transform = `translateX(${translateX}px)`;

    console.log('Slider moved:', genre, 'to index:', currentIndex, 'translateX:', translateX);

    // Update button states
    updateSliderButtons(genre, currentIndex, totalCards, visibleCards);
}

// Slider butonlarını güncelle
function updateSliderButtons(genre, currentIndex, totalCards, visibleCards) {
    const sliderContainer = document.querySelector(`#${genre}-slider`).closest('.slider-container');
    const prevBtn = sliderContainer.querySelector('.prev-btn');
    const nextBtn = sliderContainer.querySelector('.next-btn');

    if (!prevBtn || !nextBtn) return;

    // Update prev button
    if (currentIndex === 0) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.3';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.opacity = '1';
    }

    // Update next button
    if (currentIndex >= Math.max(0, totalCards - visibleCards)) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.3';
    } else {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
    }
}

// Global fonksiyon olarak tanımla (diğer script'lerden erişim için)
window.initializeFilms = initializeFilms;
window.openRatingModal = openRatingModal;
window.slideGenre = slideGenre; 