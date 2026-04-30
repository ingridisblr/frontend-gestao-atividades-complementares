document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('https://sistema-gestao-atividades-complementares.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email, 
                senha: password 
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || data.mensagem || 'Erro ao fazer login');
            return;
        }

        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.usuario));

        
        const perfis = data.usuario.perfis || [];

        if (perfis.includes('administrador')) {
            window.location.href = './admin/src/pages/dashboard.html';
        } else if (perfis.includes('coordenador')) {
            window.location.href = './coordenador/src/pages/dashboard.html';
        } else {
            alert('Perfil não autorizado.');
        }

    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro de conexão com o servidor.');
    }
});