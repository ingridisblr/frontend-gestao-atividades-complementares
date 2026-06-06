document.addEventListener("DOMContentLoaded", () => {
    renderHeaderUser();

    // Referências do DOM - Métricas e Resumos
    const txtTaxaAprovacao = document.getElementById("txtTaxaAprovacao");
    const barTaxaAprovacao = document.getElementById("barTaxaAprovacao");
    const txtMediaHoras = document.getElementById("txtMediaHoras");
    const txtMetaSemestre = document.getElementById("txtMetaSemestre");
    const barMetaSemestre = document.getElementById("barMetaSemestre");

    const execTotalAlunos = document.getElementById("execTotalAlunos");
    const execAlunosPendentes = document.getElementById("execAlunosPendentes");
    const execHorasValidadas = document.getElementById("execHorasValidadas");
    const execTempoAnalise = document.getElementById("execTempoAnalise");
    const listaInsights = document.getElementById("listaInsights");

    // Instâncias Globais dos Gráficos para possibilitar destruição/re-renderização posterior
    let chartSubmissoesInstance = null;
    let chartTaxaPeriodoInstance = null;
    let chartHorasCursoInstance = null;

    // 1. Método Principal de Carregamento da Rota de Relatórios
    async function carregarIndicadoresERelatorios() {
        try {
            // Contexto pronto para receber endpoint real, ex: const res = await api.get('/coordenador/relatorios');
            // const dadosReais = await res.json();

            // Consumindo estrutura simulada (mock) idêntica aos indicadores enviados nas imagens
            const dados = obterMockRelatorios();

            // Atualiza Interface Visual (Textos e Barras de Progresso)
            txtTaxaAprovacao.textContent = `${dados.metricas.taxaAprovacao}%`;
            barTaxaAprovacao.style.width = `${dados.metricas.taxaAprovacao}%`;

            txtMediaHoras.textContent = `${dados.metricas.mediaHoras}h`;
            
            txtMetaSemestre.textContent = `${dados.metricas.metaSemestre}%`;
            barMetaSemestre.style.width = `${dados.metricas.metaSemestre}%`;

            // Atualiza Bloco de Resumo Executivo
            execTotalAlunos.textContent = dados.resumo.totalAlunos;
            execAlunosPendentes.textContent = dados.resumo.alunosPendentes;
            execHorasValidadas.textContent = `${dados.resumo.horasValidadas}h`;
            execTempoAnalise.textContent = `${dados.resumo.tempoAnaliseMedia} dias`;

            // Monta os Bullet-points de Insights
            renderizarInsights(dados.insights);

            // Renderiza as estruturas gráficas do Chart.js
            renderizarGraficosLineares(dados.graficosPeriodos);
            renderizarGraficoBarrasCurso(dados.graficoCursos);

        } catch (error) {
            console.error("Erro estrutural ao carregar relatórios:", error);
        }
    }

    // 2. Renderização Dinâmica da Lista de Insights
    function renderizarInsights(insightsArray) {
        listaInsights.innerHTML = "";
        insightsArray.forEach(insight => {
            const li = document.createElement("li");
            li.textContent = insight;
            listaInsights.appendChild(li);
        });
    }

    // 3. Configuração dos dois gráficos lineares superiores (Submissões e Taxas)
    function renderizarGraficosLineares(dadosPeriodo) {
        const ctxSub = document.getElementById("chartSubmissoes").getContext("2d");
        const ctxTaxa = document.getElementById("chartTaxaPeriodo").getContext("2d");

        // Gráfico de Atividades Submetidas
        chartSubmissoesInstance = new Chart(ctxSub, {
            type: "line",
            data: {
                labels: dadosPeriodo.meses,
                datasets: [{
                    label: "Atividades",
                    data: dadosPeriodo.submetidas,
                    borderColor: "#2563eb",
                    backgroundColor: "transparent",
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: "#2563eb"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } } },
                scales: { y: { min: 0, max: 12, ticks: { stepSize: 3 } } }
            }
        });

        // Gráfico de Taxa de Aprovação por Período
        chartTaxaPeriodoInstance = new Chart(ctxTaxa, {
            type: "line",
            data: {
                labels: dadosPeriodo.meses,
                datasets: [{
                    label: "Taxa (%)",
                    data: dadosPeriodo.taxas,
                    borderColor: "#10b981",
                    backgroundColor: "transparent",
                    tension: 0.1,
                    borderWidth: 2,
                    pointBackgroundColor: "#10b981"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } } },
                scales: { y: { min: 0, max: 100, ticks: { stepSize: 25 } } }
            }
        });
    }

    // 4. Configuração do Gráfico de Barras (Média por Curso)
    function renderizarGraficoBarrasCurso(dadosCurso) {
        const ctxCurso = document.getElementById("chartHorasCurso").getContext("2d");

        chartHorasCursoInstance = new Chart(ctxCurso, {
            type: "bar",
            data: {
                labels: dadosCurso.nomes,
                datasets: [{
                    label: "Horas médias",
                    data: dadosCurso.valores,
                    backgroundColor: "#2563eb",
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'bottom' } },
                scales: { y: { min: 0, max: 60, ticks: { stepSize: 15 } } }
            }
        });
    }

    // Inicialização da busca de dados
    carregarIndicadoresERelatorios();
});

//  APAGAR AQUI! Evento disparado pelas ações de clique dos botões de exportação
function exportarRelatorio(tipo) {
    console.log(`Solicitação de exportação via API enviada para o formato: ${tipo}`);
    // Exemplo: api.post(`/relatorios/exportar`, { formato: tipo })
    alert(`Exportação do tipo "${tipo}" iniciada com sucesso!`);
}

// Mock Estruturado baseado estritamente nos dados das capturas enviadas
function obterMockRelatorios() {
    return {
        metricas: {
            taxaAprovacao: 75,
            mediaHoras: 42,
            metaSemestre: 68
        },
        graficosPeriodos: {
            meses: ["Jan", "Fev", "Mar", "Abr"],
            submetidas: [5, 8, 12, 7],
            taxas: [75, 82, 78, 85]
        },
        graficoCursos: {
            nomes: ["Ciência da Comp.", "Eng. de Software", "Sistemas de Info."],
            valores: [45, 52, 38]
        },
        resumo: {
            totalAlunos: 156,
            alunosPendentes: 23,
            horasValidadas: "6.548",
            tempoAnaliseMedia: 2.3
        },
        insights: [
            "Houve um aumento de 15% nas submissões em relação ao mês anterior",
            "O curso de Engenharia de Software apresenta a maior média de horas",
            "A taxa de aprovação está acima da meta estabelecida (75%)",
            "O tempo médio de análise reduziu 20% no último trimestre"
        ]
    };
}

function renderHeaderUser() {
    const nameEl = document.getElementById("userName");
    const emailEl = document.getElementById("userEmail");
    if (nameEl && nameEl.textContent === "Carregando...") {
        nameEl.textContent = "Prof. João Silva";
        if (emailEl) emailEl.textContent = "joao.silva@kore.edu.br";
    }
}