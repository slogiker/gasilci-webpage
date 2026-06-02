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

        let result;
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
            try {
                result = await response.json();
            } catch (e) {
                const text = await response.text();
                throw new Error(text || 'Invalid JSON response from server');
            }
        } else {
            const text = await response.text();
            throw new Error(text || `HTTP error: ${response.status} ${response.statusText}`);
        }

        if (!response.ok) {
            throw new Error((result && result.error) || 'Something went wrong');
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
    currentSection: 'news',
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

        this.loadSection('news');
    },

    async loadSection(section) {
        this.currentSection = section;
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;
        contentArea.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i></div>';

        try {
            switch (section) {
                case 'news': await Sections.news.render(contentArea); break;
                case 'gallery': await Sections.gallery.render(contentArea); break;
                case 'events': await Sections.events.render(contentArea); break;
                case 'vehicles': await Sections.vehicles.render(contentArea); break;
                case 'members': await Sections.members.render(contentArea); break;
                case 'users': await Sections.users.render(contentArea); break;
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
            // Mock users data
            let users = JSON.parse(localStorage.getItem('mock_users')) || [
                { id: 1, name: 'Administrator', email: 'admin@pgd-majsperk.si', role: 'Admin' },
                { id: 2, name: 'Janez Novak', email: 'janez.novak@example.com', role: 'Član' },
                { id: 3, name: 'Marija Horvat', email: 'marija.horvat@example.com', role: 'Član' }
            ];
            localStorage.setItem('mock_users', JSON.stringify(users));

            container.innerHTML = `
                <div class="section-header">
                    <h2>Uporabniki</h2>
                    <button class="btn btn-primary admin-add-btn" onclick="Sections.users.showAddForm()">Dodaj uporabnika</button>
                </div>
                <div class="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Ime</th>
                                <th>E-pošta</th>
                                <th>Vloga</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr>
                                    <td>${u.name}</td>
                                    <td>${u.email}</td>
                                    <td><span class="pill" style="background: ${u.role === 'Admin' ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}; color: ${u.role === 'Admin' ? '#000' : '#fff'}; padding: 2px 10px; border-radius: 20px; font-size: 0.8rem;">${u.role}</span></td>
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
                        <label>Ime in priimek</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>E-pošta</label>
                        <input type="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>Vloga</label>
                        <select name="role">
                            <option value="Član">Član</option>
                            <option value="Admin">Admin</option>
                        </select>
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

        showEditForm(id) {
            let users = JSON.parse(localStorage.getItem('mock_users'));
            const user = users.find(u => u.id === id);
            const html = `
                <form id="user-form">
                    <input type="hidden" name="id" value="${user.id}">
                    <div class="form-group">
                        <label>Ime in priimek</label>
                        <input type="text" name="name" value="${user.name}" required>
                    </div>
                    <div class="form-group">
                        <label>E-pošta</label>
                        <input type="email" name="email" value="${user.email}" required>
                    </div>
                    <div class="form-group">
                        <label>Vloga</label>
                        <select name="role">
                            <option value="Član" ${user.role === 'Član' ? 'selected' : ''}>Član</option>
                            <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
                        </select>
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

        handleSubmit(e, isEdit = false) {
            e.preventDefault();
            const formData = new FormData(e.target);
            let users = JSON.parse(localStorage.getItem('mock_users'));
            
            if (isEdit) {
                const id = parseInt(formData.get('id'));
                users = users.map(u => u.id === id ? { ...u, name: formData.get('name'), email: formData.get('email'), role: formData.get('role') } : u);
                UI.showAlert('Uporabnik posodobljen');
            } else {
                const newUser = {
                    id: Date.now(),
                    name: formData.get('name'),
                    email: formData.get('email'),
                    role: formData.get('role')
                };
                users.push(newUser);
                UI.showAlert('Uporabnik dodan');
            }
            
            localStorage.setItem('mock_users', JSON.stringify(users));
            UI.closeModal();
            this.render(document.getElementById('content-area'));
        },

        delete(id) {
            if (confirm('Izbrišem uporabnika?')) {
                let users = JSON.parse(localStorage.getItem('mock_users'));
                users = users.filter(u => u.id !== id);
                localStorage.setItem('mock_users', JSON.stringify(users));
                UI.showAlert('Uporabnik izbrisan');
                this.render(document.getElementById('content-area'));
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
            const items = res.data;
            container.innerHTML = `
                <div class="section-header">
                    <h2>Galerija</h2>
                    <button class="btn btn-primary admin-add-btn" onclick="Sections.gallery.showAddForm()">Dodaj sliko</button>
                </div>
                <div class="card" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                    ${items.map(item => `
                        <div style="position: relative;">
                            <img src="/${item.image_path}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px;">
                            <div style="padding: 0.5rem;">
                                <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">${item.title || 'Brez naslova'}</p>
                                <button class="btn btn-sm btn-delete" onclick="Sections.gallery.delete(${item.id})">Izbriši</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        },

        showAddForm() {
            const html = `
                <form id="gallery-form">
                    <div class="form-group">
                        <label>Naslov / Opis</label>
                        <input type="text" name="title">
                    </div>
                    <div class="form-group">
                        <label>Kategorija</label>
                        <select name="category" id="img-category">
                            <option value="">Izberi kategorijo...</option>
                            <option value="tekmovanje">Tekmovanje</option>
                            <option value="vaje">Vaje</option>
                            <option value="prosti-cas">Prosti čas</option>
                        </select>
                        <input type="text" name="custom_category" placeholder="Ali vpiši novo kategorijo..." style="margin-top: 0.5rem;" />
                    </div>
                    <div class="form-group">
                        <label>Slika</label>
                        <input type="file" name="image" accept="image/*" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Naloži</button>
                </form>
            `;
            UI.showModal('Dodaj v galerijo', html, () => {
                document.getElementById('gallery-form').onsubmit = (e) => this.handleSubmit(e);
            });
        },

        async handleSubmit(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const customCat = formData.get('custom_category');
            if (customCat && customCat.trim() !== '') {
                formData.set('category', customCat);
            }
            formData.delete('custom_category');
            
            try {
                await API.post('/gallery', formData);
                UI.showAlert('Slika naložena');
                UI.closeModal();
                UI.loadSection('gallery');
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
                                <th>Naslov</th>
                                <th>Datum</th>
                                <th>Lokacija</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.title}</td>
                                    <td>${new Date(item.event_date).toLocaleDateString('sl-SI')}</td>
                                    <td>${item.location || ''}</td>
                                    <td class="actions">
                                        <button class="btn btn-sm btn-edit" onclick="Sections.events.showEditForm(${item.id})">Uredi</button>
                                        <button class="btn btn-sm btn-delete" onclick="Sections.events.delete(${item.id})">Izbriši</button>
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
                <form id="event-form">
                    <div class="form-group">
                        <label>Naslov</label>
                        <input type="text" name="title" required>
                    </div>
                    <div class="form-group">
                        <label>Datum</label>
                        <input type="date" name="event_date" required>
                    </div>
                    <div class="form-group">
                        <label>Lokacija</label>
                        <input type="text" name="location">
                    </div>
                    <div class="form-group">
                        <label>Opis</label>
                        <textarea name="description" rows="4"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Shrani</button>
                </form>
            `;
            UI.showModal('Dodaj dogodek', html, () => {
                document.getElementById('event-form').onsubmit = (e) => this.handleSubmit(e);
            });
        },

        async showEditForm(id) {
            const res = await API.get(`/events/${id}`);
            const item = res.data;
            const html = `
                <form id="event-form">
                    <input type="hidden" name="id" value="${item.id}">
                    <div class="form-group">
                        <label>Naslov</label>
                        <input type="text" name="title" value="${item.title}" required>
                    </div>
                    <div class="form-group">
                        <label>Datum</label>
                        <input type="date" name="event_date" value="${item.event_date.split(' ')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label>Lokacija</label>
                        <input type="text" name="location" value="${item.location || ''}">
                    </div>
                    <div class="form-group">
                        <label>Opis</label>
                        <textarea name="description" rows="4">${item.description || ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Posodobi</button>
                </form>
            `;
            UI.showModal('Uredi dogodek', html, () => {
                document.getElementById('event-form').onsubmit = (e) => this.handleSubmit(e, true);
            });
        },

        async handleSubmit(e, isEdit = false) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            try {
                if (isEdit) {
                    await API.put(`/events/${data.id}`, data);
                    UI.showAlert('Dogodek posodobljen');
                } else {
                    await API.post('/events', data);
                    UI.showAlert('Dogodek dodan');
                }
                UI.closeModal();
                UI.loadSection('events');
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
            }

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
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.rank || '/'}</td>
                                    <td>${item.role || '/'}</td>
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
                        <label>Slika</label>
                        <input type="file" name="image" accept="image/*">
                    </div>
                    <button type="submit" class="btn btn-primary">Shrani</button>
                </form>
            `;
            UI.showModal('Dodaj člana', html, () => {
                document.getElementById('member-form').onsubmit = (e) => this.handleSubmit(e);
            });
        },

        async showEditForm(id) {
            const res = await API.get(`/members/${id}`);
            const item = res.data;
            const html = `
                <form id="member-form">
                    <input type="hidden" name="id" value="${item.id}">
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
                        <label>Slika</label>
                        <input type="file" name="image" accept="image/*">
                    </div>
                    <button type="submit" class="btn btn-primary">Posodobi</button>
                </form>
            `;
            UI.showModal('Uredi člana', html, () => {
                document.getElementById('member-form').onsubmit = (e) => this.handleSubmit(e, true);
            });
        },

        async handleSubmit(e, isEdit = false) {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            const imageFile = formData.get('image');
            if (imageFile && imageFile.size > 0) {
                data.image = await API.uploadImage(imageFile);
            }

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
    },

    applications: {
        async render(container) {
            const res = await API.get('/apply');
            const items = res.data;
            container.innerHTML = `
                <div class="section-header">
                    <h2>Vloge za vstop</h2>
                </div>
                <div class="card">
                    <table>
                        <thead>
                            <tr>
                                <th>Ime</th>
                                <th>E-pošta</th>
                                <th>Datum</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.email}</td>
                                    <td>${new Date(item.created_at).toLocaleDateString('sl-SI')}</td>
                                    <td class="actions">
                                        <button class="btn btn-sm btn-edit" onclick="Sections.applications.view(${item.id})">Poglej</button>
                                        <button class="btn btn-sm btn-delete" onclick="Sections.applications.delete(${item.id})">Izbriši</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },

        async view(id) {
            const res = await API.get('/apply/' + id);
            const item = res.data;
            const html = `
                <div style="line-height: 2;">
                    <p><strong>Ime in priimek:</strong> ${item.name}</p>
                    <p><strong>E-pošta:</strong> ${item.email}</p>
                    <p><strong>Telefon:</strong> ${item.phone || '/'}</p>
                    <p><strong>Datum rojstva:</strong> ${item.birth_date || '/'}</p>
                    <p><strong>Naslov:</strong> ${item.address || '/'}</p>
                    <p><strong>Sporočilo:</strong></p>
                    <div style="background: #f9f9f9; padding: 1rem; border-radius: 4px;">
                        ${item.message || 'Brez sporočila'}
                    </div>
                </div>
            `;
            UI.showModal('Podrobnosti vloge', html);
        },

        async delete(id) {
            if (confirm('Izbrišem to vlogo?')) {
                try {
                    await API.delete(`/apply/${id}`);
                    UI.showAlert('Vloga izbrisana');
                    UI.loadSection('applications');
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    }
};

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    UI.init();
});
