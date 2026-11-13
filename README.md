# Atende+ — Sistema de gestão de chamados

**Responsável pelo projeto: João.**

API REST em Java 21 / Spring Boot 4, banco H2 (em memória) e interface web integrada (HTML/CSS/JS), servida pelo próprio Spring Boot. Não é preciso iniciar um servidor de frontend separado.

## Como executar
1. Instale o **JDK 21**.
2. Abra o terminal na pasta `chamados` (onde estão `pom.xml` e `mvnw`).
3. Execute:

   - Windows (PowerShell): `.\mvnw.cmd spring-boot:run`
   - macOS / Linux: `chmod +x mvnw && ./mvnw spring-boot:run`
4. Acesse **http://localhost:8080**.

Na primeira execução o Maven Wrapper baixa o Maven e as dependências (é necessária internet). Os dados ficam em memória e são perdidos ao encerrar a aplicação.
Console do H2: http://localhost:8080/h2-console — JDBC URL `jdbc:h2:mem:chamadosdb`, usuário `sa`, senha vazia.

## Primeiros passos na interface
1. **Clientes → Novo cliente**.
2. **Categorias → Nova categoria**.
3. (Opcional) **Técnicos → Novo técnico**, para atribuir chamados.
4. **Novo chamado**: escolha cliente, categoria e prioridade.

## Funcionalidades
- Dashboard com indicadores e chamados recentes.
- Listagem, busca e filtros (status e prioridade) de chamados.
- Abertura e edição de chamados; detalhes com atribuição de técnico, alteração de status e comentários.
- Cadastro, edição e exclusão de clientes, técnicos e categorias.

## API REST
| Recurso | Rotas |
|---|---|
| Clientes | POST/GET `/clientes`, GET/PUT/DELETE `/clientes/{id}`, GET `/clientes/{id}/chamados` |
| Categorias | POST/GET `/categorias`, GET/PUT/DELETE `/categorias/{id}` |
| Técnicos | POST/GET `/tecnicos`, GET/PUT/DELETE `/tecnicos/{id}` |
| Chamados | POST `/chamados`, GET `/chamados?status=&prioridade=&clienteId=&page=&size=&sort=`, GET/PUT/DELETE `/chamados/{id}` |
| Ações | PATCH `/chamados/{id}/atribuir`, PATCH `/chamados/{id}/status` |
| Comentários | POST/GET `/chamados/{id}/comentarios` |

Corpo para abrir um chamado: `{"titulo":"...","descricao":"...","prioridade":"ALTA","clienteId":1,"categoriaId":1}`.
`GET /chamados` devolve uma página (`{"content":[...],"page":{...}}`); as demais listagens devolvem arrays.

## Regras de negócio
- O chamado nasce `ABERTO`; `dataAbertura` é automática.
- Transições: ABERTO → EM_ATENDIMENTO | FECHADO · EM_ATENDIMENTO → AGUARDANDO_CLIENTE | FECHADO · AGUARDANDO_CLIENTE → EM_ATENDIMENTO | FECHADO.
- EM_ATENDIMENTO exige técnico atribuído. Chamado FECHADO não pode ser atribuído nem alterado.
- Erros: 400 (validação), 404 (não encontrado), 409 (regra de negócio / registro em uso).

## Estrutura
```
chamados/
├── pom.xml, mvnw, mvnw.cmd, .mvn/
└── src/main
    ├── java/br/com/sistemas/chamados   (controller, service, repository, entity, dto, exception)
    └── resources
        ├── application.properties
        └── static  (index.html, styles.css, app.js)
```
