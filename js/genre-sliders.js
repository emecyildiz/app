// Genre Slider Management
const genreSliders = {
    romantik: { currentIndex: 0, itemsPerView: 5 },
    korku: { currentIndex: 0, itemsPerView: 5 },
    komedi: { currentIndex: 0, itemsPerView: 5 },
    anime: { currentIndex: 0, itemsPerView: 5 },
    macera: { currentIndex: 0, itemsPerView: 5 },
    aksiyon: { currentIndex: 0, itemsPerView: 5 },
    dram: { currentIndex: 0, itemsPerView: 5 }
};

function slideGenre(genre, direction) {
    if (genre === 'active') {
        genre = window.currentActiveGenre || 'romantik';
    }
    const slider = document.getElementById(`${genre}-slider`);
    if (!slider) return;

    const cards = slider.querySelectorAll('.film-card');
    const totalCards = cards.length;
    const cardWidth = cards[0].offsetWidth;
    const gap = 24; // 1.5rem = 24px
    const moveDistance = cardWidth + gap;

    let currentIndex = genreSliders[genre].currentIndex;

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

    genreSliders[genre].currentIndex = currentIndex;
    const translateX = -currentIndex * moveDistance;
    slider.style.transform = `translateX(${translateX}px)`;

    // Update button states
    updateSliderButtons(genre, currentIndex, totalCards, visibleCards);
}

function updateSliderButtons(genre, currentIndex, totalCards, visibleCards) {
    const sliderContainer = document.querySelector(`#${genre}-slider`).closest('.slider-container');
    const prevBtn = sliderContainer.querySelector('.prev-btn');
    const nextBtn = sliderContainer.querySelector('.next-btn');

    // Update prev button
    if (currentIndex === 0) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.5';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.opacity = '1';
    }

    // Update next button
    if (currentIndex >= Math.max(0, totalCards - visibleCards)) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.5';
    } else {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
    }
}

function initializeSliders() {
    // Calculate items per view based on screen size
    const screenWidth = window.innerWidth;
    let itemsPerView;
    
    if (screenWidth < 480) {
        itemsPerView = 2;
    } else if (screenWidth < 768) {
        itemsPerView = 3;
    } else if (screenWidth < 1024) {
        itemsPerView = 4;
    } else {
        itemsPerView = 5;
    }

    // Update all genre sliders
    Object.keys(genreSliders).forEach(genre => {
        genreSliders[genre].itemsPerView = itemsPerView;
        genreSliders[genre].currentIndex = 0;
        
        const slider = document.getElementById(`${genre}-slider`);
        if (slider) {
            slider.style.transform = 'translateX(0px)';
            const cards = slider.querySelectorAll('.film-card');
            updateSliderButtons(genre, 0, cards.length, itemsPerView);
        }
    });
}

