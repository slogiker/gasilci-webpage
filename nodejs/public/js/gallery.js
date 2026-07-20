document.addEventListener('DOMContentLoaded', () => {
    const galleryGrid = document.getElementById('gallery-grid');
    const lightbox = document.getElementById('lightbox');
    
    // --- Gallery Page Logic ---
    if (galleryGrid && lightbox) {
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCaption = document.getElementById('lightbox-caption');
        const lightboxClose = document.querySelector('.lightbox-close');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const filterBtns = document.querySelectorAll('.filter-btn');

        let allPhotos = [];
        let currentFilteredPhotos = [];
        let currentIndex = 0;

        const fetchGallery = async () => {
            try {
                const response = await fetch('/api/gallery');
                const result = await response.json();
                if (result.success) {
                    allPhotos = result.data;
                    
                    // Handle URL parameter ?kat=
                    const urlParams = new URLSearchParams(window.location.search);
                    const kat = urlParams.get('kat');
                    
                    if (kat) {
                        const activeBtn = Array.from(filterBtns).find(btn => btn.dataset.category === kat);
                        if (activeBtn) {
                            filterBtns.forEach(b => b.classList.remove('active'));
                            activeBtn.classList.add('active');
                            filterPhotos(kat);
                        } else {
                            filterPhotos('Vse');
                        }
                    } else {
                        filterPhotos('Vse');
                    }
                }
            } catch (error) {
                console.error('Error fetching gallery:', error);
                galleryGrid.innerHTML = '<p>Napaka pri nalaganju galerije.</p>';
            }
        };

        const filterPhotos = (category) => {
            if (category === 'Vse') {
                currentFilteredPhotos = allPhotos;
            } else {
                currentFilteredPhotos = allPhotos.filter(p => p.category === category);
            }
            renderGallery(currentFilteredPhotos);
        };

        const renderGallery = (photos) => {
            galleryGrid.innerHTML = photos.map((photo, index) => `
                <div class="gallery-item" data-index="${index}">
                    <img src="${photo.image_path}" alt="${photo.title}">
                    <div class="gallery-item-overlay">
                        <div class="gallery-item-title">${photo.title}</div>
                    </div>
                </div>
            `).join('');

            // Add click events
            document.querySelectorAll('.gallery-item').forEach(item => {
                item.addEventListener('click', () => {
                    currentIndex = parseInt(item.dataset.index);
                    openLightbox(currentIndex);
                });
            });
        };

        const openLightbox = (index) => {
            const photo = currentFilteredPhotos[index];
            if (!photo) return;

            lightboxImg.src = photo.image_path;
            lightboxCaption.textContent = photo.title;
            lightbox.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        };

        const closeLightbox = () => {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
        };

        const showNext = () => {
            currentIndex = (currentIndex + 1) % currentFilteredPhotos.length;
            openLightbox(currentIndex);
        };

        const showPrev = () => {
            currentIndex = (currentIndex - 1 + currentFilteredPhotos.length) % currentFilteredPhotos.length;
            openLightbox(currentIndex);
        };

        // Event Listeners
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterPhotos(btn.dataset.category);
                
                // Update URL without reload
                const newUrl = new URL(window.location);
                if (btn.dataset.category === 'Vse') {
                    newUrl.searchParams.delete('kat');
                } else {
                    newUrl.searchParams.set('kat', btn.dataset.category);
                }
                window.history.pushState({}, '', newUrl);
            });
        });

        lightboxClose.addEventListener('click', closeLightbox);
        nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
        prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (lightbox.style.display === 'flex') {
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowRight') showNext();
                if (e.key === 'ArrowLeft') showPrev();
            }
        });

        fetchGallery();
    }

    // --- Gallery Preview Slideshow Logic ---
    const startSlideshows = () => {
        const slideshows = document.querySelectorAll('.gallery-slideshow, .slideshow-inner');
        slideshows.forEach(slideshow => {
            const images = slideshow.querySelectorAll('img');
            if (images.length <= 1) return;

            let currentIdx = 0;
            setInterval(() => {
                images[currentIdx].classList.remove('active');
                currentIdx = (currentIdx + 1) % images.length;
                images[currentIdx].classList.add('active');
            }, 3000 + Math.random() * 2000); // Random offset so they don't all flip at once
        });
    };

    startSlideshows();
});
