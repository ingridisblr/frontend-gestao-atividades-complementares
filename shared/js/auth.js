function verificarAuth(perfilNecessario = null) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    // se não tiver token ou user → volta pro login
    if (!token || !user) {
        window.location.href = '../../../index.html';
        return;
    }

    // valida perfil (se necessário)
    if (perfilNecessario && !user.perfis?.includes(perfilNecessario)) {
        alert('Você não tem permissão para acessar esta área.');
        window.location.href = '../../../index.html';
    }

    // preenche nome no topo
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    if (userName) userName.textContent = user.nome;
    if (userEmail) userEmail.textContent = user.email;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../../../index.html';
}