// Film verileri
const filmData = {
    romantik: [
        { id: 4,   title: 'Aşk Hikayesi',      genre: 'Romantik', img: '../img/kom.png',   rating: 8.1, reviews: 956 },
        { id: 5,   title: 'Kalp Çırpıntısı',   genre: 'Romantik', img: '../img/han.png',   rating: 7.9, reviews: 743 },
        { id: 6,   title: 'Sonsuz Aşk',        genre: 'Romantik', img: '../img/nine.png',  rating: 8.5, reviews: 1123 },
        { id: 7,   title: 'Aşkın Gücü',        genre: 'Romantik', img: '../img/terr.png',  rating: 7.6, reviews: 621 },
        { id: 104, title: 'Romantik Film 5',   genre: 'Romantik', img: '../img/kom.png',   rating: 7.8, reviews: 500 },
        { id: 105, title: 'Romantik Film 6',   genre: 'Romantik', img: '../img/han.png',   rating: 8.0, reviews: 600 },
        { id: 106, title: 'Romantik Film 7',   genre: 'Romantik', img: '../img/nine.png',  rating: 7.5, reviews: 700 },
        { id: 107, title: 'Romantik Film 8',   genre: 'Romantik', img: '../img/terr.png',  rating: 8.2, reviews: 800 },
        { id: 108, title: 'Romantik Film 9',   genre: 'Romantik', img: '../img/kom.png',   rating: 7.9, reviews: 900 },
        { id: 109, title: 'Romantik Film 10',  genre: 'Romantik', img: '../img/han.png',   rating: 8.3, reviews: 1000 },
        { id: 110, title: 'Romantik Film 11',  genre: 'Romantik', img: '../img/nine.png',  rating: 7.7, reviews: 1100 },
        { id: 111, title: 'Romantik Film 12',  genre: 'Romantik', img: '../img/terr.png',  rating: 8.1, reviews: 1200 },
        { id: 112, title: 'Romantik Film 13',  genre: 'Romantik', img: '../img/kom.png',   rating: 7.6, reviews: 1300 },
        { id: 113, title: 'Romantik Film 14',  genre: 'Romantik', img: '../img/han.png',   rating: 8.4, reviews: 1400 },
        { id: 114, title: 'Romantik Film 15',  genre: 'Romantik', img: '../img/nine.png',  rating: 7.8, reviews: 1500 },
    ],
    korku: [
        { id: 2,   title: 'Terrifier',         genre: 'Korku',    img: '../img/terr.png',  rating: 7.8, reviews: 892 },
        { id: 8,   title: 'Karanlık Orman',    genre: 'Korku',    img: '../img/nine.png',  rating: 8.2, reviews: 1456 },
        { id: 9,   title: 'Gece Kabusu',       genre: 'Korku',    img: '../img/han.png',   rating: 7.4, reviews: 687 },
        { id: 10,  title: 'Hayalet Ev',        genre: 'Korku',    img: '../img/kom.png',   rating: 8.0, reviews: 934 },
        { id: 202, title: 'Korku Film 5',      genre: 'Korku',    img: '../img/terr.png',  rating: 7.7, reviews: 500 },
        { id: 203, title: 'Korku Film 6',      genre: 'Korku',    img: '../img/nine.png',  rating: 8.1, reviews: 600 },
        { id: 204, title: 'Korku Film 7',      genre: 'Korku',    img: '../img/han.png',   rating: 7.6, reviews: 700 },
        { id: 205, title: 'Korku Film 8',      genre: 'Korku',    img: '../img/kom.png',   rating: 8.3, reviews: 800 },
        { id: 206, title: 'Korku Film 9',      genre: 'Korku',    img: '../img/terr.png',  rating: 7.9, reviews: 900 },
        { id: 207, title: 'Korku Film 10',     genre: 'Korku',    img: '../img/nine.png',  rating: 8.2, reviews: 1000 },
        { id: 208, title: 'Korku Film 11',     genre: 'Korku',    img: '../img/han.png',   rating: 7.5, reviews: 1100 },
        { id: 209, title: 'Korku Film 12',     genre: 'Korku',    img: '../img/kom.png',   rating: 8.0, reviews: 1200 },
        { id: 210, title: 'Korku Film 13',     genre: 'Korku',    img: '../img/terr.png',  rating: 7.8, reviews: 1300 },
        { id: 211, title: 'Korku Film 14',     genre: 'Korku',    img: '../img/nine.png',  rating: 8.4, reviews: 1400 },
        { id: 212, title: 'Korku Film 15',     genre: 'Korku',    img: '../img/han.png',   rating: 7.6, reviews: 1500 },
    ],
    komedi: [
        { id: 11,  title: 'Gülmece',           genre: 'Komedi',   img: '../img/kom.png',   rating: 8.7, reviews: 1789 },
        { id: 12,  title: 'Kahkaha Tufanı',    genre: 'Komedi',   img: '../img/han.png',   rating: 7.9, reviews: 1234 },
        { id: 13,  title: 'Komik Karışıklık',  genre: 'Komedi',   img: '../img/nine.png',  rating: 8.1, reviews: 987 },
        { id: 14,  title: 'Eğlence Zamanı',    genre: 'Komedi',   img: '../img/terr.png',  rating: 7.7, reviews: 756 },
        { id: 302, title: 'Komedi Film 5',     genre: 'Komedi',   img: '../img/kom.png',   rating: 7.8, reviews: 500 },
        { id: 303, title: 'Komedi Film 6',     genre: 'Komedi',   img: '../img/han.png',   rating: 8.0, reviews: 600 },
        { id: 304, title: 'Komedi Film 7',     genre: 'Komedi',   img: '../img/nine.png',  rating: 7.5, reviews: 700 },
        { id: 305, title: 'Komedi Film 8',     genre: 'Komedi',   img: '../img/terr.png',  rating: 8.2, reviews: 800 },
        { id: 306, title: 'Komedi Film 9',     genre: 'Komedi',   img: '../img/kom.png',   rating: 7.9, reviews: 900 },
        { id: 307, title: 'Komedi Film 10',    genre: 'Komedi',   img: '../img/han.png',   rating: 8.3, reviews: 1000 },
        { id: 308, title: 'Komedi Film 11',    genre: 'Komedi',   img: '../img/nine.png',  rating: 7.7, reviews: 1100 },
        { id: 309, title: 'Komedi Film 12',    genre: 'Komedi',   img: '../img/terr.png',  rating: 8.1, reviews: 1200 },
        { id: 310, title: 'Komedi Film 13',    genre: 'Komedi',   img: '../img/kom.png',   rating: 7.6, reviews: 1300 },
        { id: 311, title: 'Komedi Film 14',    genre: 'Komedi',   img: '../img/han.png',   rating: 8.4, reviews: 1400 },
        { id: 312, title: 'Komedi Film 15',    genre: 'Komedi',   img: '../img/nine.png',  rating: 7.8, reviews: 1500 },
    ],
    anime: [
        { id: 15,  title: 'Spirited Away',     genre: 'Anime',    img: '../img/nine.png',  rating: 9.2, reviews: 2456 },
        { id: 16,  title: 'Your Name',         genre: 'Anime',    img: '../img/kom.png',   rating: 8.9, reviews: 1876 },
        { id: 17,  title: 'Princess Mononoke', genre: 'Anime',    img: '../img/han.png',   rating: 8.8, reviews: 1543 },
        { id: 18,  title: 'Akira',             genre: 'Anime',    img: '../img/terr.png',  rating: 8.6, reviews: 1321 },
        { id: 402, title: 'Anime Film 5',      genre: 'Anime',    img: '../img/nine.png',  rating: 8.7, reviews: 500 },
        { id: 403, title: 'Anime Film 6',      genre: 'Anime',    img: '../img/kom.png',   rating: 8.5, reviews: 600 },
        { id: 404, title: 'Anime Film 7',      genre: 'Anime',    img: '../img/han.png',   rating: 8.2, reviews: 700 },
        { id: 405, title: 'Anime Film 8',      genre: 'Anime',    img: '../img/terr.png',  rating: 8.9, reviews: 800 },
        { id: 406, title: 'Anime Film 9',      genre: 'Anime',    img: '../img/nine.png',  rating: 8.8, reviews: 900 },
        { id: 407, title: 'Anime Film 10',     genre: 'Anime',    img: '../img/kom.png',   rating: 8.6, reviews: 1000 },
        { id: 408, title: 'Anime Film 11',     genre: 'Anime',    img: '../img/han.png',   rating: 8.4, reviews: 1100 },
        { id: 409, title: 'Anime Film 12',     genre: 'Anime',    img: '../img/terr.png',  rating: 8.3, reviews: 1200 },
        { id: 410, title: 'Anime Film 13',     genre: 'Anime',    img: '../img/nine.png',  rating: 8.5, reviews: 1300 },
        { id: 411, title: 'Anime Film 14',     genre: 'Anime',    img: '../img/kom.png',   rating: 8.7, reviews: 1400 },
        { id: 412, title: 'Anime Film 15',     genre: 'Anime',    img: '../img/han.png',   rating: 8.9, reviews: 1500 },
    ],
    macera: [
        { id: 19,  title: 'Hazine Avcıları',   genre: 'Macera',   img: '../img/han.png',   rating: 8.4, reviews: 1654 },
        { id: 20,  title: 'Kayıp Dünya',       genre: 'Macera',   img: '../img/nine.png',  rating: 7.8, reviews: 1098 },
        { id: 21,  title: 'Uzak Yolculuk',     genre: 'Macera',   img: '../img/kom.png',   rating: 8.0, reviews: 876 },
        { id: 22,  title: 'Vahşi Doğa',        genre: 'Macera',   img: '../img/terr.png',  rating: 7.6, reviews: 654 },
        { id: 502, title: 'Macera Film 5',     genre: 'Macera',   img: '../img/han.png',   rating: 8.1, reviews: 500 },
        { id: 503, title: 'Macera Film 6',     genre: 'Macera',   img: '../img/nine.png',  rating: 7.9, reviews: 600 },
        { id: 504, title: 'Macera Film 7',     genre: 'Macera',   img: '../img/kom.png',   rating: 8.2, reviews: 700 },
        { id: 505, title: 'Macera Film 8',     genre: 'Macera',   img: '../img/terr.png',  rating: 7.8, reviews: 800 },
        { id: 506, title: 'Macera Film 9',     genre: 'Macera',   img: '../img/han.png',   rating: 8.0, reviews: 900 },
        { id: 507, title: 'Macera Film 10',    genre: 'Macera',   img: '../img/nine.png',  rating: 7.7, reviews: 1000 },
        { id: 508, title: 'Macera Film 11',    genre: 'Macera',   img: '../img/kom.png',   rating: 8.3, reviews: 1100 },
        { id: 509, title: 'Macera Film 12',    genre: 'Macera',   img: '../img/terr.png',  rating: 7.6, reviews: 1200 },
        { id: 510, title: 'Macera Film 13',    genre: 'Macera',   img: '../img/han.png',   rating: 8.4, reviews: 1300 },
        { id: 511, title: 'Macera Film 14',    genre: 'Macera',   img: '../img/nine.png',  rating: 7.8, reviews: 1400 },
        { id: 512, title: 'Macera Film 15',    genre: 'Macera',   img: '../img/kom.png',   rating: 8.1, reviews: 1500 },
    ],
    aksiyon: [
        { id: 3,   title: 'Han Solo',          genre: 'Aksiyon',  img: '../img/han.png',   rating: 7.5, reviews: 678 },
        { id: 23,  title: 'Hızlı ve Öfkeli',   genre: 'Aksiyon',  img: '../img/nine.png',  rating: 8.3, reviews: 1987 },
        { id: 24,  title: 'Süper Kahraman',    genre: 'Aksiyon',  img: '../img/terr.png',  rating: 8.7, reviews: 2345 },
        { id: 25,  title: 'Savaşçı',           genre: 'Aksiyon',  img: '../img/kom.png',   rating: 7.9, reviews: 1234 },
        { id: 602, title: 'Aksiyon Film 5',    genre: 'Aksiyon',  img: '../img/han.png',   rating: 8.1, reviews: 500 },
        { id: 603, title: 'Aksiyon Film 6',    genre: 'Aksiyon',  img: '../img/nine.png',  rating: 7.9, reviews: 600 },
        { id: 604, title: 'Aksiyon Film 7',    genre: 'Aksiyon',  img: '../img/kom.png',   rating: 8.2, reviews: 700 },
        { id: 605, title: 'Aksiyon Film 8',    genre: 'Aksiyon',  img: '../img/terr.png',  rating: 7.8, reviews: 800 },
        { id: 606, title: 'Aksiyon Film 9',    genre: 'Aksiyon',  img: '../img/han.png',   rating: 8.0, reviews: 900 },
        { id: 607, title: 'Aksiyon Film 10',   genre: 'Aksiyon',  img: '../img/nine.png',  rating: 7.7, reviews: 1000 },
        { id: 608, title: 'Aksiyon Film 11',   genre: 'Aksiyon',  img: '../img/kom.png',   rating: 8.3, reviews: 1100 },
        { id: 609, title: 'Aksiyon Film 12',   genre: 'Aksiyon',  img: '../img/terr.png',  rating: 7.6, reviews: 1200 },
        { id: 610, title: 'Aksiyon Film 13',   genre: 'Aksiyon',  img: '../img/han.png',   rating: 8.4, reviews: 1300 },
        { id: 611, title: 'Aksiyon Film 14',   genre: 'Aksiyon',  img: '../img/nine.png',  rating: 7.8, reviews: 1400 },
        { id: 612, title: 'Aksiyon Film 15',   genre: 'Aksiyon',  img: '../img/kom.png',   rating: 8.1, reviews: 1500 },
    ],
    dram: [
        { id: 1,   title: 'District 9',        genre: 'Dram',     img: '../img/nine.png',  rating: 8.3, reviews: 1245 },
        { id: 26,  title: 'Hayatın Anlamı',    genre: 'Dram',     img: '../img/kom.png',   rating: 9.1, reviews: 2876 },
        { id: 27,  title: 'Aile Bağları',      genre: 'Dram',     img: '../img/han.png',   rating: 8.5, reviews: 1567 },
        { id: 28,  title: 'İnsan Doğası',      genre: 'Dram',     img: '../img/terr.png',  rating: 8.8, reviews: 1987 },
        { id: 702, title: 'Dram Film 5',       genre: 'Dram',     img: '../img/nine.png',  rating: 8.7, reviews: 500 },
        { id: 703, title: 'Dram Film 6',       genre: 'Dram',     img: '../img/kom.png',   rating: 8.5, reviews: 600 },
        { id: 704, title: 'Dram Film 7',       genre: 'Dram',     img: '../img/han.png',   rating: 8.2, reviews: 700 },
        { id: 705, title: 'Dram Film 8',       genre: 'Dram',     img: '../img/terr.png',  rating: 8.9, reviews: 800 },
        { id: 706, title: 'Dram Film 9',       genre: 'Dram',     img: '../img/nine.png',  rating: 8.8, reviews: 900 },
        { id: 707, title: 'Dram Film 10',      genre: 'Dram',     img: '../img/kom.png',   rating: 8.6, reviews: 1000 },
        { id: 708, title: 'Dram Film 11',      genre: 'Dram',     img: '../img/han.png',   rating: 8.4, reviews: 1100 },
        { id: 709, title: 'Dram Film 12',      genre: 'Dram',     img: '../img/terr.png',  rating: 8.3, reviews: 1200 },
        { id: 710, title: 'Dram Film 13',      genre: 'Dram',     img: '../img/nine.png',  rating: 8.5, reviews: 1300 },
        { id: 711, title: 'Dram Film 14',      genre: 'Dram',     img: '../img/kom.png',   rating: 8.7, reviews: 1400 },
        { id: 712, title: 'Dram Film 15',      genre: 'Dram',     img: '../img/han.png',   rating: 8.9, reviews: 1500 },
    ],
};

