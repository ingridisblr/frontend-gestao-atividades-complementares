renderTopbar();

let todasAtividadesValidadas = [];
// URL Base do seu backend no Render
const API_UPLOAD_BASE = 'https://sistema-gestao-atividades-complementares.onrender.com';

function normalizarStatus(status) {
    if (!status) return 'enviada';
    const s = String(status).trim().toLowerCase();
    const map = {
        pendente: 'enviada',
        enviada: 'enviada',
        'em análise': 'em análise',
        'em analise': 'em análise',
        aprovada: 'aprovada',
        aprovado: 'aprovada',
        reprovada: 'reprovada',
        reprovado: 'reprovada'
    };
    return map[s] || s;
}

function labelStatus(status) {
    const map = {
        enviada: 'Enviada',
        'em análise': 'Em análise',
        aprovada: 'Aprovada',
        reprovada: 'Reprovada'
    };
    return map[normalizarStatus(status)] || status || 'Enviada';
}

function formatarData(data) {
    if (!data) return '–';
    const d = new Date(data);
    if (isNaN(d.getTime())) return '–';
    return d.toLocaleDateString('pt-BR');
}

function obterAluno(a) {
    return a.alunoId?.nome || a.aluno?.nome || a.nomeAluno || a.nome || '–';
}

function obterCurso(a) {
    return a.cursoId?.nome || a.curso?.nome || a.curso || '–';
}

function obterHorasSolicitadas(a) {
    return a.cargaHorariaInformada || a.cargaHoraria || 0;
}

function obterHorasValidadas(a) {
    return a.cargaHorariaValidada || 0;
}

function obterDescricao(a) {
    return a.descricao || '–';
}

function obterObservacao(a) {
    return a.observacaoCoordenador || a.observacao || '';
}

function obterJustificativa(a) {
    return a.justificativaReprovacao || a.justificativa || '';
}

function obterValidador(a) {
    return a.validadoPor?.nome || a.coordenador?.nome || 'Coordenador';
}

function obterDataValidacao(a) {
    return a.updatedAt || a.dataValidacao || a.data;
}

function renderizarCardsHistorico(atividades) {
    const container = document.getElementById('historicoCardsContainer');

    if (!container) return;

    if (!atividades || atividades.length === 0) {
        container.innerHTML = `
            <div class="card" style="padding: 32px; text-align: center; color: var(--text-secondary);">
                Nenhuma atividade validada encontrada no seu histórico.
            </div>
        `;
        return;
    }

    container.innerHTML = atividades.map(a => {
        const status = normalizarStatus(a.status);
        const isAprovada = status === 'aprovada';

        const gridColunas = isAprovada 
            ? 'grid-template-columns: repeat(4, 1fr);' 
            : 'grid-template-columns: repeat(3, 1fr);';

        let blocoDetalhesInternos = `<div><strong>Descrição:</strong> ${obterDescricao(a)}</div>`;
        
        if (!isAprovada && obterJustificativa(a)) {
            blocoDetalhesInternos += `<div style="color: #b91c1c; margin-top: 6px;"><strong>Justificativa:</strong> ${obterJustificativa(a)}</div>`;
        }
        if (obterObservacao(a)) {
            blocoDetalhesInternos += `<div style="color: var(--text-secondary); margin-top: 6px;"><strong>Observação:</strong> ${obterObservacao(a)}</div>`;
        }

        return `
            <div class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 20px; background: var(--surface);">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: ${isAprovada ? '#e8faf2' : '#fef0f0'}; color: ${isAprovada ? '#059669' : '#dc2626'};">
                            ${isAprovada 
                                ? `<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>`
                                : `<svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>`
                            }
                        </div>
                        <div>
                            <div style="font-size: 15px; font-weight: 600; color: var(--text-primary);">${obterAluno(a)}</div>
                            <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">${obterCurso(a)}</div>
                        </div>
                    </div>
                    <span class="badge ${status}">
                        ${labelStatus(status)}
                    </span>
                </div>

                <div style="display: grid; ${gridColunas} gap: 16px; border-bottom: 1px solid var(--border); padding-bottom: 16px; font-size: 13px; color: var(--text-secondary);">
                    <div>
                        <div style="color: var(--text-muted); margin-bottom: 6px;">Horas Solicitadas</div>
                        <div style="font-size: 15px; font-weight: 500; color: var(--text-primary);">${obterHorasSolicitadas(a)}h</div>
                    </div>
                    ${isAprovada ? `
                    <div>
                        <div style="color: var(--text-muted); margin-bottom: 6px;">Horas Validadas</div>
                        <div style="font-size: 15px; font-weight: 600; color: var(--text-primary);">${obterHorasValidadas(a)}h</div>
                    </div>` : ''}
                    <div>
                        <div style="color: var(--text-muted); margin-bottom: 6px;">Data de Validação</div>
                        <div style="font-size: 14px; color: var(--text-primary); font-family: 'DM Sans', sans-serif;">${formatarData(obterDataValidacao(a))}</div>
                    </div>
                    <div>
                        <div style="color: var(--text-muted); margin-bottom: 6px;">Validado por</div>
                        <div style="font-size: 14px; color: var(--text-primary); font-weight: 500;">${obterValidador(a)}</div>
                    </div>
                </div>

                <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; font-size: 13.5px; line-height: 1.5; color: var(--text-primary);">
                    ${blocoDetalhesInternos}
                </div>
            </div>
        `;
    }).join('');
}

async function carregarHistoricoAtividades() {
    try {
        // 1. Busca o token salvo no navegador para autenticar com o back-end
        const token = localStorage.getItem('token'); 
        
        // 2. Configura os cabeçalhos de requisição
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // 3. Faz a chamada nativa usando a URL completa do Render
        const res = await fetch(`${API_UPLOAD_BASE}/api/atividades`, {
            method: 'GET',
            headers: headers
        });

        if (!res.ok) throw new Error('Erro ao buscar atividades do histórico');

        const data = await res.json();
        
        // Trata os formatos comuns que o back-end pode retornar (um objeto com chaves ou direto a array)
        const listaBruta = data.atividades || data.data || data || [];

        // 4. Filtra trazendo apenas o histórico de fato (Aprovadas e Reprovadas)
        todasAtividadesValidadas = listaBruta.filter(a => {
            const status = normalizarStatus(a.status);
            return status === 'aprovada' || status === 'reprovada';
        });

        renderizarCardsHistorico(todasAtividadesValidadas);

    } catch (err) {
        console.error('Erro ao carregar histórico:', err);

        const container = document.getElementById('historicoCardsContainer');
        if (container) {
            container.innerHTML = `
                <div class="card" style="padding: 32px; text-align: center; color: #dc2626;">
                    Erro ao carregar o histórico de validações. Tente novamente mais tarde.
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await carregarHistoricoAtividades();
});