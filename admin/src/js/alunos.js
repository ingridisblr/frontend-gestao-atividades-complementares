renderTopbar();

let alunos = [];

async function carregarAlunos() {
    const tabelaBody = document.getElementById('tabelaBody');

    try {
        const res = await apiFetch('/api/alunos');

        if (!res.ok) {
            throw new Error('Erro ao buscar alunos');
        }

        const data = await res.json();

        alunos = Array.isArray(data) ? data : data.data || [];

        renderizarAlunos(alunos);

    } catch (error) {
        console.error('Erro ao carregar alunos:', error);

        tabelaBody.innerHTML = `
            <tr>
                <td colspan="5">Erro ao carregar alunos.</td>
            </tr>
        `;
    }
}

function renderizarAlunos(lista) {
    const tabelaBody = document.getElementById('tabelaBody');

    if (!lista.length) {
        tabelaBody.innerHTML = `
            <tr>
                <td colspan="5">Nenhum aluno cadastrado.</td>
            </tr>
        `;
        return;
    }

    tabelaBody.innerHTML = lista.map(aluno => `
        <tr>
            <td>${aluno.nome || '-'}</td>
            <td>${aluno.matricula || aluno.codigoAluno || '-'}</td>
            <td>${aluno.curso?.nome || aluno.curso || '-'}</td>
            <td>${aluno.email || '-'}</td>
            <td>
                <button onclick="editarAluno('${aluno._id}')">Editar</button>
            </td>
        </tr>
    `).join('');
}

function buscar() {
    const termo = document.getElementById('campoBusca').value.toLowerCase();

    const filtrados = alunos.filter(aluno =>
        aluno.nome?.toLowerCase().includes(termo) ||
        aluno.email?.toLowerCase().includes(termo) ||
        aluno.matricula?.toLowerCase().includes(termo) ||
        aluno.codigoAluno?.toLowerCase().includes(termo)
    );

    renderizarAlunos(filtrados);
}

function abrirModal() {
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('modal').classList.add('active');
}

function fecharModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('modal').classList.remove('active');
}

function editarAluno(id) {
    alert(`Editar aluno: ${id}`);
}

function salvarAluno() {
    alert('Cadastro de aluno será integrado depois.');
}

carregarAlunos();