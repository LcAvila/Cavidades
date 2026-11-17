<p align="center">
  <img src="assets/logos/Logo%20Compactor.svg" alt="Compactor — Cia. de Canetas" width="320">
</p>

<h1 align="center">Controle de Cavidades Não Conformes</h1>

<p align="center">
  Aplicação web para registro, acompanhamento e publicação de não conformidades das cavidades de moldes de injeção plástica.
</p>

<p align="center">
  <img alt="Java" src="https://img.shields.io/badge/Java-17%2B-007396?logo=openjdk&logoColor=white">
  <img alt="Jakarta EE" src="https://img.shields.io/badge/Jakarta%20EE-Servlet%206.0-1b6ec2">
  <img alt="Tomcat" src="https://img.shields.io/badge/Tomcat-10.1-F8DC75?logo=apachetomcat&logoColor=black">
  <img alt="SQLite" src="https://img.shields.io/badge/SQLite-3.46-003B57?logo=sqlite&logoColor=white">
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-3D-000000?logo=three.js&logoColor=white">
</p>

---

## Visão geral

O **Controle de Cavidades** é um módulo web interno da **Compactor (Cia. de Canetas)** integrado ao
ambiente **Fusion**. Ele permite que a ferramentaria e o controle de qualidade registrem, por molde e
por cavidade, os desvios identificados na entrada dos moldes em produção — com bloqueio de cavidades
vedadas, impressão da grade em A4 e publicação do relatório no GED.

A aplicação foi desenhada para um fluxo **sem botão de salvar**: o operador seleciona a cavidade no
diagrama, descreve o desvio, aplica e o sistema persiste automaticamente. Ao final, a grade é
impressa ou publicada como documento oficial.

## Funcionalidades

- **Abertura de grade com check-list** — molde, máquina, matéria-prima, quantidade total/ativa de
  cavidades, situação, controlador e status de liberação.
- **Registro de não conformidade** — seleção múltipla de cavidades (Ctrl/Cmd + clique), desvios
  padronizados (F.P.F.Q., P.F.Q., V.P.F., REB., B.V., C.P.Q., B.B.F.Q.), observação e marcação de
  cavidade **vedada**.
- **Auto-save** — gravação assíncrona e agrupada por debounce, com feedback visual de status.
- **Resumo em tempo real** — total, OK, defeitos e vedadas por grade.
- **Diagrama SVG interativo** — gerado a partir do desenho da grade do molde, com zonas e seleção
  de todas as cavidades de uma região.
- **Tabela de registros** e **modal de detalhes** por cavidade.
- **Impressão A4 / PDF** — folha única em milímetros reais, gerada com `jsPDF` + `html-to-image`.
- **Visualização 3D da peça** — `Three.js` local (STL) com vistas ortogonais, medições, cortes,
  estilos de exibição e anotações; opcionalmente via **Autodesk Platform Services (APS)** na nuvem.
- **Publicação no GED** do Fusion — gera o PDF da grade e o envia como documento oficial.
- **Permissões por papel/grupo do Fusion** — controle granular de acesso por função.

## Arquitetura

Aplicação web **Java (Jakarta EE)** empacotada como *webapp* estático (sem framework MVC), com
frontend em **JavaScript puro** modularizado e persistência em **SQLite**.

| Camada | Tecnologia |
| --- | --- |
| Backend | Java + Jakarta Servlet 6.0 (`javax` → `jakarta`), `web.xml` 6.0 |
| Servidor | Apache Tomcat 10.1 (`/opt/tomcat/apache-tomcat-10.1.34`) |
| View | JSP (`index.jsp`) + HTML/CSS/JS |
| JSON | Jackson 2.17.2 (`databind`, `core`, `annotations`, `jsr310`) |
| Persistência | SQLite via `sqlite-jdbc` 3.46.1.3 |
| 3D | Three.js (local) e Autodesk APS (nuvem, opcional) |
| PDF | `html-to-image` + `jsPDF` |

### Fluxo de uma sessão

1. O `index.jsp` limpa o cookie de sessão legado e carrega a tela inicial de grades abertas.
2. `app.js` carrega moldes e grades via `/api/config/moldes` e `/api/grades`.
3. Ao abrir uma grade, o layout do molde (SVG) é transformado em modelo e renderizado no diagrama.
4. As edições são persistidas por `persistencia.js` (debounce de 250 ms, com fila de salvamento).
5. Ao publicar, `app.js` monta a folha A4, gera o PDF e envia ao GED via
   `POST /api/moldes/{codigo}/publicar-ged`.

