renderTopbar();

let todasAtividades = [];
let todosAlunos = [];
let todosCursos = [];
let todasCategorias = [];
let atividadeSelecionada = null;

const eyeIcon = `
    <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="15" height="15">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>`;

function textoSeguro(valor, fallback = '-') {
    return valor === undefined || valor === null || valor === '' ? fallback : String(valor);
}

function normalizarStatus(status) {
    const s = textoSeguro(status, 'enviada').trim().toLowerCase();

    const map = {
        pendente: 'enviada',
        enviada: 'enviada',
        enviado: 'enviada',
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

    return map[normalizarStatus(status)] || textoSeguro(status, 'Enviada');
}

function classeStatus(status) {
    return normalizarStatus(status).replace(/\s+/g, '-');
}

function formatarData(data) {
    if (!data) return '-';
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
}

function obterAluno(a) {
    return textoSeguro(a.alunoId?.nome || a.aluno?.nome || a.nomeAluno || a.alunoNome || a.nome);
}

function obterAlunoId(a) {
    const aluno = a.alunoId || a.aluno || a.aluno_id || null;
    return aluno?._id || aluno?.id || aluno || '';
}

function normalizarNomeArquivo(nome = '') {
    return String(nome || '').trim().toLowerCase();
}

function escolherCertificado(certificados = [], arquivoReferencia = null) {
    if (!Array.isArray(certificados) || certificados.length === 0) return null;

    const nomeReferencia = normalizarNomeArquivo(
        arquivoReferencia?.nomeArquivo || arquivoReferencia?.filename || arquivoReferencia?.name
    );

    if (nomeReferencia) {
        const porNome = certificados.find(certificado => {
            const nomeCertificado = normalizarNomeArquivo(
                certificado.nomeArquivo || certificado.filename || certificado.name
            );
            return nomeCertificado === nomeReferencia;
        });

        if (porNome) return porNome;
    }

    return [...certificados].sort((a, b) => {
        const dataA = new Date(a.dataEnvio || a.createdAt || a.dataCriacao || 0).getTime();
        const dataB = new Date(b.dataEnvio || b.createdAt || b.dataCriacao || 0).getTime();
        return dataB - dataA;
    })[0];
}

async function buscarCertificadoFallback(atividade, arquivoReferencia = null) {
    const alunoId = obterAlunoId(atividade);
    if (!alunoId) return null;

    try {
        const res = await apiFetch(`/api/certificados/aluno/${alunoId}`);
        if (!res || !res.ok) return null;

        const data = await res.json().catch(() => []);
        const certificados = Array.isArray(data) ? data : (data.certificados || data.data || []);
        return escolherCertificado(certificados, arquivoReferencia);
    } catch (err) {
        console.warn('Nao foi possivel buscar certificado do aluno:', err);
        return null;
    }
}

function obterCurso(a) {
    return textoSeguro(a.cursoId?.nome || a.curso?.nome || a.nomeCurso || a.curso);
}

function obterCursoId(a) {
    return coordAtividadeCursoId(a);
}

function obterCategoria(a) {
    return textoSeguro(a.categoriaId?.nome || a.categoria?.nome || a.nomeCategoria || a.categoria);
}

function obterAreaCategoria(a) {
    return textoSeguro(a.categoriaId?.areaParametro || a.categoria?.areaParametro || a.areaParametroCategoria || a.areaParametro);
}

function obterHoras(a) {
    return a.cargaHorariaInformada ?? a.cargaHorariaValidada ?? a.cargaHoraria ?? a.horas ?? '';
}

function obterData(a) {
    return a.dataEnvio || a.dataCriacao || a.createdAt || a.dataRealizacao || a.data || a.updatedAt;
}

function obterTitulo(a) {
    return textoSeguro(a.titulo || a.nomeAtividade || a.nome);
}

function obterDescricao(a) {
    return textoSeguro(a.descricao || a.observacao || a.resumo);
}

function obterArquivo(a) {
    if (Array.isArray(a.anexos) && a.anexos.length > 0) return a.anexos[0];
    return a.anexo || a.arquivo || null;
}

function obterIndiceArquivo(arquivo) {
    const anexos = atividadeSelecionada?.anexos;
    if (!Array.isArray(anexos) || !arquivo) return 0;

    const index = anexos.indexOf(arquivo);
    return index >= 0 ? index : 0;
}

function baseApi() {
    return typeof API_URL !== 'undefined' ? API_URL : 'https://sistema-gestao-atividades-complementares.onrender.com';
}

function obterUrlArquivo(arquivo) {
    if (!arquivo) return null;

    const valor = arquivo.urlArquivo ||
        arquivo.caminho ||
        arquivo.path ||
        arquivo.url ||
        arquivo.filename;

    if (!valor) return null;

    const base = baseApi();
    let url = String(valor).trim().replace(/\\/g, '/');

    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return encodeURI(url);
    if (url.startsWith('/')) return encodeURI(`${base}${url}`);
    if (url.startsWith('uploads/')) return encodeURI(`${base}/${url}`);
    if (!url.includes('/')) return encodeURI(`${base}/uploads/${url}`);

    return encodeURI(`${base}/${url}`);
}

function obterUrlDownloadArquivo(url, arquivo = null) {
    if (!atividadeSelecionada) return null;

    const id = atividadeSelecionada._id || atividadeSelecionada.id;
    if (!id) return null;

    const index = obterIndiceArquivo(arquivo);
    return `/api/atividades/${id}/anexos/${index}/download`;
}

function obterTipoArquivo(arquivo, url = '') {
    return textoSeguro(
        arquivo?.tipoArquivo || arquivo?.mimetype || arquivo?.tipo || arquivo?.contentType || url,
        ''
    ).toLowerCase();
}

async function baixarAnexoAtividade(endpoint, nomeArquivo = 'certificado.pdf') {
    if (!endpoint) {
        alert('Não foi possível identificar o arquivo para download.');
        return;
    }

    try {
        const res = await apiFetch(endpoint);

        if (!res || !res.ok) {
            const data = await res?.json().catch(() => ({}));
            alert(data.message || 'Não foi possível baixar o PDF.');
            return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo || 'certificado.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Erro ao baixar anexo:', err);
        alert('Erro ao baixar o PDF.');
    }
}

async function lerJsonSeguro(res, fallback = {}) {
    if (!res) return fallback;
    return res.json().catch(() => fallback);
}

function renderizarTabela(atividades) {
    const tbody = document.getElementById('tabelaBody');
    if (!tbody) return;

    if (!Array.isArray(atividades) || atividades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-table">Nenhuma atividade encontrada.</td></tr>';
        return;
    }

    tbody.innerHTML = atividades.map(a => {
        const status = normalizarStatus(a.status);
        const id = a._id || a.id;
        const horas = obterHoras(a);

        return `
            <tr>
                <td class="td-aluno">${obterAluno(a)}</td>
                <td class="td-curso">${obterCurso(a)}</td>
                <td>${obterCategoria(a)}</td>
                <td class="td-carga">${horas !== '' ? `${horas}h` : '-'}</td>
                <td><span class="badge ${classeStatus(status)}">${labelStatus(status)}</span></td>
                <td class="td-data">${formatarData(obterData(a))}</td>
                <td>
                    ${id ? `<button class="btn-detalhes" onclick="abrirModal('${id}')">${eyeIcon} Ver detalhes</button>` : '-'}
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
            (status === 'pendente' && ['enviada', 'em análise'].includes(statusAtividade));
        const cursoOk = !curso || String(obterCursoId(a)) === String(curso);

        return statusOk && cursoOk;
    });

    renderizarTabela(filtradas);
}

async function carregarAtividades() {
    try {
        const cursoId = coordCursoSelecionadoId(todosCursos);
        const res = await apiFetch(`/api/atividades${cursoId ? `?cursoId=${cursoId}` : ''}`);

        if (!res || !res.ok) throw new Error('Erro ao buscar atividades');

        const data = await res.json();
        todasAtividades = coordFiltrarAtividadesCursoSelecionado(coordNormalizarLista(data, 'atividades'), todosCursos);

        filtrar();
    } catch (err) {
        console.error('Erro ao carregar atividades:', err);
        document.getElementById('tabelaBody').innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">Erro ao carregar atividades. Tente novamente.</td>
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

async function abrirModal(id) {
    atividadeSelecionada = todasAtividades.find(a => String(a._id || a.id) === String(id));

    if (!atividadeSelecionada) {
        alert('Atividade não encontrada.');
        return;
    }

    const a = atividadeSelecionada;
    let arquivo = obterArquivo(a);
    let urlArquivo = obterUrlArquivo(arquivo);
    let tipoArquivo = obterTipoArquivo(arquivo, urlArquivo || '');
    const horas = obterHoras(a);

    document.getElementById('atividadeId').value = a._id || a.id;
    document.getElementById('detalheAluno').textContent = obterAluno(a);
    document.getElementById('detalheCurso').textContent = obterCurso(a);
    document.getElementById('detalheCategoria').textContent = obterCategoria(a);
    document.getElementById('detalheAreaCategoria').textContent = obterAreaCategoria(a);
    document.getElementById('detalheHoras').textContent = horas !== '' ? `${horas}h` : '-';
    document.getElementById('detalheStatus').textContent = labelStatus(a.status);
    document.getElementById('detalheData').textContent = formatarData(obterData(a));
    document.getElementById('detalheTitulo').textContent = obterTitulo(a);
    document.getElementById('detalheDescricao').textContent = obterDescricao(a);
    document.getElementById('cargaHorariaValidada').value = a.cargaHorariaValidada || horas || '';
    document.getElementById('observacaoCoordenador').value = a.observacaoCoordenador || '';
    document.getElementById('justificativaReprovacao').value = a.justificativaReprovacao || '';

    renderizarArquivo(urlArquivo, tipoArquivo, arquivo);

    document.getElementById('modalOverlay')?.classList.add('open');
    document.getElementById('modalAtividade')?.classList.add('open');
    document.getElementById('modalAtividade')?.setAttribute('aria-hidden', 'false');

    if (!urlArquivo) {
        renderizarArquivo(null, '', arquivo, 'Buscando certificado salvo do aluno...');
        const certificado = await buscarCertificadoFallback(a, arquivo);

        if (certificado) {
            arquivo = { ...(arquivo || {}), ...certificado };
            urlArquivo = obterUrlArquivo(arquivo);
            tipoArquivo = obterTipoArquivo(arquivo, urlArquivo || '');
        }

        renderizarArquivo(urlArquivo, tipoArquivo, arquivo);
    }
}

function renderizarArquivo(url, tipo, arquivo = null, mensagemSemUrl = null) {
    const preview = document.getElementById('previewArquivo');
    if (!preview) return;

    if (!url) {
        const nome = arquivo?.nomeArquivo || arquivo?.filename || '';
        preview.innerHTML = `
            <span class="arquivo-vazio">
                ${mensagemSemUrl || `${nome ? `Arquivo informado: ${nome}. ` : ''}O registro não possui caminho do arquivo salvo no servidor.`}
            </span>
        `;
        return;
    }

    const urlLower = url.toLowerCase();

    if (tipo.includes('pdf') || urlLower.endsWith('.pdf')) {
        const endpointDownload = obterUrlDownloadArquivo(url, arquivo);
        const nomeArquivo = arquivo?.nomeArquivo || arquivo?.filename || 'certificado.pdf';

        preview.innerHTML = `
            <span class="arquivo-vazio">
                O PDF está disponível para download. A visualização em nova aba foi desativada porque o navegador não conseguiu carregar este arquivo.
            </span>
            <button type="button" class="link-arquivo btn-download-arquivo">Baixar PDF</button>
        `;
        preview.querySelector('.btn-download-arquivo')?.addEventListener('click', () => {
            baixarAnexoAtividade(endpointDownload, nomeArquivo);
        });
        return;
    }

    if (tipo.includes('image') || /\.(jpg|jpeg|png|webp)$/i.test(urlLower)) {
        preview.innerHTML = `
            <img src="${url}" alt="Certificado enviado">
            <a href="${url}" target="_blank" class="link-arquivo" rel="noopener">Abrir imagem em nova aba</a>
        `;
        return;
    }

    preview.innerHTML = `<a href="${url}" target="_blank" class="link-arquivo" rel="noopener">Abrir arquivo enviado</a>`;
}

function fecharModal() {
    document.getElementById('modalAtividade')?.classList.remove('open');
    document.getElementById('modalAtividade')?.setAttribute('aria-hidden', 'true');
    document.getElementById('modalOverlay')?.classList.remove('open');
    atividadeSelecionada = null;
}

function fecharTodosModais() {
    fecharModal();
}

function aplicarStatusLocal(id, novoStatus, body = {}) {
    todasAtividades = todasAtividades.map(atividade => {
        if (String(atividade._id || atividade.id) !== String(id)) return atividade;

        return {
            ...atividade,
            status: novoStatus,
            observacaoCoordenador: body.observacaoCoordenador ?? atividade.observacaoCoordenador,
            cargaHorariaValidada: body.cargaHorariaValidada ?? atividade.cargaHorariaValidada,
            justificativaReprovacao: body.justificativaReprovacao ?? atividade.justificativaReprovacao
        };
    });

    filtrar();
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

    if (novoStatus === 'Aprovada' && cargaHorariaValidada !== '') {
        const horasDigitadas = Number(cargaHorariaValidada);
        const categoria = atividadeSelecionada?.categoriaId || atividadeSelecionada?.categoria;
        const limiteDaCategoria = categoria?.limiteHoras || categoria?.cargaHorariaMaxima || null;

        if (limiteDaCategoria && horasDigitadas > limiteDaCategoria) {
            alert(`Atenção: Esta categoria permite validar no máximo ${limiteDaCategoria} horas por certificado. O certificado pode ter mais horas, mas o sistema só aceita até o teto estipulado.`);
            return;
        }
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
            body: JSON.stringify(body)
        });

        const data = await lerJsonSeguro(res);

        if (!res || !res.ok) {
            alert(data.message || data.mensagem || data.erro || 'Erro ao atualizar status.');
            return;
        }

        aplicarStatusLocal(id, novoStatus, body);
        fecharModal();

        try {
            await carregarAtividades();
        } catch (reloadError) {
            console.warn('Status atualizado, mas a lista nao foi recarregada automaticamente:', reloadError);
        }

        setTimeout(() => {
            alert(`Atividade ${novoStatus.toLowerCase()} com sucesso!`);
        }, 0);
    } catch (err) {
        console.error('Erro ao atualizar status:', err);
        alert('Erro ao atualizar status da atividade.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosFormulario();
    await carregarAtividades();
});
