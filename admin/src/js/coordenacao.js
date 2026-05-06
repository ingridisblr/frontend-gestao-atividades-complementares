// ── ÍCONES ──────────────────────────────────────────────
const icoEditar = `<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="17" height="17">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>`;

const icoDeletar = `<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="17" height="17">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
</svg>`;

const icoAvatar = `<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="18" height="18">
    <circle cx="12" cy="8" r="4"/>
    <path d="M6 20v-2a6 6 0 0112 0v2"/>
    <path d="M19 11l1.5 1.5L23 10"/>
</svg>`;

let coordenadores = [];
let coordEditandoId = null;
let coordExcluindoId = null;

function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function formatarData(iso) {
    if (!iso) return '–';
    return new Date(iso).toLocaleDateString('pt-BR');
}

function obterCurso(c) {
    if (c.curso) return c.curso;

    if (Array.isArray(c.cursosCoordenados) && c.cursosCoordenados.length > 0) {
        return c.cursosCoordenados
            .map(curso => curso.nome || curso.titulo || curso.codigo || curso)
            .join(', ');
    }

    return '–';
}

function renderizarTabela(lista) {
    const tbody = document.getElementById('tabelaBody');

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-table">Nenhum coordenador encontrado</td></tr>`;
        return;
    }

    tbody.innerHTML = lista.map(c => {
        const id = c._id || c.id;
        const status = c.ativo === false ? 'inativo' : 'ativo';

        return `
            <tr>
                <td>
                    <div class="td-nome-cell">
                        <div class="coord-avatar">${icoAvatar}</div>
                        <span class="td-nome-text">${c.nome || '–'}</span>
                    </div>
                </td>
                <td class="td-email">${c.email || '–'}</td>
                <td>${obterCurso(c)}</td>
                <td>
                    <span class="badge-status ${status}">
                        ${status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>${formatarData(c.createdAt || c.dataCriacao)}</td>
                <td>
                    <div class="acoes">
                        <button class="btn-acao editar" onclick='editarCoordenador(${JSON.stringify(c)})' title="Editar">
                            ${icoEditar}
                        </button>
                        <button class="btn-acao deletar" onclick="confirmarExclusao('${id}', '${(c.nome || '').replace(/'/g, "\\'")}')" title="Remover">
                            ${icoDeletar}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function abrirModal(coord = null) {
    coordEditandoId = coord?._id || coord?.id || null;

    document.getElementById('modalTitulo').textContent = coord ? 'Editar Coordenador' : 'Novo Coordenador';
    document.getElementById('inputNome').value = coord?.nome || '';
    document.getElementById('inputEmail').value = coord?.email || '';
    document.getElementById('inputCurso').value = obterCurso(coord || {});
    document.getElementById('inputStatus').value = coord?.ativo === false ? 'inativo' : 'ativo';

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modal').classList.add('open');
    document.getElementById('inputNome').focus();
}

function fecharModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('modal').classList.remove('open');
    coordEditandoId = null;
}

function editarCoordenador(coord) {
    abrirModal(coord);
}

async function salvarCoordenador() {
    const nome = document.getElementById('inputNome').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    const curso = document.getElementById('inputCurso').value.trim();
    const status = document.getElementById('inputStatus').value;

    if (!nome || !email || !curso) {
        mostrarToast('Preencha todos os campos obrigatórios.');
        return;
    }

    const body = {
        nome,
        email,
        perfis: ['coordenador'],
        ativo: status === 'ativo',
        cursosCoordenados: curso ? [curso] : []
    };

    if (!coordEditandoId) {
        body.senha = '123456';
    }

    try {
        let res;

        if (coordEditandoId) {
            res = await apiFetch(`/api/usuarios/${coordEditandoId}`, {
                method: 'PATCH',
                body: JSON.stringify(body)
            });
        } else {
            res = await apiFetch('/api/usuarios', {
                method: 'POST',
                body: JSON.stringify(body)
            });
        }

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || 'Erro na resposta do servidor');
        }

        fecharModal();
        mostrarToast(coordEditandoId ? 'Coordenador atualizado!' : 'Coordenador criado com sucesso!');
        await carregarCoordenadores();

    } catch (err) {
        console.error('Erro ao salvar coordenador:', err);
        mostrarToast(err.message || 'Erro ao salvar coordenador no banco.');
    }
}

function confirmarExclusao(id, nome) {
    coordExcluindoId = id;
    document.getElementById('nomeConfirm').textContent = nome;
    document.getElementById('overlayConfirm').classList.add('open');
    document.getElementById('modalConfirm').classList.add('open');

    document.getElementById('btnConfirmarExclusao').onclick = () => deletarCoordenador(id);
}

function fecharConfirm() {
    document.getElementById('overlayConfirm').classList.remove('open');
    document.getElementById('modalConfirm').classList.remove('open');
    coordExcluindoId = null;
}

async function deletarCoordenador(id) {
    fecharConfirm();

    try {
        const res = await apiFetch(`/api/usuarios/${id}`, {
            method: 'DELETE'
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || 'Erro ao excluir');
        }

        mostrarToast('Coordenador removido com sucesso!');
        await carregarCoordenadores();

    } catch (err) {
        console.error('Erro ao deletar coordenador:', err);
        mostrarToast(err.message || 'Erro ao remover coordenador do banco.');
    }
}

async function carregarCoordenadores() {
    try {
        const res = await apiFetch('/api/usuarios');

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || 'Erro ao buscar coordenadores');
        }

        const usuarios = data.data || data.usuarios || data || [];

        coordenadores = usuarios.filter(u => u.perfis?.includes('coordenador'));
        renderizarTabela(coordenadores);

    } catch (err) {
        console.error('Erro ao carregar coordenadores:', err);
        coordenadores = [];
        renderizarTabela(coordenadores);
        mostrarToast(err.message || 'Erro ao carregar coordenadores do banco.');
    }
}

renderTopbar();
carregarCoordenadores();