## Estrutura do projeto

```
cavidades/
├── index.jsp                     # Página única (tela inicial + grade + modais)
├── css/style.css                 # Estilos (mobile-first, tema Compactor)
├── js/
│   ├── app.js                    # Orquestrador da aplicação
│   ├── seguranca.js              # Permissões por papel do Fusion
│   ├── core/                     # estado, persistência, catálogos, registros
│   ├── render/                   # diagrama, tabela, formulário, impressão, 3D...
│   ├── layouts/generators.js     # Geração de layouts
│   └── lib/                      # Three.js, html-to-image, jsPDF
├── assets/
│   ├── logos/                    # Logo Compactor
│   ├── desenhos/                 # Grades dos moldes em SVG
│   ├── images/pecas/             # Desenhos das peças injetadas
│   └── models/                   # Modelos 3D (STL)
├── META-INF/
│   └── context.xml               # Cookie de sessão (CAVIDADES_SESSIONID)
└── WEB-INF/
    ├── web.xml                   # Configuração do webapp
    ├── lib/                      # Jackson + sqlite-jdbc
    └── classes/
        ├── application.properties
        ├── application-local.properties   # Segredos (não versionado)
        ├── db/schema.sql                  # Schema SQLite (idempotente)
        └── fusion/developer/web/cavidades/
            ├── config/    aps/     model/    repository/
            ├── seguranca/  service/  servlet/  db/
```

## Pré-requisitos

- **JDK 17+**
- **Apache Tomcat 10.1** (compatível com Jakarta EE 9+; o projeto usa `jakarta.servlet`)
- Banco **SQLite** (arquivo criado automaticamente pela aplicação)

## Execução e deploy

O projeto é entregue no formato de *webapp* (sem build Maven/Gradle). Para publicar:

1. Compile as classes Java em `WEB-INF/classes` (alvo compatível com Jakarta, JDK 17+).
2. Copie ou aponte o diretório como contexto do Tomcat com o nome **`cavidades`**.
3. Inicie o Tomcat — `Database.inicializar()` aplica o `db/schema.sql` de forma idempotente na
   primeira execução.
4. Acesse `http://<host>:8080/cavidades/` (a página inicial é o `index.jsp`).

O caminho padrão do banco é:

- **Linux:** `/opt/neomind/fusion/config/customfusion.db`
- **Windows:** `%USERPROFILE%\.customfusion\customfusion.db`

## Configuração

As configurações ficam em `WEB-INF/classes/application.properties` e podem ser sobrescritas por
variáveis de ambiente (ex.: `APP_FUSION_API_TOKEN` → `app.fusion.api-token`). Segredos são mantidos
fora do versionamento em `application-local.properties`.

| Grupo | Chave | Descrição |
| --- | --- | --- |
| Banco | `app.sqlite.path` | Caminho do SQLite (vazio = padrão do SO / `APP_SQLITE_PATH`) |
| Segurança | `app.seguranca.papel-admin` | Papel/grupo do Fusion com acesso total |
| Segurança | `app.seguranca.admin-logins` | Logins com privilégio de administrador |
| Desenvolvimento | `app.dev.usuario` | Usuário local sem sessão Fusion (testes) |
| GED | `app.fusion.base-url` | URL base do GED do Fusion |
| GED | `app.fusion.api-token` | Token da API do GED (em `application-local.properties`) |
| GED | `app.fusion.doc-type` | Tipo do documento (padrão `RELATORIOCAVIDADES`) |
| GED | `app.fusion.folder-base` | Pasta de destino (ex.: `Cavidades Não Conformes`) |
| SSO | `app.sso.secret-file` | Segredo do token SSO Fusion → Cavidades |
| APS | `app.aps.client-id` / `app.aps.client-secret` | Credenciais do Autodesk Platform Services |

> Sem credenciais APS, a visualização 3D usa o visualizador **Three.js local** e nenhum arquivo é
> enviado para a nuvem.

## API REST

Todas as rotas ficam sob `/api` e são protegidas por sessão/SSO do Fusion, salvo em ambiente de
desenvolvimento.

