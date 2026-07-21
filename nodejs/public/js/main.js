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

    // --- Accessibility Settings ---
    createAccessibilityPanel();

    // --- Scroll Animations ---
    initScrollReveal();
});

window.addEventListener('load', () => {
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
});

// --- Scroll Reveal Animations ---
const initScrollReveal = () => {
    const targets = document.querySelectorAll('.section, .stats-section, .vehicle-card, .member-card, .gallery-card, .news-card');
    
    // Add reveal class to targets
    targets.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    targets.forEach(target => observer.observe(target));
};

// --- Accessibility Panel Builder ---
const createAccessibilityPanel = () => {
    if (document.getElementById('accessibility-panel')) return;

    // Create floating button
    const btn = document.createElement('button');
    btn.id = 'accessibility-toggle';
    btn.className = 'accessibility-toggle';
    btn.setAttribute('aria-label', 'Gumb za prilagoditev dostopnosti');
    btn.innerHTML = '♿';
    document.body.appendChild(btn);

    // Create options panel
    const panel = document.createElement('div');
    panel.id = 'accessibility-panel';
    panel.className = 'accessibility-panel';
    panel.innerHTML = `
        <div class="accessibility-header">
            <h3>Prilagoditev dostopnosti</h3>
            <button id="accessibility-close">&times;</button>
        </div>
        <div class="accessibility-body">
            <div class="acc-option">
                <span>Velikost besedila</span>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline acc-btn" data-type="text" data-val="normal">A</button>
                    <button class="btn btn-sm btn-outline acc-btn" data-type="text" data-val="lg">A+</button>
                    <button class="btn btn-sm btn-outline acc-btn" data-type="text" data-val="xl">A++</button>
                </div>
            </div>
            <div class="acc-option">
                <span>Visok kontrast</span>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline acc-btn" data-type="contrast" data-val="normal">Privzeto</button>
                    <button class="btn btn-sm btn-outline acc-btn" data-type="contrast" data-val="grayscale">Črno-belo</button>
                    <button class="btn btn-sm btn-outline acc-btn" data-type="contrast" data-val="high">Kontrast</button>
                </div>
            </div>
            <div class="acc-option">
                <span>Pisava za disleksijo</span>
                <button class="btn btn-sm btn-outline acc-btn toggle-btn" data-type="font" data-val="dyslexia">Vklopi</button>
            </div>
            <div class="acc-option">
                <span>Poudari povezave</span>
                <button class="btn btn-sm btn-outline acc-btn toggle-btn" data-type="links" data-val="underline">Vklopi</button>
            </div>
            <div class="acc-option">
                <span>Onemogoči animacije</span>
                <button class="btn btn-sm btn-outline acc-btn toggle-btn" data-type="animations" data-val="disable">Vklopi</button>
            </div>
            <button class="btn btn-red w-full" id="accessibility-reset" style="margin-top: 1rem;">Ponastavi vse</button>
        </div>
    `;
    document.body.appendChild(panel);

    const style = document.createElement('style');
    style.textContent = `
        .accessibility-toggle {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 9999;
            background-color: var(--red);
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
        }
        .accessibility-toggle:hover {
            transform: scale(1.1);
        }
        .accessibility-panel {
            position: fixed;
            bottom: 80px;
            left: 20px;
            z-index: 9999;
            background: var(--bg-elevated);
            border: 1px solid var(--bg-border);
            border-radius: 12px;
            width: 300px;
            padding: 1.5rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: none;
            flex-direction: column;
            color: var(--text-primary);
        }
        .accessibility-panel.open {
            display: flex;
        }
        .accessibility-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            border-bottom: 1px solid var(--bg-border);
            padding-bottom: 0.5rem;
        }
        .accessibility-header h3 {
            font-size: 1rem;
            margin: 0;
            color: var(--text-primary);
            font-family: var(--font-sans);
        }
        #accessibility-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 20px;
            cursor: pointer;
        }
        .accessibility-body {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .acc-option {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13.5px;
        }
        .acc-option span {
            color: var(--text-secondary);
        }
        .accessibility-body .btn-group {
            display: flex;
            gap: 0.25rem;
        }
        .accessibility-body .btn {
            padding: 0.25rem 0.5rem;
            font-size: 12px;
            min-width: 32px;
            border: 1px solid var(--bg-border);
            background: transparent;
            color: var(--text-primary);
            cursor: pointer;
            border-radius: 4px;
        }
        .accessibility-body .btn:hover {
            border-color: var(--red);
        }
        .accessibility-body .btn-red {
            padding: 0.5rem;
            font-size: 13px;
            background: var(--red);
            color: white;
            border: none;
            border-radius: 6px;
            width: 100%;
        }
        .accessibility-body .btn-red:hover {
            background: var(--red-dark);
        }
        .acc-btn.active {
            background-color: var(--red) !important;
            color: white !important;
            border-color: var(--red) !important;
        }
    `;
    document.head.appendChild(style);

    btn.onclick = () => panel.classList.toggle('open');
    document.getElementById('accessibility-close').onclick = () => panel.classList.remove('open');

    const state = JSON.parse(localStorage.getItem('acc_settings')) || {
        text: 'normal',
        contrast: 'normal',
        font: 'normal',
        links: 'normal',
        animations: 'normal'
    };

    const applySettings = () => {
        document.documentElement.classList.remove('text-lg', 'text-xl');
        if (state.text === 'lg') document.documentElement.classList.add('text-lg');
        if (state.text === 'xl') document.documentElement.classList.add('text-xl');

        document.body.classList.remove('contrast-grayscale', 'contrast-high');
        if (state.contrast === 'grayscale') document.body.classList.add('contrast-grayscale');
        if (state.contrast === 'high') document.body.classList.add('contrast-high');

        document.body.classList.remove('font-dyslexia');
        if (state.font === 'dyslexia') document.body.classList.add('font-dyslexia');

        document.body.classList.remove('links-underline');
        if (state.links === 'underline') document.body.classList.add('links-underline');

        document.body.classList.remove('disable-animations');
        if (state.animations === 'disable') document.body.classList.add('disable-animations');

        panel.querySelectorAll('.acc-btn').forEach(btnEl => {
            const type = btnEl.dataset.type;
            const val = btnEl.dataset.val;
            
            if (btnEl.classList.contains('toggle-btn')) {
                if (state[type] === val) {
                    btnEl.classList.add('active');
                    btnEl.textContent = 'Izklopi';
                } else {
                    btnEl.classList.remove('active');
                    btnEl.textContent = 'Vklopi';
                }
            } else {
                if (state[type] === val) {
                    btnEl.classList.add('active');
                } else {
                    btnEl.classList.remove('active');
                }
            }
        });

        localStorage.setItem('acc_settings', JSON.stringify(state));
    };

    panel.onclick = (e) => {
        const b = e.target.closest('.acc-btn');
        if (!b) return;

        const type = b.dataset.type;
        const val = b.dataset.val;

        if (b.classList.contains('toggle-btn')) {
            state[type] = state[type] === val ? 'normal' : val;
        } else {
            state[type] = val;
        }
        applySettings();
    };

    document.getElementById('accessibility-reset').onclick = () => {
        state.text = 'normal';
        state.contrast = 'normal';
        state.font = 'normal';
        state.links = 'normal';
        state.animations = 'normal';
        applySettings();
    };

    applySettings();
};


