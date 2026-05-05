// ── ESTADO ──────────────────────────────────────────────────────────────────
let categorias = [];
let modoEdicao = null; // null = novo, id = editar

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    carregarCategorias();
});

// ── CARREGAR CATEGORIAS ───────────────────────────────────────────────────────
async function carregarCategorias() {
    try {
        // Tenta buscar da API se existir
        categorias = await api.get('/categorias');
    } catch (e) {
        // Fallback: usa localStorage para persistência local
        const salvo = localStorage.getItem('kore_categorias');
        categorias = salvo ? JSON.parse(salvo) : [];
    }
    renderTabela(categorias);
}

// ── SALVAR NO LOCALSTORAGE (fallback sem API) ─────────────────────────────────
function persistirLocal() {
    localStorage.setItem('kore_categorias', JSON.stringify(categorias));
}

// ── RENDER TABELA ─────────────────────────────────────────────────────────────
function renderTabela(lista) {
    const tbody = document.getElementById('tabelaBody');

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted);font-size:14px;">
                    Nenhuma categoria cadastrada ainda.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = lista.map(c => `
        <tr>
            <td class="td-nome">${escapeHtml(c.nome)}</td>
            <td class="td-descricao">${escapeHtml(c.descricao || '–')}</td>
            <td>
                <span class="badge ${c.ativo ? 'ativo' : 'inativo'}">
                    ${c.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>
                <div class="acoes">
                    <button class="btn-acao editar" onclick="editarCategoria(${c.id})" title="Editar">
                        <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-acao excluir" onclick="excluirCategoria(${c.id})" title="Excluir">
                        <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ── FILTRAR ───────────────────────────────────────────────────────────────────
function filtrar() {
    const busca = document.getElementById('filtroBusca').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;

    const filtradas = categorias.filter(c => {
        const matchBusca = !busca || c.nome.toLowerCase().includes(busca) ||
                          (c.descricao && c.descricao.toLowerCase().includes(busca));
        const matchStatus = !status || (status === 'ativo' ? c.ativo : !c.ativo);
        return matchBusca && matchStatus;
    });

    renderTabela(filtradas);
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
function abrirModal(categoria = null) {
    modoEdicao = categoria ? categoria.id : null;

    document.getElementById('modalTitle').textContent = modoEdicao ? 'Editar Categoria' : 'Nova Categoria';
    document.getElementById('inputNome').value = categoria?.nome || '';
    document.getElementById('inputDescricao').value = categoria?.descricao || '';
    document.getElementById('inputAtivo').checked = categoria ? categoria.ativo : true;

    document.getElementById('modal').style.display = 'flex';
    document.getElementById('inputNome').focus();
}

function fecharModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('formCategoria').reset();
    modoEdicao = null;

    // Limpar erros
    ['inputNome'].forEach(id => {
        document.getElementById(id).classList.remove('input-erro');
    });
}

// ── SALVAR CATEGORIA ──────────────────────────────────────────────────────────
async function salvarCategoria(event) {
    event.preventDefault();

    const nome = document.getElementById('inputNome').value.trim();
    const descricao = document.getElementById('inputDescricao').value.trim();
    const ativo = document.getElementById('inputAtivo').checked;

    // Validação
    let valido = true;
    if (!nome) {
        document.getElementById('inputNome').classList.add('input-erro');
        valido = false;
    } else {
        document.getElementById('inputNome').classList.remove('input-erro');
    }

    if (!valido) return;

    try {
        if (modoEdicao) {
            // Editar
            const idx = categorias.findIndex(c => c.id === modoEdicao);
            if (idx !== -1) {
                categorias[idx] = { ...categorias[idx], nome, descricao, ativo };
                await api.put(`/categorias/${modoEdicao}`, { nome, descricao, ativo });
            }
        } else {
            // Novo
            const nova = {
                id: gerarId(),
                nome,
                descricao,
                ativo,
                criadoEm: new Date().toISOString()
            };
            categorias.push(nova);
            await api.post('/categorias', nova);
        }

        persistirLocal();
        renderTabela(categorias);
        fecharModal();

        mostrarToast('Categoria salva com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        mostrarToast('Erro ao salvar categoria. Tente novamente.', 'error');
    }
}

// ── EDITAR CATEGORIA ──────────────────────────────────────────────────────────
function editarCategoria(id) {
    const categoria = categorias.find(c => c.id === id);
    if (categoria) {
        abrirModal(categoria);
    }
}

// ── EXCLUIR CATEGORIA ─────────────────────────────────────────────────────────
async function excluirCategoria(id) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
        const idx = categorias.findIndex(c => c.id === id);
        if (idx !== -1) {
            categorias.splice(idx, 1);
            await api.delete(`/categorias/${id}`);
        }

        persistirLocal();
        renderTabela(categorias);
        mostrarToast('Categoria excluída com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        mostrarToast('Erro ao excluir categoria. Tente novamente.', 'error');
    }
}

// ── UTILITÁRIOS ───────────────────────────────────────────────────────────────
function gerarId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarToast(mensagem, tipo = 'info') {
    // Implementação básica de toast - pode ser melhorada
    alert(mensagem);
}