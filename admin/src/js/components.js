function renderTopbar() {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent  = userData.nome  || 'Administrador';
    document.getElementById('userEmail').textContent = userData.email || '';
}

function renderSidebar() {
    const paginaAtual = window.location.pathname.split('/').pop(); // ex: "dashboard.html"

    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href && href === paginaAtual) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

renderTopbar();
renderSidebar();