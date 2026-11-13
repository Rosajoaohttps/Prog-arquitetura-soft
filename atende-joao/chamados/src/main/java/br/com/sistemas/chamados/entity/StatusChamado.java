package br.com.sistemas.chamados.entity;

import java.util.EnumSet;
import java.util.Set;

public enum StatusChamado {
    ABERTO, EM_ATENDIMENTO, AGUARDANDO_CLIENTE, FECHADO;

    /** Transições permitidas a partir de cada status. FECHADO é final. */
    public Set<StatusChamado> proximosPermitidos() {
        return switch (this) {
            case ABERTO -> EnumSet.of(EM_ATENDIMENTO, FECHADO);
            case EM_ATENDIMENTO -> EnumSet.of(AGUARDANDO_CLIENTE, FECHADO);
            case AGUARDANDO_CLIENTE -> EnumSet.of(EM_ATENDIMENTO, FECHADO);
            case FECHADO -> EnumSet.noneOf(StatusChamado.class);
        };
    }

    public boolean podeIrPara(StatusChamado destino) {
        return proximosPermitidos().contains(destino);
    }
}
