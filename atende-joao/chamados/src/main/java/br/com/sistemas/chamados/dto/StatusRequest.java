package br.com.sistemas.chamados.dto;

import br.com.sistemas.chamados.entity.StatusChamado;
import jakarta.validation.constraints.NotNull;

public record StatusRequest(
    @NotNull(message = "Status é obrigatório") StatusChamado status
) { }
