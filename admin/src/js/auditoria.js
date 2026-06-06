const modalOverlay = document.getElementById("modalInfoOverlay");
const modalInfo = document.getElementById("modalInfoAuditoria");
const btnFechar = document.getElementById("btnFecharModalInfo");
const btnEntendido = document.getElementById("btnEntendidoModalInfo");

function abrirPopupInfo() {
    modalOverlay?.classList.add("open");
    modalInfo?.classList.add("open");
}

function fecharPopupInfo() {
    modalOverlay?.classList.remove("open");
    modalInfo?.classList.remove("open");
}

btnFechar?.addEventListener("click", fecharPopupInfo);
btnEntendido?.addEventListener("click", fecharPopupInfo);
modalOverlay?.addEventListener("click", fecharPopupInfo);

document.addEventListener("DOMContentLoaded", () => {
    renderHeaderUser();

    let todosLogs = [];

    const tabelaBody = document.getElementById("tabelaAuditoriaBody");
    const inputBusca = document.getElementById("inputBuscaAuditoria");
    const selectAcao = document.getElementById("selectFiltroAcao");
    const tituloHistorico = document.getElementById("tituloHistorico");

    const countTotalEl = document.getElementById("countTotal");
    const countAprovacoesEl = document.getElementById("countAprovacoes");
    const countReprovacoesEl = document.getElementById("countReprovacoes");
    const count24hEl = document.getElementById("count24h");

    const rotulosAcao = {
        CRIACAO: "Criação",
        ATUALIZACAO: "Atualização",
        EXCLUSAO: "Exclusão",
        LOGIN: "Login",
        LOGOUT: "Logout",
        APROVACAO: "Aprovação",
        REPROVACAO: "Reprovação",
        AJUSTE_CARGA_HORARIA: "Ajuste de CH",
        VINCULO_CURSO: "Vínculo de Curso",
        ALTERACAO_REGRA: "Alteração de Regra"
    };

    function escapar(valor) {
        return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatarData(data) {
        if (!data) return "–";

        const valor = new Date(data);

        if (Number.isNaN(valor.getTime())) return "–";

        return valor.toLocaleString("pt-BR");
    }

    function obterUsuario(log) {
        if (log.usuarioId && typeof log.usuarioId === "object") {
            return {
                id: log.usuarioId._id || "–",
                nome: log.usuarioId.nome || "Usuário do sistema",
                email: log.usuarioId.email || ""
            };
        }

        return {
            id: log.usuarioId || "–",
            nome: "Usuário do sistema",
            email: ""
        };
    }

    function normalizarLog(log) {
        const usuario = obterUsuario(log);

        return {
            id: log._id,
            dataHora: formatarData(log.dataEvento),
            dataEvento: log.dataEvento,
            usuarioNome: usuario.nome,
            usuarioId: usuario.id,
            usuarioEmail: usuario.email,
            acaoCodigo: log.acao || "",
            acao: rotulosAcao[log.acao] || log.acao || "Ação",
            entidade: log.entidade || "",
            detalhes: log.descricao || "Registro de auditoria sem descrição."
        };
    }

    async function carregarLogsAuditoria() {
        try {
            tabelaBody.innerHTML = `<tr><td colspan="4" class="loading-cell">Carregando registros de auditoria...</td></tr>`;

            const dados = await apiFetch("/api/auditoria?limite=200");
            todosLogs = Array.isArray(dados) ? dados.map(normalizarLog) : [];

            atualizarContadores(todosLogs);
            renderizarTabela(todosLogs);
        } catch (error) {
            console.error("Erro ao carregar dados de auditoria:", error);
            tabelaBody.innerHTML = `<tr><td colspan="4" class="loading-cell" style="color: #dc2626;">Erro ao carregar logs de auditoria do servidor.</td></tr>`;
        }
    }

    function atualizarContadores(logs) {
        countTotalEl.textContent = logs.length;
        countAprovacoesEl.textContent = logs.filter(log => log.acaoCodigo === "APROVACAO").length;
        countReprovacoesEl.textContent = logs.filter(log => log.acaoCodigo === "REPROVACAO").length;

        const agora = Date.now();
        const umDia = 24 * 60 * 60 * 1000;
        const logs24h = logs.filter(log => {
            const data = new Date(log.dataEvento).getTime();
            return !Number.isNaN(data) && agora - data <= umDia;
        }).length;

        count24hEl.textContent = logs24h;
    }

    function obterClasseBadge(log) {
        if (log.acaoCodigo === "APROVACAO") return "aprovacao";
        if (log.acaoCodigo === "REPROVACAO") return "reprovao";
        if (log.acaoCodigo === "ATUALIZACAO" || log.acaoCodigo === "ALTERACAO_REGRA") return "atualizacao";
        return "visualizacao";
    }

    function renderizarTabela(logsFiltrados) {
        tabelaBody.innerHTML = "";
        tituloHistorico.textContent = `Histórico de Ações (${logsFiltrados.length})`;

        if (logsFiltrados.length === 0) {
            tabelaBody.innerHTML = `<tr><td colspan="4" class="empty-state">Nenhum registro encontrado para os filtros aplicados.</td></tr>`;
            return;
        }

        logsFiltrados.forEach(log => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td style="font-family: 'DM Mono', monospace; font-size: 13.5px;">${escapar(log.dataHora)}</td>
                <td>
                    <div class="user-info-cell">
                        <span class="user-title">${escapar(log.usuarioNome)}</span>
                        <span class="user-subid">ID: ${escapar(log.usuarioId)}</span>
                    </div>
                </td>
                <td>
                    <span class="badge-acao ${obterClasseBadge(log)}">${escapar(log.acao)}</span>
                </td>
                <td style="color: var(--text-secondary); font-size: 13.5px;">${escapar(log.detalhes)}</td>
            `;

            tabelaBody.appendChild(tr);
        });
    }

    function aplicarFiltros() {
        const termoBusca = inputBusca.value.toLowerCase().trim();
        const acaoSelecionada = selectAcao.value;

        const resultado = todosLogs.filter(log => {
            const bateAcao = acaoSelecionada === "" || log.acaoCodigo === acaoSelecionada;

            const texto = [
                log.usuarioNome,
                log.usuarioId,
                log.usuarioEmail,
                log.acao,
                log.acaoCodigo,
                log.entidade,
                log.detalhes
            ].join(" ").toLowerCase();

            return bateAcao && (termoBusca === "" || texto.includes(termoBusca));
        });

        renderizarTabela(resultado);
    }

    inputBusca?.addEventListener("input", aplicarFiltros);
    selectAcao?.addEventListener("change", aplicarFiltros);

    carregarLogsAuditoria();
});

function renderHeaderUser() {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");

    const nameEl = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");

    if (nameEl) nameEl.textContent = userData.nome || "Administrador";
    if (emailEl) emailEl.textContent = userData.email || "admin@kore.com";
}
