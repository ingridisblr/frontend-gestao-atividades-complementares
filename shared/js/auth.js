function verificarAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../../index.html';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './admin/pages/dashboard.html';
}

verificarAuth();