const modalOverlay = document.getElementById("modalInfoOverlay");
const modalInfo = document.getElementById("modalInfoAuditoria");
const btnFechar = document.getElementById("btnFecharModalInfo");
const btnEntendido = document.getElementById("btnEntendidoModalInfo");

function abrirPopupInfo() {
    modalOverlay.classList.add("open");
    modalInfo.classList.add("open");
}

function fecharPopupInfo() {
    modalOverlay.classList.remove("open");
    modalInfo.classList.remove("open");
}

btnFechar.addEventListener("click", fecharPopupInfo);
btnEntendido.addEventListener("click", fecharPopupInfo);
modalOverlay.addEventListener("click", fecharPopupInfo); 

abrirPopupInfo();

document.addEventListener("DOMContentLoaded", () => {
    // Inicializa autenticação ou dados do cabeçalho
    renderHeaderUser();

    // Estado local da aplicação para os filtros funcionarem reativamente
    let todosLogs = [];

    // Elementos da interface
    const tabelaBody = document.getElementById("tabelaAuditoriaBody");
    const inputBusca = document.getElementById("inputBuscaAuditoria");
    const selectAcao = document.getElementById("selectFiltroAcao");
    const tituloHistorico = document.getElementById("tituloHistorico");

    // Elementos dos contadores
    const countTotalEl = document.getElementById("countTotal");
    const countAprovacoesEl = document.getElementById("countAprovacoes");
    const countReprovacoesEl = document.getElementById("countReprovacoes");
    const count24hEl = document.getElementById("count24h");

    // 1. Função assíncrona para buscar dados reais da API
    async function carregarLogsAuditoria() {
        try {
            // Insira sua rota real de API quando configurada, ex: await api.get('/auditoria')
            // const response = await fetch("SUA_API_URL/auditoria");
            // const data = await response.json();
            
            // Simulando atribuição de dados mockados com a mesma estrutura real que virá do banco
            const mockDados = obterDadosMockados(); 
            
            todosLogs = mockDados;
            
            atualizarContadores(todosLogs);
            
            renderizarTabela(todosLogs);

        } catch (error) {
            console.error("Erro ao carregar dados de auditoria:", error);
            tabelaBody.innerHTML = `<tr><td colspan="4" class="loading-cell" style="color: #dc2626;">Erro ao carregar logs de auditoria do servidor.</td></tr>`;
        }
    }

    function atualizarContadores(logs) {
        countTotalEl.textContent = logs.length;
        
        const aprovacoes = logs.filter(log => log.acao === "Aprovação").length;
        countAprovacoesEl.textContent = aprovacoes;
        
        const reprovacoes = logs.filter(log => log.acao === "Reprovação").length;
        countReprovacoesEl.textContent = reprovacoes;
        
        // Exemplo de cálculo básico para últimas 24h baseando-se em flag ou timestamp real da API
        const logs24h = logs.filter(log => log.recente24h === true).length;
        count24hEl.textContent = logs24h;
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

            let classeBadge = "visualizacao";
            if (log.acao === "Aprovação") classeBadge = "aprovacao";
            if (log.acao === "Reprovação") classeBadge = "reprovao";
            if (log.acao === "Atualização") classeBadge = "atualizacao";

            tr.innerHTML = `
                <td style="font-family: 'DM Mono', monospace; font-size: 13.5px;">${log.dataHora}</td>
                <td>
                    <div class="user-info-cell">
                        <span class="user-title">${log.usuarioNome}</span>
                        <span class="user-subid">ID: ${log.usuarioId}</span>
                    </div>
                </td>
                <td>
                    <span class="badge-acao ${classeBadge}">${log.acao}</span>
                </td>
                <td style="color: var(--text-secondary); font-size: 13.5px;">${log.detalhes}</td>
            `;
            tabelaBody.appendChild(tr);
        });
    }

    function aplicarFiltros() {
        const termoBusca = inputBusca.value.toLowerCase().trim();
        const acaoSelecionada = selectAcao.value;

        const resultado = todosLogs.filter(log => {
            const bateAcao = acaoSelecionada === "" || log.acao === acaoSelecionada;
            
            const bateTexto = termoBusca === "" || 
                log.usuarioNome.toLowerCase().includes(termoBusca) ||
                log.usuarioId.toString().includes(termoBusca) ||
                log.detalhes.toLowerCase().includes(termoBusca);

            return bateAcao && bateTexto;
        });

        renderizarTabela(resultado);
    }

    inputBusca.addEventListener("input", aplicarFiltros);
    selectAcao.addEventListener("change", aplicarFiltros);

    // Inicializa carregamento
    carregarLogsAuditoria();
});

// Mock auxiliar simulando os exatos dados exibidos na imagem enviada para testes locais imediatos
function obterDadosMockados() {
    return [
        { dataHora: "07/04/2026, 10:30", usuarioNome: "Prof. João Silva", usuarioId: 2, acao: "Visualização", detalhes: "Visualizou detalhes da atividade de Maria Santos Silva", recente24h: false },
        { dataHora: "12/03/2026, 09:15", usuarioNome: "Prof. João Silva", usuarioId: 2, acao: "Aprovação", detalhes: "Aprovou atividade \"Curso de React e TypeScript Avançado\" do aluno João Pedro Oliveira", recente24h: false },
        { dataHora: "09/03/2026, 16:30", usuarioNome: "Prof. João Silva", usuarioId: 2, acao: "Reprovação", detalhes: "Reprovou atividade \"Monitoria de Programação Orientada a Objetos\" da aluna Ana Carolina Costa", recente24h: false },
        { dataHora: "02/03/2026, 10:20", usuarioNome: "Administrador Sistema", usuarioId: 1, acao: "Aprovação", detalhes: "Aprovou atividade \"Desenvolvimento de sistema para ONG local\" da aluna Beatriz Ferreira Lima", recente24h: false },
        { dataHora: "01/03/2026, 09:00", usuarioNome: "Administrador Sistema", usuarioId: 1, acao: "Atualização", detalhes: "Alterou limite máximo de horas complementares para 200", recente24h: false }
    ];
}

// Preenchimento opcional do Header caso sua aplicação não rode globalmente
function renderHeaderUser() {
    const nameEl = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");
    if (nameEl && nameEl.textContent === "Carregando...") {
        nameEl.textContent = "Administrador";
        if (emailEl) emailEl.textContent = "admin@kore.com";
    }
}