package br.com.sistemas.chamados.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.sistemas.chamados.entity.Chamado;
import br.com.sistemas.chamados.entity.Prioridade;
import br.com.sistemas.chamados.entity.StatusChamado;

public interface ChamadoRepository extends JpaRepository<Chamado, Long> {

    @Query("""
        select c from Chamado c
        where (:status is null or c.status = :status)
          and (:prioridade is null or c.prioridade = :prioridade)
          and (:clienteId is null or c.cliente.id = :clienteId)
        """)
    Page<Chamado> filtrar(@Param("status") StatusChamado status,
                          @Param("prioridade") Prioridade prioridade,
                          @Param("clienteId") Long clienteId,
                          Pageable pageable);
}
