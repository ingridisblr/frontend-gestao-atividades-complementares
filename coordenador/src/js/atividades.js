async function atualizarStatus(novoStatus) {
    const id = document.getElementById('atividadeId').value;
    const cargaHorariaValidada = document.getElementById('cargaHorariaValidada').value;
    const observacaoCoordenador = document.getElementById('observacaoCoordenador').value.trim();
    const justificativaReprovacao = document.getElementById('justificativaReprovacao').value.trim();

    if (!id) {
        alert('Atividade inválida.');
        return;
    }

    // --- INÍCIO DA TRAVA DE LIMITE DE HORAS ---
    if (novoStatus === 'Aprovada' && cargaHorariaValidada !== '') {
        const horasDigitadas = Number(cargaHorariaValidada);

        // Busca a categoria atrelada a esta atividade selecionada
        const categoria = atividadeSelecionada?.categoriaId || atividadeSelecionada?.categoria;
        
        // Captura o limite vindo do banco. 
        // (Atenção: Se no seu banco o nome do campo for diferente, troque 'limiteHoras' para 'maximoHoras', 'cargaHorariaMaxima', etc.)
        const limiteDaCategoria = categoria?.limiteHoras || categoria?.cargaHorariaMaxima || null;

        // Se a categoria tiver um limite E o coordenador digitou um valor maior que ele:
        if (limiteDaCategoria && horasDigitadas > limiteDaCategoria) {
            alert(`⚠️ Atenção: Esta categoria permite validar no máximo ${limiteDaCategoria} horas por certificado. O certificado pode ter mais horas, mas o sistema só aceita até o teto estipulado.`);
            return; // O 'return' cancela a operação e impede que o erro vá para o banco!
        }
    }
    // --- FIM DA TRAVA DE LIMITE DE HORAS ---

    if (novoStatus === 'Reprovada' && !justificativaReprovacao) {
        alert('Informe uma justificativa para reprovar a atividade.');
        return;
    }

    const body = {
        status: novoStatus,
        observacaoCoordenador
    };

    if (cargaHorariaValidada !== '') {
        body.cargaHorariaValidada = Number(cargaHorariaValidada);
    }

    if (novoStatus === 'Reprovada') {
        body.justificativaReprovacao = justificativaReprovacao;
    }

    try {
        const res = await apiFetch(`/api/atividades/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });

        const data = await res?.json().catch(() => ({}));

        if (!res || !res.ok) {
            alert(data.message || data.mensagem || data.erro || 'Erro ao atualizar status.');
            return;
        }

        alert(`Atividade ${novoStatus.toLowerCase()} com sucesso!`);
        fecharModal();
        await carregarAtividades();
    } catch (err) {
        console.error('Erro ao atualizar status:', err);
        alert('Erro ao atualizar status da atividade.');
    }
}