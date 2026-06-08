renderTopbar();

let atividadesRelatorio = [];

function normalizarStatus(status) {
    const s = String(status || '').trim().toLowerCase();
    if (['aprovada', 'aprovado', 'aprovacao', 'aprovação'].includes(s)) return 'aprovada';
    if (['reprovada', 'reprovado', 'reprovacao', 'reprovação'].includes(s)) return 'reprovada';
    if (['pendente', 'em análise', 'em analise', 'enviada', 'enviado'].includes(s)) return 'pendente';
    return s || 'pendente';
}

function labelStatus(status) {
    return {
        pendente: 'Pendente',
        aprovada: 'Aprovada',
        reprovada: 'Reprovada'
    }[normalizarStatus(status)] || status || 'Pendente';
}

function obterCursoId(a) {
    return String(a.cursoId?._id || a.cursoId || a.curso?._id || '');
}

function obterCursosCoordenados() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cursos = user.cursosCoordenados || [];
    return cursos.map(item => String(item.cursoId?._id || item.cursoId || item._id || item)).filter(Boolean);
}

function filtrarPorCursosDoCoordenador(atividades) {
    const cursosPermitidos = obterCursosCoordenados();
    if (!cursosPermitidos.length) return atividades;
    return atividades.filter(atividade => cursosPermitidos.includes(obterCursoId(atividade)));
}

function obterAluno(a) {
    return a.alunoId?.nome || a.aluno?.nome || a.nomeAluno || a.nome || '–';
}

function obterCurso(a) {
    return a.cursoId?.nome || a.curso?.nome || a.curso || '–';
}

function obterCategoria(a) {
    return a.categoriaId?.nome || a.categoria?.nome || a.categoria || '–';
}

function obterHoras(a) {
    return Number(a.cargaHorariaValidada || a.cargaHorariaInformada || a.cargaHoraria || 0);
}

function obterData(a) {
    return a.dataCriacao || a.createdAt || a.dataRealizacao || a.dataEnvio || a.data;
}

function formatarData(data) {
    if (!data) return '–';
    const valor = new Date(data);
    if (Number.isNaN(valor.getTime())) return '–';
    return valor.toLocaleDateString('pt-BR');
}

function aplicarFiltrosRelatorio() {
    const status = document.getElementById('filtroStatusRelatorio').value;
    const busca = document.getElementById('buscaRelatorio').value.trim().toLowerCase();

    const filtradas = atividadesRelatorio.filter(a => {
        const bateStatus = !status || normalizarStatus(a.status) === status;
        const texto = [obterAluno(a), obterCurso(a), obterCategoria(a), a.titulo, a.descricao, labelStatus(a.status)].join(' ').toLowerCase();
        return bateStatus && (!busca || texto.includes(busca));
    });

    renderizarRelatorio(filtradas);
}

function atualizarResumo(atividades) {
    const aprovadas = atividades.filter(a => normalizarStatus(a.status) === 'aprovada');
    const horas = aprovadas.reduce((total, a) => total + obterHoras(a), 0);

    document.getElementById('relTotal').textContent = atividades.length;
    document.getElementById('relAprovadas').textContent = aprovadas.length;
    document.getElementById('relHoras').innerHTML = `${horas}<span class="stat-unit">h</span>`;
}

function renderizarRelatorio(atividades) {
    const body = document.getElementById('tabelaRelatorioBody');
    document.getElementById('tituloRelatorio').textContent = `Atividades (${atividades.length})`;
    atualizarResumo(atividades);

    if (!atividades.length) {
        body.innerHTML = `<tr><td colspan="6" class="empty-table">Nenhuma atividade encontrada.</td></tr>`;
        return;
    }

    body.innerHTML = atividades.map(a => {
        const status = normalizarStatus(a.status);
        return `
            <tr>
                <td>${obterAluno(a)}</td>
                <td>${obterCurso(a)}</td>
                <td>${obterCategoria(a)}</td>
                <td><span class="badge ${status}">${labelStatus(status)}</span></td>
                <td>${obterHoras(a)}h</td>
                <td>${formatarData(obterData(a))}</td>
            </tr>
        `;
    }).join('');
}

async function carregarRelatorio() {
    try {
        const res = await apiFetch('/api/atividades');
        if (!res || !res.ok) throw new Error('Erro ao buscar atividades');

        const data = await res.json();
        atividadesRelatorio = filtrarPorCursosDoCoordenador(data.atividades || data.data || data || []);
        renderizarRelatorio(atividadesRelatorio);
    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
        document.getElementById('tabelaRelatorioBody').innerHTML = `<tr><td colspan="6" class="empty-table">Erro ao carregar dados do relatório.</td></tr>`;
    }
}

function exportarPdf() {
    const tituloOriginal = document.title;
    document.title = 'KORE - Relatório de Atividades';
    window.print();
    document.title = tituloOriginal;
}

document.getElementById('filtroStatusRelatorio')?.addEventListener('change', aplicarFiltrosRelatorio);
document.getElementById('buscaRelatorio')?.addEventListener('input', aplicarFiltrosRelatorio);
document.getElementById('btnExportarPdf')?.addEventListener('click', exportarPdf);

carregarRelatorio();
