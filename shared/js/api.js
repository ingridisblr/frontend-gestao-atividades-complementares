const API_URL = 'https://sistema-gestao-atividades-complementares.onrender.com';

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = `${window.location.origin}/index.html`;
            return null;
        }

        return response;
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro de conexão com o servidor.');
        throw error;
    }
}
