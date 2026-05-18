/**
 * API utility for PGD Majšperk Breg
 */
const API = {
    baseUrl: '/api',

    async fetch(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Fetch Error:', error);
            throw error;
        }
    },

    // GET methods
    async getNews() {
        return this.fetch('/news');
    },

    async getGallery() {
        return this.fetch('/gallery');
    },

    async getEvents() {
        return this.fetch('/events');
    },

    async getVehicles() {
        return this.fetch('/vehicles');
    },

    async getMembers() {
        return this.fetch('/members');
    },

    // POST methods
    async postContact(data) {
        return this.fetch('/contact', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async postApplication(data) {
        return this.fetch('/apply', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};

window.API = API;
