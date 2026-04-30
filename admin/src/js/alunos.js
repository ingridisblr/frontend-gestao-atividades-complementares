// ── ESTADO ──────────────────────────────────────────────────────────────────
let alunos = [];
let modoEdicao = null; // null = novo, id = editar

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    carregarAlunos();
});

// ── CARREGAR ALUNOS ───────────────────────────────────────────────────────────
async function carregarAlunos() {
    try {
        // Tenta buscar da API se existir
        const dados = await api.get('/alunos');
        alunos = dados;
    } catch (e) {
        // Fallback: usa localStorage para persistência local
        const salvo = localStorage.getItem('kore_alunos');
        alunos = salvo ? JSON.parse(salvo) : [];
    }
    renderTabela(alunos);
}

// ── SALVAR NO LOCALSTORAGE (fallback sem API) ─────────────────────────────────
function persistirLocal() {
    localStorage.setItem('kore_alunos', JSON.stringify(alunos));
}

// ── RENDER TABELA ─────────────────────────────────────────────────────────────
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

    tbody.innerHTML = lista.map(a => `
        <tr>
            <td class="td-nome">${escapeHtml(a.nome)}</td>
            <td><span class="badge-matricula">${escapeHtml(a.matricula)}</span></td>
            <td>${escapeHtml(a.curso)}</td>
            <td class="td-email">${escapeHtml(a.email)}</td>
            <td>
                <div class="acoes">
                    <button class="btn-acao editar" onclick="abrirModalEdicao('${a.id}')" title="Editar">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-acao deletar" onclick="excluirAluno('${a.id}')" title="Excluir">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ── BUSCA ─────────────────────────────────────────────────────────────────────
function buscar() {
    const termo = document.getElementById('campoBusca').value.toLowerCase().trim();
    if (!termo) {
        renderTabela(alunos);
        return;
    }
    const filtrado = alunos.filter(a =>
        a.nome.toLowerCase().includes(termo) ||
        a.matricula.toLowerCase().includes(termo) ||
        a.email.toLowerCase().includes(termo)
    );
    renderTabela(filtrado);
}

// ── MODAL: ABRIR / FECHAR ─────────────────────────────────────────────────────
function abrirModal() {
    modoEdicao = null;
    document.getElementById('modalTitulo').textContent = 'Novo Aluno';
    document.getElementById('btnSalvar').textContent = 'Salvar';
    limparFormulario();
    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modal').classList.add('open');
    document.getElementById('inputNome').focus();
}

function abrirModalEdicao(id) {
    const aluno = alunos.find(a => a.id === id);
    if (!aluno) return;

    modoEdicao = id;
    document.getElementById('modalTitulo').textContent = 'Editar Aluno';
    document.getElementById('btnSalvar').textContent = 'Atualizar';

    document.getElementById('inputNome').value      = aluno.nome;
    document.getElementById('inputMatricula').value = aluno.matricula;
    document.getElementById('inputEmail').value     = aluno.email;
    document.getElementById('inputCurso').value     = aluno.curso;

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
    ['inputNome', 'inputMatricula', 'inputEmail', 'inputCurso'].forEach(id => {
        document.getElementById(id).value = '';
        document.getElementById(id).classList.remove('input-erro');
    });
}

// ── SALVAR / ATUALIZAR ALUNO ──────────────────────────────────────────────────
async function salvarAluno() {
    const nome      = document.getElementById('inputNome').value.trim();
    const matricula = document.getElementById('inputMatricula').value.trim();
    const email     = document.getElementById('inputEmail').value.trim();
    const curso     = document.getElementById('inputCurso').value.trim();

    // Validação
    let valido = true;
    [['inputNome', nome], ['inputMatricula', matricula], ['inputEmail', email], ['inputCurso', curso]].forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (!val) {
            el.classList.add('input-erro');
            valido = false;
        } else {
            el.classList.remove('input-erro');
        }
    });
    if (!valido) return;

    // Validação de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('inputEmail').classList.add('input-erro');
        return;
    }

    const btnSalvar = document.getElementById('btnSalvar');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
        if (modoEdicao) {
            // Editar
            const idx = alunos.findIndex(a => a.id === modoEdicao);
            alunos[idx] = { ...alunos[idx], nome, matricula, email, curso };
            try { await api.put(`/alunos/${modoEdicao}`, alunos[idx]); } catch (e) { persistirLocal(); }
            mostrarToast('Aluno atualizado com sucesso!');
        } else {
            // Novo
            const novo = { id: gerarId(), nome, matricula, email, curso, criadoEm: new Date().toISOString() };
            alunos.unshift(novo);
            try { await api.post('/alunos', novo); } catch (e) { persistirLocal(); }
            mostrarToast('Aluno cadastrado com sucesso!');
        }

        fecharModal();
        renderTabela(alunos);

    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = modoEdicao ? 'Atualizar' : 'Salvar';
    }
}

// ── EXCLUIR ALUNO ─────────────────────────────────────────────────────────────
async function excluirAluno(id) {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;

    alunos = alunos.filter(a => a.id !== id);
    try { await api.delete(`/alunos/${id}`); } catch (e) { persistirLocal(); }

    renderTabela(alunos);
    mostrarToast('Aluno removido.');
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
