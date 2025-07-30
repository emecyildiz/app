function loadPage(page){
    fetch(`pages/${page}.html`)
    .then(res => res.text())
    .then(data => {
        // Extract only the body content to avoid nested HTML structure
        const bodyMatch = data.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const extractedContent = bodyMatch ? bodyMatch[1] : data;
        
        // Fix CSS paths
        const fixedContent = fixCSSPaths(extractedContent);
        
        document.getElementById("content").innerHTML = fixedContent;
        
        // Handle specific page initializations
        if(page == "Filmler") {
            // Initialize film slider after DOM is ready
            setTimeout(() => {
                if (typeof initializeFilms === 'function') {
                    initializeFilms();
                } else if (typeof initializeFilmSlider === 'function') {
                    initializeFilmSlider();
                } else {
                    console.error('Film initialization function not found');
                }
            }, 100);
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
    })
    .catch(error => {
        console.error('Error loading page:', error);
        document.getElementById("content").innerHTML = '<h1>Sayfa yüklenirken bir hata oluştu</h1>';
    });
}

function loadScript(src){
    // Check if script is already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
        console.log(`Script ${src} already loaded`);
        return;
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
    const buttons = document.querySelectorAll(".btn, .giriş, .nav-link, .mobile-nav-link, .action-btn, .mobile-action-btn");
    
    buttons.forEach(item => {
        // Remove existing event listeners to prevent duplicates
        item.removeEventListener("click", handleNavigation);
        
        // Add new event listener
        item.addEventListener("click", handleNavigation);
    });
    
    console.log(`Attached event listeners to ${buttons.length} navigation buttons`);
}

function handleNavigation(event) {
    event.preventDefault();
    const page = this.getAttribute("data-page");
    
    if (page) {
        console.log(`Loading page: ${page}`);
        loadPage(page);
        
        // Update active states
        updateActiveNavigation(this);
        
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
    const slider = document.getElementById('filmSlider');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!slider || !prevBtn || !nextBtn) {
        console.log('Film slider elements not found');
        return;
    }
    
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
    
    prevBtn.addEventListener('click', () => {
        if (currentPosition > 0) {
            currentPosition--;
            updateSlider();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentPosition < maxPosition) {
            currentPosition++;
            updateSlider();
        }
    });
    
    // Initialize
    updateSlider();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const newVisibleCards = Math.floor(slider.parentElement.offsetWidth / cardWidth);
        const newMaxPosition = Math.max(0, totalCards - newVisibleCards);
        
        if (currentPosition > newMaxPosition) {
            currentPosition = newMaxPosition;
        }
        
        updateSlider();
    });
    
    console.log('Film slider initialized successfully');
}

// Only initialize if CinemaHubApp is not available
window.onload = async() => {
    try {
        // Check if CinemaHubApp is already handling the initialization
        if (window.app && window.app instanceof CinemaHubApp) {
            console.log('CinemaHubApp is already handling initialization');
            return;
        }
        
        // Wait a bit for DOM to be ready
        setTimeout(() => {
            // Load the home page directly since navbar is now embedded in index.html
            loadPage("Home");

            // Attach event listeners after a short delay to ensure DOM is ready
            setTimeout(() => {
                attachNavbarEventListeners();
            }, 100);
        }, 100);
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
};

// Fix CSS paths function
function fixCSSPaths(content) {
    // ../templates/navbar.css -> templates/navbar.css
    content = content.replace(/href="\.\.\/templates\//g, 'href="templates/');
    // ../css/ -> css/
    content = content.replace(/href="\.\.\/css\//g, 'href="css/');
    // ../js/ -> js/
    content = content.replace(/src="\.\.\/js\//g, 'src="js/');
    // ../img/ -> img/
    content = content.replace(/src="\.\.\/img\//g, 'src="img/');
    
    return content;
}

// Re-attach event listeners when new content is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        attachNavbarEventListeners();
    }, 200);
}); 