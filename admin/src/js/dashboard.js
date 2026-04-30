renderTopbar();

let chartBarras = null;
let chartPizza  = null;

function labelStatus(status) {
    const map = {
        pendente: 'Pendente',
        aprovada: 'Aprovada',
        reprovada: 'Reprovada'
    };
    return map[status?.toLowerCase()] || status;
}

function renderizarBarras(dados) {
    const ctx = document.getElementById('chartBarras').getContext('2d');

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

function renderizarPizza(pendentes, aprovadas, reprovadas) {
    const ctx = document.getElementById('chartPizza').getContext('2d');

    if (chartPizza) chartPizza.destroy();

    chartPizza = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pendentes', 'Aprovadas', 'Reprovadas'],
            datasets: [{
                data: [pendentes, aprovadas, reprovadas],
                backgroundColor: ['#d97706', '#059669', '#dc2626']
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

    if (!atividades || atividades.length === 0) {
        list.innerHTML = `<li class="recentes-item">Nenhuma atividade recente</li>`;
        return;
    }

    list.innerHTML = atividades.map(a => `
        <li class="recentes-item">
            <div>
                <strong>${a.nomeAluno || '–'}</strong><br>
                <small>${a.curso || '–'} • ${a.cargaHoraria || 0}h</small>
            </div>
            <span>${labelStatus(a.status)}</span>
        </li>
    `).join('');
}

async function carregarDashboard() {
    try {
        const res = await apiFetch('/api/admin/dashboard');

        if (!res.ok) throw new Error('Erro na resposta');

        const data = await res.json();

        document.getElementById('statTotal').textContent      = data.total ?? 0;
        document.getElementById('statPendentes').textContent  = data.pendentes ?? 0;
        document.getElementById('statAprovadas').textContent  = data.aprovadas ?? 0;
        document.getElementById('statReprovadas').textContent = data.reprovadas ?? 0;
        document.getElementById('statHoras').innerHTML        = `${data.horasValidadas ?? 0}<span class="stat-unit">h</span>`;
        document.getElementById('statAlunos').textContent     = data.totalAlunos ?? 0;

        if (data.atividadesPorCurso?.length) {
            renderizarBarras(data.atividadesPorCurso);
        }

        renderizarPizza(
            data.pendentes ?? 0,
            data.aprovadas ?? 0,
            data.reprovadas ?? 0
        );

        renderizarRecentes(data.atividadesRecentes);

    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
    }
}

carregarDashboard();