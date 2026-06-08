renderTopbar();

const docIcon = `
    <svg fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" width="18" height="18">
        <path d="M9 12h6M9 16h6M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2"/>
        <path d="M9 4h6v4H9V4z"/>
    </svg>`;

function normalizarStatus(status) {
    const s = String(status || '').trim().toLowerCase();

    if (['aprovada', 'aprovado', 'aprovacao', 'aprovação'].includes(s)) return 'aprovada';
    if (['reprovada', 'reprovado', 'reprovacao', 'reprovação'].includes(s)) return 'reprovada';
    if (['pendente', 'em análise', 'em analise', 'enviada', 'enviado'].includes(s)) return 'pendente';

    return s || 'pendente';
}

function obterCursoId(a) {
    return String(a.cursoId?._id || a.cursoId || a.curso?._id || '');
}

function obterCurso(a) {
    return a.cursoId?.nome || a.curso?.nome || a.curso || 'Curso não informado';
}

function obterAluno(a) {
    return a.alunoId?.nome || a.aluno?.nome || a.nomeAluno || a.nome || 'Aluno não informado';
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

function obterCursosCoordenados() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const cursos = user.cursosCoordenados || [];

    return cursos
        .map((item) => String(item.cursoId?._id || item.cursoId || item._id || item))
        .filter(Boolean);
}

function filtrarPorCursosDoCoordenador(atividades) {
    const cursosPermitidos = obterCursosCoordenados();

    if (!cursosPermitidos.length) return atividades;

    return atividades.filter((atividade) => cursosPermitidos.includes(obterCursoId(atividade)));
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
                <div class="activity-name">${obterAluno(a)}</div>
                <div class="activity-detail">${obterCurso(a)} • ${obterHoras(a)}h</div>
            </div>
            <div class="activity-date">${formatarData(obterData(a))}</div>
        </li>
    `).join('');
}

async function carregarDashboard() {
    try {
        const res = await apiFetch('/api/atividades');

        if (!res || !res.ok) throw new Error('Erro na resposta');

        const data = await res.json();
        const atividades = filtrarPorCursosDoCoordenador(data.atividades || data.data || data || []);

        const pendentes = atividades.filter(a => normalizarStatus(a.status) === 'pendente');
        const aprovadas = atividades.filter(a => normalizarStatus(a.status) === 'aprovada');
        const reprovadas = atividades.filter(a => normalizarStatus(a.status) === 'reprovada');

        document.getElementById('statPendentes').textContent = pendentes.length;
        document.getElementById('statAprovadas').textContent = aprovadas.length;
        document.getElementById('statReprovadas').textContent = reprovadas.length;

        const recentesPendentes = pendentes
            .slice()
            .sort((a, b) => new Date(obterData(b) || 0) - new Date(obterData(a) || 0))
            .slice(0, 6);

        renderizarAtividades(recentesPendentes);
    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);

        document.getElementById('statPendentes').textContent = '0';
        document.getElementById('statAprovadas').textContent = '0';
        document.getElementById('statReprovadas').textContent = '0';

        document.getElementById('activityList').innerHTML = `
            <li class="empty-state">
                <p>Erro ao carregar atividades. Tente novamente.</p>
            </li>`;
    }
}

carregarDashboard();
