// ── ESTADO ──────────────────────────────────────────────────────────────────
let regras = [];
let modoEdicao = null; // null = novo, id = editar

// ── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    carregarRegras();
});

// ── CARREGAR REGRAS ───────────────────────────────────────────────────────────
async function carregarRegras() {
    try {
        // Tenta buscar da API se existir
        regras = await api.get('/api/admin/regras');
    } catch (e) {
        // Fallback: usa localStorage para persistência local
        const salvo = localStorage.getItem('kore_regras');
        regras = salvo ? JSON.parse(salvo) : [];
    }
    renderTabela(regras);
}

// ── SALVAR NO LOCALSTORAGE (fallback sem API) ─────────────────────────────────
function persistirLocal() {
    localStorage.setItem('kore_regras', JSON.stringify(regras));
}

// ── RENDER TABELA ─────────────────────────────────────────────────────────────
function renderTabela(lista) {
    const tbody = document.getElementById('tabelaBody');

    if (!lista.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);font-size:14px;">
                    Nenhuma regra cadastrada ainda.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = lista.map(r => `
        <tr>
            <td class="td-nome">${escapeHtml(r.categoria)}</td>
            <td><span class="badge-horas">${r.minHoras}h</span></td>
            <td><span class="badge-horas">${r.maxHoras}h</span></td>
            <td class="td-descricao">${escapeHtml(r.descricao || '–')}</td>
            <td>
                <div class="acoes">
                    <button class="btn-acao editar" onclick="editarRegra(${r.id})" title="Editar">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="btn-acao deletar" onclick="excluirRegra(${r.id})" title="Excluir">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="14" height="14">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>`).join('');
}

// ── BUSCAR ───────────────────────────────────────────────────────────────────
function buscar() {
    const termo = document.getElementById('campoBusca').value.toLowerCase();
    const filtradas = regras.filter(r =>
        r.categoria.toLowerCase().includes(termo) ||
        (r.descricao && r.descricao.toLowerCase().includes(termo))
    );
    renderTabela(filtradas);
}

// ── ABRIR MODAL ──────────────────────────────────────────────────────────────
function abrirModal(id = null) {
    modoEdicao = id;

    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modalOverlay');
    const titulo = document.getElementById('modalTitulo');

    if (id) {
        // Modo edição
        const regra = regras.find(r => r.id === id);
        if (!regra) return;

        document.getElementById('inputCategoria').value = regra.categoria;
        document.getElementById('inputMinHoras').value = regra.minHoras;
        document.getElementById('inputMaxHoras').value = regra.maxHoras;
        document.getElementById('inputDescricao').value = regra.descricao || '';
        titulo.textContent = 'Editar Regra';
    } else {
        // Modo novo
        document.getElementById('inputCategoria').value = '';
        document.getElementById('inputMinHoras').value = '';
        document.getElementById('inputMaxHoras').value = '';
        document.getElementById('inputDescricao').value = '';
        titulo.textContent = 'Nova Regra';
    }

    overlay.classList.add('open');
    modal.classList.add('open');
    document.getElementById('inputCategoria').focus();
}

// ── FECHAR MODAL ─────────────────────────────────────────────────────────────
function fecharModal() {
    const modal = document.getElementById('modal');
    const overlay = document.getElementById('modalOverlay');

    overlay.classList.remove('open');
    modal.classList.remove('open');
}

// ── SALVAR REGRA ─────────────────────────────────────────────────────────────
async function salvarRegra() {
    const categoria = document.getElementById('inputCategoria').value.trim();
    const minHoras = parseInt(document.getElementById('inputMinHoras').value);
    const maxHoras = parseInt(document.getElementById('inputMaxHoras').value);
    const descricao = document.getElementById('inputDescricao').value.trim();

    if (!categoria) {
        alert('Por favor, preencha a categoria.');
        return;
    }

    if (isNaN(minHoras) || minHoras < 0) {
        alert('Horas mínimas deve ser um número positivo.');
        return;
    }

    if (isNaN(maxHoras) || maxHoras < minHoras) {
        alert('Horas máximas deve ser um número maior ou igual às mínimas.');
        return;
    }

    const regra = {
        categoria,
        minHoras,
        maxHoras,
        descricao
    };

    try {
        if (modoEdicao) {
            // Editar
            const index = regras.findIndex(r => r.id === modoEdicao);
            if (index === -1) return;

            regras[index] = { ...regras[index], ...regra };
            await api.put(`/api/admin/regras/${modoEdicao}`, regra);
        } else {
            // Novo
            const novaRegra = { ...regra, id: Date.now() }; // ID simples para fallback
            regras.push(novaRegra);
            await api.post('/api/admin/regras', novaRegra);
        }

        persistirLocal();
        renderTabela(regras);
        fecharModal();
        mostrarToast('Regra salva com sucesso!');
    } catch (e) {
        persistirLocal();
        renderTabela(regras);
        fecharModal();
        mostrarToast('Regra salva localmente!');
    }
}

// ── EDITAR REGRA ─────────────────────────────────────────────────
function editarRegra(id) {
    abrirModal(id);
}

// ── EXCLUIR REGRA ──────────────────────────────────────────────────
async function excluirRegra(id) {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;

    try {
        regras = regras.filter(r => r.id !== id);
        await api.delete(`/api/admin/regras/${id}`);
        persistirLocal();
        renderTabela(regras);
        mostrarToast('Regra excluída!');
    } catch (e) {
        regras = regras.filter(r => r.id !== id);
        persistirLocal();
        renderTabela(regras);
        mostrarToast('Regra excluída localmente!');
    }
}

// ── UTILITÁRIOS ───────────────────────────────────────────────────────
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}