renderTopbar();

let todasAtividades = [];
let todosAlunos = [];
let todosCursos = [];
let todasCategorias = [];
let atividadeSelecionada = null;

const API_UPLOAD_BASE = 'https://sistema-gestao-atividades-complementares.onrender.com';

const eyeIcon = `
    <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="15" height="15">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>`;

function normalizarStatus(status) {
    if (!status) return 'enviada';

    const s = String(status).trim().toLowerCase();

    const map = {
        pendente: 'enviada',
        enviada: 'enviada',
        'em análise': 'em análise',
        'em analise': 'em análise',
        aprovada: 'aprovada',
        aprovado: 'aprovada',
        reprovada: 'reprovada',
        reprovado: 'reprovada'
    };

    return map[s] || s;
}

function labelStatus(status) {
    const map = {
        enviada: 'Enviada',
        'em análise': 'Em análise',
        aprovada: 'Aprovada',
        reprovada: 'Reprovada'
    };

    return map[normalizarStatus(status)] || status || 'Enviada';
}

function formatarData(data) {
    if (!data) return '–';

    const d = new Date(data);

    if (isNaN(d.getTime())) return '–';

    return d.toLocaleDateString('pt-BR');
}

function obterAluno(a) {
    return a.alunoId?.nome || a.aluno?.nome || a.nomeAluno || a.nome || '–';
}

function obterCurso(a) {
    return a.cursoId?.nome || a.curso?.nome || a.curso || '–';
}

function obterCursoId(a) {
    return coordAtividadeCursoId(a);
}

function obterCategoria(a) {
    return a.categoriaId?.nome || a.categoria?.nome || a.categoria || '–';
}

function obterHoras(a) {
    return a.cargaHorariaInformada || a.cargaHorariaValidada || a.cargaHoraria || 0;
}

function obterData(a) {
    return a.dataEnvio || a.dataCriacao || a.createdAt || a.dataRealizacao || a.data;
}

function obterTitulo(a) {
    return a.titulo || a.nomeAtividade || '–';
}

function obterDescricao(a) {
    return a.descricao || '–';
}

function obterArquivo(a) {
    if (Array.isArray(a.anexos) && a.anexos.length > 0) return a.anexos[0];
    if (a.anexo) return a.anexo;
    if (a.arquivo) return a.arquivo;
    return null;
}

function obterUrlArquivo(arquivo) {
    if (!arquivo) return null;

    const url = arquivo.urlArquivo || arquivo.url || arquivo.caminho || arquivo.path;

    if (!url) return null;
    if (url.startsWith('http')) return url;

    return `${API_UPLOAD_BASE}${url.startsWith('/') ? url : `/${url}`}`;
}

function obterTipoArquivo(arquivo) {
    return String(
        arquivo?.tipoArquivo ||
        arquivo?.mimetype ||
        arquivo?.tipo ||
        ''
    ).toLowerCase();
}

function renderizarTabela(atividades) {
    const tbody = document.getElementById('tabelaBody');

    if (!tbody) return;

    if (!atividades || atividades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">Nenhuma atividade encontrada</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = atividades.map(a => {
        const status = normalizarStatus(a.status);
        const id = a._id || a.id;

        return `
            <tr>
                <td class="td-aluno">${obterAluno(a)}</td>
                <td class="td-curso">${obterCurso(a)}</td>
                <td>${obterCategoria(a)}</td>
                <td class="td-carga">${obterHoras(a) ? obterHoras(a) + 'h' : '–'}</td>
                <td>
                    <span class="badge ${status.replace(' ', '-')}">
                        ${labelStatus(status)}
                    </span>
                </td>
                <td class="td-data">${formatarData(obterData(a))}</td>
                <td>
                    ${
                        id
                            ? `<button class="btn-detalhes" onclick="abrirModal('${id}')">
                                    ${eyeIcon} Ver Detalhes
                               </button>`
                            : `<span class="empty-table">Sem ID</span>`
                    }
                </td>
            </tr>
        `;
    }).join('');
}

function filtrar() {
    const status = document.getElementById('filtroStatus')?.value.toLowerCase() || '';
    const curso = document.getElementById('filtroCurso')?.value || coordCursoSelecionadoId(todosCursos);

    const filtradas = todasAtividades.filter(a => {
        const statusAtividade = normalizarStatus(a.status);
        const statusOk = !status ||
            statusAtividade === status ||
            (status === 'pendente' && ['enviada', 'em análise', 'em anÃ¡lise'].includes(statusAtividade));
        const cursoOk = !curso || String(obterCursoId(a)) === String(curso);

        return statusOk && cursoOk;
    });

    renderizarTabela(filtradas);
}

