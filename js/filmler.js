// Filmler sayfası için ana fonksiyonlar
console.log('filmler.js yüklendi');

// Film verileri
const filmData = {
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

// Film kartı oluşturma fonksiyonu
function createFilmCard(film) {
    return `
        <div class="film-card" data-film-id="${film.id}">
            <div class="film-poster">
                <img src="${film.image}" alt="${film.title}">
                <div class="film-overlay">
                    <div class="overlay-buttons">
                        <button class="rate-btn-small" onclick="openRatingModal(${film.id}, '${film.title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-star"></i>
                            Puanla
                        </button>
                        <button class="comment-btn-small" onclick="openCommentModal(${film.id}, '${film.title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-comment"></i>
                            Yorum
                        </button>
                    </div>
                </div>
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
        </div>
    `;
}

// Film kartlarını yükleme fonksiyonu
function loadFilmCards() {
    console.log('Film kartları yükleniyor...');
    
    // Her tür için film kartlarını yükle
    Object.keys(filmData).forEach(genre => {
        const slider = document.getElementById(`${genre}-slider`);
        if (slider) {
            slider.innerHTML = '';
            filmData[genre].forEach(film => {
                const cardHTML = createFilmCard(film);
                slider.innerHTML += cardHTML;
            });
            console.log(`${genre} türü için ${filmData[genre].length} film yüklendi`);
        } else {
            console.warn(`${genre}-slider elementi bulunamadı`);
        }
    });
    
    // Film kartlarının yüklendiğini doğrula
    setTimeout(() => {
        const allCards = document.querySelectorAll('.film-card');
        console.log(`Toplam ${allCards.length} film kartı yüklendi`);
    }, 100);
}

// Filmler sayfasını başlatma fonksiyonu
function initializeFilms() {
    console.log('Filmler başlatılıyor...');
    
    // DOM'un hazır olduğundan emin ol
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            loadFilmCards();
            initializeGenreTabs();
            attachFilmEventListeners();
        });
    } else {
        // DOM zaten hazır
        loadFilmCards();
        initializeGenreTabs();
        attachFilmEventListeners();
    }
    
    console.log('Filmler başlatma tamamlandı');
}

// Genre tab'larını başlatma
function initializeGenreTabs() {
    const genreTabs = document.querySelectorAll('.genre-tab');
    
    genreTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const genre = this.getAttribute('data-genre');
            
            // Active class'ını güncelle
            genreTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Genre görünümünü güncelle
            showGenre(genre);
        });
    });
}

// Genre görünümünü gösterme
function showGenre(genre) {
    console.log(`${genre} türü gösteriliyor...`);
    
    if (genre === 'all') {
        // Tüm türleri göster
        document.querySelectorAll('.genre-section').forEach(section => {
            section.style.display = 'block';
        });
    } else {
        // Sadece seçili türü göster
        document.querySelectorAll('.genre-section').forEach(section => {
            if (section.getAttribute('data-genre') === genre) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }
}

// Rating modal'ını açma
function openRatingModal(filmId, filmTitle) {
    console.log(`Rating modal açılıyor: ${filmTitle}`);
    
    const modal = document.getElementById('ratingModal');
    const title = document.getElementById('modalFilmTitle');
    
    if (modal && title) {
        title.textContent = filmTitle;
        modal.style.display = 'flex';
        
        // Modal'ı açma animasyonu
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }
}

// Rating modal'ını kapatma
function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Yorum modal'ını açma
function openCommentModal(filmId, filmTitle) {
    console.log(`Comment modal açılıyor: ${filmTitle}`);
    
    const modal = document.getElementById('commentModal');
    const title = document.getElementById('commentModalTitle');
    
    if (modal && title) {
        title.textContent = filmTitle;
        modal.style.display = 'flex';
        
        // Modal'ı açma animasyonu
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }
}

// Yorum modal'ını kapatma
function closeCommentModal() {
    const modal = document.getElementById('commentModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Event listener'ları ekleme (Event delegation ile)
function attachFilmEventListeners() {
    console.log('Film event listener\'ları event delegation ile ekleniyor...');
    
    // Event delegation for film interactions
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // Film kartlarına tıklama
        const filmCard = target.closest('.film-card');
        if (filmCard) {
            const filmId = filmCard.getAttribute('data-film-id');
            console.log(`Film kartına tıklandı: ${filmId}`);
        }
        
        // Rating butonlarına tıklama
        const ratingBtn = target.closest('.rating-btn');
        if (ratingBtn) {
            event.stopPropagation();
            const filmCard = ratingBtn.closest('.film-card');
            if (filmCard) {
                const filmId = filmCard.getAttribute('data-film-id');
                const filmTitle = filmCard.querySelector('.film-title')?.textContent || 'Film';
                openRatingModal(filmId, filmTitle);
            }
        }
        
        // Modal kapatma butonları
        if (target.closest('.close-modal, .cancel-btn')) {
            closeRatingModal();
            closeCommentModal();
        }
    });
    
    console.log('Event delegation attached for film interactions');
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', function() {
    console.log('filmler.js DOMContentLoaded tetiklendi');
    setTimeout(() => {
        initializeFilms();
    }, 100);
});

// Global fonksiyonlar (HTML'den çağrılabilir)
window.initializeFilms = initializeFilms;
window.loadFilmCards = loadFilmCards;
window.openRatingModal = openRatingModal;
window.closeRatingModal = closeRatingModal;
window.openCommentModal = openCommentModal;
window.closeCommentModal = closeCommentModal;
