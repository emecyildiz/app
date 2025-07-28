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
                        // Önce content'i temizle
                        content.innerHTML = '';
                        
                        fetch('pages/Filmler.html')
                            .then(res => res.text())
                            .then(html => {
                                // Sadece <body> içeriğini al
                                const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                                content.innerHTML = bodyMatch ? bodyMatch[1] : html;
                                
                                // Önce eski CSS'i kaldır
                                const oldCss = document.getElementById('filmler-css');
                                if (oldCss) oldCss.remove();
                                
                                // Yeni CSS'i ekle
                                const css = document.createElement('link');
                                css.rel = 'stylesheet';
                                css.href = 'css/filmler.css';
                                css.id = 'filmler-css';
                                document.head.appendChild(css);
                                
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
                                    if (i >= scripts.length) {
                                        // Tüm scriptler yüklendikten sonra sayfayı yenile
                                        setTimeout(() => {
                                            // Film kartlarının düzgün yüklenmesi için kısa bir bekleme
                                            if (typeof initializeFilmCards === 'function') {
                                                initializeFilmCards();
                                            } else {
                                                console.log('initializeFilmCards function not found, trying alternative initialization');
                                                // Alternative initialization
                                                if (typeof fillAllGenreSliders === 'function') {
                                                    fillAllGenreSliders();
                                                    initializeSliders();
                                                    showGenre('all');
                                                    attachGenreTabEvents();
                                                }
                                            }
                                        }, 200);
                                        return;
                                    }
                                    const s = document.createElement('script');
                                    s.src = scripts[i].src;
                                    s.id = scripts[i].id;
                                    s.onload = () => loadScript(i+1);
                                    document.body.appendChild(s);
                                }
                                
                                loadScript(0);
                            })
                            .catch(error => {
                                console.error('Filmler sayfası yüklenirken hata:', error);
                            });
                    }
                }
            });
        });

        // Search functionality for new hover search
        const searchForm = document.querySelector('.navbar-actions form');
        const searchInput = document.querySelector('.mini-input');
        
        if (searchForm && searchInput) {
            // Search form hover effect is handled by CSS
            // Additional functionality can be added here if needed
            searchInput.addEventListener('focus', function() {
                // Focus effect is handled by CSS :focus-within
            });
            
            searchInput.addEventListener('blur', function() {
                // Blur effect is handled by CSS
            });
        }
    }, 100);
});