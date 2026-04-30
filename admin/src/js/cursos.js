let cursoEditandoId = null;

const icoEditar = `<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="17" height="17"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const icoDeletar = `<svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="17" height="17"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>`;

function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function abrirModal(curso = null) {
    cursoEditandoId = curso?._id || curso?.id || null;
    document.getElementById('modalTitulo').textContent = curso ? 'Editar Curso' : 'Novo Curso';
    document.getElementById('inputNome').value   = curso?.nome   || '';
    document.getElementById('inputCodigo').value = curso?.codigo || '';
    document.getElementById('inputStatus').value = curso?.status || 'ativo';
    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modal').classList.add('open');
    document.getElementById('inputNome').focus();
}

function fecharModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('modal').classList.remove('open');
    cursoEditandoId = null;
}

function renderizarTabela(cursos) {
    const tbody = document.getElementById('tabelaBody');

    if (!cursos || cursos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="empty-table">Nenhum curso encontrado</td></tr>`;
        return;
    }

    tbody.innerHTML = cursos.map(c => {
        const status = (c.status || 'ativo').toLowerCase();
        return `
            <tr>
                <td class="td-nome">${c.nome || '–'}</td>
                <td><span class="badge-codigo">${c.codigo || '–'}</span></td>
                <td><span class="badge-status ${status}">${status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
                <td>
                    <div class="acoes">
                        <button class="btn-acao editar" onclick='editarCurso(${JSON.stringify(c)})' title="Editar">
                            ${icoEditar}
                        </button>
                        <button class="btn-acao deletar" onclick="deletarCurso('${c._id || c.id}')" title="Remover">
                            ${icoDeletar}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function editarCurso(curso) {
    abrirModal(curso);
}

async function salvarCurso() {
    const nome = document.getElementById('inputNome').value.trim();
    const codigo = document.getElementById('inputCodigo').value.trim().toUpperCase();
    const status = document.getElementById('inputStatus').value;

    if (!nome || !codigo) {
        alert('Preencha nome e código.');
        return;
    }

    const body = {
        nome,
        codigo,
        ativo: status === 'ativo'
    };

    try {
        const res = await apiFetch('/api/cursos', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || data.mensagem || 'Erro ao salvar curso.');
            return;
        }

        mostrarToast('Curso criado!');
        fecharModal();
        carregarCursos();

    } catch (error) {
        console.error('Erro ao salvar curso:', error);
        alert('Erro ao salvar curso. Tente novamente.');
    }
}

async function deletarCurso(id) {
    if (!confirm('Tem certeza que deseja remover este curso?')) return;

    try {
        const res = await apiFetch(`/api/admin/cursos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();

        mostrarToast('Curso removido!');
        carregarCursos();

    } catch {
        alert('Erro ao remover curso. Tente novamente.');
    }
}

async function carregarCursos() {
    try {
        const res = await apiFetch('/api/admin/cursos');
        if (!res.ok) throw new Error();

        const data = await res.json();
        renderizarTabela(data.cursos || data);

    } catch (err) {
        console.error('Erro ao carregar cursos:', err);
        document.getElementById('tabelaBody').innerHTML =
            `<tr><td colspan="4" class="empty-table">Erro ao carregar cursos. Tente novamente.</td></tr>`;
    }
}

carregarCursos();