let todasAtividades = [];
let atividadeSelecionada = null;
let statusEmAtualizacao = false;

if (typeof verificarAuth === 'function') {
    verificarAuth();
}

function textoSeguro(valor, fallback = '-') {
    return valor === undefined || valor === null || valor === '' ? fallback : String(valor);
}

function normalizarStatus(status) {
    const s = textoSeguro(status, 'enviada').trim().toLowerCase();

    const map = {
        'pendente': 'enviada',
        'enviado': 'enviada',
        'enviada': 'enviada',
        'em an\u00e1lise': 'em an\u00e1lise',
        'em analise': 'em an\u00e1lise',
        'aprovada': 'aprovada',
        'aprovado': 'aprovada',
        'reprovada': 'reprovada',
        'reprovado': 'reprovada'
    };

    return map[s] || s;
}

function classeStatus(status) {
    return normalizarStatus(status).replace(/\s+/g, '-');
}

function labelStatus(status) {
    const map = {
        'enviada': 'Enviada',
        'em an\u00e1lise': 'Em an\u00e1lise',
        'aprovada': 'Aprovada',
        'reprovada': 'Reprovada'
    };

    return map[normalizarStatus(status)] || textoSeguro(status, 'Enviada');
}

function formatarData(data) {
    if (!data) return '-';

    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return '-';

    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
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
    return a.dataEnvio || a.createdAt || a.data || a.updatedAt;
}

function obterTitulo(a) {
    return textoSeguro(a.titulo || a.nomeAtividade || a.nome);
}

function obterDescricao(a) {
    return textoSeguro(a.descricao || a.observacao || a.resumo);
}

function obterArquivo(a) {
    if (Array.isArray(a.anexos) && a.anexos.length) return a.anexos[0];
    return a.anexo || a.arquivo || null;
}

function obterIndiceArquivo(arquivo) {
    const anexos = atividadeSelecionada?.anexos;
    if (!Array.isArray(anexos) || !arquivo) return 0;

    const index = anexos.indexOf(arquivo);
    return index >= 0 ? index : 0;
}

function baseApi() {
    return typeof API_URL !== 'undefined' ? API_URL : '';
}

function obterUrlArquivo(arquivo) {
    if (!arquivo) return null;

    const url = arquivo.urlArquivo || arquivo.caminho || arquivo.path || arquivo.url || arquivo.filename;
    if (!url) return null;

    const normalizada = String(url).trim().replace(/\\/g, '/');

    if (!normalizada) return null;
    if (/^https?:\/\//i.test(normalizada)) return encodeURI(normalizada);
    if (normalizada.startsWith('/')) return encodeURI(`${baseApi()}${normalizada}`);
    if (normalizada.startsWith('uploads/')) return encodeURI(`${baseApi()}/${normalizada}`);
    if (!normalizada.includes('/')) return encodeURI(`${baseApi()}/uploads/${normalizada}`);

    return encodeURI(`${baseApi()}/${normalizada}`);
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
        tbody.innerHTML = `<tr><td colspan="7" class="empty-table">Nenhuma atividade encontrada</td></tr>`;
        return;
    }

    tbody.innerHTML = atividades.map(a => {
        const id = a._id || a.id;
        const horas = obterHoras(a);
        const status = normalizarStatus(a.status);

        return `
            <tr>
                <td class="td-aluno">${obterAluno(a)}</td>
                <td class="td-curso">${obterCurso(a)}</td>
                <td>${obterCategoria(a)}</td>
                <td>${obterAreaCategoria(a)}</td>
                <td class="td-horas">${horas !== '' ? `${horas}h` : '-'}</td>
                <td><span class="badge ${classeStatus(status)}">${labelStatus(status)}</span></td>
                <td class="td-data">${formatarData(obterData(a))}</td>
                <td>
                    ${id ? `
                        <button class="btn-detalhes" onclick="abrirModal('${id}')">
                            Ver detalhes
                        </button>` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

function filtrar() {
    const select = document.getElementById('filtroStatus');
    const filtro = normalizarStatus(select?.value || '');

    const filtradas = todasAtividades.filter(a => {
        return !select.value || normalizarStatus(a.status) === filtro;
    });

    renderizarTabela(filtradas);
}

async function carregarAtividades() {
    const tbody = document.getElementById('tabelaBody');

    try {
        let res = await apiFetch('/api/atividades');

        if (!res || !res.ok) {
            res = await apiFetch('/api/admin/atividades');
        }

        if (!res || !res.ok) throw new Error('Erro ao buscar atividades');

        const data = await res.json();
        const lista = data.atividades || data.data || data;

        todasAtividades = Array.isArray(lista) ? lista : [];
        renderizarTabela(todasAtividades);

    } catch (err) {
        console.error('Erro ao carregar atividades:', err);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-table">Erro ao carregar atividades. Tente novamente.</td>
                </tr>
            `;
        }
    }
}

