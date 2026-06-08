renderTopbar();

let atividadesRelatorio = [];
let cursosRelatorio = [];

function normalizarStatus(status) {
    const s = String(status || 'pendente').trim().toLowerCase();

    if (['aprovada', 'aprovado'].includes(s)) return 'aprovada';
    if (['reprovada', 'reprovado'].includes(s)) return 'reprovada';
    if (['pendente', 'enviada', 'enviado', 'em análise', 'em analise'].includes(s)) return 'pendente';

    return 'pendente';
}

function labelStatus(status) {
    const map = {
        pendente: 'Pendente',
        aprovada: 'Aprovada',
        reprovada: 'Reprovada'
    };

    return map[normalizarStatus(status)] || status || 'Pendente';
}

function obterAluno(a) {
    return a.alunoId?.nome || a.aluno?.nome || a.nomeAluno || a.nome || '–';
}

function obterCurso(a) {
    return a.cursoId?.nome || a.curso?.nome || a.curso || coordCursoSelecionado(cursosRelatorio)?.nome || '–';
}

function obterCategoria(a) {
    return a.categoriaId?.nome || a.categoria?.nome || a.categoria || '–';
}

function obterHoras(a) {
    return Number(a.cargaHorariaValidada || a.cargaHorariaInformada || a.cargaHoraria || 0);
}

function obterData(a) {
    return a.dataCriacao || a.createdAt || a.dataEnvio || a.dataRealizacao || a.updatedAt;
}

function obterTitulo(a) {
    return a.titulo || a.nomeAtividade || '';
}

function formatarData(data) {
    if (!data) return '–';
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return '–';
    return d.toLocaleDateString('pt-BR');
}

function atualizarResumo(lista) {
    const aprovadas = lista.filter(a => normalizarStatus(a.status) === 'aprovada');
    const horas = aprovadas.reduce((total, a) => total + Number(a.cargaHorariaValidada || obterHoras(a)), 0);

    document.getElementById('relTotal').textContent = lista.length;
    document.getElementById('relAprovadas').textContent = aprovadas.length;
    document.getElementById('relHoras').textContent = `${horas}h`;

    const curso = coordCursoSelecionado(cursosRelatorio);
    document.getElementById('tituloRelatorio').textContent = curso ? `Atividades - ${curso.nome}` : 'Atividades';
}

function aplicarFiltrosRelatorio() {
    const status = document.getElementById('filtroStatusRelatorio')?.value || '';
    const busca = document.getElementById('buscaRelatorio')?.value.trim().toLowerCase() || '';

    const lista = atividadesRelatorio.filter(a => {
        const statusOk = !status || normalizarStatus(a.status) === status;
        const buscaOk = !busca || [
            obterAluno(a),
            obterCurso(a),
            obterCategoria(a),
            obterTitulo(a)
        ].join(' ').toLowerCase().includes(busca);

        return statusOk && buscaOk;
    });

    atualizarResumo(lista);
    renderizarRelatorio(lista);
}

function renderizarRelatorio(lista) {
    const tbody = document.getElementById('tabelaRelatorioBody');
    if (!tbody) return;

    if (!lista.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-table">Nenhuma atividade encontrada para o curso selecionado.</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(a => `
        <tr>
            <td>${obterAluno(a)}</td>
            <td>${obterCurso(a)}</td>
            <td>${obterCategoria(a)}</td>
            <td><span class="badge ${normalizarStatus(a.status)}">${labelStatus(a.status)}</span></td>
            <td>${obterHoras(a)}h</td>
            <td>${formatarData(obterData(a))}</td>
        </tr>
    `).join('');
}

async function carregarRelatorio() {
    try {
        const [resCursos, resAtividades] = await Promise.all([
            apiFetch('/api/cursos'),
            apiFetch('/api/atividades')
        ]);

        const dataCursos = await resCursos.json().catch(() => ({}));
        const dataAtividades = await resAtividades.json().catch(() => ({}));

        if (!resAtividades.ok) throw new Error(dataAtividades.message || 'Erro ao carregar atividades.');

        cursosRelatorio = resCursos.ok ? coordNormalizarLista(dataCursos, 'cursos') : [];
        coordCursoSelecionadoId(cursosRelatorio);
        atividadesRelatorio = coordFiltrarAtividadesCursoSelecionado(coordNormalizarLista(dataAtividades, 'atividades'), cursosRelatorio);

        aplicarFiltrosRelatorio();
    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
        document.getElementById('tabelaRelatorioBody').innerHTML = '<tr><td colspan="6" class="empty-table">Erro ao carregar relatório.</td></tr>';
    }
}

document.getElementById('filtroStatusRelatorio')?.addEventListener('change', aplicarFiltrosRelatorio);
document.getElementById('buscaRelatorio')?.addEventListener('input', aplicarFiltrosRelatorio);
document.getElementById('btnExportarPdf')?.addEventListener('click', () => window.print());

carregarRelatorio();
