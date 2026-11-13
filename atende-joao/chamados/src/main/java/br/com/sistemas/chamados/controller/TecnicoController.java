package br.com.sistemas.chamados.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import br.com.sistemas.chamados.dto.TecnicoRequest;
import br.com.sistemas.chamados.dto.TecnicoResponse;
import br.com.sistemas.chamados.service.TecnicoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/tecnicos")
public class TecnicoController {

    private final TecnicoService service;

    public TecnicoController(TecnicoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TecnicoResponse> criar(@Valid @RequestBody TecnicoRequest dto) {
        TecnicoResponse criado = service.criar(dto);
        return ResponseEntity.created(URI.create("/tecnicos/" + criado.id())).body(criado);
    }

    @GetMapping
    public List<TecnicoResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public TecnicoResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }

    @PutMapping("/{id}")
    public TecnicoResponse atualizar(@PathVariable Long id, @Valid @RequestBody TecnicoRequest dto) {
        return service.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
