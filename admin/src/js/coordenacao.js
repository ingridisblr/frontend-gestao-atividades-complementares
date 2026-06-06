
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
let cursosDisponiveis = [];
let coordEditandoId = null;
let coordExcluindoId = null;

function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function formatarData(iso) {
    if (!iso) return 'â€“';
    return new Date(iso).toLocaleDateString('pt-BR');
}



function obterIdCursoCoordenado(coord) {
    const primeiro = coord?.cursosCoordenados?.[0];

    if (!primeiro) return '';

    if (typeof primeiro === 'string') return primeiro;

    if (primeiro.cursoId) {
        if (typeof primeiro.cursoId === 'string') return primeiro.cursoId;
        return primeiro.cursoId._id || primeiro.cursoId.id || '';
    }

    return primeiro._id || primeiro.id || '';
}

function obterCurso(coord) {
    if (!coord?.cursosCoordenados?.length) return 'â€“';

    return coord.cursosCoordenados
        .map(item => {
            const curso = item.cursoId || item;

            if (typeof curso === 'string') {
                const encontrado = cursosDisponiveis.find(c => (c._id || c.id) === curso);
                return encontrado?.nome || encontrado?.titulo || encontrado?.codigo || curso;
            }

            return curso.nome || curso.titulo || curso.codigo || 'Curso';
        })
        .join(', ');
}

function popularSelectCursos(cursoSelecionado = '') {
    const select = document.getElementById('inputCurso');

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

async function carregarCursos() {
    try {
        const res = await apiFetch('/api/cursos');
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || 'Erro ao buscar cursos');
        }

        cursosDisponiveis = data.cursos || data.data || data || [];
        popularSelectCursos();

    } catch (err) {
        console.error('Erro ao carregar cursos:', err);
        cursosDisponiveis = [];
        popularSelectCursos();
        mostrarToast('Erro ao carregar cursos.');
    }
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
                        <span class="td-nome-text">${c.nome || 'â€“'}</span>
                    </div>
                </td>
                <td><span class="badge-codigo">${c.codigoUsuario || '–'}</span></td>
                <td class="td-email">${c.email || 'â€“'}</td>
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

    const cursoSelecionado = obterIdCursoCoordenado(coord);

    document.getElementById('modalTitulo').textContent = coord ? 'Editar Coordenador' : 'Novo Coordenador';
    document.getElementById('inputNome').value = coord?.nome || '';
    document.getElementById('inputMatricula').value = coord?.codigoUsuario || '';
    document.getElementById('inputEmail').value = coord?.email || '';
    document.getElementById('inputStatus').value = coord?.ativo === false ? 'inativo' : 'ativo';

    popularSelectCursos(cursoSelecionado);

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
    const matricula = document.getElementById('inputMatricula').value.trim().toUpperCase();
    const email = document.getElementById('inputEmail').value.trim();
    const cursoId = document.getElementById('inputCurso').value;
    const status = document.getElementById('inputStatus').value;

    if (!nome || !email || !cursoId) {
        mostrarToast('Preencha todos os campos obrigatÃ³rios.');
        return;
    }

    const body = {
        codigoUsuario: matricula,
        nome,
        email,
        perfis: ['coordenador'],
        ativo: status === 'ativo',
        cursosCoordenados: [{ cursoId }]
    };

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
            const msg = data.message || data.errors?.join(', ') || 'Erro na resposta do servidor';
            throw new Error(msg);
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

async function inicializar() {
    renderTopbar();
    await carregarCursos();
    await carregarCoordenadores();
}

inicializar();