### Grades

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/grades` | Lista as grades abertas |
| `POST` | `/api/grades` | Cria/abre uma grade |
| `GET` | `/api/grades/{id}` | Carrega uma grade e seus registros |
| `PUT` | `/api/grades/{id}` | Persiste dados da grade e das cavidades |
| `DELETE` | `/api/grades/{id}` | Exclui uma grade e seus registros |
| `POST` | `/api/grades/importar` | Importa grades do `localStorage` legado |

### Moldes e catálogos

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/api/moldes/cadastrar` | Cadastra/edita molde com layout, desenho e 3D |
| `GET` | `/api/moldes/{codigo}` | Consulta molde por código |
| `PUT` | `/api/moldes/{codigo}/cavidades` | Atualização de cavidades (compatibilidade) |
| `POST` | `/api/moldes/{codigo}/publicar-ged` | Publica a grade como PDF no GED |
| `GET` | `/api/config/moldes` | Catálogo de moldes |
| `GET` | `/api/config/layouts/{id}` | Layout (SVG) de um molde |
| `GET` | `/api/config/formas` | Catálogo de formas |
| `GET` | `/api/config/desenhos` | Catálogo de desenhos de peça |
| `GET` | `/api/config/maquinas` | Catálogo de máquinas |
| `GET` | `/api/config/modelos3d` | Catálogo de modelos 3D |

### Visualização 3D, anotações e usuário

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/aps/token` | Token do Autodesk Platform Services |
| `POST` | `/api/aps/modelo` | Tradução/URN do modelo para SVF2 |
| `GET/POST` | `/api/anotacoes3d/{gradeId}?modelo=` | Lista / cria anotações 3D |
| `PUT/DELETE` | `/api/anotacoes3d/{gradeId}/{id}?modelo=` | Atualiza / remove anotação 3D |
| `GET` | `/api/usuario-atual` | Usuário autenticado e suas permissões |
| `GET/POST` | `/api/papeis` | Consulta / salva permissões por papel do Fusion |

## Modelo de dados

O schema SQLite é aplicado de forma idempotente por `Database.inicializar()`.

- `moldes`, `molde_cavidades` — cadastro do molde e numeração das cavidades.
- `layouts`, `formas`, `desenhos`, `modelos3d` — catálogos usados no diagrama, na impressão e no 3D.
- `maquinas` — máquinas disponíveis na abertura de grade.
- `grades` — cabeçalho da grade (molde, máquina, data de entrada, dados JSON).
- `grade_cavidades` — registro por cavidade (desvio, data, vedado, observação, controlador).
- `anotacoes_3d` — anotações posicionadas em coordenadas XYZ por grade/modelo.
- `registros_molde` — compatibilidade com o endpoint antigo de cavidades.
- `permissoes_papel` — permissões por papel/grupo do Fusion.
- `meta` — metadados internos.

## Permissões

As permissões são **somadas** quando o usuário possui mais de um papel, e um papel sem
**Visualizar** não acessa o projeto. Administradores do Fusion e o usuário de desenvolvimento local
ignoram a tabela de permissões.

| Permissão | Descrição |
| --- | --- |
| `visualizar` | Visualizar o projeto e consultar as grades |
| `imprimir` | Imprimir a grade |
| `abrirMolde` | Abrir grade, editar dados e publicar no GED |
| `cadastrarMolde` | Cadastrar um molde novo |
| `editarMolde` | Editar ou excluir um molde existente |
| `excluirGrade` | Excluir uma grade aberta e seus registros |
| `configurar` | Alterar as permissões dos papéis |

## Visualização 3D

Dois visualizadores complementares, acessados pelo botão **VER EM 3D**:

- **Three.js (local)** — carrega o STL do molde, oferece vistas ortogonais (Ctrl+1 a Ctrl+8),
  medições (distância, diâmetro, ângulo, caixa), plano de corte (X/Y/Z), estilos de exibição
  (sombreado, arestas, wireframe) e anotações em pontos da peça.
- **Autodesk Platform Services (APS)** — traduz o modelo para SVF2 na nuvem e usa o Viewer oficial,
  útil para arquivos CAD do SolidWorks quando configurado.

## Publicação no GED

O status de publicação é obrigatório e pode ser **Término de produção**, **Defeito no molde** ou
**Mudança de máquina**, com observação opcional. A aplicação monta a folha A4, gera o PDF e envia
para o GED do Fusion via `POST /api/moldes/{codigo}/publicar-ged`
(`{ "file": "grade-<codigo>.pdf", "fileBytes": "<base64>", ... }`). Ao concluir, a grade é marcada
como publicada e sai da lista de grades abertas.

## Convenções

- Idioma do domínio, rótulos e mensagens: **português do Brasil**.
- Identificadores de código, classes e colunas: sem acentuação.
- Persistência sempre no SQLite (fonte de verdade); o `localStorage` é apenas legado de migração.

---

<p align="center">
  <sub>Desenvolvido para <strong>Compactor — Cia. de Canetas</strong>. Uso interno.</sub>
</p>
