
let alunos = [];
let cursosDisponiveis = [];
let modoEdicao = null;

document.addEventListener('DOMContentLoaded', async () => {
    await carregarCursos();
    await carregarAlunos();
});

async function carregarCursos() {
    try {
        const res = await apiFetch('/api/cursos');
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.message || 'Erro ao buscar cursos');

        cursosDisponiveis = data.cursos || data.data || data || [];
        popularSelectCursos();

    } catch (e) {
        console.error('Erro ao carregar cursos:', e);
        cursosDisponiveis = [];
        popularSelectCursos();
    }
}

function popularSelectCursos(cursoSelecionado = '') {
    const select = document.getElementById('inputCurso');

    if (!select) return;

    select.innerHTML = '<option value="">Selecione um curso</option>';

    cursosDisponiveis.forEach(curso => {
        const id = curso._id || curso.id;
        const nome = curso.nome || curso.titulo || curso.codigo || 'Curso sem nome';

        const option = document.createElement('option');
        option.value = id;
        option.textContent = nome;

        if (id === cursoSelecionado) {
            option.selected = true;
        }

        select.appendChild(option);
    });
}

function obterIdCursoAluno(aluno) {
    const primeiro = aluno?.cursos?.[0];

    if (!primeiro) return '';

    if (typeof primeiro === 'string') return primeiro;

    if (primeiro.cursoId) {
        if (typeof primeiro.cursoId === 'string') return primeiro.cursoId;
        return primeiro.cursoId._id || primeiro.cursoId.id || '';
    }

    return primeiro._id || primeiro.id || '';
}

function obterNomeCursoAluno(aluno) {
    if (aluno?.curso && typeof aluno.curso === 'string') return aluno.curso;

    const primeiro = aluno?.cursos?.[0];

    if (!primeiro) return '-';

    const curso = primeiro.cursoId || primeiro;

    if (typeof curso === 'string') {
        const encontrado = cursosDisponiveis.find(c => (c._id || c.id) === curso);
        return encontrado?.nome || encontrado?.titulo || encontrado?.codigo || curso;
    }

    return curso.nome || curso.titulo || curso.codigo || '-';
}

async function carregarAlunos() {
    try {
        const res = await apiFetch('/api/alunos');
        const data = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(data.message || 'Erro ao buscar alunos');

        alunos = data.alunos || data.data || data || [];

    } catch (e) {
        console.error('Erro ao carregar alunos:', e);
        alunos = [];
    }

    renderTabela(alunos);
}

function renderTabela(lista) {
    const tbody = document.getElementById('tabelaBody');

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);font-size:14px;">
                    Nenhum aluno cadastrado ainda.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = lista.map(a => {
        const id = a._id || a.id;

        return `
            <tr>
                <td class="td-nome">${escapeHtml(a.nome || '-')}</td>
                <td><span class="badge-matricula">${escapeHtml(a.matricula || '-')}</span></td>
                <td>${escapeHtml(obterNomeCursoAluno(a))}</td>
                <td class="td-email">${escapeHtml(a.email || '-')}</td>
                <td>
                    <div class="acoes">
                        <button class="btn-acao editar" onclick="abrirModalEdicao('${id}')" title="Editar">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="btn-acao deletar" onclick="excluirAluno('${id}')" title="Excluir">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function buscar() {
    const termo = document.getElementById('campoBusca').value.toLowerCase().trim();

    if (!termo) {
        renderTabela(alunos);
        return;
    }

    const filtrado = alunos.filter(a =>
        String(a.nome || '').toLowerCase().includes(termo) ||
        String(a.matricula || '').toLowerCase().includes(termo) ||
        String(a.email || '').toLowerCase().includes(termo)
    );

    renderTabela(filtrado);
}

function abrirModal() {
    modoEdicao = null;

    document.getElementById('modalTitulo').textContent = 'Novo Aluno';
    document.getElementById('btnSalvar').textContent = 'Salvar';

    limparFormulario();
    popularSelectCursos();

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modal').classList.add('open');
    document.getElementById('inputNome').focus();
    
}

function abrirModalEdicao(id) {
    const aluno = alunos.find(a => (a._id || a.id) === id);

    if (!aluno) return;

    modoEdicao = id;

    document.getElementById('modalTitulo').textContent = 'Editar Aluno';
    document.getElementById('btnSalvar').textContent = 'Atualizar';

    document.getElementById('inputNome').value = aluno.nome || '';
    document.getElementById('inputMatricula').value = aluno.matricula || '';
    document.getElementById('inputEmail').value = aluno.email || '';
    document.getElementById('inputDataColacao').value = aluno.dataPrevistaColacao
    ? aluno.dataPrevistaColacao.split('T')[0]: '';

    popularSelectCursos(obterIdCursoAluno(aluno));

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modal').classList.add('open');
    document.getElementById('inputNome').focus();
}

function fecharModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('modal').classList.remove('open');
    limparFormulario();
    modoEdicao = null;
}

function limparFormulario() {
    ['inputNome', 'inputMatricula', 'inputEmail', 'inputCurso', 'inputDataColacao'].forEach(id => {
        const el = document.getElementById(id);

        if (el) {
            el.value = '';
            el.classList.remove('input-erro');
        }
    });
}

async function salvarAluno() {
    const nome = document.getElementById('inputNome').value.trim();
    const matricula = document.getElementById('inputMatricula').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    const cursoId = document.getElementById('inputCurso').value;
    const dataPrevistaColacao = document.getElementById('inputDataColacao').value;

    let valido = true;

    [
        ['inputNome', nome],
        ['inputMatricula', matricula],
        ['inputEmail', email],
        ['inputCurso', cursoId],
        ['inputDataColacao', dataPrevistaColacao]
    ].forEach(([id, val]) => {
        const el = document.getElementById(id);

        if (!val) {
            el.classList.add('input-erro');
            valido = false;
        } else {
            el.classList.remove('input-erro');
        }
    });

    if (!valido) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('inputEmail').classList.add('input-erro');
        return;
    }

    const body = {
        nome,
        matricula,
        email,
        cursos: [{ cursoId }],
        dataPrevistaColacao
    };

    const btnSalvar = document.getElementById('btnSalvar');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
        let res;

        if (modoEdicao) {
            res = await apiFetch(`/api/alunos/${modoEdicao}`, {
                method: 'PATCH',
                body: JSON.stringify(body)
            });
        } else {
            res = await apiFetch('/api/alunos', {
                method: 'POST',
                body: JSON.stringify(body)
            });
        }

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.message || data.errors?.join(', ') || 'Erro ao salvar aluno.');
            return;
        }

        mostrarToast(modoEdicao ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!');
        fecharModal();
        await carregarAlunos();

    } catch (e) {
        console.error('Erro ao salvar aluno:', e);
        alert('Erro ao salvar aluno.');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = modoEdicao ? 'Atualizar' : 'Salvar';
    }
}

async function excluirAluno(id) {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;

    try {
        const res = await apiFetch(`/api/alunos/${id}`, {
            method: 'DELETE'
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.message || data.errors?.join(', ') || 'Erro ao excluir aluno.');
            return;
        }

        mostrarToast('Aluno removido.');
        await carregarAlunos();

    } catch (e) {
        console.error('Erro ao excluir aluno:', e);
        alert('Erro ao excluir aluno.');
    }
}

function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}


function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
