// Filmler sayfası için ana fonksiyonlar
console.log('filmler.js yüklendi');

// Film verileri
const filmData = {
    romantik: [
        { id: 1, title: "Titanic", year: 1997, rating: 8.5, image: "../img/kom.png" },
        { id: 2, title: "La La Land", year: 2016, rating: 8.0, image: "../img/han.png" },
        { id: 3, title: "500 Days of Summer", year: 2009, rating: 7.7, image: "../img/nine.png" },
        { id: 4, title: "The Notebook", year: 2004, rating: 7.8, image: "../img/terr.png" }
    ],
    korku: [
        { id: 5, title: "The Shining", year: 1980, rating: 8.4, image: "../img/kom.png" },
        { id: 6, title: "A Nightmare on Elm Street", year: 1984, rating: 7.5, image: "../img/han.png" },
        { id: 7, title: "Halloween", year: 1978, rating: 7.7, image: "../img/nine.png" },
        { id: 8, title: "The Exorcist", year: 1973, rating: 8.0, image: "../img/terr.png" }
    ],
    komedi: [
        { id: 9, title: "The Hangover", year: 2009, rating: 7.7, image: "../img/kom.png" },
        { id: 10, title: "Superbad", year: 2007, rating: 7.6, image: "../img/han.png" },
        { id: 11, title: "Bridesmaids", year: 2011, rating: 6.8, image: "../img/nine.png" },
        { id: 12, title: "The 40-Year-Old Virgin", year: 2005, rating: 7.3, image: "../img/terr.png" }
    ],
    anime: [
        { id: 13, title: "Spirited Away", year: 2001, rating: 8.6, image: "../img/kom.png" },
        { id: 14, title: "My Neighbor Totoro", year: 1988, rating: 8.2, image: "../img/han.png" },
        { id: 15, title: "Akira", year: 1988, rating: 8.0, image: "../img/nine.png" },
        { id: 16, title: "Ghost in the Shell", year: 1995, rating: 8.0, image: "../img/terr.png" }
    ],
    macera: [
        { id: 17, title: "Indiana Jones", year: 1981, rating: 8.4, image: "../img/kom.png" },
        { id: 18, title: "The Mummy", year: 1999, rating: 7.0, image: "../img/han.png" },
        { id: 19, title: "National Treasure", year: 2004, rating: 6.9, image: "../img/nine.png" },
        { id: 20, title: "The Goonies", year: 1985, rating: 7.8, image: "../img/terr.png" }
    ],
    aksiyon: [
        { id: 21, title: "Die Hard", year: 1988, rating: 8.2, image: "../img/kom.png" },
        { id: 22, title: "Mad Max: Fury Road", year: 2015, rating: 8.1, image: "../img/han.png" },
        { id: 23, title: "John Wick", year: 2014, rating: 7.4, image: "../img/nine.png" },
        { id: 24, title: "The Matrix", year: 1999, rating: 8.7, image: "../img/terr.png" }
    ],
    dram: [
        { id: 25, title: "The Shawshank Redemption", year: 1994, rating: 9.3, image: "../img/kom.png" },
        { id: 26, title: "Forrest Gump", year: 1994, rating: 8.8, image: "../img/han.png" },
        { id: 27, title: "The Green Mile", year: 1999, rating: 8.6, image: "../img/nine.png" },
        { id: 28, title: "Schindler's List", year: 1993, rating: 8.9, image: "../img/terr.png" }
    ]
};

// Film kartı oluşturma fonksiyonu
function createFilmCard(film) {
    return `
        <div class="film-card" data-film-id="${film.id}">
            <div class="film-image">
                <img src="${film.image}" alt="${film.title}">
                <div class="film-overlay">
                    <button class="rating-btn" onclick="openRatingModal(${film.id}, '${film.title}')">
                        <i class="fas fa-star"></i>
                        Puanla
                    </button>
                </div>
            </div>
            <div class="film-info">
                <h3 class="film-title">${film.title}</h3>
                <div class="film-meta">
                    <span class="film-year">${film.year}</span>
                    <span class="film-rating">
                        <i class="fas fa-star"></i>
                        ${film.rating}
                    </span>
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
                slider.innerHTML += createFilmCard(film);
            });
            console.log(`${genre} türü için ${filmData[genre].length} film yüklendi`);
        }
    });
}

// Filmler sayfasını başlatma fonksiyonu
function initializeFilms() {
    console.log('Filmler başlatılıyor...');
    
    // Film kartlarını yükle
    loadFilmCards();
    
    // Genre tab'larını başlat
    initializeGenreTabs();
    
    // Event listener'ları ekle
    attachFilmEventListeners();
    
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

// Event listener'ları ekleme
function attachFilmEventListeners() {
    console.log('Film event listener\'ları ekleniyor...');
    
    // Film kartlarına tıklama
    const filmCards = document.querySelectorAll('.film-card');
    filmCards.forEach(card => {
        card.addEventListener('click', function() {
            const filmId = this.getAttribute('data-film-id');
            console.log(`Film kartına tıklandı: ${filmId}`);
        });
    });
    
    // Rating butonlarına tıklama
    const ratingButtons = document.querySelectorAll('.rating-btn');
    ratingButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const filmCard = this.closest('.film-card');
            const filmId = filmCard.getAttribute('data-film-id');
            const filmTitle = filmCard.querySelector('.film-title').textContent;
            openRatingModal(filmId, filmTitle);
        });
    });
    
    // Modal kapatma butonları
    const closeButtons = document.querySelectorAll('.close-modal, .cancel-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeRatingModal);
    });
    
    console.log(`${filmCards.length} film kartı ve ${ratingButtons.length} rating butonu için event listener eklendi`);
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
