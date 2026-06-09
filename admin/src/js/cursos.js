let cursoEditandoId = null;
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

function normalizarCursos(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.cursos)) return data.cursos;
    return [];
}

function abrirModal(curso = null) {
    cursoEditandoId = curso?._id || curso?.id || null;

    document.getElementById('modalTitulo').textContent = curso ? 'Editar Curso' : 'Novo Curso';
    document.getElementById('inputNome').value = curso?.nome || '';
    document.getElementById('inputCodigo').value = curso?.codigo || '';
    document.getElementById('inputStatus').value = curso?.ativo === false ? 'inativo' : 'ativo';
    document.getElementById('inputCarga').value = curso?.cargaHorariaTotalComplementar || '';

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modal').classList.add('open');
    document.getElementById('inputNome').focus();
}

function fecharModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('modal').classList.remove('open');

    document.getElementById('inputNome').value = '';
    document.getElementById('inputCodigo').value = '';
    document.getElementById('inputStatus').value = 'ativo';
    document.getElementById('inputCarga').value = '';

    cursoEditandoId = null;
}

function renderizarTabela(cursos) {
    const tbody = document.getElementById('tabelaBody');

    if (!cursos || cursos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">Nenhum curso encontrado</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = cursos.map(curso => {
        const id = curso._id || curso.id;
        const status = curso.ativo === false ? 'inativo' : 'ativo';
        const statusLabel = status === 'ativo' ? 'Ativo' : 'Inativo';
        const carga = curso.cargaHorariaTotalComplementar ?? '-';

        return `
            <tr>
                <td class="td-nome">${curso.nome || '-'}</td>
                <td><span class="badge-codigo">${curso.codigo || '-'}</span></td>
                <td>${carga}h</td>
                <td><span class="badge-status ${status}">${statusLabel}</span></td>
                <td>
                    <div class="acoes">
                        <button class="btn-acao editar" onclick="editarCurso('${id}')" title="Editar">
                            ${icoEditar}
                        </button>
                        <button class="btn-acao deletar" onclick="deletarCurso('${id}')" title="Remover">
                            ${icoDeletar}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function editarCurso(id) {
    const curso = cursosCache.find(c => (c._id || c.id) === id);

    if (!curso) {
        alert('Curso não encontrado.');
        return;
    }

    abrirModal(curso);
}

async function salvarCurso() {
    const nome = document.getElementById('inputNome').value.trim();
    const codigo = document.getElementById('inputCodigo').value.trim().toUpperCase();
    const status = document.getElementById('inputStatus').value;
    const cargaHorariaTotalComplementar = Number(document.getElementById('inputCarga').value);

    if (!nome || !codigo || !cargaHorariaTotalComplementar) {
        alert('Preencha nome, código e carga horária complementar.');
        return;
    }

    const body = {
        nome,
        codigo,
        descricao: `Curso de ${nome}`,
        cargaHorariaTotalComplementar,
        ativo: status === 'ativo'
    };

    const url = cursoEditandoId ? `/api/cursos/${cursoEditandoId}` : '/api/cursos';
    const method = cursoEditandoId ? 'PUT' : 'POST';

    try {
        const res = await apiFetch(url, {
            method,
            body: JSON.stringify(body)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.message || data.mensagem || data.erro || 'Erro ao salvar curso.');
            return;
        }

        mostrarToast(cursoEditandoId ? 'Curso atualizado!' : 'Curso criado!');
        fecharModal();
        await carregarCursos();

    } catch (error) {
        console.error('Erro ao salvar curso:', error);
        alert('Erro ao salvar curso. Tente novamente.');
    }
}

async function deletarCurso(id) {
    if (!id) {
        alert('Curso inválido.');
        return;
    }

    if (!confirm('Tem certeza que deseja remover este curso?')) return;

    try {
        const res = await apiFetch(`/api/cursos/${id}`, {
            method: 'DELETE'
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.message || data.mensagem || data.erro || 'Erro ao remover curso.');
            return;
        }

        mostrarToast('Curso removido!');
        await carregarCursos();

    } catch (error) {
        console.error('Erro ao remover curso:', error);
        alert('Erro ao remover curso. Tente novamente.');
    }
}

async function carregarCursos() {
    const tbody = document.getElementById('tabelaBody');

    try {
        const res = await apiFetch('/api/cursos');

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || data.mensagem || 'Erro ao carregar cursos.');
        }

        cursosCache = normalizarCursos(data);
        renderizarTabela(cursosCache);

    } catch (error) {
        console.error('Erro ao carregar cursos:', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">Erro ao carregar cursos. Tente novamente.</td>
            </tr>
        `;
    }
}

carregarCursos();
