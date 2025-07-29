    function loadPage(page){
        // Prevent multiple simultaneous page loads
        if (window.isLoadingPage) {
            console.log('Page load already in progress, ignoring request');
            return;
        }
        
        window.isLoadingPage = true;
        
        // Clear content first to prevent stacking
        const content = document.getElementById("content");
        content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><span style="margin-left: 10px;">Yükleniyor...</span></div>';
        
        // Apply loading styles
        document.body.style.opacity = '0.8';
        document.body.style.transition = 'opacity 0.3s ease';
        
        fetch(`/pages/${page}.html`)
        .then(res => res.text())
        .then(data => {
            // Clear content completely before loading new page
            content.innerHTML = '';
            
            // Load new page content
            content.innerHTML = data;
            
            // Apply page-specific styles
            applyPageStyles(page);
            
            // Restore body opacity
            document.body.style.opacity = '1';
            
                    // Handle specific page initializations
        if(page == "Filmler") {
            console.log('Initializing Filmler page...');
            
            // Clear any existing film-related scripts to prevent conflicts
            const existingScripts = document.querySelectorAll('script[src*="filmler"], script[src*="genre"]');
            existingScripts.forEach(script => {
                console.log('Removing existing script:', script.src);
                script.remove();
            });
            
            // Clear any existing film-related event listeners by cloning elements
            const filmCards = document.querySelectorAll('.film-card, .rating-btn, .genre-filter, .film-item, .rating-star, .genre-btn, .film-slider');
            filmCards.forEach(card => {
                const newCard = card.cloneNode(true);
                card.parentNode.replaceChild(newCard, card);
            });
            
            // Initialize film slider after DOM is ready
            setTimeout(() => {
                console.log('Initializing film slider...');
                initializeFilmSlider();
            }, 200);
            
            // Load filmler-specific scripts after a delay
            setTimeout(() => {
                console.log('Loading filmler scripts...');
                loadScript("js/filmler.js");
                loadScript("js/filmler-rating.js");
                loadScript("js/genre-sliders.js");
                
                // Re-attach film-specific event listeners after scripts load
                setTimeout(() => {
                    console.log('Attaching film event listeners...');
                    attachFilmEventListeners();
                }, 500);
            }, 400);
        } else if(page == "Profil"){
            // Load sidebar CSS if not already loaded
            if (!document.querySelector('link[href*="sidebar.css"]')) {
                const sidebarCSS = document.createElement('link');
                sidebarCSS.rel = 'stylesheet';
                sidebarCSS.href = 'css/sidebar.css';
                document.head.appendChild(sidebarCSS);
            }
            
            // Initialize sidebar functionality after a short delay to ensure DOM is ready
            setTimeout(() => {
                if (window.sidebarUtils) {
                    // Use the exported utility functions
                    window.sidebarUtils.initializeSidebar();
                    window.sidebarUtils.initializePhotoUpload();
                    window.sidebarUtils.initializeMenuItems();
                } else {
                    // Fallback: load the script if not already loaded
                    loadScript("js/sidebar.js");
                }
            }, 100);
        }
        
        // Re-attach event listeners for all buttons including newly loaded ones
        setTimeout(() => {
            attachNavbarEventListeners();
            window.isLoadingPage = false; // Allow new page loads
        }, 300);
    })
    .catch(error => {
        console.error('Error loading page:', error);
        content.innerHTML = '<h1>Sayfa yüklenirken bir hata oluştu</h1>';
        window.isLoadingPage = false; // Allow new page loads even on error
    });
}

// Apply page-specific styles to fix color conflicts
function applyPageStyles(page) {
    const body = document.body;
    const content = document.getElementById("content");
    
    // Clear all existing inline styles first to prevent accumulation
    body.removeAttribute('style');
    content.removeAttribute('style');
    
    // Reset body styles
    body.style.fontFamily = "'Inter', sans-serif";
    body.style.margin = "0";
    body.style.padding = "0";
    body.style.overflowX = "hidden";
    
    // Reset content styles
    content.style.background = "transparent";
    content.style.marginTop = "70px";
    content.style.minHeight = "calc(100vh - 70px)";
    
    // Apply page-specific background colors
    switch(page) {
        case "Home":
            body.style.background = "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)";
            body.style.color = "#fff";
            break;
        case "Filmler":
            body.style.background = "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)";
            body.style.color = "#fff";
            break;
        case "Hakkinda":
            body.style.background = "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)";
            body.style.color = "#1e293b";
            break;
        case "Profil":
            body.style.background = "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)";
            body.style.color = "#1e293b";
            break;
        case "Kayıt":
        case "Giriş":
            body.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
            body.style.color = "#fff";
            break;
        default:
            body.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
            body.style.color = "#fff";
            break;
    }
}

