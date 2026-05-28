from app.models.training import WorkoutSession


def build_adaptation_summary(session: WorkoutSession) -> str:
    if not session.completed:
        return "Sessão não concluída. Próxima semana com volume reduzido em 20% para retomar consistência."
    if (session.perceived_effort or 0) <= 6 and (session.difficulty_level or 0) <= 5:
        return "Treino fácil: aumente carga em 2,5% a 5% no próximo treino dos mesmos exercícios."
    if (session.perceived_effort or 0) >= 9 or (session.soreness_level or 0) >= 8:
        return "Treino muito pesado: reduza 1 série dos acessórios e mantenha RPE alvo em 7-8."
    if (session.energy_level or 0) <= 4:
        return "Baixa energia: preserve técnica, aumente descanso entre séries e priorize recuperação."
    return "Carga e volume adequados: mantenha progressão de reps antes de subir carga."
