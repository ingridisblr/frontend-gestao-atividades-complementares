function renderTopbar() {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userName').textContent  = userData.nome  || 'Coordenador';
    document.getElementById('userEmail').textContent = userData.email || '';
}

function renderSidebar(paginaAtiva) {
    const links = [
        { href: 'dashboard.html',  label: 'Dashboard',  id: 'dashboard' },
        { href: 'atividades.html', label: 'Atividades', id: 'atividades' },
        { href: 'historico.html',  label: 'Histórico',  id: 'historico' },
    ];
    
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.page === paginaAtiva) item.classList.add('active');
    });
}