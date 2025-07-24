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

window.onload = async() => {
    try {
        await loadComponent("navbar","../templates/navbar.html");
        loadPage("Home");

        // Add event listeners with better error handling
        const buttons = document.querySelectorAll(".btn, .giriş");
        buttons.forEach(item => {
            item.addEventListener("click", (event) => {
                event.preventDefault();
                const page = item.getAttribute("data-page");
                if (page) {
                    console.log(`Loading page: ${page}`);
                    loadPage(page);
                } else {
                    console.warn('No data-page attribute found on button:', item);
                }
            });
        });
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
};

