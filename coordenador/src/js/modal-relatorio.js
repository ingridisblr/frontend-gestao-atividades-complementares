// Selecionando elementos do Modal
const modal = document.getElementById('modalDetalhes');
const btnFecharModal = document.getElementById('btnFecharModal');

// Função para abrir o modal mapeando os dados dinâmicos da linha/card clicado
function abrirDetalhesAtividade(atividade) {
    document.getElementById('modalAluno').innerText = atividade.aluno;
    document.getElementById('modalCurso').innerText = atividade.curso;
    document.getElementById('modalCategoria').innerText = atividade.categoria;
    document.getElementById('modalData').innerText = atividade.dataSubmissao;
    document.getElementById('modalDescricao').innerText = atividade.descricao;
    document.getElementById('modalHoras').innerText = `${atividade.cargaHoraria} horas`;
    
    // Renderizar a lista de anexos dinamicamente
    const containerAnexos = document.getElementById('modalAnexos');
    containerAnexos.innerHTML = ''; // Limpa antigos
    
    atividade.anexos.forEach(nomeArquivo => {
        containerAnexos.innerHTML += `
            <div class="attachment-item">
                <i class="icon-file-pdf">📄</i> 
                <span class="attachment-name">${nomeArquivo}</span>
            </div>
        `;
    });

    // Exibe o modal removendo a classe hidden
    modal.classList.remove('hidden');
}

// Evento para fechar ao clicar no "X"
btnFecharModal.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Evento para fechar se o coordenador clicar fora da caixa branca
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.classList.add('hidden');
    }
});

// Configuração dos botões de ação do rodapé
document.getElementById('btnAprovar').addEventListener('click', () => {
    alert('Atividade aprovada com sucesso!');
    modal.classList.add('hidden');
    // Chame sua função de API aqui para atualizar no banco MySQL
});

document.getElementById('btnReprovar').addEventListener('click', () => {
    alert('Atividade recusada!');
    modal.classList.add('hidden');
    // Chame sua função de API aqui para atualizar no banco MySQL
});