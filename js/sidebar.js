// Sidebar utility functions
const sidebarUtils = {
    initializeSidebar() {
        console.log('Initializing sidebar...');
        
        // Sidebar toggle functionality
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                mainContent?.classList.toggle('sidebar-active');
            });
        }
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar && !sidebar.contains(e.target) && !sidebarToggle?.contains(e.target)) {
                sidebar.classList.remove('active');
                mainContent?.classList.remove('sidebar-active');
            }
        });
        
        console.log('Sidebar initialized successfully');
    },
    
    initializePhotoUpload() {
        console.log('Initializing photo upload...');
        
        const photoInput = document.getElementById('photoInput');
        const profilePhoto = document.getElementById('profilePhoto');
        
        if (photoInput && profilePhoto) {
            photoInput.addEventListener('change', function() {
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
                        
                        // Add animation when photo changes
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
        }
        
        console.log('Photo upload initialized successfully');
    },
    
    initializeMenuItems() {
        console.log('Initializing menu items...');
        
        // Menu item click handlers
        const menuItems = document.querySelectorAll('.sidebar-menu-item');
        
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove active class from all items
                menuItems.forEach(i => i.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Handle specific menu actions
                const action = this.dataset.action;
                if (action) {
                    this.handleMenuAction(action);
                }
            });
        });
        
        console.log('Menu items initialized successfully');
    },
    
    handleMenuAction(action) {
        switch(action) {
            case 'profile':
                console.log('Profile action triggered');
                break;
            case 'settings':
                console.log('Settings action triggered');
                break;
            case 'logout':
                console.log('Logout action triggered');
                // Add logout logic here
                break;
            default:
                console.log(`Unknown action: ${action}`);
        }
    }
};

// Export for global access
window.sidebarUtils = sidebarUtils;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        sidebarUtils.initializeSidebar();
        sidebarUtils.initializePhotoUpload();
        sidebarUtils.initializeMenuItems();
    });
} else {
    sidebarUtils.initializeSidebar();
    sidebarUtils.initializePhotoUpload();
    sidebarUtils.initializeMenuItems();
} 