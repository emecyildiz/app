// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (mobileMenu.classList.contains('active') && 
                !mobileMenu.contains(e.target) && 
                !mobileToggle.contains(e.target)) {
                mobileToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    }

    // Search functionality
    const searchForm = document.querySelector('.navbar-actions form');
    const searchInput = document.querySelector('.mini-input');
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                console.log('Searching for:', searchTerm);
                // TODO: Implement search functionality
            }
        });
    }

    // Mobile search
    const mobileSearchForm = document.querySelector('.mobile-search-form');
    const mobileSearchInput = document.querySelector('.mobile-search-input');
    
    if (mobileSearchForm && mobileSearchInput) {
        mobileSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchTerm = mobileSearchInput.value.trim();
            if (searchTerm) {
                console.log('Mobile searching for:', searchTerm);
                // TODO: Implement search functionality
            }
        });
    }
});

// Update active navigation state
window.updateActiveNavigation = function(pageName) {
    // Remove active class from all nav links
    const allNavLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    allNavLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to matching links
    const activeLinks = document.querySelectorAll(`[data-page="${pageName}"]`);
    activeLinks.forEach(link => {
        if (link.classList.contains('nav-link') || link.classList.contains('mobile-nav-link')) {
            link.classList.add('active');
        }
    });
    
    // Close mobile menu if open
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileToggle && mobileMenu) {
        mobileToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
};