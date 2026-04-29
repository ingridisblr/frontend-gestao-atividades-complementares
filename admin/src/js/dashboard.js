renderTopbar();

let chartBarras = null;
let chartPizza  = null;

function labelStatus(status) {
    const map = { pendente: 'Pendente', aprovada: 'Aprovada', reprovada: 'Reprovada' };
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
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 12 }, color: '#64748b' } },
                y: { beginAtZero: true, ticks: { stepSize: 2, font: { family: 'DM Sans', size: 12 }, color: '#64748b' }, grid: { color: '#f0f0f0' } }
            }
        }
    });
}

function renderizarPizza(pendentes, aprovadas, reprovadas) {
    const ctx = document.getElementById('chartPizza').getContext('2d');
    const total = pendentes + aprovadas + reprovadas;
    const pct = v => total > 0 ? Math.round((v / total) * 100) : 0;

    document.getElementById('pizzaLegends').innerHTML = [
        { label: `Pendentes: ${pct(pendentes)}%`,   color: '#d97706' },
        { label: `Aprovadas: ${pct(aprovadas)}%`,   color: '#059669' },
        { label: `Reprovadas: ${pct(reprovadas)}%`, color: '#dc2626' },
    ].map(l => `
        <div class="pizza-legend-item" style="color:${l.color}">
            <div class="pizza-legend-dot" style="background:${l.color}"></div>
            ${l.label}
        </div>
    `).join('');

    if (chartPizza) chartPizza.destroy();
    chartPizza = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pendentes', 'Aprovadas', 'Reprovadas'],
            datasets: [{
                data: [pendentes, aprovadas, reprovadas],
                backgroundColor: ['#d97706', '#059669', '#dc2626'],
                borderWidth: 2,
                borderColor: '#ffffff'
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
        list.innerHTML = `<li class="recentes-item"><div class="recentes-info" style="color:#94a3b8;font-size:14px">Nenhuma atividade recente</div></li>`;
        return;
    }

    list.innerHTML = atividades.map(a => {
        const status = (a.status || 'pendente').toLowerCase();
        return `
            <li class="recentes-item">
                <div class="recentes-info">
                    <div class="recentes-nome">${a.nomeAluno || a.nome || '–'}</div>
                    <div class="recentes-detalhe">${a.curso || '–'} • ${a.cargaHoraria ? a.cargaHoraria + 'h' : '–'}</div>
                </div>
                <span class="badge ${status}">${labelStatus(status)}</span>
            </li>
        `;
    }).join('');
}

async function carregarDashboard() {
    try {
        const res = await apiFetch('/api/admin/dashboard');
        if (!res.ok) throw new Error('Erro na resposta');
        const data = await res.json();

        document.getElementById('statTotal').textContent      = data.total          ?? 0;
        document.getElementById('statPendentes').textContent  = data.pendentes       ?? 0;
        document.getElementById('statAprovadas').textContent  = data.aprovadas       ?? 0;
        document.getElementById('statReprovadas').textContent = data.reprovadas      ?? 0;
        document.getElementById('statHoras').innerHTML        = `${data.horasValidadas ?? 0}<span class="stat-unit">h</span>`;
        document.getElementById('statAlunos').textContent     = data.totalAlunos     ?? 0;

        if (data.atividadesPorCurso?.length) renderizarBarras(data.atividadesPorCurso);
        renderizarPizza(data.pendentes ?? 0, data.aprovadas ?? 0, data.reprovadas ?? 0);
        renderizarRecentes(data.atividadesRecentes);

    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
    }
}

carregarDashboard();
    const ctx = document.getElementById('chartBarras').getContext('2d');

    if (chartBarras) chartBarras.destroy();

    chartBarras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dados.map(d => d.curso),
            datasets: [{
                data: dados.map(d => d.total),
                backgroundColor: '#3b82f6',
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'DM Sans', size: 12 }, color: '#64748b' }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 2,
                        font: { family: 'DM Sans', size: 12 },
                        color: '#64748b'
                    },
                    grid: { color: '#f0f0f0' }
                }
            }
        }
    });

function renderizarPizza(pendentes, aprovadas, reprovadas) {
    const ctx = document.getElementById('chartPizza').getContext('2d');

    const total = pendentes + aprovadas + reprovadas;
    const pct = v => total > 0 ? Math.round((v / total) * 100) : 0;

    // Legends
    const legends = [
        { label: `Pendentes: ${pct(pendentes)}%`,  color: '#d97706' },
        { label: `Aprovadas: ${pct(aprovadas)}%`,  color: '#059669' },
        { label: `Reprovadas: ${pct(reprovadas)}%`, color: '#dc2626' },
    ];

    document.getElementById('pizzaLegends').innerHTML = legends.map(l => `
        <div class="pizza-legend-item" style="color:${l.color}">
            <div class="pizza-legend-dot" style="background:${l.color}"></div>
            ${l.label}
        </div>
    `).join('');

    if (chartPizza) chartPizza.destroy();

    chartPizza = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pendentes', 'Aprovadas', 'Reprovadas'],
            datasets: [{
                data: [pendentes, aprovadas, reprovadas],
                backgroundColor: ['#d97706', '#059669', '#dc2626'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

async function carregarDashboard() {
    try {
        const res = await apiFetch('/api/admin/dashboard');

        if (!res.ok) throw new Error('Erro na resposta');

        const data = await res.json();

        document.getElementById('statTotal').textContent     = data.total      ?? 0;
        document.getElementById('statPendentes').textContent = data.pendentes   ?? 0;
        document.getElementById('statAprovadas').textContent = data.aprovadas   ?? 0;
        document.getElementById('statReprovadas').textContent = data.reprovadas ?? 0;
        document.getElementById('statHoras').innerHTML       = `${data.horasValidadas ?? 0}<span class="stat-unit">h</span>`;
        document.getElementById('statAlunos').textContent    = data.totalAlunos ?? 0;

        if (data.atividadesPorCurso?.length) {
            renderizarBarras(data.atividadesPorCurso);
        }

        renderizarPizza(
            data.pendentes   ?? 0,
            data.aprovadas   ?? 0,
            data.reprovadas  ?? 0
        );

    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
    }
}

carregarDashboard();