function loadScript(src){
    // Remove existing script if it exists to prevent conflicts
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
        console.log(`Removing existing script: ${src}`);
        existingScript.remove();
    }
    
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    
    // Add error handling
    script.onerror = function() {
        console.error(`Failed to load script: ${src}`);
    };
    
    script.onload = function() {
        console.log(`Script loaded successfully: ${src}`);
        
        // Special handling for sidebar script
        if (src.includes('sidebar.js') && window.sidebarUtils) {
            setTimeout(() => {
                window.sidebarUtils.initializeSidebar();
                window.sidebarUtils.initializePhotoUpload();
                window.sidebarUtils.initializeMenuItems();
            }, 50);
        }
        
        // Special handling for filmler scripts
        if (src.includes('filmler.js')) {
            setTimeout(() => {
                console.log('filmler.js loaded, re-initializing...');
                // Re-initialize film slider after script loads
                if (typeof initializeFilmSlider === 'function') {
                    initializeFilmSlider();
                }
                // Re-attach film event listeners
                attachFilmEventListeners();
            }, 200);
        }
        
        // Special handling for filmler-rating.js
        if (src.includes('filmler-rating.js')) {
            setTimeout(() => {
                console.log('filmler-rating.js loaded, re-attaching listeners...');
                // Re-attach film event listeners after rating script loads
                attachFilmEventListeners();
            }, 200);
        }
        
        // Special handling for genre-sliders.js
        if (src.includes('genre-sliders.js')) {
            setTimeout(() => {
                console.log('genre-sliders.js loaded, re-attaching listeners...');
                // Re-attach film event listeners after genre script loads
                attachFilmEventListeners();
            }, 200);
        }
    };
    
    document.body.appendChild(script);
}

async function loadComponent(id, file) {
    try {
        const response = await fetch(file);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        document.getElementById(id).innerHTML = html;
    } catch (error) {
        console.error('Error loading component:', error);
        document.getElementById(id).innerHTML = '<div>Component yüklenirken hata oluştu</div>';
    }
}

function attachNavbarEventListeners() {
    // Add event listeners for all navigation buttons
    const buttons = document.querySelectorAll(".btn, .giriş, .nav-link, .mobile-nav-link, .action-btn, .mobile-action-btn, .cta-button");
    
    buttons.forEach(item => {
        // Remove existing event listeners to prevent duplicates
        item.removeEventListener("click", handleNavigation);
        
        // Add new event listener with stronger binding
        item.addEventListener("click", handleNavigation, true);
        
        // Also add a backup event listener for buttons that might be dynamically added
        if (item.classList.contains('btn') || item.classList.contains('cta-button')) {
            item.addEventListener("click", function(e) {
                const page = this.getAttribute("data-page");
                if (page) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`Button clicked: ${page}`);
                    loadPage(page);
                    updateActiveNavigation(this);
                    closeMobileMenu();
                }
            }, true);
        }
    });
    
    console.log(`Attached event listeners to ${buttons.length} navigation buttons`);
}

function handleNavigation(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Prevent multiple rapid clicks
    if (this.disabled) {
        return;
    }
    
    // Disable button temporarily
    this.disabled = true;
    setTimeout(() => {
        this.disabled = false;
    }, 1000);
    
    const page = this.getAttribute("data-page");
    
    if (page) {
        console.log(`Loading page: ${page} from ${this.className}`);
        loadPage(page);
        
        // Update active states for navbar links only
        if (this.classList.contains('nav-link') || this.classList.contains('mobile-nav-link')) {
            updateActiveNavigation(this);
        }
        
        // Close mobile menu if open
        closeMobileMenu();
    } else {
        console.warn('No data-page attribute found on button:', this);
    }
}

function updateActiveNavigation(activeElement) {
    // Remove active class from all navigation links
    const allNavLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    allNavLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to the clicked element or its corresponding link
    const page = activeElement.getAttribute('data-page');
    if (page) {
        const correspondingLinks = document.querySelectorAll(`[data-page="${page}"].nav-link, [data-page="${page}"].mobile-nav-link`);
        correspondingLinks.forEach(link => link.classList.add('active'));
    }
}

function closeMobileMenu() {
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileToggle && mobileMenu) {
        mobileToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
}

