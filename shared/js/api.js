const API_URL = 'https://sistema-gestao-atividades-complementares.onrender.com';

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        });

        
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/index.html';
            return;
        }

        return response;

    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro de conexão com o servidor.');
        throw error;
    }
}

// ── OBJETO API PARA FACILITAR O USO ───────────────────────────────────────────
const api = {
    async get(endpoint) {
        const response = await apiFetch(endpoint);
        if (!response.ok) throw new Error(`GET ${endpoint} failed`);
        return await response.json();
    },

    async post(endpoint, data) {
        const response = await apiFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`POST ${endpoint} failed`);
        return await response.json();
    },

    async put(endpoint, data) {
        const response = await apiFetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`PUT ${endpoint} failed`);
        return await response.json();
    },

    async delete(endpoint) {
        const response = await apiFetch(endpoint, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`DELETE ${endpoint} failed`);
        return await response.json();
    }
};