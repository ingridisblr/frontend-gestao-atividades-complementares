renderTopbar();

let chartBarras = null;
let chartPizza = null;
let cursosBase = [];

function textoSeguro(valor, fallback = '–') {
    return valor === undefined || valor === null || valor === '' ? fallback : String(valor);
}

function normalizarStatus(status) {
    const s = textoSeguro(status, 'pendente').trim().toLowerCase();

    if (['aprovada', 'aprovado', 'aprovação', 'aprovacao'].includes(s)) return 'aprovada';
    if (['reprovada', 'reprovado', 'reprovação', 'reprovacao'].includes(s)) return 'reprovada';
    if (['pendente', 'enviada', 'enviado', 'em análise', 'em analise'].includes(s)) return 'pendente';

    return 'pendente';
}

function labelStatus(status) {
    const map = {
        pendente: 'Pendente',
        aprovada: 'Aprovada',
        reprovada: 'Reprovada'
    };

    return map[normalizarStatus(status)] || textoSeguro(status);
}

function obterAluno(a) {
    return textoSeguro(a.alunoId?.nome || a.aluno?.nome || a.nomeAluno || a.nome, 'Aluno não informado');
}

function obterCurso(a) {
    return textoSeguro(a.cursoId?.nome || a.curso?.nome || a.curso || coordCursoSelecionado(cursosBase)?.nome, 'Curso não informado');
}

function obterHorasValidadas(a) {
    return Number(a.cargaHorariaValidada || 0);
}

function obterHorasInformadas(a) {
    return Number(a.cargaHorariaInformada || a.cargaHoraria || 0);
}

function obterData(a) {
    return a.dataCriacao || a.createdAt || a.dataRealizacao || a.dataEnvio || a.dataAtualizacao || a.updatedAt;
}

function formatarData(data) {
    if (!data) return '–';
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return '–';
    return d.toLocaleDateString('pt-BR');
}

function atualizarCursoAtual() {
    const curso = coordCursoSelecionado(cursosBase);
    const nome = document.getElementById('cursoAtualNome');

    if (nome) {
        nome.textContent = curso?.nome || 'Nenhum curso vinculado';
    }

    coordPopularSelectCursos('selectCursoDashboard', cursosBase, curso?.id || '');
}

function agruparAtividadesDoCurso(atividades) {
    const curso = coordCursoSelecionado(cursosBase)?.nome || 'Curso selecionado';
    return { [curso]: atividades.length };
}

function renderizarBarras(dados) {
    const canvas = document.getElementById('chartBarras');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartBarras) chartBarras.destroy();

    const labels = Object.keys(dados);
    const valores = Object.values(dados);

    chartBarras = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['Sem dados'],
            datasets: [{
                label: 'Atividades',
                data: valores.length ? valores : [0],
                backgroundColor: '#00b8b8',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

function renderizarLegendas(statusResumo) {
    const legendas = document.getElementById('pizzaLegends');
    if (!legendas) return;

    const itens = [
        ['Pendentes', statusResumo.pendentes, '#f59e0b'],
        ['Aprovadas', statusResumo.aprovadas, '#10b981'],
        ['Reprovadas', statusResumo.reprovadas, '#ef4444']
    ];

    legendas.innerHTML = itens.map(([label, valor, cor]) => `
        <div class="pizza-legend-item">
            <span class="pizza-legend-dot" style="background:${cor}"></span>
            ${label}: ${valor}
        </div>
    `).join('');
}

function renderizarPizza(statusResumo) {
    const canvas = document.getElementById('chartPizza');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartPizza) chartPizza.destroy();
    renderizarLegendas(statusResumo);

    chartPizza = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Pendentes', 'Aprovadas', 'Reprovadas'],
            datasets: [{
                data: [statusResumo.pendentes, statusResumo.aprovadas, statusResumo.reprovadas],
                backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: { legend: { display: false } }
        }
    });
}

function renderizarRecentes(atividades) {
    const lista = document.getElementById('recentesList');
    if (!lista) return;

    const recentes = [...atividades]
        .sort((a, b) => new Date(obterData(b) || 0) - new Date(obterData(a) || 0))
        .slice(0, 6);

    if (!recentes.length) {
        lista.innerHTML = '<li class="recentes-item">Nenhuma atividade encontrada para este curso.</li>';
        return;
    }

    lista.innerHTML = recentes.map(a => `
        <li class="recentes-item">
            <div class="recentes-info">
                <div class="recentes-nome">${obterAluno(a)}</div>
                <div class="recentes-detalhe">${obterCurso(a)} • ${obterHorasInformadas(a)}h • ${labelStatus(a.status)}</div>
            </div>
            <div class="activity-date">${formatarData(obterData(a))}</div>
        </li>
    `).join('');
}

async function carregarCursosBase() {
    try {
        const res = await apiFetch('/api/cursos');
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            cursosBase = coordNormalizarLista(data, 'cursos');
        }
    } catch (error) {
        console.warn('Não foi possível hidratar nomes dos cursos:', error);
    }
}

async function carregarDashboard() {
    try {
        await carregarCursosBase();
        atualizarCursoAtual();

        const [resAtividades, resAlunos] = await Promise.all([
            apiFetch('/api/atividades'),
            apiFetch('/api/alunos')
        ]);

        if (!resAtividades.ok) throw new Error('Erro ao buscar atividades');
        if (!resAlunos.ok) throw new Error('Erro ao buscar alunos');

        const dataAtividades = await resAtividades.json();
        const dataAlunos = await resAlunos.json();

        const atividades = coordFiltrarAtividadesCursoSelecionado(coordNormalizarLista(dataAtividades, 'atividades'), cursosBase);
        const alunos = coordFiltrarAlunosCursoSelecionado(coordNormalizarLista(dataAlunos, 'alunos'), cursosBase);

        const pendentes = atividades.filter(a => normalizarStatus(a.status) === 'pendente').length;
        const aprovadas = atividades.filter(a => normalizarStatus(a.status) === 'aprovada').length;
        const reprovadas = atividades.filter(a => normalizarStatus(a.status) === 'reprovada').length;
        const horasValidadas = atividades
            .filter(a => normalizarStatus(a.status) === 'aprovada')
            .reduce((total, a) => total + obterHorasValidadas(a), 0);

        document.getElementById('statTotal').textContent = atividades.length;
        document.getElementById('statPendentes').textContent = pendentes;
        document.getElementById('statAprovadas').textContent = aprovadas;
        document.getElementById('statReprovadas').textContent = reprovadas;
        document.getElementById('statHoras').innerHTML = `${horasValidadas}<span class="stat-unit">h</span>`;
        document.getElementById('statAlunos').textContent = alunos.length;

        renderizarBarras(agruparAtividadesDoCurso(atividades));
        renderizarPizza({ pendentes, aprovadas, reprovadas });
        renderizarRecentes(atividades);
    } catch (error) {
        console.error('Erro ao carregar dashboard do coordenador:', error);
        document.getElementById('recentesList').innerHTML = '<li class="recentes-item">Erro ao carregar dados do dashboard.</li>';
    }
}

document.getElementById('selectCursoDashboard')?.addEventListener('change', event => {
    coordSetCursoSelecionado(event.target.value);
    carregarDashboard();
});

carregarDashboard();
