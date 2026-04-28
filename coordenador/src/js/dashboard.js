renderTopbar();

const docIcon = `
    <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="18" height="18">
        <path d="M9 12h6M9 16h6M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2"/>
        <path d="M9 4h6v4H9V4z"/>
    </svg>`;

function formatarData(iso) {
    return new Date(iso).toLocaleDateString('pt-PT', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

function renderizarAtividades(atividades) {
    const list = document.getElementById('activityList');

    if (!atividades || atividades.length === 0) {
        list.innerHTML = `
            <li class="empty-state">
                <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9"/><path d="M12 8v4m0 4h.01"/>
                </svg>
                <p>Nenhuma atividade pendente</p>
            </li>`;
        return;
    }

    list.innerHTML = atividades.map(a => `
        <li class="activity-item" onclick="window.location.href='atividades.html'">
            <div class="activity-icon">${docIcon}</div>
            <div class="activity-info">
                <div class="activity-name">${a.nomeAluno || a.nome}</div>
                <div class="activity-detail">${a.curso || ''} ${a.cargaHoraria ? '• ' + a.cargaHoraria + 'h' : ''}</div>
            </div>
            <div class="activity-date">${formatarData(a.createdAt || a.data)}</div>
        </li>
    `).join('');
}


async function carregarDashboard() {
    try {
        const res = await apiFetch('/api/coordenador/dashboard');

        if (!res.ok) throw new Error('Erro na resposta');

        const data = await res.json();

        document.getElementById('statPendentes').textContent  = data.pendentes  ?? 0;
        document.getElementById('statAprovadas').textContent  = data.aprovadas  ?? 0;
        document.getElementById('statReprovadas').textContent = data.reprovadas ?? 0;

        renderizarAtividades(data.atividadesRecentes);

    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        document.getElementById('activityList').innerHTML = `
            <li class="empty-state">
                <p>Erro ao carregar atividades. Tente novamente.</p>
            </li>`;
    }
}

carregarDashboard();