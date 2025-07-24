// Modern Sidebar Functionality
function initializeSidebar() {
    const toggleButton = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';
    document.body.appendChild(overlay);

    if (toggleButton && sidebar) {
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

        // Toggle button click event
        toggleButton.addEventListener("click", function(event) {
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
                !toggleButton.contains(event.target)) {
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
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
});

// Photo upload functionality
function uploadPhoto() {
    document.getElementById("photoInput").click();
}

// Handle photo upload
document.addEventListener('DOMContentLoaded', function() {
    const photoInput = document.getElementById("photoInput");
    const profilePhoto = document.getElementById("profilePhoto");
    
    if (photoInput && profilePhoto) {
        photoInput.addEventListener("change", function() {
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
    }
});

// Add smooth scroll behavior for menu items
document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Add click animation
            this.style.transform = 'translateX(5px) scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Here you can add navigation logic for each menu item
            const itemText = this.textContent.trim();
            
            switch(itemText) {
                case '👤Kullanıcı Bilgileri':
                    console.log('Kullanıcı Bilgileri tıklandı');
                    // Add your navigation logic here
                    break;
                case '⚙️Ayarlar':
                    console.log('Ayarlar tıklandı');
                    // Add your navigation logic here
                    break;
                case '🚪Çıkış Yap':
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
});

// Add loading animation for profile image
document.addEventListener('DOMContentLoaded', function() {
    const profileImage = document.getElementById('profilePhoto');
    
    if (profileImage) {
        profileImage.addEventListener('load', function() {
            this.style.opacity = '0';
            setTimeout(() => {
                this.style.opacity = '1';
            }, 100);
        });
    }
});