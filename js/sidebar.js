// Modern Sidebar Functionality
function initializeSidebar() {
    const toggleButton = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    

    // Check if elements exist
    if (!toggleButton || !sidebar) {
        console.log('Sidebar elements not found, retrying...');
        return false;
    }

    // Check if already initialized
    if (sidebar.hasAttribute('data-initialized')) {
        console.log('Sidebar already initialized');
        return true;
    }

    // Mark as initialized
    sidebar.setAttribute('data-initialized', 'true');
    
    // Create overlay element if it doesn't exist
    let overlay = document.getElementById('sidebarOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'sidebarOverlay';
        document.body.appendChild(overlay);
    }

    // Toggle sidebar function
    function toggleSidebar() {
        const isOpen = sidebar.classList.contains("open");
        
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    // Open sidebar function
    function openSidebar() {
        sidebar.classList.add("open");
        overlay.classList.add("active");
        toggleButton.classList.add("active");
        document.body.style.overflow = "hidden"; // Prevent background scrolling
        
        // Add escape key listener
        document.addEventListener('keydown', handleEscapeKey);
    }

    // Close sidebar function
    function closeSidebar() {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
        toggleButton.classList.remove("active");
        document.body.style.overflow = ""; // Restore scrolling
        
        // Remove escape key listener
        document.removeEventListener('keydown', handleEscapeKey);

    }

    // Handle escape key
    function handleEscapeKey(event) {
        if (event.key === 'Escape') {
            closeSidebar();
        }
    }

    // Remove existing event listeners to prevent duplicates
    const newToggleButton = toggleButton.cloneNode(true);
    toggleButton.parentNode.replaceChild(newToggleButton, toggleButton);

    // Toggle button click event
    newToggleButton.addEventListener("click", function(event) {
        event.stopPropagation();
        toggleSidebar();
    });

    // Overlay click event to close sidebar
    overlay.addEventListener("click", function() {
        closeSidebar();
    });

    // Prevent sidebar clicks from closing the sidebar
    sidebar.addEventListener("click", function(event) {
        event.stopPropagation();
    });

    // Close sidebar when clicking outside
    document.addEventListener("click", function(event) {
        if (sidebar.classList.contains("open") && 
            !sidebar.contains(event.target) && 
            !newToggleButton.contains(event.target)) {
            closeSidebar();
        }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && sidebar.classList.contains('open')) {
            // Optional: Keep sidebar open on larger screens or close it
            // closeSidebar();
        }
    });

    console.log('Sidebar initialized successfully');
    return true;
}


// Initialize sidebar with retry mechanism
function initializeSidebarWithRetry(maxRetries = 10, delay = 100) {
    let attempts = 0;
    
    function tryInitialize() {
        attempts++;
        
        if (initializeSidebar()) {
            console.log(`Sidebar initialized successfully on attempt ${attempts}`);
            return;
        }
        
        if (attempts < maxRetries) {
            console.log(`Sidebar initialization attempt ${attempts} failed, retrying in ${delay}ms...`);
            setTimeout(tryInitialize, delay);
        } else {
            console.error('Failed to initialize sidebar after maximum retries');
        }
    }
    
    tryInitialize();
}

// Initialize when DOM is ready OR when script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeSidebarWithRetry();
    });
} else {
    // DOM is already ready, initialize immediately
    initializeSidebarWithRetry();
}

// Photo upload functionality
function uploadPhoto() {
    const photoInput = document.getElementById("photoInput");
    if (photoInput) {
        photoInput.click();
    }
}

// Handle photo upload with better initialization
function initializePhotoUpload() {
    const photoInput = document.getElementById("photoInput");
    const profilePhoto = document.getElementById("profilePhoto");
    
    if (!photoInput || !profilePhoto) {
        return false;
    }

    // Remove existing event listeners
    const newPhotoInput = photoInput.cloneNode(true);
    photoInput.parentNode.replaceChild(newPhotoInput, photoInput);
    
    newPhotoInput.addEventListener("change", function() {
        const file = this.files[0];

        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                alert('Lütfen geçerli bir resim dosyası seçin (JPEG, PNG, GIF)');
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert('Dosya boyutu çok büyük. Maksimum 5MB olmalıdır.');
                return;
            }

            const reader = new FileReader();

            reader.onload = function(e) {
                profilePhoto.src = e.target.result;
                
                // Add a subtle animation when photo changes
                profilePhoto.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    profilePhoto.style.transform = 'scale(1)';
                }, 150);
            };

            reader.onerror = function() {
                alert('Dosya okuma hatası oluştu.');
            };

            reader.readAsDataURL(file);
        }
    });
    
    return true;
}

// Initialize photo upload with retry
function initializePhotoUploadWithRetry(maxRetries = 10, delay = 100) {
    let attempts = 0;
    
    function tryInitialize() {
        attempts++;
        
        if (initializePhotoUpload()) {
            console.log(`Photo upload initialized successfully on attempt ${attempts}`);
            return;
        }
        
        if (attempts < maxRetries) {
            setTimeout(tryInitialize, delay);
        }
    }
    
    tryInitialize();
}

// Initialize photo upload
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializePhotoUploadWithRetry();
    });
} else {
    initializePhotoUploadWithRetry();
}

// Add smooth scroll behavior for menu items
function initializeMenuItems() {
    const menuItems = document.querySelectorAll('.item');
    
    if (menuItems.length === 0) {
        return false;
    }
    
    menuItems.forEach(item => {
        // Remove existing listeners by cloning
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', function() {
            // Add click animation
            this.style.transform = 'translateX(5px) scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Here you can add navigation logic for each menu item
            const itemText = this.textContent.trim();
            
            switch(itemText) {
                case '👤 Kullanıcı Bilgileri':
                    console.log('Kullanıcı Bilgileri tıklandı');
                    // Add your navigation logic here
                    break;
                case '⚙️ Ayarlar':
                    console.log('Ayarlar tıklandı');
                    // Add your navigation logic here
                    break;
                case '🚪 Çıkış Yap':
                    console.log('Çıkış Yap tıklandı');
                    // Add your logout logic here
                    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
                        // Perform logout
                        window.location.href = '../index.html'; // or your logout URL
                    }
                    break;
            }
        });
    });
    
    return true;
}

// Initialize menu items with retry
function initializeMenuItemsWithRetry(maxRetries = 10, delay = 100) {
    let attempts = 0;
    
    function tryInitialize() {
        attempts++;
        
        if (initializeMenuItems()) {
            console.log(`Menu items initialized successfully on attempt ${attempts}`);
            return;
        }
        
        if (attempts < maxRetries) {
            setTimeout(tryInitialize, delay);
        }
    }
    
    tryInitialize();
}

// Initialize menu items
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeMenuItemsWithRetry();
    });
} else {
    initializeMenuItemsWithRetry();
}

// Add loading animation for profile image
function initializeProfileImageAnimation() {
    const profileImage = document.getElementById('profilePhoto');
    
    if (!profileImage) {
        return false;
    }
    
    profileImage.addEventListener('load', function() {
        this.style.opacity = '0';
        setTimeout(() => {
            this.style.opacity = '1';
        }, 100);
    });
    
    return true;
}

// Initialize profile image animation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeProfileImageAnimation();
    });
} else {
    initializeProfileImageAnimation();
}

// Export functions for manual initialization if needed
window.sidebarUtils = {
    initializeSidebar: initializeSidebarWithRetry,
    initializePhotoUpload: initializePhotoUploadWithRetry,
    initializeMenuItems: initializeMenuItemsWithRetry
};

