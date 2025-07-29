let currentFilmId = null;
let currentRating = 0;

// Rating sistemi başlatma fonksiyonu (Event delegation ile)
function initializeRating() {
    console.log('Rating sistemi event delegation ile başlatılıyor...');
    
    const ratingText = document.getElementById('ratingText');
    const commentText = document.getElementById('commentText');
    const charCount = document.getElementById('charCount');

    // Event delegation for star rating
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // Star click events
        if (target.closest('.star-rating i')) {
            const stars = document.querySelectorAll('.star-rating i');
            const clickedStar = target.closest('.star-rating i');
            const index = Array.from(stars).indexOf(clickedStar);
            
            currentRating = index + 1;
            setRatingText(currentRating);
            highlightStars(currentRating);
        }
    });

    // Event delegation for star hover
    document.addEventListener('mouseenter', function(event) {
        const target = event.target;
        
        if (target.closest('.star-rating i')) {
            const stars = document.querySelectorAll('.star-rating i');
            const hoveredStar = target.closest('.star-rating i');
            const index = Array.from(stars).indexOf(hoveredStar);
            
            highlightStars(index + 1);
        }
    });

    // Reset stars on mouse leave
    document.addEventListener('mouseleave', function(event) {
        const target = event.target;
        
        if (target.closest('.star-rating')) {
            highlightStars(currentRating);
        }
    });

    // Character counter
    if (commentText) {
        commentText.addEventListener('input', () => {
            const count = commentText.value.length;
            charCount.textContent = count;
            
            if (count > 450) {
                charCount.style.color = '#ef4444';
            } else if (count > 400) {
                charCount.style.color = '#f59e0b';
            } else {
                charCount.style.color = '#6b7280';
            }
        });
    }

    // Close modal on outside click
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        if (target.closest('.rating-modal') && target.classList.contains('rating-modal')) {
            closeRatingModal();
        }
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('ratingModal').classList.contains('active')) {
            closeRatingModal();
        }
    });
    
    console.log('Rating sistemi event delegation ile başlatma tamamlandı');
}

function openRatingModal(filmId, filmTitle) {
    currentFilmId = filmId;
    document.getElementById('modalFilmTitle').textContent = filmTitle;
    document.getElementById('ratingModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Reset form
    resetRatingForm();
}

function closeRatingModal() {
    document.getElementById('ratingModal').classList.remove('active');
    document.body.style.overflow = '';
    currentFilmId = null;
    currentRating = 0;
}

function resetRatingForm() {
    // Reset stars
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach(star => star.classList.remove('active'));
    
    // Reset text
    document.getElementById('ratingText').textContent = 'Puanınızı seçin';
    document.getElementById('commentText').value = '';
    document.getElementById('charCount').textContent = '0';
    
    currentRating = 0;
}

// Star rating functionality with event delegation
document.addEventListener('DOMContentLoaded', function() {
    const ratingText = document.getElementById('ratingText');
    const commentText = document.getElementById('commentText');
    const charCount = document.getElementById('charCount');

    // Event delegation for star rating
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // Star click events
        if (target.closest('.star-rating i')) {
            const stars = document.querySelectorAll('.star-rating i');
            const clickedStar = target.closest('.star-rating i');
            const index = Array.from(stars).indexOf(clickedStar);
            
            currentRating = index + 1;
            setRatingText(currentRating);
            highlightStars(currentRating);
        }
    });

    // Event delegation for star hover
    document.addEventListener('mouseenter', function(event) {
        const target = event.target;
        
        if (target.closest('.star-rating i')) {
            const stars = document.querySelectorAll('.star-rating i');
            const hoveredStar = target.closest('.star-rating i');
            const index = Array.from(stars).indexOf(hoveredStar);
            
            highlightStars(index + 1);
        }
    });

    // Reset stars on mouse leave
    document.addEventListener('mouseleave', function(event) {
        const target = event.target;
        
        if (target.closest('.star-rating')) {
            highlightStars(currentRating);
        }
    });

    // Character counter with event delegation
    if (commentText) {
        commentText.addEventListener('input', () => {
            const count = commentText.value.length;
            charCount.textContent = count;
            
            if (count > 450) {
                charCount.style.color = '#ef4444';
            } else if (count > 400) {
                charCount.style.color = '#f59e0b';
            } else {
                charCount.style.color = '#6b7280';
            }
        });
    }

    // Close modal on outside click with event delegation
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        if (target.closest('.rating-modal') && target.classList.contains('rating-modal')) {
            closeRatingModal();
        }
    });

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('ratingModal').classList.contains('active')) {
            closeRatingModal();
        }
    });
});

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function setRatingText(rating) {
    const ratingTexts = {
        1: '1/10 - Berbat',
        2: '2/10 - Çok Kötü',
        3: '3/10 - Kötü',
        4: '4/10 - Zayıf',
        5: '5/10 - Orta',
        6: '6/10 - İyi',
        7: '7/10 - Güzel',
        8: '8/10 - Çok İyi',
        9: '9/10 - Mükemmel',
        10: '10/10 - Harika'
    };
    
    document.getElementById('ratingText').textContent = ratingTexts[rating] || 'Puanınızı seçin';
}

function submitRating() {
    if (currentRating === 0) {
        alert('Lütfen bir puan seçin!');
        return;
    }

    const comment = document.getElementById('commentText').value.trim();
    
    // Simulate API call
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Gönderiliyor...';

    setTimeout(() => {
        alert(`Film puanlandı!\nPuan: ${currentRating}/10\nYorum: ${comment || 'Yorum yok'}`);
        closeRatingModal();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Gönder';
    }, 1500);
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('ratingModal');
    if (e.target === modal) {
        closeRatingModal();
    }
});