async function carregarAtividades() {
    try {
        const cursoId = coordCursoSelecionadoId(todosCursos);
        const res = await apiFetch(`/api/atividades${cursoId ? `?cursoId=${cursoId}` : ''}`);

        if (!res.ok) throw new Error('Erro ao buscar atividades');

        const data = await res.json();

        todasAtividades = coordFiltrarAtividadesCursoSelecionado(coordNormalizarLista(data, 'atividades'), todosCursos);

        filtrar();

    } catch (err) {
        console.error('Erro ao carregar atividades:', err);

        document.getElementById('tabelaBody').innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    Erro ao carregar atividades. Tente novamente.
                </td>
            </tr>
        `;
    }
}

async function carregarDadosFormulario() {
    try {
        await coordSincronizarUsuarioDaApi();

        const [resAlunos, resCursos, resCategorias] = await Promise.all([
            apiFetch('/api/alunos'),
            apiFetch('/api/cursos'),
            apiFetch('/api/categorias')
        ]);

        const dataAlunos = await resAlunos.json().catch(() => ({}));
        const dataCursos = await resCursos.json().catch(() => ({}));
        const dataCategorias = await resCategorias.json().catch(() => ({}));

        todosCursos = coordNormalizarLista(dataCursos, 'cursos');
        coordCursoSelecionadoId(todosCursos);
        todosAlunos = coordFiltrarAlunosCursoSelecionado(coordNormalizarLista(dataAlunos, 'alunos'), todosCursos);
        todasCategorias = coordNormalizarLista(dataCategorias, 'categorias');

        popularSelectAlunos();
        popularSelectCursos();
        popularFiltroCurso();
        popularSelectCategorias();

    } catch (err) {
        console.error('Erro ao carregar dados do formulário:', err);
    }
}

function popularSelectAlunos() {
    const select = document.getElementById('inputAlunoId');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione o aluno</option>';

    todosAlunos.forEach(aluno => {
        const opt = document.createElement('option');
        opt.value = aluno._id || aluno.id;
        opt.textContent = `${aluno.nome || 'Aluno'}${aluno.matricula ? ` - ${aluno.matricula}` : ''}`;
        select.appendChild(opt);
    });
}

function popularSelectCursos() {
    const select = document.getElementById('inputCursoId');
    if (!select) return;

    const cursoAtual = coordCursoSelecionado(todosCursos);
    select.innerHTML = '';

    if (!cursoAtual) {
        select.innerHTML = '<option value="">Nenhum curso vinculado</option>';
        select.disabled = true;
        return;
    }

    const opt = document.createElement('option');
    opt.value = cursoAtual.id;
    opt.textContent = cursoAtual.nome;
    opt.selected = true;
    select.appendChild(opt);
    select.disabled = true;
}

function popularFiltroCurso() {
    const select = document.getElementById('filtroCurso');
    if (!select) return;

    coordPopularSelectCursos('filtroCurso', todosCursos, coordCursoSelecionadoId(todosCursos));
    select.disabled = true;
}

function popularSelectCategorias() {
    const select = document.getElementById('inputCategoriaId');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione a categoria</option>';

    todasCategorias.forEach(categoria => {
        const opt = document.createElement('option');
        opt.value = categoria._id || categoria.id;
        opt.textContent = categoria.nome || categoria.nomeCategoria || categoria.descricao || 'Categoria';
        select.appendChild(opt);
    });
}

function abrirModalEnvio() {
    document.getElementById('modalOverlay').classList.add('show');
    document.getElementById('modalEnvioAtividade').classList.add('show');
    document.getElementById('modalEnvioAtividade').setAttribute('aria-hidden', 'false');
}

function fecharModalEnvio() {
    document.getElementById('modalEnvioAtividade').classList.remove('show');
    document.getElementById('modalEnvioAtividade').setAttribute('aria-hidden', 'true');

    if (!document.getElementById('modalAtividade').classList.contains('show')) {
        document.getElementById('modalOverlay').classList.remove('show');
    }
}

function abrirModal(id) {
    atividadeSelecionada = todasAtividades.find(a => String(a._id || a.id) === String(id));

    if (!atividadeSelecionada) {
        alert('Atividade não encontrada.');
        return;
    }

    const a = atividadeSelecionada;
    const arquivo = obterArquivo(a);
    const urlArquivo = obterUrlArquivo(arquivo);
    const tipoArquivo = obterTipoArquivo(arquivo);

    document.getElementById('atividadeId').value = a._id || a.id;
    document.getElementById('detalheAluno').textContent = obterAluno(a);
    document.getElementById('detalheCurso').textContent = obterCurso(a);
    document.getElementById('detalheCategoria').textContent = obterCategoria(a);
    document.getElementById('detalheHoras').textContent = obterHoras(a) ? `${obterHoras(a)}h` : '–';
    document.getElementById('detalheStatus').textContent = labelStatus(a.status);
    document.getElementById('detalheData').textContent = formatarData(obterData(a));
    document.getElementById('detalheTitulo').textContent = obterTitulo(a);
    document.getElementById('detalheDescricao').textContent = obterDescricao(a);

    document.getElementById('cargaHorariaValidada').value = a.cargaHorariaValidada || obterHoras(a) || '';
    document.getElementById('observacaoCoordenador').value = a.observacaoCoordenador || '';
    document.getElementById('justificativaReprovacao').value = a.justificativaReprovacao || '';

    renderizarArquivo(urlArquivo, tipoArquivo);

    document.getElementById('modalOverlay').classList.add('show');
    document.getElementById('modalAtividade').classList.add('show');
    document.getElementById('modalAtividade').setAttribute('aria-hidden', 'false');
}

function renderizarArquivo(url, tipo) {
    const preview = document.getElementById('previewArquivo');

    if (!preview) return;

    if (!url) {
        preview.innerHTML = 'Nenhum arquivo encontrado.';
        return;
    }

    const urlLower = url.toLowerCase();

    if (tipo.includes('pdf') || urlLower.endsWith('.pdf')) {
        preview.innerHTML = `
            <iframe src="${url}" class="pdf-preview"></iframe>
            <a href="${url}" target="_blank" class="btn-detalhes" style="margin-top:10px;">
                Abrir PDF em nova aba
            </a>
        `;
        return;
    }

    if (
        tipo.includes('image') ||
        urlLower.endsWith('.jpg') ||
        urlLower.endsWith('.jpeg') ||
        urlLower.endsWith('.png')
    ) {
        preview.innerHTML = `
            <img src="${url}" alt="Certificado enviado" class="image-preview">
            <a href="${url}" target="_blank" class="btn-detalhes" style="margin-top:10px;">
                Abrir imagem em nova aba
            </a>
        `;
        return;
    }

    preview.innerHTML = `
        <a href="${url}" target="_blank" class="btn-detalhes">
            Abrir arquivo enviado
        </a>
    `;
}

function fecharModal() {
    document.getElementById('modalAtividade').classList.remove('show');
    document.getElementById('modalAtividade').setAttribute('aria-hidden', 'true');
    document.getElementById('modalOverlay').classList.remove('show');
    atividadeSelecionada = null;
}

function fecharTodosModais() {
    fecharModal();
    fecharModalEnvio();
}

async function atualizarStatus(novoStatus) {
    const id = document.getElementById('atividadeId').value;
    const cargaHorariaValidada = document.getElementById('cargaHorariaValidada').value;
    const observacaoCoordenador = document.getElementById('observacaoCoordenador').value.trim();
    const justificativaReprovacao = document.getElementById('justificativaReprovacao').value.trim();

    if (!id) {
        alert('Atividade inválida.');
        return;
    }

    if (novoStatus === 'Reprovada' && !justificativaReprovacao) {
        alert('Informe uma justificativa para reprovar a atividade.');
        return;
    }

    const body = {
        status: novoStatus,
        observacaoCoordenador
    };

    if (cargaHorariaValidada !== '') {
        body.cargaHorariaValidada = Number(cargaHorariaValidada);
    }

    if (novoStatus === 'Reprovada') {
        body.justificativaReprovacao = justificativaReprovacao;
    }

    try {
        const res = await apiFetch(`/api/atividades/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.message || data.mensagem || data.erro || 'Erro ao atualizar status.');
            return;
        }

        alert(`Atividade ${novoStatus.toLowerCase()} com sucesso!`);

        fecharModal();
        await carregarAtividades();

    } catch (err) {
        console.error('Erro ao atualizar status:', err);
        alert('Erro ao atualizar status da atividade.');
    }
}

