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