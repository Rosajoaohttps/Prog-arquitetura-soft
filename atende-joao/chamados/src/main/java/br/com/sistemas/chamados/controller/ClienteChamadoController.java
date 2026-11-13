package br.com.sistemas.chamados.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.*;

import br.com.sistemas.chamados.dto.ChamadoResponse;
import br.com.sistemas.chamados.service.ChamadoService;

/** GET /clientes/{id}/chamados - chamados de um cliente específico. */
@RestController
@RequestMapping("/clientes/{clienteId}/chamados")
public class ClienteChamadoController {

    private final ChamadoService service;

    public ClienteChamadoController(ChamadoService service) {
        this.service = service;
    }

    @GetMapping
    public PagedModel<ChamadoResponse> listar(
            @PathVariable Long clienteId,
            @PageableDefault(size = 10, sort = "dataAbertura", direction = Sort.Direction.DESC) Pageable pageable) {
        return new PagedModel<>(service.listarPorCliente(clienteId, pageable));
    }
}
