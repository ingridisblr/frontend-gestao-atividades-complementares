renderTopbar();

let todasAtividades = [];

const eyeIcon = `
    <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="15" height="15">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>`;

function labelStatus(status) {
    const map = { 
        pendente: 'Pendente', 
        aprovada: 'Aprovada', 
        reprovada: 'Reprovada' 
    };

    return map[status?.toLowerCase()] || status || 'Pendente';
}

function renderizarTabela(atividades) {
    const tbody = document.getElementById('tabelaBody');

    if (!atividades || atividades.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-table">Nenhuma atividade encontrada</td></tr>`;
        return;
    }

    tbody.innerHTML = atividades.map(a => {
        const status = (a.status || 'pendente').toLowerCase();
        const id = a._id || a.id;

        return `
            <tr>
                <td class="td-aluno">${a.nomeAluno || a.nome || '–'}</td>
                <td class="td-curso">${a.curso || '–'}</td>
                <td>${a.categoria || '–'}</td>
                <td class="td-carga">${a.cargaHoraria ? a.cargaHoraria + 'h' : '–'}</td>
                <td><span class="badge ${status}">${labelStatus(status)}</span></td>
                <td>
                    ${
                        id 
                        ? `<button class="btn-detalhes" onclick="verDetalhes('${id}')">
                                ${eyeIcon} Ver Detalhes
                           </button>`
                        : `<span class="empty-table">Sem ID</span>`
                    }
                </td>
            </tr>
        `;
    }).join('');
}

function popularCursos(atividades) {
    const cursos = [...new Set(atividades.map(a => a.curso).filter(Boolean))];
    const select = document.getElementById('filtroCurso');

    select.innerHTML = `<option value="">Todos</option>`;

    cursos.forEach(curso => {
        const opt = document.createElement('option');
        opt.value = curso;
        opt.textContent = curso;
        select.appendChild(opt);
    });
}

function filtrar() {
    const status = document.getElementById('filtroStatus').value.toLowerCase();
    const curso  = document.getElementById('filtroCurso').value;

    const filtradas = todasAtividades.filter(a => {
        const matchStatus = !status || (a.status || '').toLowerCase() === status;
        const matchCurso  = !curso || a.curso === curso;
        return matchStatus && matchCurso;
    });

    renderizarTabela(filtradas);
}

function verDetalhes(id) {
    if (!id) {
        alert('Atividade inválida.');
        return;
    }

    window.location.href = `detalhes.html?id=${id}`;
}

async function carregarAtividades() {
    try {
        const res = await apiFetch('/api/coordenador/atividades');

        if (!res.ok) throw new Error('Erro na resposta');

        const data = await res.json();

        todasAtividades = data.atividades || data || [];

        popularCursos(todasAtividades);
        renderizarTabela(todasAtividades);

    } catch (err) {
        console.error('Erro ao carregar atividades:', err);

        document.getElementById('tabelaBody').innerHTML =
            `<tr><td colspan="6" class="empty-table">Erro ao carregar atividades. Tente novamente.</td></tr>`;
    }
}

carregarAtividades();