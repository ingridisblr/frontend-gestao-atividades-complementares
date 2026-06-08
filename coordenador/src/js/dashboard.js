renderTopbar();

let chartBarras = null;
let chartPizza = null;

function normalizarLista(data) {
    if (Array.isArray(data)) return data;
    return data?.atividades || data?.alunos || data?.data || [];
}

function normalizarStatus(status) {
    const s = String(status || '').trim().toLowerCase();

    if (['aprovada', 'aprovado', 'aprovação', 'aprovacao'].includes(s)) return 'aprovada';
    if (['reprovada', 'reprovado', 'reprovação', 'reprovacao'].includes(s)) return 'reprovada';
    if (['pendente', 'enviada', 'enviado', 'em análise', 'em analise'].includes(s)) return 'pendente';

    return 'pendente';
}

function obterAluno(a) {
    return a.alunoId?.nome || a.aluno?.nome || a.nomeAluno || a.nome || 'Aluno não informado';
}

function obterCurso(a) {
    return a.cursoId?.nome || a.curso?.nome || a.curso || 'Curso não informado';
}

function obterCursoId(a) {
    return String(a.cursoId?._id || a.cursoId || a.curso?._id || '');
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

function obterCursosCoordenados() {
    const user = JSON.parse(localStorage.getItem('user') || localStorage.getItem('usuario') || '{}');
    const cursos = user.cursosCoordenados || [];

    return cursos
        .map(item => String(item.cursoId?._id || item.cursoId || item._id || item))
        .filter(Boolean);
}

function filtrarPorCursosDoCoordenador(atividades) {
    const cursosPermitidos = obterCursosCoordenados();

    if (!cursosPermitidos.length) return atividades;

    return atividades.filter(atividade => cursosPermitidos.includes(obterCursoId(atividade)));
}

function obterIdsCursosAluno(aluno) {
    const cursos = aluno.cursos || aluno.cursosMatriculados || [];
    const ids = cursos.map(item => String(item.cursoId?._id || item.cursoId || item._id || item)).filter(Boolean);

    const cursoUnico = String(aluno.cursoId?._id || aluno.cursoId || aluno.curso?._id || '');
    if (cursoUnico) ids.push(cursoUnico);

    return ids;
}

function filtrarAlunosPorCursosDoCoordenador(alunos) {
    const cursosPermitidos = obterCursosCoordenados();

    if (!cursosPermitidos.length) return alunos;

    return alunos.filter(aluno => obterIdsCursosAluno(aluno).some(id => cursosPermitidos.includes(id)));
}

function agruparAtividadesPorCurso(atividades) {
    return atividades.reduce((acc, atividade) => {
        const curso = obterCurso(atividade);
        acc[curso] = (acc[curso] || 0) + 1;
        return acc;
    }, {});
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

function renderizarPizza(statusResumo) {
    const canvas = document.getElementById('chartPizza');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartPizza) chartPizza.destroy();

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
            cutout: '65%'
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
        lista.innerHTML = '<li class="activity-item">Nenhuma atividade encontrada.</li>';
        return;
    }

    lista.innerHTML = recentes.map(a => `
        <li class="activity-item">
            <div class="activity-info">
                <div class="activity-name">${obterAluno(a)}</div>
                <div class="activity-detail">${obterCurso(a)} • ${obterHorasInformadas(a)}h • ${normalizarStatus(a.status)}</div>
            </div>
            <div class="activity-date">${formatarData(obterData(a))}</div>
        </li>
    `).join('');
}

async function carregarDashboard() {
    try {
        const [resAtividades, resAlunos] = await Promise.all([
            apiFetch('/api/atividades'),
            apiFetch('/api/alunos')
        ]);

        if (!resAtividades.ok) throw new Error('Erro ao buscar atividades');
        if (!resAlunos.ok) throw new Error('Erro ao buscar alunos');

        const dataAtividades = await resAtividades.json();
        const dataAlunos = await resAlunos.json();

        const atividades = filtrarPorCursosDoCoordenador(normalizarLista(dataAtividades));
        const alunos = filtrarAlunosPorCursosDoCoordenador(normalizarLista(dataAlunos));

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
        document.getElementById('statHoras').textContent = `${horasValidadas}h`;
        document.getElementById('statAlunos').textContent = alunos.length;

        renderizarBarras(agruparAtividadesPorCurso(atividades));
        renderizarPizza({ pendentes, aprovadas, reprovadas });
        renderizarRecentes(atividades);
    } catch (error) {
        console.error('Erro ao carregar dashboard do coordenador:', error);
        document.getElementById('recentesList').innerHTML = '<li class="activity-item">Erro ao carregar dados do dashboard.</li>';
    }
}

carregarDashboard();
