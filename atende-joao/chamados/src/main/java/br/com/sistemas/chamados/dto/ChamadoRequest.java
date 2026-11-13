package br.com.sistemas.chamados.dto;

import br.com.sistemas.chamados.entity.Prioridade;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChamadoRequest(
    @NotBlank(message = "Título é obrigatório")
    @Size(max = 150, message = "Título deve ter no máximo 150 caracteres")
    String titulo,

    @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
    String descricao,

    @NotNull(message = "Prioridade é obrigatória")
    Prioridade prioridade,

    @NotNull(message = "Cliente é obrigatório")
    Long clienteId,

    @NotNull(message = "Categoria é obrigatória")
    Long categoriaId
) { }