function createFilmCard(film) {
    return `
        <div class="film-card" data-film-id="${film.id}">
            <div class="film-poster">
                <img src="${film.img}" alt="Film Posteri">
                <div class="film-overlay">
                    <button class="rate-btn-small" onclick="openRatingModal(${film.id}, '${film.title.replace(/'/g, "\'")}' )">
                        <i class="fas fa-star"></i>
                        Puanla
                    </button>
                </div>
            </div>
            <div class="film-details">
                <h3 class="film-title">${film.title}</h3>
                <p class="film-genre">${film.genre}</p>
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

function attachGenreTabEvents() {
    document.querySelectorAll('.film-genre-navbar .genre-tab').forEach(btn => {
        // Önce eski event'ı kaldırmak için cloneNode kullan
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', function() {
            showGenre(this.dataset.genre);
        });
    });
}

function showGenre(genre) {
    const allSection = document.getElementById('all-genres-section');
    const singleSection = document.querySelector('.single-genre-section');
    if (genre === 'all') {
        fillAllGenreSliders();
        if (allSection) allSection.style.display = '';
        if (singleSection) singleSection.style.display = 'none';
        // Tüm sliderları başa al
        ['romantik','korku','komedi','anime','macera','aksiyon','dram'].forEach(g => {
            const slider = document.getElementById(`${g}-slider`);
            if (slider) slider.style.transform = 'translateX(0px)';
            genreSliders[g].currentIndex = 0;
            updateSliderButtons(g, 0, filmData[g].length, genreSliders[g].itemsPerView);
        });
    } else {
        if (allSection) allSection.style.display = 'none';
        if (singleSection) singleSection.style.display = '';
        // Başlık güncelle
        const title = document.getElementById('active-genre-title');
        if (title) {
            title.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
        }
        // Film kartlarını grid olarak güncelle
        const grid = document.getElementById('active-genre-grid');
        if (grid) {
            grid.innerHTML = filmData[genre].map(createFilmCard).join('');
        }
    }
    // Aktif sekme vurgusu
    document.querySelectorAll('.film-genre-navbar .genre-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.genre === genre);
    });
    window.currentActiveGenre = genre;
    attachGenreTabEvents();
}

// Sayfa yüklenince tüm türler ve sliderlar düzgün başlasın
function fillAllGenreSliders() {
    Object.keys(filmData).forEach(genre => {
        const slider = document.getElementById(`${genre}-slider`);
        if (slider) {
            slider.innerHTML = filmData[genre].map(createFilmCard).join('');
            slider.style.transform = 'translateX(0px)';
        }
    });
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    fillAllGenreSliders();
    initializeSliders();
    showGenre('all');
    attachGenreTabEvents();
}
document.addEventListener('DOMContentLoaded', function() {
    fillAllGenreSliders();
    initializeSliders();
    showGenre('all');
    attachGenreTabEvents();
});

// Reinitialize on window resize
window.addEventListener('resize', function() {
    initializeSliders();
});

// Touch/swipe support for mobile
let touchStartX = 0;
let touchEndX = 0;
let currentTouchGenre = null;

document.addEventListener('touchstart', function(e) {
    const slider = e.target.closest('.film-slider');
    if (slider) {
        touchStartX = e.changedTouches[0].screenX;
        currentTouchGenre = slider.id.replace('-slider', '');
    }
});

document.addEventListener('touchend', function(e) {
    if (currentTouchGenre) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        currentTouchGenre = null;
    }
});

function handleSwipe() {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX - touchStartX;

    if (Math.abs(swipeDistance) > swipeThreshold) {
        if (swipeDistance > 0) {
            // Swipe right - go to previous
            slideGenre(currentTouchGenre, 'prev');
        } else {
            // Swipe left - go to next
            slideGenre(currentTouchGenre, 'next');
        }
    }
}

// Eğer script dinamik yüklendiyse ve DOM zaten hazırsa sliderları başlat
if (document.readyState === "complete" || document.readyState === "interactive") {
    Object.keys(filmData).forEach(genre => {
        const slider = document.getElementById(`${genre}-slider`);
        if (slider) {
            slider.innerHTML = filmData[genre].map(createFilmCard).join('');
        }
    });
    initializeSliders();
}