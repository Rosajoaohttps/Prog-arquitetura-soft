package br.com.sistemas.chamados.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.sistemas.chamados.entity.Comentario;

public interface ComentarioRepository extends JpaRepository<Comentario, Long> {
    List<Comentario> findByChamadoIdOrderByDataAsc(Long chamadoId);
}
