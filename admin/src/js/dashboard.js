renderTopbar();

let chartBarras = null;
let chartPizza = null;

function textoSeguro(valor, fallback = '–') {
    return valor === undefined || valor === null || valor === '' ? fallback : String(valor);
}

function normalizarLista(data, chave) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.[chave])) return data[chave];
    return [];
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

function labelStatus(status) {
    const map = {
        'enviada': 'Enviada',
        'em análise': 'Em análise',
        'aprovada': 'Aprovada',
        'reprovada': 'Reprovada'
    };

    return map[normalizarStatus(status)] || textoSeguro(status);
}

function obterAluno(a) {
    return textoSeguro(a.alunoId?.nome || a.aluno?.nome || a.nomeAluno || a.alunoNome || a.nome);
}

function obterCurso(a) {
    return textoSeguro(a.cursoId?.nome || a.curso?.nome || a.nomeCurso || a.curso);
}

function obterHorasValidadas(a) {
    return Number(a.cargaHorariaValidada || 0);
}

function obterHorasInformadas(a) {
    return Number(a.cargaHorariaInformada || a.cargaHoraria || a.horas || 0);
}

function obterData(a) {
    return a.dataCriacao || a.createdAt || a.dataEnvio || a.data || a.updatedAt;
}

function renderizarBarras(dados) {
    const canvas = document.getElementById('chartBarras');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');

    if (chartBarras) chartBarras.destroy();

    chartBarras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dados.map(d => d.curso),
            datasets: [{
                data: dados.map(d => d.total),
                backgroundColor: '#3b82f6',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderizarPizza(enviadas, emAnalise, aprovadas, reprovadas) {
    const canvas = document.getElementById('chartPizza');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');

    if (chartPizza) chartPizza.destroy();

    chartPizza = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Enviadas', 'Em análise', 'Aprovadas', 'Reprovadas'],
            datasets: [{
                data: [enviadas, emAnalise, aprovadas, reprovadas],
                backgroundColor: ['#d97706', '#f59e0b', '#059669', '#dc2626']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function renderizarRecentes(atividades) {
    const list = document.getElementById('recentesList');
    if (!list) return;

    if (!atividades || atividades.length === 0) {
        list.innerHTML = `<li class="recentes-item">Nenhuma atividade recente</li>`;
        return;
    }

    list.innerHTML = atividades.slice(0, 5).map(a => `
        <li class="recentes-item">
            <div>
                <strong>${obterAluno(a)}</strong><br>
                <small>${obterCurso(a)} • ${obterHorasInformadas(a)}h</small>
            </div>
            <span>${labelStatus(a.status)}</span>
        </li>
    `).join('');
}

function agruparAtividadesPorCurso(atividades) {
    const mapa = new Map();

    atividades.forEach(a => {
        const curso = obterCurso(a);
        mapa.set(curso, (mapa.get(curso) || 0) + 1);
    });

    return Array.from(mapa.entries()).map(([curso, total]) => ({ curso, total }));
}

async function buscarPrimeiroEndpoint(endpoints) {
    for (const endpoint of endpoints) {
        const res = await apiFetch(endpoint);
        if (res && res.ok) {
            return res;
        }
    }

    return null;
}

async function carregarDashboard() {
    try {
        const [resAtividades, resAlunos] = await Promise.all([
            buscarPrimeiroEndpoint(['/api/atividades', '/api/admin/atividades']),
            apiFetch('/api/alunos')
        ]);

        if (!resAtividades || !resAtividades.ok) {
            throw new Error('Erro ao buscar atividades.');
        }

        const dataAtividades = await resAtividades.json().catch(() => ({}));
        const dataAlunos = await resAlunos?.json().catch(() => ({}));

        const atividades = normalizarLista(dataAtividades, 'atividades');
        const alunos = normalizarLista(dataAlunos, 'alunos');

        const total = atividades.length;
        const enviadas = atividades.filter(a => normalizarStatus(a.status) === 'enviada').length;
        const emAnalise = atividades.filter(a => normalizarStatus(a.status) === 'em análise').length;
        const aprovadas = atividades.filter(a => normalizarStatus(a.status) === 'aprovada').length;
        const reprovadas = atividades.filter(a => normalizarStatus(a.status) === 'reprovada').length;
        const pendentes = enviadas + emAnalise;

        const horasValidadas = atividades.reduce((soma, a) => soma + obterHorasValidadas(a), 0);

        document.getElementById('statTotal').textContent = total;
        document.getElementById('statPendentes').textContent = pendentes;
        document.getElementById('statAprovadas').textContent = aprovadas;
        document.getElementById('statReprovadas').textContent = reprovadas;
        document.getElementById('statHoras').innerHTML = `${horasValidadas}<span class="stat-unit">h</span>`;
        document.getElementById('statAlunos').textContent = alunos.length;

        renderizarBarras(agruparAtividadesPorCurso(atividades));
        renderizarPizza(enviadas, emAnalise, aprovadas, reprovadas);

        const recentes = [...atividades].sort((a, b) => {
            return new Date(obterData(b) || 0) - new Date(obterData(a) || 0);
        });

        renderizarRecentes(recentes);

    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);

        const recentes = document.getElementById('recentesList');
        if (recentes) {
            recentes.innerHTML = `<li class="recentes-item">Erro ao carregar dashboard.</li>`;
        }
    }
}

carregarDashboard();
