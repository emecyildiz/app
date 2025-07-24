function loadPage(page){
    fetch(`/pages/${page}.html`)
    .then(res => res.text())
    .then(data => {
        document.getElementById("content").innerHTML = data;
        
        // Handle specific page initializations
        if(page == "Filmler") {
            loadScript("js/script.js");
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

