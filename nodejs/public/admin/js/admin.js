/**
 * Admin Panel JS for PGD Majšperk Breg
 */

const API_BASE = '/api';

const API = {
    getToken() {
        return localStorage.getItem('pgd_token');
    },

    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = { ...options.headers };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (!(options.body instanceof FormData) && options.body && typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
            headers['Content-Type'] = 'application/json';
        }

        console.log(`API Request: ${options.method || 'GET'} ${endpoint}`, { hasToken: !!token });
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            console.error('401 Unauthorized detected. Token valid?', !!token);
            // Don't logout if we are on login page
            if (!window.location.pathname.endsWith('index.html')) {
                Auth.logout();
            }
            throw new Error('Unauthorized');
        }

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Something went wrong');
        }
        return result;
    },

    get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); },

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await this.post('/upload', formData);
        return res.data.url; 
    }
};

const Auth = {
    init() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        const headerLogoutBtn = document.getElementById('header-logout-btn');
        if (headerLogoutBtn) {
            headerLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Check auth
        const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/admin/');
        if (!isLoginPage && !this.getToken()) {
            window.location.href = 'index.html';
        }
    },

    getToken() {
        return localStorage.getItem('pgd_token');
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const alertBox = document.getElementById('login-alert');

        try {
            const res = await API.post('/auth/login', { email, password });
            if (res.success) {
                localStorage.setItem('pgd_token', res.token);
                localStorage.setItem('user', JSON.stringify({ email: email, role: res.role }));
                if (typeof showToast === 'function') showToast('Prijava uspešna', 'success');
                setTimeout(() => window.location.href = 'dashboard.html', 500);
            }
        } catch (err) {
            const errorMsg = err.message || 'Napačni podatki';
            if (typeof showToast === 'function') {
                showToast(errorMsg);
            } else if (alertBox) {
                alertBox.textContent = errorMsg;
                alertBox.style.display = 'block';
            } else {
                alert(errorMsg);
            }
        }
    },

    logout() {
        localStorage.removeItem('pgd_token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
};

const UI = {
    currentSection: 'dashboard',
    quill: null,

    init() {
        if (!window.location.pathname.includes('dashboard.html')) return;

        const sidebarLinks = document.querySelectorAll('.sidebar-nav a[data-section]');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('a').dataset.section;
                this.loadSection(section);
                
                sidebarLinks.forEach(l => l.classList.remove('active'));
                e.target.closest('a').classList.add('active');
            });
        });

        const toggleBtn = document.getElementById('toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('open');
            });
        }

        const user = JSON.parse(localStorage.getItem('user'));
        const userEmailSpan = document.getElementById('user-email');
        if (userEmailSpan && user) {
            userEmailSpan.textContent = user.email;
        }

        const closeModalBtn = document.getElementById('close-modal');
        if (closeModalBtn) {
            closeModalBtn.onclick = () => this.closeModal();
        }

        window.onclick = (e) => {
            const modal = document.getElementById('modal');
            if (modal && e.target == modal) this.closeModal();
        };

        this.loadSection('dashboard');
    },

    async loadSection(section) {
        this.currentSection = section;
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;
        contentArea.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i></div>';

        // Keep active class synced in sidebar
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a[data-section]');
        sidebarLinks.forEach(link => {
            if (link.dataset.section === section) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        try {
            switch (section) {
                case 'dashboard': await Sections.dashboard.render(contentArea); break;
                case 'news': await Sections.news.render(contentArea); break;
                case 'gallery': await Sections.gallery.render(contentArea); break;
                case 'events': await Sections.events.render(contentArea); break;
                case 'vehicles': await Sections.vehicles.render(contentArea); break;
                case 'members': await Sections.members.render(contentArea); break;
                case 'users': await Sections.users.render(contentArea); break;
                case 'applications': await Sections.applications.render(contentArea); break;
                case 'messages': await Sections.messages.render(contentArea); break;
            }
        } catch (err) {
            contentArea.innerHTML = `<div class="alert alert-error" style="background: rgba(197, 40, 28, 0.1); border: 1px solid var(--red); color: var(--red);">Napaka pri nalaganju: ${err.message}</div>`;
        }
    },

    showModal(title, html, onRender = null) {
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modal = document.getElementById('modal');
        
        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = html;
        if (modal) modal.style.display = 'block';
        if (onRender) onRender();
    },

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) modal.style.display = 'none';
    },

    showAlert(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '3000';
        alert.style.background = type === 'success' ? 'var(--primary)' : 'var(--red)';
        alert.style.color = type === 'success' ? '#000' : '#fff';
        alert.style.padding = '1rem 2rem';
        alert.style.borderRadius = '8px';
        alert.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        document.body.appendChild(alert);
        setTimeout(() => alert.remove(), 3000);
    }
};

