package br.com.sistemas.chamados.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.sistemas.chamados.dto.ComentarioRequest;
import br.com.sistemas.chamados.dto.ComentarioResponse;
import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Comentario;
import br.com.sistemas.chamados.exception.RecursoNaoEncontradoException;
import br.com.sistemas.chamados.repository.ChamadoRepository;
import br.com.sistemas.chamados.repository.ComentarioRepository;

@Service
public class ComentarioService {

    private final ComentarioRepository repository;
    private final ChamadoRepository chamadoRepository;

    public ComentarioService(ComentarioRepository repository, ChamadoRepository chamadoRepository) {
        this.repository = repository;
        this.chamadoRepository = chamadoRepository;
    }

    @Transactional
    public ComentarioResponse adicionar(Long chamadoId, ComentarioRequest dto) {
        Chamado chamado = buscarChamado(chamadoId);
        return ComentarioResponse.de(repository.save(new Comentario(dto.texto(), dto.autor(), chamado)));
    }

    @Transactional(readOnly = true)
    public List<ComentarioResponse> listar(Long chamadoId) {
        buscarChamado(chamadoId);
        return repository.findByChamadoIdOrderByDataAsc(chamadoId).stream().map(ComentarioResponse::de).toList();
    }

    private Chamado buscarChamado(Long id) {
        return chamadoRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Chamado " + id + " não encontrado"));
    }
}
