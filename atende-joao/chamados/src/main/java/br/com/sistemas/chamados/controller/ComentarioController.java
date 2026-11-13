package br.com.sistemas.chamados.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import br.com.sistemas.chamados.dto.ComentarioRequest;
import br.com.sistemas.chamados.dto.ComentarioResponse;
import br.com.sistemas.chamados.service.ComentarioService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/chamados/{chamadoId}/comentarios")
public class ComentarioController {

    private final ComentarioService service;

    public ComentarioController(ComentarioService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ComentarioResponse adicionar(@PathVariable Long chamadoId, @Valid @RequestBody ComentarioRequest dto) {
        return service.adicionar(chamadoId, dto);
    }

    @GetMapping
    public List<ComentarioResponse> listar(@PathVariable Long chamadoId) {
        return service.listar(chamadoId);
    }
}