async function abrirModal(id) {
    atividadeSelecionada = todasAtividades.find(a => String(a._id || a.id) === String(id));

    if (!atividadeSelecionada) {
        alert('Atividade n\u00e3o encontrada.');
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
    document.getElementById('cargaHorariaValidada').value = a.cargaHorariaValidada ?? horas ?? '';
    document.getElementById('observacaoCoordenador').value = a.observacaoCoordenador || '';
    document.getElementById('justificativaReprovacao').value = a.justificativaReprovacao || '';

    renderizarArquivo(urlArquivo, tipoArquivo, arquivo);

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modalAtividade').classList.add('open');
    document.getElementById('modalAtividade').setAttribute('aria-hidden', 'false');

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
        const origem = arquivo || obterArquivo(atividadeSelecionada) || null;
        const nome = origem?.nomeArquivo || origem?.filename || '';
        preview.innerHTML = `
            <span class="arquivo-vazio">
                ${mensagemSemUrl || `${nome ? `Arquivo informado: ${nome}. ` : ''}O registro n\u00e3o possui caminho do arquivo salvo no servidor.`}
            </span>
        `;
        return;
    }

    if (tipo.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
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

    if (tipo.includes('image') || /\.(jpg|jpeg|png|webp)$/i.test(url)) {
        preview.innerHTML = `
            <img src="${url}" alt="Certificado enviado">
            <a href="${url}" target="_blank" class="link-arquivo" rel="noopener">Abrir imagem em nova aba</a>
        `;
        return;
    }

    preview.innerHTML = `<a href="${url}" target="_blank" class="link-arquivo" rel="noopener">Abrir arquivo enviado</a>`;
}
function fecharModal() {
    document.getElementById('modalOverlay')?.classList.remove('open');
    document.getElementById('modalAtividade')?.classList.remove('open');
    document.getElementById('modalAtividade')?.setAttribute('aria-hidden', 'true');
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

    renderizarTabela(todasAtividades);
}

function definirBotoesStatusCarregando(carregando, novoStatus = '') {
    const btnAprovar = document.getElementById('btnAprovarAtividade');
    const btnReprovar = document.getElementById('btnReprovarAtividade');

    if (btnAprovar) {
        btnAprovar.disabled = carregando;
        btnAprovar.textContent = carregando && novoStatus === 'Aprovada' ? 'Aprovando...' : 'Aprovar';
    }

    if (btnReprovar) {
        btnReprovar.disabled = carregando;
        btnReprovar.textContent = carregando && novoStatus === 'Reprovada' ? 'Reprovando...' : 'Reprovar';
    }
}

async function atualizarStatus(novoStatus) {
    if (statusEmAtualizacao) return;

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

    const body = { status: novoStatus, observacaoCoordenador };

    if (cargaHorariaValidada !== '') {
        body.cargaHorariaValidada = Number(cargaHorariaValidada);
    }

    if (novoStatus === 'Reprovada') {
        body.justificativaReprovacao = justificativaReprovacao;
    }

    try {
        statusEmAtualizacao = true;
        definirBotoesStatusCarregando(true, novoStatus);

        const res = await apiFetch(`/api/atividades/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });

        const data = await lerJsonSeguro(res);

        if (!res || !res.ok) {
            alert(data?.message || data?.mensagem || data?.erro || 'Erro ao atualizar status.');
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
    } finally {
        statusEmAtualizacao = false;
        definirBotoesStatusCarregando(false);
    }
}

function configurarBotoesStatus() {
    document.getElementById('btnAprovarAtividade')?.addEventListener('click', () => atualizarStatus('Aprovada'));
    document.getElementById('btnReprovarAtividade')?.addEventListener('click', () => atualizarStatus('Reprovada'));
}

document.addEventListener('DOMContentLoaded', () => {
    configurarBotoesStatus();
    carregarAtividades();
});



