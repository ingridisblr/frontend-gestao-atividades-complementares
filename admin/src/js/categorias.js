let categoriaEditandoId = null;
let categoriasCache = [];
let cursosCache = [];

const icoEditar = `<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="17" height="17"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const icoDeletar = `<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="17" height="17"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = msg;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function normalizarLista(data, chave) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.[chave])) return data[chave];
    return [];
}

function getId(item) {
    return item?._id || item?.id || '';
}

function getCursoDaCategoria(categoria) {
    const curso = categoria.curso || categoria.cursoId;
    if (typeof curso === 'object' && curso !== null) return getId(curso);
    return curso || '';
}

function getNomeCurso(categoria) {
    const curso = categoria.curso || categoria.cursoId;

    if (typeof curso === 'object' && curso !== null) {
        return curso.nome || curso.codigo || 'Curso não informado';
    }

    const encontrado = cursosCache.find(cursoItem => getId(cursoItem) === curso);
    return encontrado?.nome || 'Curso não informado';
}

function preencherSelectCursos() {
    const select = document.getElementById('inputCurso');

    if (!cursosCache.length) {
        select.innerHTML = '<option value="">Nenhum curso cadastrado</option>';
        return;
    }

    select.innerHTML = '<option value="">Selecione um curso</option>' + cursosCache.map(curso => `
        <option value="${getId(curso)}">${curso.nome}</option>
    `).join('');
}

function abrirModal(categoria = null) {
    categoriaEditandoId = categoria ? getId(categoria) : null;

    document.getElementById('modalTitulo').textContent = categoria ? 'Editar Categoria' : 'Nova Categoria';
    document.getElementById('inputNome').value = categoria?.nome || '';
    document.getElementById('inputCodigo').value = categoria?.codigo || '';
    document.getElementById('inputCurso').value = categoria ? getCursoDaCategoria(categoria) : '';
    document.getElementById('inputArea').value = categoria?.areaParametro || '';
    document.getElementById('inputDescricao').value = categoria?.descricao || '';
    document.getElementById('inputStatus').value = categoria?.ativa === false ? 'inativo' : 'ativo';

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modal').classList.add('open');
    document.getElementById('inputNome').focus();
}

function fecharModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('modal').classList.remove('open');

    document.getElementById('inputNome').value = '';
    document.getElementById('inputCodigo').value = '';
    document.getElementById('inputCurso').value = '';
    document.getElementById('inputArea').value = '';
    document.getElementById('inputDescricao').value = '';
    document.getElementById('inputStatus').value = 'ativo';

    categoriaEditandoId = null;
}

function renderizarTabela(categorias) {
    const tbody = document.getElementById('tabelaBody');

    if (!categorias || categorias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table">Nenhuma categoria encontrada</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = categorias.map(categoria => {
        const id = getId(categoria);
        const status = categoria.ativa === false ? 'inativo' : 'ativo';
        const statusLabel = status === 'ativo' ? 'Ativa' : 'Inativa';

        return `
            <tr>
                <td class="td-nome">${categoria.nome || '-'}</td>
                <td><span class="badge-codigo">${categoria.codigo || '-'}</span></td>
                <td>${getNomeCurso(categoria)}</td>
                <td><span class="badge-area">${categoria.areaParametro || '-'}</span></td>
                <td><span class="badge-status ${status}">${statusLabel}</span></td>
                <td>
                    <div class="acoes">
                        <button class="btn-acao editar" onclick="editarCategoria('${id}')" title="Editar">
                            ${icoEditar}
                        </button>
                        <button class="btn-acao deletar" onclick="deletarCategoria('${id}')" title="Remover">
                            ${icoDeletar}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function editarCategoria(id) {
    const categoria = categoriasCache.find(item => getId(item) === id);

    if (!categoria) {
        alert('Categoria não encontrada.');
        return;
    }

    abrirModal(categoria);
}

async function carregarCursos() {
    const res = await apiFetch('/api/cursos');
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || data.mensagem || 'Erro ao carregar cursos.');
    }

    cursosCache = normalizarLista(data, 'cursos');
    preencherSelectCursos();
}

async function carregarCategorias() {
    const tbody = document.getElementById('tabelaBody');

    try {
        const res = await apiFetch('/api/categorias');

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || data.mensagem || 'Erro ao carregar categorias.');
        }

        categoriasCache = normalizarLista(data, 'categorias');
        renderizarTabela(categoriasCache);

    } catch (error) {
        console.error('Erro ao carregar categorias:', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table">Erro ao carregar categorias. Tente novamente.</td>
            </tr>
        `;
    }
}

async function salvarCategoria() {
    const nome = document.getElementById('inputNome').value.trim();
    const codigo = document.getElementById('inputCodigo').value.trim().toUpperCase();
    const curso = document.getElementById('inputCurso').value;
    const areaParametro = document.getElementById('inputArea').value.trim();
    const descricao = document.getElementById('inputDescricao').value.trim();
    const status = document.getElementById('inputStatus').value;

    if (!nome || !codigo || !curso || !areaParametro) {
        alert('Preencha nome, código, curso e área/parâmetro.');
        return;
    }

    const body = {
        nome,
        codigo,
        curso,
        areaParametro,
        descricao,
        ativa: status === 'ativo'
    };

    const url = categoriaEditandoId ? `/api/categorias/${categoriaEditandoId}` : '/api/categorias';
    const method = categoriaEditandoId ? 'PUT' : 'POST';

    try {
        const res = await apiFetch(url, {
            method,
            body: JSON.stringify(body)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.message || data.mensagem || data.erro || 'Erro ao salvar categoria.');
            return;
        }

        mostrarToast(categoriaEditandoId ? 'Categoria atualizada!' : 'Categoria criada!');
        fecharModal();
        await carregarCategorias();

    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        alert('Erro ao salvar categoria. Tente novamente.');
    }
}

async function deletarCategoria(id) {
    if (!id) {
        alert('Categoria inválida.');
        return;
    }

    if (!confirm('Tem certeza que deseja remover esta categoria?')) return;

    try {
        const res = await apiFetch(`/api/categorias/${id}`, {
            method: 'DELETE'
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.message || data.mensagem || data.erro || 'Erro ao remover categoria.');
            return;
        }

        mostrarToast('Categoria removida!');
        await carregarCategorias();

    } catch (error) {
        console.error('Erro ao remover categoria:', error);
        alert('Erro ao remover categoria. Tente novamente.');
    }
}

async function iniciar() {
    try {
        await carregarCursos();
    } catch (error) {
        console.error('Erro ao carregar cursos:', error);
        preencherSelectCursos();
    }

    await carregarCategorias();
}

iniciar();
