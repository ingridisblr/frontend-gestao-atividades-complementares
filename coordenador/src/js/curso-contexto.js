const COORD_CURSO_STORAGE_KEY = 'coordCursoSelecionadoId';

function coordUser() {
    return JSON.parse(localStorage.getItem('user') || localStorage.getItem('usuario') || '{}');
}

function coordSalvarUser(user) {
    if (user && typeof user === 'object') {
        localStorage.setItem('user', JSON.stringify(user));
    }
}

function coordEhCoordenador() {
    const perfis = coordUser().perfis || [];
    return perfis.includes('coordenador') && !perfis.includes('administrador');
}

async function coordSincronizarUsuarioDaApi() {
    if (typeof apiFetch !== 'function') return coordUser();

    try {
        const res = await apiFetch('/api/auth/me');
        if (!res || !res.ok) return coordUser();

        const data = await res.json().catch(() => ({}));
        const usuario = data.usuario || data.user || data.data || data;

        if (usuario && (usuario.id || usuario._id)) {
            coordSalvarUser(usuario);
            return usuario;
        }
    } catch (error) {
        console.warn('NÃ£o foi possÃ­vel atualizar dados do coordenador autenticado:', error);
    }

    return coordUser();
}

function coordNormalizarLista(data, chave = '') {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (chave && Array.isArray(data?.[chave])) return data[chave];
    return [];
}

function coordId(valor) {
    return String(valor?._id || valor?.id || valor || '').trim();
}

function coordCursoId(item) {
    return coordId(item?.cursoId || item?.curso || item);
}

function coordCursoNome(item, cursos = []) {
    const id = coordCursoId(item);
    const curso = cursos.find(c => coordId(c) === id);

    return item?.cursoId?.nome ||
        item?.curso?.nome ||
        item?.nome ||
        item?.nomeCurso ||
        curso?.nome ||
        curso?.nomeCurso ||
        item?.codigo ||
        'Curso sem nome';
}

function coordCursosCoordenados(cursosBase = []) {
    const cursosUsuario = coordUser().cursosCoordenados || [];
    const fonte = cursosUsuario.length ? cursosUsuario : (coordEhCoordenador() ? cursosBase : []);

    return fonte
        .map(item => {
            const id = coordCursoId(item);
            if (!id) return null;

            return {
                id,
                nome: coordCursoNome(item, cursosBase)
            };
        })
        .filter(Boolean);
}

function coordCursoSelecionadoId(cursosBase = []) {
    const cursos = coordCursosCoordenados(cursosBase);
    if (!cursos.length) return '';

    const salvo = localStorage.getItem(COORD_CURSO_STORAGE_KEY);
    const valido = cursos.some(curso => String(curso.id) === String(salvo));
    const selecionado = valido ? salvo : cursos[0].id;

    localStorage.setItem(COORD_CURSO_STORAGE_KEY, selecionado);
    return selecionado;
}

function coordSetCursoSelecionado(id) {
    if (id) localStorage.setItem(COORD_CURSO_STORAGE_KEY, String(id));
}

function coordCursoSelecionado(cursosBase = []) {
    const id = coordCursoSelecionadoId(cursosBase);
    return coordCursosCoordenados(cursosBase).find(curso => String(curso.id) === String(id)) || null;
}

function coordPopularSelectCursos(selectId, cursosBase = [], cursoSelecionado = coordCursoSelecionadoId(cursosBase)) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const cursos = coordCursosCoordenados(cursosBase);
    select.innerHTML = '';

    if (!cursos.length) {
        select.innerHTML = '<option value="">Nenhum curso vinculado</option>';
        select.disabled = true;
        return;
    }

    select.disabled = cursos.length <= 1;

    cursos.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso.id;
        option.textContent = curso.nome;
        option.selected = String(curso.id) === String(cursoSelecionado);
        select.appendChild(option);
    });
}

function coordAtividadeCursoId(atividade) {
    return coordId(atividade?.cursoId || atividade?.curso);
}

function coordAlunoCursoIds(aluno) {
    const ids = [];
    const cursos = aluno?.cursos || aluno?.cursosMatriculados || [];

    cursos.forEach(item => {
        const id = coordCursoId(item);
        if (id) ids.push(id);
    });

    const cursoUnico = coordId(aluno?.cursoId || aluno?.curso);
    if (cursoUnico) ids.push(cursoUnico);

    return [...new Set(ids)];
}

function coordFiltrarAtividadesCursoSelecionado(atividades, cursosBase = []) {
    const cursoId = coordCursoSelecionadoId(cursosBase);
    if (!cursoId) return coordEhCoordenador() ? [] : atividades;

    return atividades.filter(atividade => String(coordAtividadeCursoId(atividade)) === String(cursoId));
}

function coordFiltrarAlunosCursoSelecionado(alunos, cursosBase = []) {
    const cursoId = coordCursoSelecionadoId(cursosBase);
    if (!cursoId) return coordEhCoordenador() ? [] : alunos;

    return alunos.filter(aluno => coordAlunoCursoIds(aluno).some(id => String(id) === String(cursoId)));
}

