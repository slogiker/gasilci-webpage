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

    // Close sidebar, news modal, or legal modals on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSidebar();
            
            // Close news modal if open
            const newsModal = document.getElementById('news-modal');
            if (newsModal && newsModal.style.display === 'flex') {
                const closeBtn = newsModal.querySelector('.modal-close');
                if (closeBtn) closeBtn.click();
            }

            // Close legal modals if active
            const pravnoModal = document.getElementById('pravno-modal');
            if (pravnoModal && pravnoModal.classList.contains('active')) {
                const closeBtn = document.getElementById('pravno-close');
                if (closeBtn) closeBtn.click();
            }

            const varstvoModal = document.getElementById('varstvo-modal');
            if (varstvoModal && varstvoModal.classList.contains('active')) {
                const closeBtn = document.getElementById('varstvo-close');
                if (closeBtn) closeBtn.click();
            }
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

        slideInterval = setInterval(nextSlide, 8000);

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                clearInterval(slideInterval);
                goToSlide(parseInt(dot.dataset.index));
                slideInterval = setInterval(nextSlide, 8000);
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


    // --- Vehicles Section & Modal ---
    const vehicleSection = document.getElementById('vozila');
    const vehicleModal = document.getElementById('vehicle-modal');
    if (vehicleSection) {
        const loadVehicles = async () => {
            const grid = vehicleSection.querySelector('.grid-2');
            if (!grid) return;
            try {
                const res = await API.getVehicles();
                if (res.success && res.data && res.data.length > 0) {
                    grid.innerHTML = res.data.map(v => `
                        <div class="vehicle-card" data-id="${v.id}" style="cursor: pointer;">
                            <img src="${v.image ? v.image : 'https://placehold.co/800x450/1C1C1C/F0EFEA?text=PGD'}" class="vehicle-img" alt="${v.name}">
                            <div class="vehicle-info">
                                <span class="vehicle-badge">${v.year ? 'Letnik ' + v.year : 'Gasilsko vozilo'}</span>
                                <h3 class="vehicle-name">${v.name}</h3>
                                <p style="font-size: 0.85rem; color: var(--yellow); margin-top: 0.4rem; font-weight: 500;">Oglej si podrobnosti &rarr;</p>
                            </div>
                        </div>
                    `).join('');

                    grid.querySelectorAll('.vehicle-card').forEach((card, idx) => {
                        card.addEventListener('click', () => {
                            openVehicleModal(res.data[idx]);
                        });
                    });
                }
            } catch (err) {
                console.log('Error loading vehicles:', err);
            }
        };

        const openVehicleModal = (v) => {
            if (!vehicleModal) return;
            const imgEl = document.getElementById('v-modal-img');
            const titleEl = document.getElementById('v-modal-title');
            const yearEl = document.getElementById('v-modal-year');
            const specsEl = document.getElementById('v-modal-specs');

            if (imgEl) imgEl.src = v.image ? v.image : 'https://placehold.co/800x450/1C1C1C/F0EFEA?text=PGD';
            if (titleEl) titleEl.textContent = v.name;
            if (yearEl) yearEl.textContent = v.year ? 'Leto proizvodnje: ' + v.year : 'Gasilsko vozilo';

            if (specsEl) {
                const lines = v.description ? v.description.split('\n') : [];
                specsEl.innerHTML = lines.map(line => {
                    const parts = line.split(':');
                    if (parts.length > 1) {
                        return `<div class="vehicle-spec-item"><span class="vehicle-spec-label">${parts[0].trim()}</span><span class="vehicle-spec-val">${parts.slice(1).join(':').trim()}</span></div>`;
                    }
                    return `<div class="vehicle-spec-item"><span class="vehicle-spec-val">${line.trim()}</span></div>`;
                }).join('');
            }

            vehicleModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        const closeVehicleModal = () => {
            if (vehicleModal) {
                vehicleModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        };

        const closeBtn = document.getElementById('v-modal-close');
        if (closeBtn) closeBtn.onclick = closeVehicleModal;

        if (vehicleModal) {
            vehicleModal.onclick = (e) => {
                if (e.target === vehicleModal) closeVehicleModal();
            };
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeVehicleModal();
        });

        loadVehicles();
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
    const handleScroll = () => {
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();

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

    // --- Legal Modals (Pravno obvestilo & Varstvo podatkov) ---
    const pravnoModal = document.getElementById('pravno-modal');
    const varstvoModal = document.getElementById('varstvo-modal');
    const pravnoLink = document.getElementById('pravno-link');
    const varstvoLink = document.getElementById('varstvo-link');
    const pravnoClose = document.getElementById('pravno-close');
    const varstvoClose = document.getElementById('varstvo-close');

    const openLegalModal = (modal) => {
        if (!modal) return;
        modal.style.display = 'flex';
        // Trigger layout reflow for CSS transition
        modal.offsetHeight;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeLegalModal = (modal) => {
        if (!modal) return;
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    };

    if (pravnoLink && pravnoModal) {
        pravnoLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalModal(pravnoModal);
        });
    }

    if (varstvoLink && varstvoModal) {
        varstvoLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalModal(varstvoModal);
        });
    }

    if (pravnoClose && pravnoModal) {
        pravnoClose.addEventListener('click', () => {
            closeLegalModal(pravnoModal);
        });
    }

    if (varstvoClose && varstvoModal) {
        varstvoClose.addEventListener('click', () => {
            closeLegalModal(varstvoModal);
        });
    }

    // Close modals on clicking outside the content
    [pravnoModal, varstvoModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeLegalModal(modal);
                }
            });
        }
    });

    // Check URL parameters for auto-opening modals
    const urlParams = new URLSearchParams(window.location.search);
    const openParam = urlParams.get('open');
    if (openParam === 'pravno' && pravnoModal) {
        openLegalModal(pravnoModal);
    } else if (openParam === 'varstvo' && varstvoModal) {
        openLegalModal(varstvoModal);
    }

    // --- Accessibility Settings ---
    createAccessibilityPanel();

    // --- Scroll Animations ---
    initScrollReveal();

    // --- Gallery Category Crossfade ---
    const initGalleryCrossfades = async () => {
        const slideshowContainers = document.querySelectorAll('.gallery-slideshow');
        if (slideshowContainers.length === 0) return;

        try {
            const result = await window.API.getGallery();
            if (result && result.success && result.data) {
                const photos = result.data;
                
                const categories = {
                    'tekmovanje': photos.filter(p => p.category === 'tekmovanje'),
                    'vaje': photos.filter(p => p.category === 'vaje'),
                    'prosti-cas': photos.filter(p => p.category === 'prosti-cas')
                };

                slideshowContainers.forEach(container => {
                    const cat = container.dataset.category;
                    const catPhotos = categories[cat] || [];

                    if (catPhotos.length === 0) {
                        container.innerHTML = `<img src="https://placehold.co/800x450/1C1C1C/F0EFEA?text=PGD" class="active" alt="Placeholder">`;
                    } else {
                        container.innerHTML = catPhotos.map((p, idx) => {
                            const imgPath = p.image_path.startsWith('/') ? p.image_path : '/' + p.image_path;
                            return `<img src="${imgPath}" class="${idx === 0 ? 'active' : ''}" alt="${p.title || 'Foto'}">`;
                        }).join('');

                        if (catPhotos.length > 1) {
                            let currentIdx = 0;
                            const imgs = container.querySelectorAll('img');
                            setInterval(() => {
                                imgs[currentIdx].classList.remove('active');
                                currentIdx = (currentIdx + 1) % imgs.length;
                                imgs[currentIdx].classList.add('active');
                            }, 6000 + Math.random() * 1000);
                        }
                    }
                });
            } else {
                throw new Error("Invalid API response format");
            }
        } catch (err) {
            console.warn("Failed to fetch gallery for homepage crossfade, displaying placeholders:", err);
            slideshowContainers.forEach(container => {
                container.innerHTML = `<img src="https://placehold.co/800x450/1C1C1C/F0EFEA?text=PGD" class="active" alt="Placeholder">`;
            });
        }
    };

    initGalleryCrossfades();
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
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="4" r="1.5"></circle>
            <path d="M12 7.5v8.5"></path>
            <path d="M7 10h10"></path>
            <path d="M9 20l3-4 3 4"></path>
        </svg>
    `;
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
            <div class="acc-option block">
                <span class="acc-label">Velikost besedila</span>
                <div class="btn-group">
                    <button class="btn btn-outline acc-btn" data-type="text" data-val="normal">A</button>
                    <button class="btn btn-outline acc-btn" data-type="text" data-val="lg">A+</button>
                    <button class="btn btn-outline acc-btn" data-type="text" data-val="xl">A++</button>
                </div>
            </div>
            <div class="acc-option block">
                <span class="acc-label">Visok kontrast</span>
                <div class="btn-group">
                    <button class="btn btn-outline acc-btn" data-type="contrast" data-val="normal">Privzeto</button>
                    <button class="btn btn-outline acc-btn" data-type="contrast" data-val="grayscale">Črno-belo</button>
                    <button class="btn btn-outline acc-btn" data-type="contrast" data-val="high">Kontrast</button>
                </div>
            </div>
            <div class="acc-option row">
                <span>Pisava za disleksijo</span>
                <button class="btn btn-outline acc-btn toggle-btn" data-type="font" data-val="dyslexia">Vklopi</button>
            </div>
            <div class="acc-option row">
                <span>Poudari povezave</span>
                <button class="btn btn-outline acc-btn toggle-btn" data-type="links" data-val="underline">Vklopi</button>
            </div>
            <div class="acc-option row">
                <span>Onemogoči animacije</span>
                <button class="btn btn-outline acc-btn toggle-btn" data-type="animations" data-val="disable">Vklopi</button>
            </div>
            <button class="btn btn-red w-full" id="accessibility-reset" style="margin-top: 0.5rem; padding: 0.75rem;">Ponastavi vse</button>
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
            background: rgba(28, 28, 28, 0.75);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            color: var(--text-primary);
            border: 1px solid rgba(250, 190, 40, 0.4);
            border-radius: 50%;
            width: 54px;
            height: 54px;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .accessibility-toggle svg {
            width: 24px;
            height: 24px;
            stroke: var(--text-primary);
            transition: transform 0.3s ease;
        }
        .accessibility-toggle:hover {
            background: rgba(220, 40, 40, 0.25);
            border-color: var(--red);
            transform: scale(1.08) translateY(-2px);
            box-shadow: 0 12px 40px rgba(220, 40, 40, 0.3), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .accessibility-toggle:hover svg {
            transform: rotate(15deg);
        }
        .accessibility-panel {
            position: fixed;
            bottom: 90px;
            left: 20px;
            z-index: 9999;
            background: rgba(36, 36, 36, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            width: 320px;
            padding: 1.5rem;
            box-shadow: 0 20px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
            display: none;
            flex-direction: column;
            color: var(--text-primary);
            transition: opacity 0.3s, transform 0.3s;
        }
        .accessibility-panel.open {
            display: flex;
            animation: acc-panel-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes acc-panel-fade {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .accessibility-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.25rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 0.75rem;
        }
        .accessibility-header h3 {
            font-size: 1.05rem;
            font-weight: 700;
            margin: 0;
            color: var(--text-primary);
            font-family: var(--font-serif);
        }
        #accessibility-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 24px;
            cursor: pointer;
            line-height: 1;
            transition: color 0.2s;
        }
        #accessibility-close:hover {
            color: var(--red);
        }
        .accessibility-body {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }
        .acc-option {
            display: flex;
            width: 100%;
            font-size: 0.85rem;
        }
        .acc-option.block {
            flex-direction: column;
            gap: 0.6rem;
            align-items: flex-start;
        }
        .acc-option.row {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
        }
        .acc-label {
            color: var(--text-primary);
            font-weight: 600;
        }
        .acc-option span {
            color: var(--text-secondary);
        }
        .accessibility-body .btn-group {
            display: flex;
            gap: 0.5rem;
            width: 100%;
        }
        .accessibility-body .btn {
            padding: 0.5rem 0.75rem;
            font-size: 0.75rem;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.03);
            color: var(--text-primary);
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s ease;
            font-weight: 500;
            text-align: center;
        }
        .accessibility-body .btn-group .btn {
            flex: 1;
        }
        .accessibility-body .btn:hover {
            background: rgba(255,255,255,0.08);
            border-color: rgba(250, 190, 40, 0.5);
        }
        .accessibility-body .btn-red {
            padding: 0.75rem;
            font-size: 0.85rem;
            background: var(--red);
            color: white;
            border: none;
            border-radius: 8px;
            width: 100%;
            font-weight: 600;
            transition: background-color 0.2s;
        }
        .accessibility-body .btn-red:hover {
            background: var(--red-dark);
        }
        .acc-btn.active {
            background-color: var(--red) !important;
            color: white !important;
            border-color: var(--red) !important;
            box-shadow: 0 0 10px rgba(220, 40, 40, 0.3);
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

        document.documentElement.classList.remove('contrast-grayscale');
        document.body.classList.remove('contrast-grayscale', 'contrast-high');
        if (state.contrast === 'grayscale') document.documentElement.classList.add('contrast-grayscale');
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
        document.documentElement.classList.remove('contrast-grayscale');
        applySettings();
    };

    applySettings();
};


