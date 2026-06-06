let regras = [];

function textoSeguro(valor, fallback = '-') {
    return valor === undefined || valor === null || valor === '' ? fallback : valor;
}

function getId(item) {
    return item?._id || item?.id || '';
}

function getCategoria(regra) {
    return regra.categoriaId?.nome || regra.categoria?.nome || regra.nomeCategoria || '-';
}

function getCurso(regra) {
    return regra.cursoId?.nome || regra.curso?.nome || regra.nomeCurso || '-';
}

function mostrarToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = msg;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function normalizarRegras(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.regras)) return data.regras;
    return [];
}

function renderTabela(lista) {
    const tbody = document.getElementById('tabelaBody');

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table">Nenhuma regra cadastrada ainda.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = lista.map(regra => {
        const status = regra.ativa === false ? 'Inativa' : 'Ativa';
        const statusClass = regra.ativa === false ? 'inativo' : 'ativo';

        return `
            <tr>
                <td class="td-nome">${getCategoria(regra)}</td>
                <td>${getCurso(regra)}</td>
                <td><span class="badge-horas">${textoSeguro(regra.cargaHorariaMaximaCategoria)}h</span></td>
                <td><span class="badge-horas">${textoSeguro(regra.cargaHorariaMaximaSemestre)}h</span></td>
                <td class="td-descricao">${textoSeguro(regra.observacao)}</td>
                <td><span class="badge-status ${statusClass}">${status}</span></td>
            </tr>
        `;
    }).join('');
}

function buscar() {
    const termo = document.getElementById('campoBusca')?.value.toLowerCase() || '';

    const filtradas = regras.filter(regra => {
        return getCategoria(regra).toLowerCase().includes(termo) ||
            getCurso(regra).toLowerCase().includes(termo) ||
            String(regra.observacao || '').toLowerCase().includes(termo);
    });

    renderTabela(filtradas);
}

async function carregarRegras() {
    const tbody = document.getElementById('tabelaBody');

    try {
        const res = await apiFetch('/api/regras-carga-horaria');
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            throw new Error(data.message || data.mensagem || 'Erro ao carregar regras.');
        }

        regras = normalizarRegras(data);
        renderTabela(regras);

    } catch (error) {
        console.error('Erro ao carregar regras:', error);

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table">Erro ao carregar regras. Tente novamente.</td>
            </tr>
        `;
    }
}

carregarRegras();
