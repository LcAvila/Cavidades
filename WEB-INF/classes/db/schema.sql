-- CustomFusionWeb - schema do banco SQLite (fonte de verdade do projeto).
-- Aplicado de forma idempotente por Database.inicializar().

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS moldes (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    nome_peca TEXT NOT NULL,
    familia TEXT,
    revisao_cadastro TEXT,
    layout_id TEXT,
    desenho_id TEXT,
    modelo3d_id TEXT,
    padroes_json TEXT NOT NULL DEFAULT '{}',
    origem TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS molde_cavidades (
    molde_id TEXT NOT NULL REFERENCES moldes(id) ON DELETE CASCADE,
    numero TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    PRIMARY KEY (molde_id, numero)
);

CREATE TABLE IF NOT EXISTS desenhos (
    id TEXT PRIMARY KEY,
    molde_id TEXT REFERENCES moldes(id) ON DELETE SET NULL,
    papel TEXT,
    revisao TEXT,
    imagem TEXT,
    documento TEXT,
    origem TEXT,
    observacao TEXT,
    dados_json TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_desenhos_molde ON desenhos(molde_id);

CREATE TABLE IF NOT EXISTS formas (
    id TEXT PRIMARY KEY,
    revisao TEXT,
    descricao TEXT,
    dados_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS maquinas (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    ocorrencias INTEGER NOT NULL DEFAULT 0,
    dados_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS layouts (
    id TEXT PRIMARY KEY,
    molde_id TEXT REFERENCES moldes(id) ON DELETE SET NULL,
    tipo TEXT,
    revisao TEXT,
    dados_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_layouts_molde ON layouts(molde_id);

CREATE TABLE IF NOT EXISTS modelos3d (
    id TEXT PRIMARY KEY,
    arquivo TEXT NOT NULL,
    nome TEXT,
    revisao TEXT,
    codigo_tecnico TEXT,
    documento_original TEXT,
    fallback_procedural INTEGER NOT NULL DEFAULT 0,
    dados_json TEXT NOT NULL DEFAULT '{}'
);

DROP TABLE IF EXISTS historico_grades;

CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY,
    molde_id TEXT NOT NULL REFERENCES moldes(id) ON DELETE CASCADE,
    aberta_em TEXT NOT NULL,
    maquina TEXT,
    data_entrada TEXT,
    dados_grade_json TEXT NOT NULL DEFAULT '{}',
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_grades_molde ON grades(molde_id);

CREATE TABLE IF NOT EXISTS anotacoes_3d (
    id TEXT PRIMARY KEY,
    grade_id TEXT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    modelo_key TEXT NOT NULL,
    conteudo_html TEXT NOT NULL,
    ponto_x REAL,
    ponto_y REAL,
    ponto_z REAL,
    autor_login TEXT NOT NULL,
    autor_nome TEXT NOT NULL,
    criado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_anotacoes_3d_grade_modelo
    ON anotacoes_3d(grade_id, modelo_key, criado_em);

CREATE TABLE IF NOT EXISTS grade_cavidades (
    grade_id TEXT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    cavidade TEXT NOT NULL,
    desvio TEXT,
    data TEXT,
    vedado TEXT NOT NULL DEFAULT 'N',
    observacao TEXT,
    controlador TEXT,
    PRIMARY KEY (grade_id, cavidade)
);
CREATE INDEX IF NOT EXISTS idx_grade_cavidades_grade ON grade_cavidades(grade_id);

-- Compatibilidade com o endpoint antigo PUT /api/moldes/{codigo}/cavidades.
CREATE TABLE IF NOT EXISTS registros_molde (
    molde_id TEXT PRIMARY KEY REFERENCES moldes(id) ON DELETE CASCADE,
    dados_cavidades_json TEXT NOT NULL DEFAULT '{}',
    dados_grade_json TEXT NOT NULL DEFAULT '{}',
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Permissoes por papel (NeoPaper) do Fusion. Sem linha configurada (ou sem
-- visualizar=1) o papel nao acessa o projeto. Administradores do Fusion e o
-- usuario de desenvolvimento local ignoram esta tabela.
CREATE TABLE IF NOT EXISTS permissoes_papel (
    papel_codigo TEXT PRIMARY KEY,
    papel_nome TEXT NOT NULL DEFAULT '',
    visualizar INTEGER NOT NULL DEFAULT 0,
    imprimir INTEGER NOT NULL DEFAULT 0,
    abrir_molde INTEGER NOT NULL DEFAULT 0,
    cadastrar_molde INTEGER NOT NULL DEFAULT 0,
    editar_molde INTEGER NOT NULL DEFAULT 0,
    excluir_grade INTEGER NOT NULL DEFAULT 0,
    configurar INTEGER NOT NULL DEFAULT 0,
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
