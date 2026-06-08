}

function obterAluno(a) {
    return a.alunoId?.nome || a.aluno?.nome || a.nomeAluno || a.nome || '–';
}

function obterCurso(a) {
    return a.cursoId?.nome || a.curso?.nome || a.curso || '–';
}


        `;
    }).join('');
}



