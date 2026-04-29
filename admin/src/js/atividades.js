let todasAtividades = [];

function labelStatus(status) {
    const map = { pendente: 'Pendente', aprovada: 'Aprovada', reprovada: 'Reprovada' };
    return map[status?.toLowerCase()] || status;
}

function formatarData(iso) {
    return new Date(iso).toLocaleDateString('pt-PT', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

function renderizarTabela(atividades) {
    const tbody = document.getElementById('tabelaBody');

    if (!atividades || atividades.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-table">Nenhuma atividade encontrada</td></tr>`;
        return;
    }

    tbody.innerHTML = atividades.map(a => {
        const status = (a.status || 'pendente').toLowerCase();
        return `
            <tr>
                <td class="td-aluno">${a.nomeAluno || a.nome || '–'}</td>
                <td class="td-curso">${a.curso || '–'}</td>
                <td>${a.categoria || '–'}</td>
                <td class="td-horas">${a.cargaHoraria ? a.cargaHoraria + 'h' : '–'}</td>
                <td><span class="badge ${status}">${labelStatus(status)}</span></td>
                <td class="td-data">${a.createdAt || a.data ? formatarData(a.createdAt || a.data) : '–'}</td>
            </tr>
        `;
    }).join('');
}

function filtrar() {
    const status = document.getElementById('filtroStatus').value.toLowerCase();
    const filtradas = todasAtividades.filter(a =>
        !status || (a.status || '').toLowerCase() === status
    );
    renderizarTabela(filtradas);
}

async function carregarAtividades() {
    try {
        const res = await apiFetch('/api/admin/atividades');
        if (!res.ok) throw new Error();

        const data = await res.json();
        todasAtividades = data.atividades || data;
        renderizarTabela(todasAtividades);

    } catch (err) {
        console.error('Erro ao carregar atividades:', err);
        document.getElementById('tabelaBody').innerHTML =
            `<tr><td colspan="6" class="empty-table">Erro ao carregar atividades. Tente novamente.</td></tr>`;
    }
}

carregarAtividades();