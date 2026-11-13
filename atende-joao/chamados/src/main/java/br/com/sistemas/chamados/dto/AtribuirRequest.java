package br.com.sistemas.chamados.dto;

import jakarta.validation.constraints.NotNull;

public record AtribuirRequest(
    @NotNull(message = "Técnico é obrigatório") Long tecnicoId
) { }
