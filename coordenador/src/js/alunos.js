renderTopbar();

let alunosCoord = [];
let cursosCoord = [];
let alunoEditandoId = null;

function obterCursosCoordenadosIds() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cursos = user.cursosCoordenados || [];

    return cursos
        .map(item => String(item.cursoId?._id || item.cursoId || item._id || item))
        .filter(Boolean);
}

function filtrarCursosCoordenados(cursos) {
    const permitidos = obterCursosCoordenadosIds();

    if (!permitidos.length) return cursos;

    return cursos.filter(curso => permitidos.includes(String(curso._id || curso.id)));
}

function obterCursoIdAluno(aluno) {
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
    const idCurso = obterCursoIdAluno(aluno);
    const curso = cursosCoord.find(c => String(c._id || c.id) === String(idCurso));

    return curso?.nome || aluno.curso?.nome || aluno.curso || '–';
}

function alunoPertenceAoCoordenador(aluno) {
    const permitidos = obterCursosCoordenadosIds();

    if (!permitidos.length) return true;

    return permitidos.includes(String(obterCursoIdAluno(aluno)));
}

function popularCursosAluno(cursoSelecionado = '') {
    const select = document.getElementById('inputAlunoCurso');
    select.innerHTML = '<option value="">Selecione um curso</option>';

    cursosCoord.forEach(curso => {
        const id = curso._id || curso.id;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = curso.nome || curso.codigo || 'Curso sem nome';

        if (String(id) === String(cursoSelecionado)) {
            option.selected = true;
        }

        select.appendChild(option);
    });
}

async function carregarCursosCoord() {
    const res = await apiFetch('/api/cursos');
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.message || 'Erro ao carregar cursos.');

    cursosCoord = filtrarCursosCoordenados(data.cursos || data.data || data || []);
    popularCursosAluno();
}

async function carregarAlunosCoord() {
    const res = await apiFetch('/api/alunos');
    const data = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(data.message || 'Erro ao carregar alunos.');

    alunosCoord = (data.alunos || data.data || data || []).filter(alunoPertenceAoCoordenador);
    renderizarAlunosCoord(alunosCoord);
}

function renderizarAlunosCoord(lista) {
    const tbody = document.getElementById('tabelaAlunosBody');

    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-table">Nenhum aluno encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(aluno => {
        const id = aluno._id || aluno.id;

        return `
            <tr>
                <td>${aluno.nome || '–'}</td>
                <td><span class="badge">${aluno.matricula || '–'}</span></td>
                <td>${obterNomeCursoAluno(aluno)}</td>
                <td>${aluno.email || '–'}</td>
                <td>
                    <button class="btn-ver-detalhes" onclick="abrirModalAluno('${id}')">Editar</button>
                </td>
            </tr>
        `;
    }).join('');
}

function buscarAlunosCoord() {
    const termo = document.getElementById('campoBuscaAluno').value.trim().toLowerCase();

    if (!termo) {
        renderizarAlunosCoord(alunosCoord);
        return;
    }

    const filtrados = alunosCoord.filter(aluno => {
        return [
            aluno.nome,
            aluno.matricula,
            aluno.email,
            obterNomeCursoAluno(aluno)
        ].join(' ').toLowerCase().includes(termo);
    });

    renderizarAlunosCoord(filtrados);
}

function abrirModalAluno(id = null) {
    alunoEditandoId = id;

    document.getElementById('modalAlunoTitulo').textContent = id ? 'Editar Aluno' : 'Novo Aluno';
    document.getElementById('btnSalvarAluno').textContent = id ? 'Atualizar' : 'Salvar';

    document.getElementById('inputAlunoNome').value = '';
    document.getElementById('inputAlunoMatricula').value = '';
    document.getElementById('inputAlunoEmail').value = '';
    document.getElementById('inputAlunoDataColacao').value = '';
    popularCursosAluno();

    if (id) {
        const aluno = alunosCoord.find(a => String(a._id || a.id) === String(id));

        if (aluno) {
            document.getElementById('inputAlunoNome').value = aluno.nome || '';
            document.getElementById('inputAlunoMatricula').value = aluno.matricula || '';
            document.getElementById('inputAlunoEmail').value = aluno.email || '';
            document.getElementById('inputAlunoDataColacao').value = aluno.dataPrevistaColacao ? aluno.dataPrevistaColacao.split('T')[0] : '';
            popularCursosAluno(obterCursoIdAluno(aluno));
        }
    }

    document.getElementById('modalAlunoOverlay').classList.add('open');
    document.getElementById('modalAluno').classList.add('open');
}

function fecharModalAluno() {
    document.getElementById('modalAlunoOverlay').classList.remove('open');
    document.getElementById('modalAluno').classList.remove('open');
    alunoEditandoId = null;
}

async function salvarAlunoCoord() {
    const nome = document.getElementById('inputAlunoNome').value.trim();
    const matricula = document.getElementById('inputAlunoMatricula').value.trim().toUpperCase();
    const email = document.getElementById('inputAlunoEmail').value.trim().toLowerCase();
    const dataPrevistaColacao = document.getElementById('inputAlunoDataColacao').value;
    const cursoId = document.getElementById('inputAlunoCurso').value;

    if (!nome || !matricula || !email || !dataPrevistaColacao || !cursoId) {
        alert('Preencha todos os campos.');
        return;
    }

    const body = {
        nome,
        matricula,
        email,
        dataPrevistaColacao,
        cursos: [{ cursoId }]
    };

    const btn = document.getElementById('btnSalvarAluno');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const res = await apiFetch(alunoEditandoId ? `/api/alunos/${alunoEditandoId}` : '/api/alunos', {
            method: alunoEditandoId ? 'PATCH' : 'POST',
            body: JSON.stringify(body)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.message || data.errors?.join(', ') || 'Erro ao salvar aluno.');
            return;
        }

        fecharModalAluno();
        await carregarAlunosCoord();
    } catch (error) {
        console.error('Erro ao salvar aluno:', error);
        alert('Erro ao salvar aluno.');
    } finally {
        btn.disabled = false;
        btn.textContent = alunoEditandoId ? 'Atualizar' : 'Salvar';
    }
}

async function iniciarAlunosCoord() {
    try {
        await carregarCursosCoord();
        await carregarAlunosCoord();

        document.getElementById('campoBuscaAluno')?.addEventListener('input', buscarAlunosCoord);
    } catch (error) {
        console.error('Erro ao carregar tela de alunos:', error);
        document.getElementById('tabelaAlunosBody').innerHTML = '<tr><td colspan="5" class="empty-table">Erro ao carregar alunos.</td></tr>';
    }
}

iniciarAlunosCoord();
