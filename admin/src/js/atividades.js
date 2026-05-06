let todasAtividades = [];
let atividadeSelecionada = null;

function normalizarStatus(status) {
    if (!status) return 'enviada';

    const s = status.toString().trim().toLowerCase();

    const map = {
        'pendente': 'enviada',
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

function labelStatus(status) {
    const s = normalizarStatus(status);

    const map = {
        'enviada': 'Enviada',
        'em análise': 'Em análise',
        'aprovada': 'Aprovada',
        'reprovada': 'Reprovada'
    };

    return map[s] || status || 'Enviada';
}

function formatarData(data) {
    if (!data) return '–';

    const d = new Date(data);

    if (isNaN(d.getTime())) return '–';

    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function obterAluno(a) {
    return (
        a.alunoId?.nome ||
        a.aluno?.nome ||
        a.nomeAluno ||
        a.nome ||
        '–'
    );
}

function obterCurso(a) {
    return (
        a.cursoId?.nome ||
        a.curso?.nome ||
        a.curso ||
        '–'
    );
}

function obterCategoria(a) {
    return (
        a.categoriaId?.nome ||
        a.categoria?.nome ||
        a.categoria ||
        '–'
    );
}

function obterHoras(a) {
    return (
        a.cargaHorariaInformada ||
        a.cargaHorariaValidada ||
        a.cargaHoraria ||
        a.horas ||
        0
    );
}

function obterData(a) {
    return (
        a.dataEnvio ||
        a.createdAt ||
        a.data ||
        a.updatedAt
    );
}

function obterTitulo(a) {
    return a.titulo || a.nomeAtividade || a.nome || '–';
}

function obterDescricao(a) {
    return a.descricao || a.observacao || '–';
}

function obterArquivo(a) {
    if (Array.isArray(a.anexos) && a.anexos.length > 0) {
        return a.anexos[0];
    }

    if (a.anexo) return a.anexo;
    if (a.arquivo) return a.arquivo;

    return null;
}

function obterUrlArquivo(arquivo) {
    if (!arquivo) return null;

    const url = (
        arquivo.urlArquivo ||
        arquivo.caminho ||
        arquivo.path ||
        arquivo.url ||
        arquivo.filename ||
        arquivo.nomeArquivo
    );

    if (!url) return null;

    if (url.startsWith('http')) return url;

    const base = window.API_BASE_URL || '';

    if (url.startsWith('/')) return `${base}${url}`;

    return `${base}/${url}`;
}

function obterTipoArquivo(arquivo) {
    return (
        arquivo.tipoArquivo ||
        arquivo.mimetype ||
        arquivo.tipo ||
        arquivo.contentType ||
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
                <td class="td-horas">${obterHoras(a) ? obterHoras(a) + 'h' : '–'}</td>
                <td>
                    <span class="badge ${status.replace(' ', '-')}">
                        ${labelStatus(status)}
                    </span>
                </td>
                <td class="td-data">${formatarData(obterData(a))}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="abrirModal('${id}')">
                        Ver detalhes
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filtrar() {
    const filtro = document.getElementById('filtroStatus').value.toLowerCase();

    const filtradas = todasAtividades.filter(a => {
        const status = normalizarStatus(a.status);
        return !filtro || status === filtro;
    });

    renderizarTabela(filtradas);
}

async function carregarAtividades() {
    try {
        let res = await apiFetch('/api/atividades');

        if (!res.ok) {
            res = await apiFetch('/api/admin/atividades');
        }

        if (!res.ok) throw new Error('Erro ao buscar atividades');

        const data = await res.json();

        todasAtividades = data.atividades || data.data || data || [];

        renderizarTabela(todasAtividades);

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

    document.getElementById('modalAtividade').style.display = 'flex';
}

function renderizarArquivo(url, tipo) {
    const preview = document.getElementById('previewArquivo');

    if (!url) {
        preview.innerHTML = 'Nenhum arquivo encontrado.';
        return;
    }

    if (tipo.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
        preview.innerHTML = `
            <iframe 
                src="${url}" 
                style="width:100%;height:420px;border:1px solid #e5e7eb;border-radius:12px;">
            </iframe>
            <p style="margin-top:10px;">
                <a href="${url}" target="_blank" class="btn btn-secondary btn-sm">
                    Abrir PDF em nova aba
                </a>
            </p>
        `;
        return;
    }

    if (
        tipo.includes('image') ||
        url.toLowerCase().endsWith('.jpg') ||
        url.toLowerCase().endsWith('.jpeg') ||
        url.toLowerCase().endsWith('.png')
    ) {
        preview.innerHTML = `
            <img 
                src="${url}" 
                alt="Certificado enviado"
                style="max-width:100%;max-height:420px;border-radius:12px;border:1px solid #e5e7eb;"
            >
            <p style="margin-top:10px;">
                <a href="${url}" target="_blank" class="btn btn-secondary btn-sm">
                    Abrir imagem em nova aba
                </a>
            </p>
        `;
        return;
    }

    preview.innerHTML = `
        <a href="${url}" target="_blank" class="btn btn-secondary">
            Abrir arquivo enviado
        </a>
    `;
}

function fecharModal() {
    document.getElementById('modalAtividade').style.display = 'none';
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

document.addEventListener('DOMContentLoaded', carregarAtividades);