// Film slider initialization function
function initializeFilmSlider() {
    console.log('Initializing film slider...');
    
    // Try multiple possible selectors for slider elements
    const slider = document.getElementById('filmSlider') || document.querySelector('.film-slider') || document.querySelector('.movie-slider');
    const prevBtn = document.getElementById('prevBtn') || document.querySelector('.prev-btn') || document.querySelector('.slider-btn.prev-btn');
    const nextBtn = document.getElementById('nextBtn') || document.querySelector('.next-btn') || document.querySelector('.slider-btn.next-btn');
    
    if (!slider) {
        console.log('Film slider not found, trying alternative selectors...');
        const alternativeSliders = document.querySelectorAll('[class*="slider"], [class*="film"], [class*="movie"]');
        console.log('Found alternative elements:', alternativeSliders.length);
        return;
    }
    
    if (!prevBtn || !nextBtn) {
        console.log('Slider navigation buttons not found');
        return;
    }
    
    console.log('Slider elements found, initializing...');
    
    let currentPosition = 0;
    const cardWidth = 220 + 24; // card width + gap
    const visibleCards = Math.floor(slider.parentElement.offsetWidth / cardWidth);
    const totalCards = slider.children.length;
    const maxPosition = Math.max(0, totalCards - visibleCards);
    
    function updateSlider() {
        slider.style.transform = `translateX(-${currentPosition * cardWidth}px)`;
        
        // Update button states
        prevBtn.disabled = currentPosition === 0;
        nextBtn.disabled = currentPosition >= maxPosition;
    }
    
    // Remove existing event listeners
    prevBtn.removeEventListener('click', handlePrevClick);
    nextBtn.removeEventListener('click', handleNextClick);
    
    // Add new event listeners
    prevBtn.addEventListener('click', handlePrevClick);
    nextBtn.addEventListener('click', handleNextClick);
    
    function handlePrevClick() {
        if (currentPosition > 0) {
            currentPosition--;
            updateSlider();
        }
    }
    
    function handleNextClick() {
        if (currentPosition < maxPosition) {
            currentPosition++;
            updateSlider();
        }
    }
    
    // Initialize
    updateSlider();
    
    // Handle window resize
    const resizeHandler = () => {
        const newVisibleCards = Math.floor(slider.parentElement.offsetWidth / cardWidth);
        const newMaxPosition = Math.max(0, totalCards - newVisibleCards);
        
        if (currentPosition > newMaxPosition) {
            currentPosition = newMaxPosition;
        }
        
        updateSlider();
    };
    
    window.removeEventListener('resize', resizeHandler);
    window.addEventListener('resize', resizeHandler);
    
    console.log('Film slider initialized successfully');
}

window.onload = async() => {
    try {
        // Load the home page directly since navbar is now embedded in index.html
        loadPage("Home");

        // Attach event listeners after a short delay to ensure DOM is ready
        setTimeout(() => {
            attachNavbarEventListeners();
        }, 100);
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
};

// Re-attach event listeners when new content is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        attachNavbarEventListeners();
    }, 200);
});

function attachFilmEventListeners() {
    console.log('Attaching film event listeners...');
    
    // Rating stars
    const ratingStars = document.querySelectorAll('.rating-star');
    ratingStars.forEach(star => {
        star.removeEventListener('click', handleRatingClick);
        star.addEventListener('click', handleRatingClick);
    });
    
    // Genre filters and buttons
    const genreFilters = document.querySelectorAll('.genre-filter, .genre-btn, .genre-button');
    genreFilters.forEach(filter => {
        filter.removeEventListener('click', handleGenreFilter);
        filter.addEventListener('click', handleGenreFilter);
    });
    
    // Film cards
    const filmCards = document.querySelectorAll('.film-card, .film-item, .movie-card');
    filmCards.forEach(card => {
        card.removeEventListener('click', handleFilmCardClick);
        card.addEventListener('click', handleFilmCardClick);
    });
    
    // Rating buttons
    const ratingButtons = document.querySelectorAll('.rating-btn, .star-btn');
    ratingButtons.forEach(btn => {
        btn.removeEventListener('click', handleRatingButtonClick);
        btn.addEventListener('click', handleRatingButtonClick);
    });
    
    // Film slider navigation
    const sliderButtons = document.querySelectorAll('.slider-btn, .prev-btn, .next-btn');
    sliderButtons.forEach(btn => {
        btn.removeEventListener('click', handleSliderButtonClick);
        btn.addEventListener('click', handleSliderButtonClick);
    });
    
    console.log(`Attached event listeners to ${ratingStars.length} stars, ${genreFilters.length} filters, ${filmCards.length} cards, ${ratingButtons.length} rating buttons, ${sliderButtons.length} slider buttons`);
}

function handleRatingClick(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Rating star clicked');
    // Rating logic will be handled by filmler-rating.js
}

function handleGenreFilter(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Genre filter clicked');
    // Genre filter logic will be handled by genre-sliders.js
}

function handleFilmCardClick(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Film card clicked');
    // Film card logic will be handled by filmler.js
}

function handleRatingButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Rating button clicked');
    // Rating button logic will be handled by filmler-rating.js
}

function handleSliderButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();
    console.log('Slider button clicked');
    // Slider button logic will be handled by filmler.js
}

