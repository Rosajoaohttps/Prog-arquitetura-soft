package br.com.sistemas.chamados.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "comentarios")
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2000)
    private String texto;

    @Column(nullable = false)
    private LocalDateTime data;

    @Column(nullable = false, length = 100)
    private String autor;

    @ManyToOne(optional = false)
    @JoinColumn(name = "chamado_id", nullable = false)
    private Chamado chamado;

    public Comentario() { }

    public Comentario(String texto, String autor, Chamado chamado) {
        this.texto = texto;
        this.autor = autor;
        this.chamado = chamado;
        this.data = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getTexto() { return texto; }
    public LocalDateTime getData() { return data; }
    public String getAutor() { return autor; }
    public Chamado getChamado() { return chamado; }
}
