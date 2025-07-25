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
const mobileToggle = document.getElementById('mobileToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', function() {
        mobileToggle.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
}

// Navigation link interactions
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for the page to fully load
    setTimeout(function() {
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // Close mobile menu if open
                if (mobileToggle && mobileMenu) {
                    mobileToggle.classList.remove('active');
                    mobileMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }

                // Dinamik Filmler sayfası yükleme
                if (this.dataset.page === 'Filmler') {
                    const content = document.getElementById('content');
                    if (content) {
                        fetch('pages/Filmler.html')
                            .then(res => res.text())
                            .then(html => {
                                // Sadece <body> içeriğini al
                                const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                                content.innerHTML = bodyMatch ? bodyMatch[1] : html;
                                // Gerekli CSS'i ekle
                                if (!document.getElementById('filmler-css')) {
                                    const css = document.createElement('link');
                                    css.rel = 'stylesheet';
                                    css.href = 'css/filmler.css';
                                    css.id = 'filmler-css';
                                    document.head.appendChild(css);
                                }
                                // Önce eski scriptleri kaldır
                                ['filmler-rating-js','genre-sliders-js','man-js'].forEach(id => {
                                    const oldScript = document.getElementById(id);
                                    if (oldScript) oldScript.remove();
                                });
                                // Scriptleri sırayla yükle
                                const scripts = [
                                    {src: 'js/filmler-rating.js', id: 'filmler-rating-js'},
                                    {src: 'js/genre-sliders.js', id: 'genre-sliders-js'},
                                    {src: 'js/man.js', id: 'man-js'}
                                ];
                                function loadScript(i) {
                                    if (i >= scripts.length) return;
                                    const s = document.createElement('script');
                                    s.src = scripts[i].src;
                                    s.id = scripts[i].id;
                                    s.onload = () => loadScript(i+1);
                                    document.body.appendChild(s);
                                }
                                loadScript(0);
                            });
                    }
                }
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBox = document.querySelector('.search-box');
        
        if (searchInput && searchBox) {
            searchInput.addEventListener('focus', function() {
                searchBox.classList.add('focused');
            });
            
            searchInput.addEventListener('blur', function() {
                if (this.value === '') {
                    searchBox.classList.remove('focused');
                }
            });
        }
    }, 100);
});