async function enviarAtividade(event) {
    event.preventDefault();

    const alunoId = document.getElementById('inputAlunoId').value;
    const cursoId = document.getElementById('inputCursoId').value;
    const categoriaId = document.getElementById('inputCategoriaId').value;
    const titulo = document.getElementById('inputTitulo').value.trim();
    const descricao = document.getElementById('inputDescricao').value.trim();
    const dataRealizacao = document.getElementById('inputDataRealizacao').value;
    const cargaHorariaInformada = document.getElementById('inputCargaHoraria').value;
    const arquivo = document.getElementById('inputAnexos').files[0];

    if (!alunoId || !cursoId || !categoriaId || !titulo || !descricao || !dataRealizacao || !cargaHorariaInformada || !arquivo) {
        alert('Preencha todos os campos e selecione um certificado.');
        return;
    }

    const formData = new FormData();
    formData.append('alunoId', alunoId);
    formData.append('cursoId', cursoId);
    formData.append('categoriaId', categoriaId);
    formData.append('titulo', titulo);
    formData.append('descricao', descricao);
    formData.append('dataRealizacao', dataRealizacao);
    formData.append('cargaHorariaInformada', cargaHorariaInformada);
    formData.append('anexos', arquivo);

    try {
        const res = await apiFetch('/api/atividades', {
            method: 'POST',
            body: formData
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.message || data.mensagem || data.erro || 'Erro ao enviar atividade.');
            return;
        }

        alert('Atividade enviada com sucesso!');

        document.getElementById('formEnvioAtividade').reset();

        fecharModalEnvio();
        await carregarAtividades();

    } catch (err) {
        console.error('Erro ao enviar atividade:', err);
        alert('Erro ao enviar atividade.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosFormulario();
    await carregarAtividades();

    const form = document.getElementById('formEnvioAtividade');

    if (form) {
        form.addEventListener('submit', enviarAtividade);
    }
});
