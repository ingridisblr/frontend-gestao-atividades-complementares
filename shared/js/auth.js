function verificarAuth(perfilNecessario = null) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        window.location.href = '../../../index.html';
        return;
    }

  
    if (perfilNecessario && !user.perfis?.includes(perfilNecessario)) {
        alert('Você não tem permissão para acessar esta área.');
        window.location.href = '../../../index.html';
    }


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
