document.addEventListener('DOMContentLoaded', () => {
    // --- Sidebar Toggle Logic ---
    const body = document.body;
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarLinks = document.querySelectorAll('.sidebar-links a');

    const toggleSidebar = () => {
        body.classList.toggle('sidebar-open');
    };

    const closeSidebar = () => {
        body.classList.remove('sidebar-open');
    };

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    sidebarLinks.forEach(link => {
        link.addEventListener('click', closeSidebar);
    });

    // Close sidebar on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidebar();
        }
    });


    // --- Alert Banner ---
    const alertBanner = document.getElementById('alert-banner');
    const closeAlert = document.getElementById('close-alert');
    
    // Check session storage
    if (sessionStorage.getItem('alert-dismissed') === 'true') {
        if (alertBanner) alertBanner.style.display = 'none';
    }

    if (closeAlert && alertBanner) {
        closeAlert.addEventListener('click', () => {
            alertBanner.style.marginTop = '-40px';
            setTimeout(() => {
                alertBanner.style.display = 'none';
            }, 3000);
            sessionStorage.setItem('alert-dismissed', 'true');
        });
    }


    // --- Hero Slideshow ---
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.hero-dot');
    if (slides.length > 0) {
        let currentSlide = 0;
        let slideInterval;

        const goToSlide = (index) => {
            slides[currentSlide].classList.remove('active');
            dots[currentSlide].classList.remove('active');
            currentSlide = index;
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        };

        const nextSlide = () => {
            goToSlide((currentSlide + 1) % slides.length);
        };

        slideInterval = setInterval(nextSlide, 4500);

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                clearInterval(slideInterval);
                goToSlide(parseInt(dot.dataset.index));
                slideInterval = setInterval(nextSlide, 4500);
            });
        });
    }


    // --- News Modal ---
    const newsGridElement = document.getElementById('news-grid');
    const newsModal = document.getElementById('news-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalBody = document.getElementById('modal-body');

    // Helper to open news modal and load content from API
    const openNewsModal = async (newsId, fallbackCard) => {
        modalBody.innerHTML = '<p>Nalaganje...</p>';
        newsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        try {
            const response = await fetch(`/api/news/${newsId}`);
            const result = await response.json();
            if (result.success) {
                const news = result.data;
                modalBody.innerHTML = `
                    <img src="${news.image || 'https://placehold.co/800x450/1C1C1C/F0EFEA?text=PGD'+news.id+'/800/450'}" style="width: 100%; border-radius: 8px; margin-bottom: 1.5rem;">
                    <span class="news-badge">${news.category || 'Novica'}</span>
                    <h2 style="margin-top: 1rem;">${news.title}</h2>
                    <p style="color: var(--text-tertiary); margin-bottom: 1.5rem;">${new Date(news.created_at).toLocaleDateString('sl-SI', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <div style="color: var(--text-secondary);">
                        ${news.content.split('\n').map(p => `<p>${p}</p>`).join('')}
                    </div>
                `;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('API load failed, falling back to page content:', error);
            if (fallbackCard) {
                modalBody.innerHTML = `
                    <img src="${fallbackCard.querySelector('img').src}" style="width: 100%; border-radius: 8px; margin-bottom: 1.5rem;">
                    <span class="news-badge">${fallbackCard.querySelector('.news-badge').textContent}</span>
                    <h2 style="margin-top: 1rem;">${fallbackCard.querySelector('.card-title').textContent}</h2>
                    <p style="color: var(--text-tertiary); margin-bottom: 1.5rem;">${fallbackCard.querySelector('.card-date').textContent}</p>
                    <div style="color: var(--text-secondary);">
                        <p>Tukaj bi se nahajala polna vsebina novice, pridobljena iz zaledne pisarne. Gasilci PGD Majšperk-Breg smo vedno na voljo za pomoč in intervencije v vseh razmerah.</p>
                        <p>Podrobnosti o dogodku bi vključevale število udeležencev, uporabljeno oprema in trajanje aktivnosti.</p>
                    </div>
                `;
            } else {
                modalBody.innerHTML = '<p>Napaka pri nalaganju novice.</p>';
            }
        }
    };

    // Load dynamic news from API on the homepage
    if (newsGridElement && newsModal) {
        const loadHomepageNews = async () => {
            try {
                const response = await fetch('/api/news');
                const result = await response.json();
                if (result.success && result.data && result.data.length > 0) {
                    const latestNews = result.data.slice(0, 3);
                    newsGridElement.innerHTML = latestNews.map(news => `
                        <div class="card news-card" data-id="${news.id}">
                            <div style="position: relative;">
                                <img src="${news.image || 'https://placehold.co/800x450/1C1C1C/F0EFEA?text=PGD'+news.id+'/640/360'}" class="news-card-img" alt="${news.title}">
                                <span class="news-badge">${news.category || 'Novica'}</span>
                            </div>
                            <div class="card-body">
                                <span class="card-date">${new Date(news.created_at).toLocaleDateString('sl-SI', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <h3 class="card-title">${news.title}</h3>
                                <p>${news.content.substring(0, 100)}...</p>
                            </div>
                        </div>
                    `).join('');
                }
            } catch (err) {
                console.warn('Failed to dynamically fetch homepage news, utilizing placeholders.', err);
            } finally {
                // Attach click listeners to whatever news cards exist (dynamic or fallback placeholders)
                document.querySelectorAll('.news-card').forEach(card => {
                    card.addEventListener('click', () => {
                        openNewsModal(card.dataset.id, card);
                    });
                });
            }
        };

        loadHomepageNews();

        modalClose.addEventListener('click', () => {
            newsModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        window.addEventListener('click', (e) => {
            if (e.target === newsModal) {
                newsModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }


    // --- Contact Form ---
    const contactForm = document.getElementById('contact-form');
    const contactResponse = document.getElementById('contact-response');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                
                if (response.ok && result.success) {
                    contactResponse.style.display = 'block';
                    contactResponse.style.color = 'var(--yellow)';
                    contactResponse.textContent = 'Sporočilo uspešno poslano!';
                    contactForm.reset();
                } else {
                    throw new Error(result.error || 'Prišlo je do napake pri pošiljanju.');
                }
                
                setTimeout(() => {
                    contactResponse.style.display = 'none';
                }, 5000);
            } catch (error) {
                contactResponse.style.display = 'block';
                contactResponse.style.color = 'var(--red)';
                contactResponse.textContent = error.message || 'Prišlo je do napake pri pošiljanju.';
            }
        });
    }


    // --- Scroll effects for Navbar ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.style.borderBottom = '1px solid var(--red)';
            } else {
                navbar.style.borderBottom = '1px solid var(--bg-border)';
            }
        }
    });

    // --- Anchor Scroll ---
    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const hash = href.includes('#') ? '#' + href.split('#')[1] : null;
            if (!hash) return;
            // If we're already on index.html, scroll directly
            if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
                e.preventDefault();
                const target = document.querySelector(hash);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

});

window.addEventListener('load', () => {
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
});

