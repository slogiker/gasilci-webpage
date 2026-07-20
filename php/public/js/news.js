document.addEventListener('DOMContentLoaded', () => {
    const newsGrid = document.getElementById('news-grid-standalone');
    const newsHeadlines = document.getElementById('news-headlines');
    const newsModal = document.getElementById('news-modal');
    
    if (!newsGrid && !newsHeadlines) return;

    const modalClose = document.querySelector('.modal-close');
    const modalBody = document.getElementById('modal-body');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let allNews = [];

    const fetchNews = async () => {
        try {
            const response = await fetch('/api/news');
            const result = await response.json();
            if (result.success) {
                allNews = result.data;
                renderNews(allNews);
                renderHeadlines(allNews);
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            newsGrid.innerHTML = '<p>Napaka pri nalaganju novic.</p>';
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('sl-SI', options);
    };

    const openModal = (news) => {
        modalBody.innerHTML = `
            <img src="${news.image || 'https://placehold.co/800x450/1C1C1C/F0EFEA?text=PGD'+news.id+'/800/450'}" style="width: 100%; border-radius: 8px; margin-bottom: 1.5rem;">
            <span class="news-badge">${news.category || 'Novica'}</span>
            <h2 style="margin-top: 1rem;">${news.title}</h2>
            <p style="color: var(--text-tertiary); margin-bottom: 1.5rem;">${formatDate(news.created_at)}</p>
            <div style="color: var(--text-secondary);">
                ${news.content.split('\n').map(p => `<p>${p}</p>`).join('')}
            </div>
        `;
        newsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    const renderNews = (newsList) => {
        newsGrid.innerHTML = newsList.map(news => `
            <div class="card news-card" data-id="${news.id}">
                <div style="position: relative;">
                    <img src="${news.image || 'https://placehold.co/800x450/1C1C1C/F0EFEA?text=PGD'+news.id+'/640/360'}" class="news-card-img" alt="${news.title}">
                    <span class="news-badge">${news.category || 'Novica'}</span>
                </div>
                <div class="card-body">
                    <span class="card-date">${formatDate(news.created_at)}</span>
                    <h3 class="card-title">${news.title}</h3>
                    <p>${news.content.substring(0, 100)}...</p>
                </div>
            </div>
        `).join('');

        // Add click events to cards
        document.querySelectorAll('.news-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const news = allNews.find(n => n.id == id);
                if (news) openModal(news);
            });
        });
    };

    const renderHeadlines = (newsList) => {
        newsHeadlines.innerHTML = newsList.map(news => `
            <li data-id="${news.id}">
                <span class="headline-date">${formatDate(news.created_at)}</span>
                <span class="headline-title">${news.title}</span>
            </li>
        `).join('');

        // Add click events to headlines
        newsHeadlines.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const news = allNews.find(n => n.id == id);
                if (news) openModal(news);
            });
        });
    };

    // Filtering logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.dataset.category;
            if (category === 'Vse') {
                renderNews(allNews);
            } else {
                const filtered = allNews.filter(n => n.category === category);
                renderNews(filtered);
            }
        });
    });

    // Modal close logic
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

    fetchNews();
});
