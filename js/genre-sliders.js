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
    const slider = document.getElementById(`${genre}-slider`);
    if (!slider) return;

    const cards = slider.querySelectorAll('.film-card');
    const totalCards = cards.length;
    const cardWidth = cards[0].offsetWidth;
    const gap = 24; // 1.5rem = 24px
    const moveDistance = cardWidth + gap;

    let currentIndex = genreSliders[genre].currentIndex;
    const itemsPerView = genreSliders[genre].itemsPerView;

    if (direction === 'next') {
        if (currentIndex < totalCards - itemsPerView) {
            currentIndex++;
        }
    } else if (direction === 'prev') {
        if (currentIndex > 0) {
            currentIndex--;
        }
    }

    genreSliders[genre].currentIndex = currentIndex;
    const translateX = -currentIndex * moveDistance;
    slider.style.transform = `translateX(${translateX}px)`;

    // Update button states
    updateSliderButtons(genre, currentIndex, totalCards, itemsPerView);
}

function updateSliderButtons(genre, currentIndex, totalCards, itemsPerView) {
    const section = document.querySelector(`#${genre}-slider`).closest('.genre-section');
    const prevBtn = section.querySelector('.prev-btn');
    const nextBtn = section.querySelector('.next-btn');

    // Update prev button
    if (currentIndex === 0) {
        prevBtn.disabled = true;
        prevBtn.style.opacity = '0.5';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.opacity = '1';
    }

    // Update next button
    if (currentIndex >= totalCards - itemsPerView) {
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

// Initialize sliders when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSliders();
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