const Sections = {
    users: {
        async render(container) {
            const res = await API.get('/users');
            const users = res.data;

            container.innerHTML = `
                <div class="section-header">
                    <h2>Uporabniki</h2>
                    <button class="btn btn-primary admin-add-btn" onclick="Sections.users.showAddForm()">Dodaj uporabnika</button>
                </div>
                <div class="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Uporabniško ime</th>
                                <th>E-pošta</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr>
                                    <td>${u.username || ''}</td>
                                    <td>${u.email}</td>
                                    <td class="actions">
                                        <button class="btn btn-sm btn-edit" onclick="Sections.users.showEditForm(${u.id})">Uredi</button>
                                        <button class="btn btn-sm btn-delete" onclick="Sections.users.delete(${u.id})">Izbriši</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },

        showAddForm() {
            const html = `
                <form id="user-form">
                    <div class="form-group">
                        <label>Uporabniško ime</label>
                        <input type="text" name="username" required>
                    </div>
                    <div class="form-group">
                        <label>E-pošta</label>
                        <input type="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>Geslo</label>
                        <input type="password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Shrani</button>
                </form>
            `;
            UI.showModal('Dodaj uporabnika', html, () => {
                document.getElementById('user-form').onsubmit = (e) => this.handleSubmit(e);
            });
        },

        async showEditForm(id) {
            const res = await API.get('/users');
            const user = res.data.find(u => u.id === id);
            const html = `
                <form id="user-form">
                    <input type="hidden" name="id" value="${user.id}">
                    <div class="form-group">
                        <label>Uporabniško ime</label>
                        <input type="text" name="username" value="${user.username || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>E-pošta</label>
                        <input type="email" name="email" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label>Novo geslo (pustite prazno za nespremenjeno)</label>
                        <input type="password" name="password">
                    </div>
                    <button type="submit" class="btn btn-primary">Posodobi</button>
                </form>
            `;
            UI.showModal('Uredi uporabnika', html, () => {
                document.getElementById('user-form').onsubmit = (e) => this.handleSubmit(e, true);
            });
        },

        async handleSubmit(e, isEdit = false) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                username: formData.get('username'),
                email: formData.get('email'),
                role: 'admin',
                password: formData.get('password') || null
            };
            
            try {
                if (isEdit) {
                    await API.put(`/users/${formData.get('id')}`, data);
                    UI.showAlert('Uporabnik posodobljen');
                } else {
                    await API.post('/users', data);
                    UI.showAlert('Uporabnik dodan');
                }
                UI.closeModal();
                this.render(document.getElementById('content-area'));
            } catch (err) {
                alert(err.message);
            }
        },

        async delete(id) {
            if (confirm('Ali ste prepričani, da želite izbrisati tega uporabnika?')) {
                try {
                    await API.delete(`/users/${id}`);
                    UI.showAlert('Uporabnik izbrisan');
                    this.render(document.getElementById('content-area'));
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    },

    dashboard: {
        async render(container) {
            const [newsRes, galleryRes, eventsRes, vehiclesRes, membersRes, appsRes, msgRes] = await Promise.all([
                API.get('/news'),
                API.get('/gallery'),
                API.get('/events'),
                API.get('/vehicles'),
                API.get('/members'),
                API.get('/apply'),
                API.get('/contact')
            ]);

            const newsCount = newsRes.data.length;
            const galleryCount = galleryRes.data.length;
            const eventsCount = eventsRes.data.length;
            const vehiclesCount = vehiclesRes.data.length;
            const membersCount = membersRes.data.length;
            const appsCount = appsRes.data.length;
            const msgCount = msgRes.data.length;

            container.innerHTML = `
                <div class="section-header">
                    <h2>Nadzorna plošča</h2>
                    <p style="color: var(--text-muted); margin-bottom: 2rem;">Dobrodošli v zaledni pisarni PGD Majšperk Breg.</p>
                </div>
                
                <div class="stats-grid-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
                    <div class="stat-card" onclick="UI.loadSection('news')">
                        <div class="stat-icon" style="background: rgba(197, 40, 28, 0.1); color: var(--primary);"><i class="fas fa-newspaper"></i></div>
                        <div class="stat-info">
                            <span class="stat-num">${newsCount}</span>
                            <span class="stat-title">Novice</span>
                        </div>
                    </div>
                    <div class="stat-card" onclick="UI.loadSection('gallery')">
                        <div class="stat-icon" style="background: rgba(41, 128, 185, 0.1); color: #2980b9;"><i class="fas fa-images"></i></div>
                        <div class="stat-info">
                            <span class="stat-num">${galleryCount}</span>
                            <span class="stat-title">Galerija slik</span>
                        </div>
                    </div>
                    <div class="stat-card" onclick="UI.loadSection('events')">
                        <div class="stat-icon" style="background: rgba(243, 156, 18, 0.1); color: #f39c12;"><i class="fas fa-calendar-alt"></i></div>
                        <div class="stat-info">
                            <span class="stat-num">${eventsCount}</span>
                            <span class="stat-title">Dogodki</span>
                        </div>
                    </div>
                    <div class="stat-card" onclick="UI.loadSection('vehicles')">
                        <div class="stat-icon" style="background: rgba(39, 174, 96, 0.1); color: #27ae60;"><i class="fas fa-truck-pickup"></i></div>
                        <div class="stat-info">
                            <span class="stat-num">${vehiclesCount}</span>
                            <span class="stat-title">Vozila</span>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grids" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 2rem; margin-bottom: 2.5rem;">
                    <div class="card" style="margin-bottom: 0;">
                        <h3 style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <span>Najnovejše prijave za članstvo</span>
                            <span class="badge" style="background: var(--primary); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">${appsCount}</span>
                        </h3>
                        <div class="stat-list">
                            ${appsRes.data.slice(0, 3).map(app => `
                                <div class="stat-list-item" onclick="UI.loadSection('applications')" style="cursor: pointer; padding: 0.8rem 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong style="color: var(--text-main); font-size: 0.95rem; display: block; margin-bottom: 0.2rem;">${app.name}</strong>
                                        <div style="font-size: 0.8rem; color: var(--text-muted);">${app.email}</div>
                                    </div>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">${new Date(app.created_at).toLocaleDateString('sl-SI')}</span>
                                </div>
                            `).join('') || '<p style="color: var(--text-muted); font-size: 0.9rem;">Ni prejetih prijav.</p>'}
                        </div>
                    </div>
                    
                    <div class="card" style="margin-bottom: 0;">
                        <h3 style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <span>Najnovejša sporočila</span>
                            <span class="badge" style="background: #2980b9; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">${msgCount}</span>
                        </h3>
                        <div class="stat-list">
                            ${msgRes.data.slice(0, 3).map(msg => `
                                <div class="stat-list-item" onclick="UI.loadSection('messages')" style="cursor: pointer; padding: 0.8rem 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong style="color: var(--text-main); font-size: 0.95rem; display: block; margin-bottom: 0.2rem;">${msg.name}</strong>
                                        <div style="font-size: 0.8rem; color: var(--text-muted);">${msg.subject}</div>
                                    </div>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">${new Date(msg.created_at).toLocaleDateString('sl-SI')}</span>
                                </div>
                            `).join('') || '<p style="color: var(--text-muted); font-size: 0.9rem;">Ni prejetih sporočil.</p>'}
                        </div>
                    </div>
                </div>
            `;
        }
    },

    applications: {
        async render(container) {
            const res = await API.get('/apply');
            const items = res.data;
            container.innerHTML = `
                <div class="section-header">
                    <h2>Prijave za članstvo</h2>
                    <p style="color: var(--text-muted);">Pregled oddanih prijav za včlanitev v društvo.</p>
                </div>
                <div class="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Ime</th>
                                <th>E-pošta</th>
                                <th>Telefon</th>
                                <th>Datum</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td><strong>${item.name}</strong></td>
                                    <td>${item.email}</td>
                                    <td>${item.phone || '/'}</td>
                                    <td>${new Date(item.created_at).toLocaleDateString('sl-SI')}</td>
                                    <td class="actions">
                                        <button class="btn btn-sm btn-edit" onclick="Sections.applications.view(${item.id})">Prikaži</button>
                                        <button class="btn btn-sm btn-delete" onclick="Sections.applications.delete(${item.id})">Izbriši</button>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Ni prejetih prijav.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;
        },

        async view(id) {
            const res = await API.get('/apply');
            const item = res.data.find(a => a.id === id);
            const html = `
                <div style="font-size: 14.5px; line-height: 1.6;">
                    <div style="margin-bottom: 1rem;"><strong style="color: var(--accent);">Ime in priimek:</strong> ${item.name}</div>
                    <div style="margin-bottom: 1rem;"><strong style="color: var(--accent);">E-pošta:</strong> ${item.email}</div>
                    <div style="margin-bottom: 1rem;"><strong style="color: var(--accent);">Telefon:</strong> ${item.phone || '/'}</div>
                    <div style="margin-bottom: 1rem;"><strong style="color: var(--accent);">Datum prijave:</strong> ${new Date(item.created_at).toLocaleString('sl-SI')}</div>
                    <div style="margin-top: 1.5rem; background: var(--bg-accent); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
                        <strong style="color: var(--primary); display: block; margin-bottom: 0.5rem;">Motivacijsko sporočilo / opombe:</strong>
                        <p style="margin: 0; white-space: pre-wrap; color: var(--text-main);">${item.message || 'Brez sporočila.'}</p>
                    </div>
                </div>
            `;
            UI.showModal('Podrobnosti prijave', html);
        },

        async delete(id) {
            if (confirm('Ali ste prepričani, da želite izbrisati to prijava?')) {
                try {
                    await API.delete(`/apply/${id}`);
                    UI.showAlert('Prijava izbrisana');
                    this.render(document.getElementById('content-area'));
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    },

    messages: {
        async render(container) {
            const res = await API.get('/contact');
            const items = res.data;
            container.innerHTML = `
                <div class="section-header">
                    <h2>Prejeta sporočila</h2>
                    <p style="color: var(--text-muted);">Pregled vprašanj in sporočil kontaktnega obrazca.</p>
                </div>
                <div class="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Pošiljatelj</th>
                                <th>E-pošta</th>
                                <th>Zadeva</th>
                                <th>Datum</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td><strong>${item.name}</strong></td>
                                    <td>${item.email}</td>
                                    <td>${item.subject || '/'}</td>
                                    <td>${new Date(item.created_at).toLocaleDateString('sl-SI')}</td>
                                    <td class="actions">
                                        <button class="btn btn-sm btn-edit" onclick="Sections.messages.view(${item.id})">Prikaži</button>
                                        <button class="btn btn-sm btn-delete" onclick="Sections.messages.delete(${item.id})">Izbriši</button>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Ni prejetih sporočil.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;
        },

        async view(id) {
            const res = await API.get('/contact');
            const item = res.data.find(m => m.id === id);
            const html = `
                <div style="font-size: 14.5px; line-height: 1.6;">
                    <div style="margin-bottom: 1rem;"><strong style="color: var(--accent);">Pošiljatelj:</strong> ${item.name}</div>
                    <div style="margin-bottom: 1rem;"><strong style="color: var(--accent);">E-pošta:</strong> ${item.email}</div>
                    <div style="margin-bottom: 1rem;"><strong style="color: var(--accent);">Zadeva:</strong> ${item.subject}</div>
                    <div style="margin-bottom: 1rem;"><strong style="color: var(--accent);">Prejeto dne:</strong> ${new Date(item.created_at).toLocaleString('sl-SI')}</div>
                    <div style="margin-top: 1.5rem; background: var(--bg-accent); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
                        <strong style="color: var(--primary); display: block; margin-bottom: 0.5rem;">Sporočilo:</strong>
                        <p style="margin: 0; white-space: pre-wrap; color: var(--text-main);">${item.message}</p>
                    </div>
                </div>
            `;
            UI.showModal('Prejeto sporočilo', html);
        },

        async delete(id) {
            if (confirm('Ali ste prepričani, da želite izbrisati to sporočilo?')) {
                try {
                    await API.delete(`/contact/${id}`);
                    UI.showAlert('Sporočilo izbrisano');
                    this.render(document.getElementById('content-area'));
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    },

    news: {
        async render(container) {
            const res = await API.get('/news');
            const items = res.data;
            container.innerHTML = `
                <div class="section-header">
                    <h2>Novice</h2>
                    <button class="btn btn-primary admin-add-btn" onclick="Sections.news.showAddForm()">Dodaj novico</button>
                </div>
                <div class="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Naslov</th>
                                <th>Datum</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.title}</td>
                                    <td>${new Date(item.created_at).toLocaleDateString('sl-SI')}</td>
                                    <td class="actions">
                                        <button class="btn btn-sm btn-edit" onclick="Sections.news.showEditForm(${item.id})">Uredi</button>
                                        <button class="btn btn-sm btn-delete" onclick="Sections.news.delete(${item.id})">Izbriši</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },

        showAddForm() {
            const html = `
                <form id="news-form">
                    <div class="form-group">
                        <label>Naslov</label>
                        <input type="text" name="title" required>
                    </div>
                    <div class="form-group">
                        <label>Kategorija</label>
                        <select name="category">
                            <option value="Novice">Novice</option>
                            <option value="Intervencije">Intervencije</option>
                            <option value="Vaje">Vaje</option>
                            <option value="Dogodki">Dogodki</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Slika (URL ali naloži)</label>
                        <input type="text" name="image_url" placeholder="http://..." style="margin-bottom: 0.5rem;">
                        <input type="file" name="image" accept="image/*">
                    </div>
                    <div class="form-group">
                        <label>Vsebina</label>
                        <div id="editor" style="height: 300px;"></div>
                    </div>
                    <button type="submit" class="btn btn-primary">Shrani</button>
                </form>
            `;
            UI.showModal('Dodaj novico', html, () => {
                UI.quill = new Quill('#editor', { 
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'clean']
                        ]
                    }
                });
                document.getElementById('news-form').onsubmit = (e) => this.handleSubmit(e);
            });
        },

        async showEditForm(id) {
            const res = await API.get(`/news/${id}`);
            const item = res.data;
            const html = `
                <form id="news-form">
                    <input type="hidden" name="id" value="${item.id}">
                    <div class="form-group">
                        <label>Naslov</label>
                        <input type="text" name="title" value="${item.title}" required>
                    </div>
                    <div class="form-group">
                        <label>Kategorija</label>
                        <select name="category">
                            <option value="Novice" ${item.category === 'Novice' ? 'selected' : ''}>Novice</option>
                            <option value="Intervencije" ${item.category === 'Intervencije' ? 'selected' : ''}>Intervencije</option>
                            <option value="Vaje" ${item.category === 'Vaje' ? 'selected' : ''}>Vaje</option>
                            <option value="Dogodki" ${item.category === 'Dogodki' ? 'selected' : ''}>Dogodki</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Slika (URL ali naloži)</label>
                        <input type="text" name="image_url" value="${item.image && item.image.startsWith('http') ? item.image : ''}" placeholder="http://..." style="margin-bottom: 0.5rem;">
                        <input type="file" name="image" accept="image/*">
                        ${item.image && !item.image.startsWith('http') ? `<p style="font-size: 0.8rem; margin-top: 0.5rem;">Trenutna: ${item.image}</p>` : ''}
                    </div>
                    <div class="form-group">
                        <label>Vsebina</label>
                        <div id="editor" style="height: 300px;"></div>
                    </div>
                    <button type="submit" class="btn btn-primary">Posodobi</button>
                </form>
            `;
            UI.showModal('Uredi novico', html, () => {
                UI.quill = new Quill('#editor', { 
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'clean']
                        ]
                    }
                });
                UI.quill.root.innerHTML = item.content;
                document.getElementById('news-form').onsubmit = (e) => this.handleSubmit(e, true);
            });
        },

        async handleSubmit(e, isEdit = false) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                title: formData.get('title'),
                category: formData.get('category'),
                content: UI.quill.root.innerHTML,
                image: formData.get('image_url') || null
            };

            const imageFile = formData.get('image');
            if (imageFile && imageFile.size > 0) {
                try {
                    data.image = await API.uploadImage(imageFile);
                } catch (err) {
                    console.error('Upload failed, using URL if provided');
                }
            }

            try {
                if (isEdit) {
                    await API.put(`/news/${formData.get('id')}`, data);
                    UI.showAlert('Novica posodobljena');
                } else {
                    await API.post('/news', data);
                    UI.showAlert('Novica dodana');
                }
                UI.closeModal();
                UI.loadSection('news');
            } catch (err) {
                alert(err.message);
            }
        },

        async delete(id) {
            if (confirm('Ali ste prepričani, da želite izbrisati to novico?')) {
                try {
                    await API.delete(`/news/${id}`);
                    UI.showAlert('Novica izbrisana');
                    UI.loadSection('news');
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    },

    gallery: {
        async render(container) {
            const res = await API.get('/gallery');
            const items = res.data || [];
            
            const rawCats = [...new Set(items.map(i => i.category).filter(Boolean))];
            const categories = ['Vse', ...rawCats];

            container.innerHTML = `
                <div class="section-header">
                    <h2>Galerija slik</h2>
                    <button class="btn btn-primary admin-add-btn" onclick="Sections.gallery.showAddForm()"><i class="fas fa-plus"></i> Dodaj slike</button>
                </div>

                <div class="category-filters-bar" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
                    ${categories.map((cat, idx) => `
                        <button class="btn btn-sm admin-gallery-filter" data-cat="${cat}" style="padding: 0.45rem 0.95rem; border-radius: 20px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; ${idx === 0 ? 'background: var(--accent, #FABE28); color: #1c1c1c; border-color: var(--accent, #FABE28);' : 'background: transparent; color: var(--text-main); border: 1px solid var(--border, rgba(255,255,255,0.15));'}">
                            ${cat === 'tekmovanje' ? 'Tekmovanja' : (cat === 'vaje' ? 'Vaje' : (cat === 'prosti-cas' ? 'Prosti čas' : cat))}
                        </button>
                    `).join('')}
                </div>

                <div class="card admin-gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem;">
                    ${this.renderItemsHtml(items, 'Vse')}
                </div>
            `;

            const filterBtns = container.querySelectorAll('.admin-gallery-filter');
            const gridContainer = container.querySelector('.admin-gallery-grid');

            filterBtns.forEach(btn => {
                btn.onclick = () => {
                    filterBtns.forEach(b => {
                        b.style.background = 'transparent';
                        b.style.color = 'var(--text-main)';
                        b.style.borderColor = 'var(--border, rgba(255,255,255,0.15))';
                    });
                    btn.style.background = 'var(--accent, #FABE28)';
                    btn.style.color = '#1c1c1c';
                    btn.style.borderColor = 'var(--accent, #FABE28)';
                    
                    const cat = btn.dataset.cat;
                    gridContainer.innerHTML = this.renderItemsHtml(items, cat);
                };
            });
        },

        renderItemsHtml(items, filterCat) {
            const filtered = filterCat === 'Vse' ? items : items.filter(i => (i.category || 'Splošno') === filterCat);
            if (filtered.length === 0) {
                return '<div style="grid-column: 1/-1; padding: 3rem; text-align: center; color: var(--text-muted, #aaa);">V tej kategoriji ni slik.</div>';
            }
            return filtered.map(item => {
                const imgSrc = item.image_path.startsWith('http') || item.image_path.startsWith('/') ? item.image_path : '/' + item.image_path;
                return `
                <div style="position: relative; background: rgba(0,0,0,0.25); border-radius: 8px; overflow: hidden; border: 1px solid var(--bg-border);">
                    <img src="${imgSrc}" style="width: 100%; height: 160px; object-fit: cover; display: block;">
                    <div style="padding: 0.75rem;">
                        <span style="font-size: 0.75rem; color: var(--yellow, #FABE28); text-transform: uppercase; font-weight: 600; display: block;">${item.category || 'Splošno'}</span>
                        <p style="font-size: 0.9rem; font-weight: 600; margin: 0.2rem 0 0.75rem 0; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title || 'Brez naslova'}</p>
                        <div class="actions" style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-sm btn-edit" style="flex: 1;" onclick="Sections.gallery.showEditForm(${item.id})">Uredi</button>
                            <button class="btn btn-sm btn-delete" style="flex: 1;" onclick="Sections.gallery.delete(${item.id})">Izbriši</button>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        },

        showAddForm() {
            const html = `
                <form id="gallery-form">
                    <div class="form-group">
                        <label>Naslov / Opis (izbirno za več slik)</label>
                        <input type="text" name="title" placeholder="Npr. Operativna vaja 2026">
                    </div>
                    <div class="form-group">
                        <label>Kategorija</label>
                        <select name="category_select" id="img-category-select" style="width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border, rgba(255,255,255,0.12)); background: var(--bg-subtle, #1a1a1a); color: var(--text-primary, #fff); cursor: pointer;">
                            <option value="">-- Izberi kategorijo --</option>
                            <option value="tekmovanje">Tekmovanja</option>
                            <option value="vaje">Vaje</option>
                            <option value="prosti-cas">Prosti čas</option>
                            <option value="custom">✏️ Vnesi novo kategorijo...</option>
                        </select>
                        <div id="custom-cat-container" style="display: none; margin-top: 0.6rem;">
                            <input type="text" id="custom-cat-input" placeholder="Vpišite ime nove kategorije..." style="width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid var(--accent, #FABE28); background: var(--bg-subtle, #1a1a1a); color: var(--text-primary, #fff);" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Slike (izbereš lahko več slik hkrati)</label>
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.25rem;">
                            <label class="btn" style="background: rgba(250, 190, 40, 0.12); border: 1px solid var(--accent, #FABE28); color: var(--accent, #FABE28); padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer; font-size: 0.88rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease;">
                                <i class="fas fa-images"></i> Izberi slike (več hkrati)...
                                <input type="file" name="images" accept="image/*" multiple style="display: none;" required>
                            </label>
                            <span class="file-count-txt" style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.6));">Ni izbranih slik</span>
                        </div>
                        <div class="image-previews-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 0.5rem; margin-top: 0.85rem; max-height: 160px; overflow-y: auto; padding-right: 0.2rem;"></div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Naloži vse slike</button>
                </form>
            `;
            UI.showModal('Dodaj v galerijo (več slik hkrati)', html, () => {
                const form = document.getElementById('gallery-form');
                form.onsubmit = (e) => this.handleSubmit(e);

                const catSelect = form.querySelector('#img-category-select');
                const customContainer = form.querySelector('#custom-cat-container');
                const customInput = form.querySelector('#custom-cat-input');

                catSelect.onchange = () => {
                    if (catSelect.value === 'custom') {
                        customContainer.style.display = 'block';
                        customInput.focus();
                    } else {
                        customContainer.style.display = 'none';
                        customInput.value = '';
                    }
                };

                const imgInput = form.querySelector('input[name="images"]');
                const countTxt = form.querySelector('.file-count-txt');
                const previewContainer = form.querySelector('.image-previews-container');

                imgInput.onchange = (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                        countTxt.textContent = `Izbranih ${files.length} slik`;
                        previewContainer.innerHTML = files.map(file => {
                            const url = URL.createObjectURL(file);
                            return `<img src="${url}" style="width: 100%; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border);">`;
                        }).join('');
                    } else {
                        countTxt.textContent = 'Ni izbranih slik';
                        previewContainer.innerHTML = '';
                    }
                };
            });
        },

        async showEditForm(id) {
            const res = await API.get(`/gallery/${id}`);
            const item = res.data;
            const imgSrc = item.image_path.startsWith('http') || item.image_path.startsWith('/') ? item.image_path : '/' + item.image_path;

            const isStandard = ['tekmovanje', 'vaje', 'prosti-cas'].includes(item.category);
            const initialSel = isStandard ? item.category : (item.category ? 'custom' : '');

            const html = `
                <form id="gallery-edit-form">
                    <div class="form-group">
                        <label>Naslov / Opis</label>
                        <input type="text" name="title" value="${item.title || ''}">
                    </div>
                    <div class="form-group">
                        <label>Kategorija</label>
                        <select name="category_select" id="img-category-select" style="width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border, rgba(255,255,255,0.12)); background: var(--bg-subtle, #1a1a1a); color: var(--text-primary, #fff); cursor: pointer;">
                            <option value="">-- Izberi kategorijo --</option>
                            <option value="tekmovanje" ${item.category === 'tekmovanje' ? 'selected' : ''}>Tekmovanja</option>
                            <option value="vaje" ${item.category === 'vaje' ? 'selected' : ''}>Vaje</option>
                            <option value="prosti-cas" ${item.category === 'prosti-cas' ? 'selected' : ''}>Prosti čas</option>
                            <option value="custom" ${!isStandard && item.category ? 'selected' : ''}>✏️ Vnesi novo kategorijo...</option>
                        </select>
                        <div id="custom-cat-container" style="display: ${!isStandard && item.category ? 'block' : 'none'}; margin-top: 0.6rem;">
                            <input type="text" id="custom-cat-input" placeholder="Vpišite ime nove kategorije..." value="${!isStandard ? (item.category || '') : ''}" style="width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid var(--accent, #FABE28); background: var(--bg-subtle, #1a1a1a); color: var(--text-primary, #fff);" />
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Zamenjaj sliko (izbirno)</label>
                        <input type="file" name="image" accept="image/*">
                        <div style="margin-top: 0.75rem;">
                            <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 0.3rem;">Trenutna slika:</span>
                            <img src="${imgSrc}" style="max-height: 120px; border-radius: 6px; border: 1px solid var(--border);">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Shrani spremembe</button>
                </form>
            `;
            UI.showModal('Uredi sliko v galeriji', html, () => {
                const form = document.getElementById('gallery-edit-form');
                form.onsubmit = (e) => this.handleEditSubmit(e, id);

                const catSelect = form.querySelector('#img-category-select');
                const customContainer = form.querySelector('#custom-cat-container');
                const customInput = form.querySelector('#custom-cat-input');

                catSelect.onchange = () => {
                    if (catSelect.value === 'custom') {
                        customContainer.style.display = 'block';
                        customInput.focus();
                    } else {
                        customContainer.style.display = 'none';
                        customInput.value = '';
                    }
                };
            });
        },

        async handleSubmit(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const selVal = formData.get('category_select');
            let finalCategory = selVal || '';
            if (selVal === 'custom') {
                const customVal = e.target.querySelector('#custom-cat-input')?.value;
                finalCategory = customVal ? customVal.trim() : '';
            }
            formData.set('category', finalCategory);
            formData.delete('category_select');
            
            try {
                const response = await fetch('/api/gallery', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('pgd_token')}`
                    },
                    body: formData
                });

                const responseText = await response.text();
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (pErr) {
                    throw new Error('Strežnik je vrnil napako: ' + responseText.substring(0, 100));
                }

                if (result.success) {
                    UI.showAlert(result.count > 1 ? `Naloženih ${result.count} slik!` : 'Slika naložena!');
                    UI.closeModal();
                    UI.loadSection('gallery');
                } else {
                    throw new Error(result.error || 'Napaka pri nalaganju');
                }
            } catch (err) {
                alert(err.message);
            }
        },

        async handleEditSubmit(e, id) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const selVal = formData.get('category_select');
            let finalCategory = selVal || '';
            if (selVal === 'custom') {
                const customVal = e.target.querySelector('#custom-cat-input')?.value;
                finalCategory = customVal ? customVal.trim() : '';
            }
            formData.set('category', finalCategory);
            formData.delete('category_select');

            try {
                const response = await fetch(`/api/gallery/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('pgd_token')}`
                    },
                    body: formData
                });

                const responseText = await response.text();
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (pErr) {
                    throw new Error('Strežnik je vrnil napako: ' + responseText.substring(0, 100));
                }

                if (result.success) {
                    UI.showAlert('Slika posodobljena');
                    UI.closeModal();
                    UI.loadSection('gallery');
                } else {
                    throw new Error(result.error || 'Napaka pri posodobitvi');
                }
            } catch (err) {
                alert(err.message);
            }
        },

        async delete(id) {
            if (confirm('Izbrišem sliko?')) {
                try {
                    await API.delete(`/gallery/${id}`);
                    UI.showAlert('Slika izbrisana');
                    UI.loadSection('gallery');
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    },

    events: {
        async render(container) {
            const res = await API.get('/events');
            const items = res.data;
            container.innerHTML = `
                <div class="section-header">
                    <h2>Dogodki</h2>
                    <button class="btn btn-primary admin-add-btn" onclick="Sections.events.showAddForm()">Dodaj dogodek</button>
                </div>
                <div class="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Slika</th>
                                <th>Naslov</th>
                                <th>Datum</th>
                                <th>Lokacija</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => {
                                const imgSrc = item.image ? (item.image.startsWith('http') || item.image.startsWith('/') ? item.image : '/' + item.image) : '';
                                return `
                                <tr>
                                    <td>
                                        ${imgSrc ? `<img src="${imgSrc}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; display: block;">` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Brez slike</span>'}
                                    </td>
                                    <td><strong>${item.title}</strong></td>
                                    <td>${item.event_date ? new Date(item.event_date).toLocaleDateString('sl-SI') : '/'}</td>
                                    <td>${item.location || '/'}</td>
                                    <td class="actions">
                                        <button class="btn btn-sm btn-edit" onclick="Sections.events.showEditForm(${item.id})">Uredi</button>
                                        <button class="btn btn-sm btn-delete" onclick="Sections.events.delete(${item.id})">Izbriši</button>
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },

        showAddForm() {
            const html = `
                <form id="event-form">
                    <div class="form-group">
                        <label>Naslov dogodka</label>
                        <input type="text" name="title" required>
                    </div>
                    <div class="form-group">
                        <label>Datum</label>
                        <input type="date" name="event_date" required>
                    </div>
                    <div class="form-group">
                        <label>Lokacija</label>
                        <input type="text" name="location" placeholder="Npr. Gasilski dom Majšperk-Breg">
                    </div>
                    <div class="form-group">
                        <label>Opis dogodka</label>
                        <textarea name="description" rows="4"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Slika dogodka</label>
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.25rem;">
                            <label class="btn" style="background: rgba(250, 190, 40, 0.12); border: 1px solid var(--accent, #FABE28); color: var(--accent, #FABE28); padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer; font-size: 0.88rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease;">
                                <i class="fas fa-image"></i> Prebrskaj...
                                <input type="file" name="image" accept="image/*" style="display: none;">
                            </label>
                            <span class="file-name-txt" style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.6));">Ni izbrane datoteke</span>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Shrani</button>
                </form>
            `;
            UI.showModal('Dodaj dogodek', html, () => {
                const form = document.getElementById('event-form');
                form.onsubmit = (e) => this.handleSubmit(e);

                const imgInput = form.querySelector('input[name="image"]');
                const nameTxt = form.querySelector('.file-name-txt');
                imgInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file && nameTxt) nameTxt.textContent = file.name;
                };
            });
        },

        async showEditForm(id) {
            const res = await API.get(`/events/${id}`);
            const item = res.data;
            const imgSrc = item.image ? (item.image.startsWith('http') || item.image.startsWith('/') ? item.image : '/' + item.image) : '';

            const html = `
                <form id="event-form">
                    <input type="hidden" name="id" value="${item.id}">
                    <input type="hidden" name="current_image" value="${item.image || ''}">
                    <div class="form-group">
                        <label>Naslov dogodka</label>
                        <input type="text" name="title" value="${item.title}" required>
                    </div>
                    <div class="form-group">
                        <label>Datum</label>
                        <input type="date" name="event_date" value="${item.event_date ? item.event_date.split(' ')[0] : ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Lokacija</label>
                        <input type="text" name="location" value="${item.location || ''}">
                    </div>
                    <div class="form-group">
                        <label>Opis dogodka</label>
                        <textarea name="description" rows="4">${item.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Slika dogodka</label>
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.25rem;">
                            <label class="btn" style="background: rgba(250, 190, 40, 0.12); border: 1px solid var(--accent, #FABE28); color: var(--accent, #FABE28); padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer; font-size: 0.88rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease;">
                                <i class="fas fa-image"></i> Prebrskaj...
                                <input type="file" name="image" accept="image/*" style="display: none;">
                            </label>
                            <span class="file-name-txt" style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.6));">${item.image ? item.image : 'Ni izbrane nove datoteke'}</span>
                        </div>
                        ${imgSrc ? `<img src="${imgSrc}" style="max-height: 100px; border-radius: 6px; margin-top: 0.5rem; border: 1px solid var(--border);">` : ''}
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Posodobi</button>
                </form>
            `;
            UI.showModal('Uredi dogodek', html, () => {
                const form = document.getElementById('event-form');
                form.onsubmit = (e) => this.handleSubmit(e, true);

                const imgInput = form.querySelector('input[name="image"]');
                const nameTxt = form.querySelector('.file-name-txt');
                imgInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file && nameTxt) nameTxt.textContent = file.name;
                };
            });
        },

        async handleSubmit(e, isEdit = false) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const dataId = formData.get('id');

            try {
                const url = isEdit ? `/api/events/${dataId}` : '/api/events';
                const method = isEdit ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('pgd_token')}`
                    },
                    body: formData
                });
                const result = await response.json();

                if (result.success) {
                    UI.showAlert(isEdit ? 'Dogodek posodobljen' : 'Dogodek dodan');
                    UI.closeModal();
                    UI.loadSection('events');
                } else {
                    throw new Error(result.error || 'Napaka pri shranjevanju');
                }
            } catch (err) {
                alert(err.message);
            }
        },

        async delete(id) {
            if (confirm('Izbrišem dogodek?')) {
                try {
                    await API.delete(`/events/${id}`);
                    UI.showAlert('Dogodek izbrisan');
                    UI.loadSection('events');
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    },

    vehicles: {
        async render(container) {
            const res = await API.get('/vehicles');
            const items = res.data;
            container.innerHTML = `
                <div class="section-header">
                    <h2>Vozni park</h2>
                    <button class="btn btn-primary admin-add-btn" onclick="Sections.vehicles.showAddForm()">Dodaj vozilo</button>
                </div>
                <div class="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Ime</th>
                                <th>Letnik</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.year || '/'}</td>
                                    <td class="actions">
                                        <button class="btn btn-sm btn-edit" onclick="Sections.vehicles.showEditForm(${item.id})">Uredi</button>
                                        <button class="btn btn-sm btn-delete" onclick="Sections.vehicles.delete(${item.id})">Izbriši</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },

        showAddForm() {
            const html = `
                <form id="vehicle-form">
                    <div class="form-group">
                        <label>Ime vozila (npr. GVC 16/25)</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Letnik</label>
                        <input type="number" name="year">
                    </div>
                    <div class="form-group">
                        <label>Slika</label>
                        <input type="file" name="image" accept="image/*">
                    </div>
                    <div class="form-group">
                        <label>Opis / Oprema</label>
                        <textarea name="description" rows="4"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Shrani</button>
                </form>
            `;
            UI.showModal('Dodaj vozilo', html, () => {
                document.getElementById('vehicle-form').onsubmit = (e) => this.handleSubmit(e);
            });
        },

        async showEditForm(id) {
            const res = await API.get(`/vehicles/${id}`);
            const item = res.data;
            const html = `
                <form id="vehicle-form">
                    <input type="hidden" name="id" value="${item.id}">
                    <input type="hidden" name="current_image" value="${item.image || ''}">
                    <div class="form-group">
                        <label>Ime vozila</label>
                        <input type="text" name="name" value="${item.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Letnik</label>
                        <input type="number" name="year" value="${item.year || ''}">
                    </div>
                    <div class="form-group">
                        <label>Slika</label>
                        <input type="file" name="image" accept="image/*">
                        ${item.image ? `<p>Trenutna: ${item.image}</p>` : ''}
                    </div>
                    <div class="form-group">
                        <label>Opis / Oprema</label>
                        <textarea name="description" rows="4">${item.description || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Posodobi</button>
                </form>
            `;
            UI.showModal('Uredi vozilo', html, () => {
                document.getElementById('vehicle-form').onsubmit = (e) => this.handleSubmit(e, true);
            });
        },

        async handleSubmit(e, isEdit = false) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            const imageFile = formData.get('image');
            if (imageFile && imageFile.size > 0) {
                data.image = await API.uploadImage(imageFile);
            } else {
                data.image = isEdit ? (formData.get('current_image') || null) : null;
            }
            delete data.current_image;

            try {
                if (isEdit) {
                    await API.put(`/vehicles/${data.id}`, data);
                    UI.showAlert('Vozilo posodobljeno');
                } else {
                    await API.post('/vehicles', data);
                    UI.showAlert('Vozilo dodano');
                }
                UI.closeModal();
                UI.loadSection('vehicles');
            } catch (err) {
                alert(err.message);
            }
        },

        async delete(id) {
            if (confirm('Izbrišem vozilo?')) {
                try {
                    await API.delete(`/vehicles/${id}`);
                    UI.showAlert('Vozilo izbrisano');
                    UI.loadSection('vehicles');
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    },

    members: {
        async render(container) {
            const res = await API.get('/members');
            const items = res.data;
            container.innerHTML = `
                <div class="section-header">
                    <h2>Vodstvo in člani</h2>
                    <button class="btn btn-primary admin-add-btn" onclick="Sections.members.showAddForm()">Dodaj člana</button>
                </div>
                <div class="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Ime</th>
                                <th>Čin</th>
                                <th>Funkcija</th>
                                <th>Vulkan/ID</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.rank || '/'}</td>
                                    <td>${item.role || '/'}</td>
                                    <td>${item.vulkan_id || '/'}</td>
                                    <td class="actions">
                                        <button class="btn btn-sm btn-edit" onclick="Sections.members.showEditForm(${item.id})">Uredi</button>
                                        <button class="btn btn-sm btn-delete" onclick="Sections.members.delete(${item.id})">Izbriši</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },

        showAddForm() {
            const html = `
                <form id="member-form">
                    <div class="form-group">
                        <label>Ime in priimek</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Čin</label>
                        <input type="text" name="rank">
                    </div>
                    <div class="form-group">
                        <label>Funkcija (npr. Predsednik, Poveljnik...)</label>
                        <input type="text" name="role">
                    </div>
                    <div class="form-group">
                        <label>Vulkan / ID številka</label>
                        <input type="text" name="vulkan_id">
                    </div>
                    <div class="form-group">
                        <label>Slika člana</label>
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.25rem;">
                            <label class="btn" style="background: rgba(250, 190, 40, 0.12); border: 1px solid var(--accent, #FABE28); color: var(--accent, #FABE28); padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer; font-size: 0.88rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease;">
                                <i class="fas fa-folder-open"></i> Prebrskaj...
                                <input type="file" name="image" accept="image/*" style="display: none;">
                            </label>
                            <span class="file-name-txt" style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.6));">Ni izbrane datoteke</span>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Shrani</button>
                </form>
            `;
            UI.showModal('Dodaj člana', html, () => {
                const form = document.getElementById('member-form');
                form.onsubmit = (e) => this.handleSubmit(e);
                
                const imgInput = form.querySelector('input[name="image"]');
                const nameTxt = form.querySelector('.file-name-txt');

                imgInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        if (nameTxt) nameTxt.textContent = file.name;
                        startCropper(file, (croppedBlob) => {
                            if (croppedBlob) {
                                this.croppedImageBlob = croppedBlob;
                                UI.showAlert('Slika uspešno obrezana');
                            } else {
                                imgInput.value = '';
                                if (nameTxt) nameTxt.textContent = 'Ni izbrane datoteke';
                                this.croppedImageBlob = null;
                            }
                        });
                    }
                };
            });
        },

        async showEditForm(id) {
            const res = await API.get(`/members/${id}`);
            const item = res.data;
            const html = `
                <form id="member-form">
                    <input type="hidden" name="id" value="${item.id}">
                    <input type="hidden" name="current_image" value="${item.image || ''}">
                    <div class="form-group">
                        <label>Ime in priimek</label>
                        <input type="text" name="name" value="${item.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Čin</label>
                        <input type="text" name="rank" value="${item.rank || ''}">
                    </div>
                    <div class="form-group">
                        <label>Funkcija</label>
                        <input type="text" name="role" value="${item.role || ''}">
                    </div>
                    <div class="form-group">
                        <label>Vulkan / ID številka</label>
                        <input type="text" name="vulkan_id" value="${item.vulkan_id || ''}">
                    </div>
                    <div class="form-group">
                        <label>Slika člana</label>
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.25rem;">
                            <label class="btn" style="background: rgba(250, 190, 40, 0.12); border: 1px solid var(--accent, #FABE28); color: var(--accent, #FABE28); padding: 0.65rem 1.25rem; border-radius: 8px; cursor: pointer; font-size: 0.88rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease;">
                                <i class="fas fa-folder-open"></i> Prebrskaj...
                                <input type="file" name="image" accept="image/*" style="display: none;">
                            </label>
                            <span class="file-name-txt" style="font-size: 0.85rem; color: var(--text-muted, rgba(255,255,255,0.6));">${item.image ? item.image : 'Ni izbrane nove datoteke'}</span>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Posodobi</button>
                </form>
            `;
            UI.showModal('Uredi člana', html, () => {
                const form = document.getElementById('member-form');
                form.onsubmit = (e) => this.handleSubmit(e, true);

                const imgInput = form.querySelector('input[name="image"]');
                const nameTxt = form.querySelector('.file-name-txt');

                imgInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        if (nameTxt) nameTxt.textContent = file.name;
                        startCropper(file, (croppedBlob) => {
                            if (croppedBlob) {
                                this.croppedImageBlob = croppedBlob;
                                UI.showAlert('Slika uspešno obrezana');
                            } else {
                                imgInput.value = '';
                                if (nameTxt) nameTxt.textContent = item.image ? item.image : 'Ni izbrane nove datoteke';
                                this.croppedImageBlob = null;
                            }
                        });
                    }
                };
            });
        },

        async handleSubmit(e, isEdit = false) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            if (this.croppedImageBlob) {
                const file = new File([this.croppedImageBlob], 'member_cropped.jpg', { type: 'image/jpeg' });
                data.image = await API.uploadImage(file);
            } else {
                const imageFile = formData.get('image');
                if (imageFile && imageFile.size > 0) {
                    data.image = await API.uploadImage(imageFile);
                } else {
                    data.image = isEdit ? (formData.get('current_image') || null) : null;
                }
            }
            delete data.current_image;
            this.croppedImageBlob = null;

            try {
                if (isEdit) {
                    await API.put(`/members/${data.id}`, data);
                    UI.showAlert('Član posodobljen');
                } else {
                    await API.post('/members', data);
                    UI.showAlert('Član dodan');
                }
                UI.closeModal();
                UI.loadSection('members');
            } catch (err) {
                alert(err.message);
            }
        },

        async delete(id) {
            if (confirm('Izbrišem člana?')) {
                try {
                    await API.delete(`/members/${id}`);
                    UI.showAlert('Član izbrisan');
                    UI.loadSection('members');
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    }
};

function startCropper(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const overlay = document.createElement('div');
            overlay.className = 'cropper-overlay';
            overlay.innerHTML = `
                <div class="cropper-card" style="background: rgba(36, 36, 36, 0.95); border: 1px solid var(--accent, #FABE28); border-radius: 16px; width: 340px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; box-shadow: 0 25px 60px rgba(0,0,0,0.8); position: relative; z-index: 10001;">
                    <h3 style="color: var(--text-primary, #fff); margin-bottom: 1rem; font-family: var(--font-sans); font-size: 1.1rem; text-align: center;">Prilagodi sliko člana</h3>
                    <div style="position: relative; width: 280px; height: 280px; border-radius: 8px; overflow: hidden; background: #111; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);">
                        <canvas id="crop-canvas" width="280" height="280" style="cursor: move; display: block;"></canvas>
                        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 0 0 9999px rgba(0,0,0,0.65); pointer-events: none; border: 2px dashed var(--yellow, #FABE28);"></div>
                    </div>
                    <div style="width: 100%; margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary);">
                            <span>Povečava</span>
                            <span id="zoom-val">100%</span>
                        </div>
                        <input type="range" id="crop-zoom" min="0.1" max="3" step="0.02" value="1" style="width: 100%; accent-color: var(--yellow, #FABE28); cursor: pointer;">
                    </div>
                    <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem; width: 100%;">
                        <button type="button" id="crop-cancel" class="btn btn-outline" style="flex: 1; padding: 0.6rem; font-size: 13px; border-radius: 6px; cursor: pointer;">Prekliči</button>
                        <button type="button" id="crop-confirm" class="btn btn-primary" style="flex: 1; padding: 0.6rem; font-size: 13px; background: var(--yellow, #FABE28); color: var(--text-on-yellow, #1C1C1C); border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Potrdi</button>
                    </div>
                </div>
            `;
            
            Object.assign(overlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(14px)',
                webkitBackdropFilter: 'blur(14px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '10000'
            });

            document.body.appendChild(overlay);

            const canvas = overlay.querySelector('#crop-canvas');
            const ctx = canvas.getContext('2d');
            const zoomSlider = overlay.querySelector('#crop-zoom');
            const zoomVal = overlay.querySelector('#zoom-val');
            const cancelBtn = overlay.querySelector('#crop-cancel');
            const confirmBtn = overlay.querySelector('#crop-confirm');

            const cw = canvas.width;
            const ch = canvas.height;

            const minZoom = Math.max(cw / img.width, ch / img.height);
            zoomSlider.min = minZoom.toFixed(3);
            
            let zoom = Math.max(minZoom, 1);
            zoomSlider.value = zoom;
            zoomVal.textContent = Math.round(zoom * 100) + '%';

            let panX = 0;
            let panY = 0;

            const draw = () => {
                ctx.clearRect(0, 0, cw, ch);
                ctx.save();
                
                const w = img.width * zoom;
                const h = img.height * zoom;
                const x = (cw - w) / 2 + panX;
                const y = (ch - h) / 2 + panY;
                
                ctx.drawImage(img, x, y, w, h);
                ctx.restore();
            };

            draw();

            zoomSlider.oninput = (e) => {
                zoom = parseFloat(e.target.value);
                zoomVal.textContent = Math.round(zoom * 100) + '%';
                const maxPanX = Math.max(0, (img.width * zoom - cw) / 2);
                const maxPanY = Math.max(0, (img.height * zoom - ch) / 2);
                panX = Math.min(maxPanX, Math.max(-maxPanX, panX));
                panY = Math.min(maxPanY, Math.max(-maxPanY, panY));
                draw();
            };

            let isDragging = false;
            let startX = 0;
            let startY = 0;

            const handleStart = (clientX, clientY) => {
                isDragging = true;
                startX = clientX - panX;
                startY = clientY - panY;
                canvas.style.cursor = 'grabbing';
            };

            const handleMove = (clientX, clientY) => {
                if (!isDragging) return;
                
                let newPanX = clientX - startX;
                let newPanY = clientY - startY;

                const maxPanX = Math.max(0, (img.width * zoom - cw) / 2);
                const maxPanY = Math.max(0, (img.height * zoom - ch) / 2);

                panX = Math.min(maxPanX, Math.max(-maxPanX, newPanX));
                panY = Math.min(maxPanY, Math.max(-maxPanY, newPanY));

                draw();
            };

            const handleEnd = () => {
                isDragging = false;
                canvas.style.cursor = 'move';
            };

            canvas.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
            window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
            window.addEventListener('mouseup', handleEnd);

            canvas.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    handleStart(e.touches[0].clientX, e.touches[0].clientY);
                    e.preventDefault();
                }
            });
            canvas.addEventListener('touchmove', (e) => {
                if (e.touches.length === 1) {
                    handleMove(e.touches[0].clientX, e.touches[0].clientY);
                    e.preventDefault();
                }
            });
            canvas.addEventListener('touchend', handleEnd);

            canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                const step = e.deltaY < 0 ? 0.05 : -0.05;
                let newZoom = Math.min(3, Math.max(minZoom, zoom + step));
                zoom = newZoom;
                zoomSlider.value = zoom;
                zoomVal.textContent = Math.round(zoom * 100) + '%';
                
                const maxPanX = Math.max(0, (img.width * zoom - cw) / 2);
                const maxPanY = Math.max(0, (img.height * zoom - ch) / 2);
                panX = Math.min(maxPanX, Math.max(-maxPanX, panX));
                panY = Math.min(maxPanY, Math.max(-maxPanY, panY));
                
                draw();
            });

            cancelBtn.onclick = () => {
                overlay.remove();
                callback(null);
            };

            confirmBtn.onclick = () => {
                canvas.toBlob((blob) => {
                    overlay.remove();
                    callback(blob);
                }, 'image/jpeg', 0.9);
            };
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    UI.init();
});
