let todasAtividades = [];
let atividadeSelecionada = null;

if (typeof verificarAuth === 'function') {
    verificarAuth();
}

function textoSeguro(valor, fallback = '–') {
    return valor === undefined || valor === null || valor === '' ? fallback : String(valor);
}

function normalizarStatus(status) {
    const s = textoSeguro(status, 'enviada').trim().toLowerCase();

    const map = {
        'pendente': 'enviada',
        'enviado': 'enviada',
        'enviada': 'enviada',
        'em análise': 'em análise',
        'em analise': 'em análise',
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
        'em análise': 'Em análise',
        'aprovada': 'Aprovada',
        'reprovada': 'Reprovada'
    };

    return map[normalizarStatus(status)] || textoSeguro(status, 'Enviada');
}

function formatarData(data) {
    if (!data) return '–';

    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return '–';

    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function obterAluno(a) {
    return textoSeguro(a.alunoId?.nome || a.aluno?.nome || a.nomeAluno || a.alunoNome || a.nome);
}

function obterCurso(a) {
    return textoSeguro(a.cursoId?.nome || a.curso?.nome || a.nomeCurso || a.curso);
}

function obterCategoria(a) {
    return textoSeguro(a.categoriaId?.nome || a.categoria?.nome || a.nomeCategoria || a.categoria);
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

function baseApi() {
    return typeof API_URL !== 'undefined' ? API_URL : '';
}

function obterUrlArquivo(arquivo) {
    if (!arquivo) return null;

    const url = arquivo.urlArquivo || arquivo.caminho || arquivo.path || arquivo.url || arquivo.filename || arquivo.nomeArquivo;
    if (!url) return null;

    if (String(url).startsWith('http')) return url;
    if (String(url).startsWith('/')) return `${baseApi()}${url}`;

    return `${baseApi()}/${url}`;
}

function obterTipoArquivo(arquivo, url = '') {
    return textoSeguro(
        arquivo?.tipoArquivo || arquivo?.mimetype || arquivo?.tipo || arquivo?.contentType || url,
        ''
    ).toLowerCase();
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
                <td class="td-horas">${horas !== '' ? `${horas}h` : '–'}</td>
                <td><span class="badge ${classeStatus(status)}">${labelStatus(status)}</span></td>
                <td class="td-data">${formatarData(obterData(a))}</td>
                <td>
                    ${id ? `
                        <button class="btn-detalhes" onclick="abrirModal('${id}')">
                            Ver detalhes
                        </button>` : '–'}
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

function abrirModal(id) {
    atividadeSelecionada = todasAtividades.find(a => String(a._id || a.id) === String(id));

    if (!atividadeSelecionada) {
        alert('Atividade não encontrada.');
        return;
    }

    const a = atividadeSelecionada;
    const arquivo = obterArquivo(a);
    const urlArquivo = obterUrlArquivo(arquivo);
    const tipoArquivo = obterTipoArquivo(arquivo, urlArquivo || '');
    const horas = obterHoras(a);

    document.getElementById('atividadeId').value = a._id || a.id;
    document.getElementById('detalheAluno').textContent = obterAluno(a);
    document.getElementById('detalheCurso').textContent = obterCurso(a);
    document.getElementById('detalheCategoria').textContent = obterCategoria(a);
    document.getElementById('detalheHoras').textContent = horas !== '' ? `${horas}h` : '–';
    document.getElementById('detalheStatus').textContent = labelStatus(a.status);
    document.getElementById('detalheData').textContent = formatarData(obterData(a));
    document.getElementById('detalheTitulo').textContent = obterTitulo(a);
    document.getElementById('detalheDescricao').textContent = obterDescricao(a);
    document.getElementById('cargaHorariaValidada').value = a.cargaHorariaValidada ?? horas ?? '';
    document.getElementById('observacaoCoordenador').value = a.observacaoCoordenador || '';
    document.getElementById('justificativaReprovacao').value = a.justificativaReprovacao || '';

    renderizarArquivo(urlArquivo, tipoArquivo);

    document.getElementById('modalOverlay').classList.add('open');
    document.getElementById('modalAtividade').classList.add('open');
    document.getElementById('modalAtividade').setAttribute('aria-hidden', 'false');
}

function renderizarArquivo(url, tipo) {
    const preview = document.getElementById('previewArquivo');
    if (!preview) return;

    if (!url) {
        preview.innerHTML = `<span class="arquivo-vazio">Nenhum arquivo encontrado.</span>`;
        return;
    }

    if (tipo.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
        preview.innerHTML = `
            <iframe src="${url}" title="Certificado em PDF"></iframe>
            <a href="${url}" target="_blank" class="link-arquivo">Abrir PDF em nova aba</a>
        `;
        return;
    }

    if (tipo.includes('image') || /\.(jpg|jpeg|png|webp)$/i.test(url)) {
        preview.innerHTML = `
            <img src="${url}" alt="Certificado enviado">
            <a href="${url}" target="_blank" class="link-arquivo">Abrir imagem em nova aba</a>
        `;
        return;
    }

    preview.innerHTML = `<a href="${url}" target="_blank" class="link-arquivo">Abrir arquivo enviado</a>`;
}

function fecharModal() {
    document.getElementById('modalOverlay')?.classList.remove('open');
    document.getElementById('modalAtividade')?.classList.remove('open');
    document.getElementById('modalAtividade')?.setAttribute('aria-hidden', 'true');
    atividadeSelecionada = null;
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

    const body = { status: novoStatus, observacaoCoordenador };

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

        const data = await res?.json().catch(() => ({}));

        if (!res || !res.ok) {
            alert(data?.message || data?.mensagem || data?.erro || 'Erro ao atualizar status.');
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

document.addEventListener('DOMContentLoaded', carregarAtividades);
