"use strict";

(function (CF) {

  const { estado, revisaoFixa, dividir, dividirPorTamanhos, registroVazio, normalizarRegistro } = CF.estado;
  const cfg = CF.cfg;
  const persistencia = CF.persistencia;
  const telaInicial = CF.telaInicial;
  const { normalizarLayout, montarDiagrama } = CF.diagrama;
  const { montarTabela } = CF.tabela;
  const { criarOpcoesCavidades, sincronizarFormulario, atualizarSelecao, limparFormulario, temEdicaoNaoSalva, initFormulario } = CF.formulario;
  const { aplicarGrade, initGrade } = CF.cabecalho;
  const { atualizarResumo } = CF.resumo;
  const { abrirDetalhes, initModal } = CF.modal;
  const { initImpressao } = CF.impressao;
  const { initRegistros } = CF.registros;

  function el(id) { return document.getElementById(id); }

  function calcularBlocosImpressao(ids, impressao) {
    const total = ids.length;
    const linhaConfigurada = Number(impressao && impressao.linhaMm);
    const linhaBase = Number.isFinite(linhaConfigurada) && linhaConfigurada > 0
      ? linhaConfigurada
      : 4.5;
    const tamanhosConfigurados = impressao && impressao.tamanhosBlocos;

    if (Array.isArray(tamanhosConfigurados) && tamanhosConfigurados.length > 0) {
      const tamanhos = tamanhosConfigurados.map(Number);
      const tamanhosValidos = tamanhos.every((t) => Number.isInteger(t) && t >= 0);
      const soma = tamanhos.reduce((acc, t) => acc + t, 0);
      const linhasDireita = tamanhos.slice(1).reduce((acc, t) => acc + t, 0);
      const maxEsquerda = Math.floor(256.8 / linhaBase);
      const maxDireita = Math.floor(77.8 / linhaBase);

      if (tamanhosValidos && soma === total
          && tamanhos[0] <= maxEsquerda && linhasDireita <= maxDireita) {
        return dividirPorTamanhos(ids, tamanhos);
      }
    }

    if (total <= 18) return dividir(ids, 2);
    if (total <= 66) return dividirPorTamanhos(ids, [total - 9, 9]);

    let menorLinha = 0;
    let maiorLinha = 4.5;
    for (let i = 0; i < 32; i++) {
      const linha = (menorLinha + maiorLinha) / 2;
      const capacidade = Math.floor(256.8 / linha) + Math.floor(77.8 / linha);
      if (capacidade >= total) menorLinha = linha;
      else maiorLinha = linha;
    }

    const linhasEsquerda = Math.min(total, Math.floor(256.8 / menorLinha));
    return dividirPorTamanhos(ids, [linhasEsquerda, total - linhasEsquerda]);
  }

  const STATUS_PUBLICACAO = Object.freeze({
    TERMINO_PRODUCAO: "Término de produção",
    DEFEITO_MOLDE: "Defeito no molde",
    MUDANCA_MAQUINA: "Mudança de máquina"
  });

  const IMAGEM_VAZIA = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  function descreverErro(e) {
    if (!e) return "erro desconhecido";
    if (e.message) return e.message;
    if (typeof e === "string") return e;
    if (e.target) {
      const alvo = e.target;
      const url = alvo.currentSrc || alvo.src || alvo.href || "";
      return "falha em " + (e.type || "evento") + (url ? ": " + url : "");
    }
    if (e.type) return "evento " + e.type;
    return String(e);
  }

  function mostrarToast(tipo, titulo, mensagem) {
    const raiz = document.body || document.documentElement;
    let container = el("cfToastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "cfToastContainer";
      container.className = "cf-toast-container";
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "false");
    }
    if (container.parentElement !== raiz) raiz.appendChild(container);
    const erro = tipo === "error" || tipo === "erro";
    const toast = document.createElement("div");
    toast.className = "cf-toast " + (erro ? "cf-toast-erro" : "cf-toast-sucesso");
    toast.setAttribute("role", erro ? "alert" : "status");

    const icone = document.createElement("span");
    icone.className = "cf-toast-icone";
    icone.setAttribute("aria-hidden", "true");
    icone.textContent = erro ? "!" : "✓";

    const corpo = document.createElement("div");
    corpo.className = "cf-toast-corpo";
    const tituloEl = document.createElement("strong");
    tituloEl.className = "cf-toast-titulo";
    tituloEl.textContent = titulo || (erro ? "Erro" : "Sucesso");
    corpo.appendChild(tituloEl);
    if (mensagem) {
      const msgEl = document.createElement("span");
      msgEl.className = "cf-toast-msg";
      msgEl.textContent = mensagem;
      corpo.appendChild(msgEl);
    }

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "cf-toast-fechar";
    fechar.setAttribute("aria-label", "Fechar aviso");
    fechar.textContent = "×";

    toast.appendChild(icone);
    toast.appendChild(corpo);
    toast.appendChild(fechar);
    while (container.children.length >= 4) {
      container.firstElementChild.remove();
    }
    container.appendChild(toast);

    let removendo = false;
    let timer = null;
    const remover = () => {
      if (removendo) return;
      removendo = true;
      if (timer) window.clearTimeout(timer);
      toast.classList.add("cf-toast-saindo");
      window.setTimeout(() => toast.remove(), 220);
    };
    fechar.addEventListener("click", remover);
    timer = window.setTimeout(remover, erro ? 9000 : 5000);
  }

  function mostrarCarregando(texto) {
    const info = el("moldeInfo");
    if (info) info.textContent = texto || "";
  }

  function mostrarAviso(msg) {
    const aviso = el("avisoLayout");
    if (aviso) { aviso.textContent = msg; aviso.style.display = "block"; }
    const svg = el("svgDiagrama");
    if (svg) svg.style.display = "none";
  }

  function esconderAviso() {
    const aviso = el("avisoLayout");
    if (aviso) aviso.style.display = "none";
    const svg = el("svgDiagrama");
    if (svg) svg.style.display = "";
  }

  function acharMolde(moldeId) {
    return estado.moldes.find((m) => m.id === moldeId) || null;
  }

  function numeroOuNull(valor) {
    if (valor === null || valor === undefined || valor === "") return null;
    const n = Number(valor);
    return Number.isFinite(n) ? n : null;
  }

  function aplicarConfigNaGrade(dadosGrade, config) {
    const saida = Object.assign({}, dadosGrade || {});
    if (!config) return saida;

    if (config.maquina) saida.maquina = String(config.maquina).trim();
    if (config.dataEntrada) saida.dataEntrada = String(config.dataEntrada).trim();
    if (config.materiaPrima) saida.material = String(config.materiaPrima).trim();

    const total = numeroOuNull(config.cavidadesTotais);
    const ativas = numeroOuNull(config.cavidadesAtivas);
    if (total !== null) saida.cavidadesTotais = total;
    if (ativas !== null) saida.cavidadesAtivas = ativas;
    if (config.checklist) {
      saida.checklist = config.checklist;
      if (config.checklist.controlador) {
        saida.controladorAbertura = String(config.checklist.controlador).trim();
      }
    }
    return saida;
  }

  // `molde.padroes` guarda os valores padrão do molde (produto, material,
  // revisão...). Um campo salvo em branco no registro da grade não deve apagar o
  // padrão, então só valores preenchidos sobrescrevem — inclusive para a
  // impressão, que lê `estado.dadosGrade`.
  function semCamposVazios(dados) {
    const saida = {};
    Object.keys(dados || {}).forEach((campo) => {
      const valor = dados[campo];
      if (valor === undefined || valor === null) return;
      if (typeof valor === "string" && valor.trim() === "") return;
      saida[campo] = valor;
    });
    return saida;
  }

  function dadosGradeDoMolde(molde, persistido) {
    const dados = Object.assign(
      {},
      (molde && molde.padroes) || {},
      semCamposVazios(persistido)
    );
    // Revisão é regra do projeto: fixa e não editável, sobrescreve molde e grade.
    dados.revisaoNum = revisaoFixa.num;
    dados.revisaoData = revisaoFixa.data;

    // Grades antigas guardavam o controlador de abertura no checklist.
    if ((dados.controladorAbertura === undefined || dados.controladorAbertura === null
        || String(dados.controladorAbertura).trim() === "")
        && dados.checklist && dados.checklist.controlador) {
      dados.controladorAbertura = String(dados.checklist.controlador).trim();
    }
    return dados;
  }

  function aplicarDesenho(desenho) {
    const imagem = desenho && desenho.imagem ? cfg.urlRecurso(desenho.imagem) : "";
    const peca = el("pecaImg");
    const erro = el("pecaErro");
    if (peca) {
      if (imagem) {
        peca.style.display = "";
        peca.src = imagem;
        if (erro) erro.style.display = "none";
      } else {
        peca.style.display = "none";
        if (erro) { erro.style.display = "block"; erro.textContent = "Desenho da peça não cadastrado para este molde."; }
      }
    }
    const folhaPeca = el("folhaPecaImg");
    if (folhaPeca && imagem) folhaPeca.src = imagem;
  }

  function inicializarDados(molde, persistido, grade) {
    const persistCav = (persistido && persistido.dadosCavidades) || {};
    const dadosCavidades = {};
    molde.cavidades.map(String).forEach((id) => {
      dadosCavidades[id] = persistCav[id] ? normalizarRegistro(persistCav[id]) : registroVazio();
    });

    const dadosGrade = dadosGradeDoMolde(molde, persistido && persistido.dadosGrade);
    dadosGrade.moldeNum = molde.codigo;

    // Grades antigas podem não ter os campos de entrada; o molde fornece o total
    // e as cavidades ativamente livres dão o fallback para ativas.
    const totalCavidades = Array.isArray(molde.cavidades) ? molde.cavidades.length : 0;
    if (dadosGrade.cavidadesTotais === undefined || dadosGrade.cavidadesTotais === null || dadosGrade.cavidadesTotais === "") {
      dadosGrade.cavidadesTotais = totalCavidades;
    }
    if (dadosGrade.cavidadesAtivas === undefined || dadosGrade.cavidadesAtivas === null || dadosGrade.cavidadesAtivas === "") {
      const vedadas = Object.values(dadosCavidades).filter((registro) => registro && registro.vedado === "S").length;
      dadosGrade.cavidadesAtivas = Math.max(0, totalCavidades - vedadas);
    }

    // Máquina e data de entrada são escolhidas no modal de abertura da grade e
    // não são editáveis na tela: o valor da grade manda sobre molde/registro.
    if (grade) {
      if (grade.maquina) dadosGrade.maquina = grade.maquina;
      if (grade.dataEntrada) dadosGrade.dataEntrada = grade.dataEntrada;
    }

    return { dadosCavidades, dadosGrade };
  }

  // ---- Tela principal (grades abertas) --------------------------------------

  async function montarCards() {
    const grades = await persistencia.listarGrades();
    return grades
      .filter((g) => !(g.dadosGrade && g.dadosGrade.publicado))
      .map((g) => {
        const molde = acharMolde(g.moldeId);
        const dadosGrade = dadosGradeDoMolde(molde, g.dadosGrade);
        const total = molde ? molde.cavidades.length : (g.total || 0);
        const vedadas = g.vedadas || 0;
        return {
          id: g.id,
          moldeCodigo: molde ? molde.codigo : g.moldeId,
          moldeNome: molde ? molde.nomePeca : "(molde não cadastrado)",
          maquina: dadosGrade.maquina || "",
          material: dadosGrade.material || "",
          total: total,
          ativas: Math.max(0, total - vedadas),
          vedadas: vedadas,
          defeitos: g.defeitos || 0,
          abertaEm: g.abertaEm
        };
      });
  }

  async function renderTelaInicial() {
    telaInicial.renderizar(await montarCards());
  }

  async function voltarParaInicial() {
    if (CF.registros && CF.registros.flushAutoSalvar) CF.registros.flushAutoSalvar();
    if (temEdicaoNaoSalva() && !confirm("Há alterações não salvas no formulário. Voltar para as grades?")) {
      return;
    }
    await renderTelaInicial();
    telaInicial.mostrar();
  }

  // ---- Abrir / carregar grade ----------------------------------------------

  async function criarEAbrirGrade(moldeId, config) {
    if (CF.seguranca && !CF.seguranca.permite("abrirMolde")) {
      mostrarToast("error", "Permissao", "Seu papel nao pode abrir grade.");
      return;
    }
    const molde = acharMolde(moldeId);
    if (!molde) { mostrarToast("error", "Molde não encontrado", String(moldeId)); return; }
    try {
      const grade = await persistencia.criarGrade(moldeId, config);
      let persistido = grade;

      if (config) {
        const dadosGrade = aplicarConfigNaGrade(grade.dadosGrade, config);
        await persistencia.salvarGrade(grade.id, grade.moldeId, {}, dadosGrade);
        persistido = {
          id: grade.id,
          moldeId: grade.moldeId,
          dadosGrade: dadosGrade,
          dadosCavidades: {}
        };
      }

      await carregarGradeInterno(grade, persistido);
      mostrarToast("success", "Grade criada", "A grade foi criada e aberta.");
    } catch (e) {
      console.error(e);
      mostrarToast("error", "Falha ao criar grade", descreverErro(e));
    }
  }

  async function abrirGrade(gradeId) {
    try {
      const grade = await persistencia.carregarGrade(gradeId);
      if (!grade) { mostrarToast("error", "Grade não encontrada", "Atualize a lista e tente novamente."); return; }
      await carregarGradeInterno(grade, grade);
    } catch (e) {
      console.error("Falha ao carregar grade:", e);
      mostrarToast("error", "Falha ao carregar grade", descreverErro(e));
    }
  }

  async function carregarGradeInterno(grade, persistidoCarregado) {
    const token = ++estado.loadToken;
    mostrarCarregando("Carregando grade...");

    try {
      const molde = acharMolde(grade.moldeId);
      if (!molde) throw new Error("Molde não cadastrado: " + grade.moldeId);

      const [layoutBruto, formas, desenhos, persistido] = await Promise.all([
        cfg.carregarLayout(molde.layoutId),
        cfg.carregarFormas(),
        cfg.carregarDesenhos(),
        persistidoCarregado ? Promise.resolve(persistidoCarregado) : persistencia.carregarGrade(grade.id)
      ]);
      if (token !== estado.loadToken) return;

      estado.formas = formas;
      estado.desenhos = desenhos;
      const desenho = desenhos[molde.desenhoId] || null;
      const ids = molde.cavidades.map(String);
      const modelo = normalizarLayout(layoutBruto, ids);
      const dados = inicializarDados(molde, persistido, grade);

      estado.gradeAtual = grade;
      estado.molde = molde;
      estado.layout = layoutBruto;
      estado.modelo = modelo;
      estado.desenho = desenho;
      estado.dadosCavidades = dados.dadosCavidades;
      estado.dadosGrade = dados.dadosGrade;
      estado.selecionadas = [];

      const blocosTabela = (layoutBruto.tabela && layoutBruto.tabela.blocos) || 2;
      estado.blocosTabela = dividir(ids, blocosTabela);

      estado.blocosImpressao = calcularBlocosImpressao(ids, layoutBruto.impressao);

      telaInicial.esconder();
      aplicarGrade();
      criarOpcoesCavidades(ids);
      montarTabela();
      montarDiagrama(modelo, estado.formas);
      atualizarResumo();
      aplicarDesenho(desenho);
      limparFormulario();
      sincronizarFormulario();
      atualizarSelecao();
      esconderAviso();

      mostrarCarregando("Molde " + molde.codigo + " · " + ids.length + " cavidades");
    } catch (e) {
      if (token !== estado.loadToken) return;
      console.error(e);
      mostrarCarregando("");
      mostrarAviso("Não foi possível abrir a grade do molde \"" + grade.moldeId + "\": " + e.message + " — Layout indisponível ou ainda não validado.");
    }
  }

  let promessaLibsPdf = null;

  function carregarScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Falha ao carregar " + src));
      document.head.appendChild(script);
    });
  }

  function carregarLibsPdf() {
    if (window.htmlToImage && window.jspdf && window.jspdf.jsPDF) {
      return Promise.resolve();
    }
    if (!promessaLibsPdf) {
      const base = (estado.contextPath || "") + "/js/lib/";
      promessaLibsPdf = carregarScript(base + "html-to-image.js?v=20261112a")
        .then(() => carregarScript(base + "jspdf.umd.min.js?v=20261112a"))
        .catch((e) => {
          promessaLibsPdf = null;
          throw e;
        });
    }
    return promessaLibsPdf;
  }

  function prepararImagensFolha(folha) {
    const imagens = Array.from(folha.querySelectorAll("img"));
    return Promise.all(imagens.map((img) => new Promise((resolve) => {
      let concluido = false;
      const finalizar = () => {
        if (concluido) return;
        concluido = true;
        img.removeEventListener("load", finalizar);
        img.removeEventListener("error", finalizar);
        if (!img.naturalWidth) {
          img.src = IMAGEM_VAZIA;
          img.style.display = "none";
        }
        resolve();
      };
      const src = img.getAttribute("src");
      if (!src || !src.trim()) {
        img.src = IMAGEM_VAZIA;
        img.style.display = "none";
        resolve();
        return;
      }
      if (img.complete) {
        finalizar();
        return;
      }
      img.addEventListener("load", finalizar, { once: true });
      img.addEventListener("error", finalizar, { once: true });
      window.setTimeout(finalizar, 4000);
    })));
  }

  async function gerarPdfGrade(folha) {
    await carregarLibsPdf();
    if (!window.htmlToImage || !window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("Bibliotecas de PDF não carregadas.");
    }
    const pai = folha.parentNode;
    const proximo = folha.nextSibling;
    const estiloOriginal = folha.getAttribute("style");
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-10000px";
    wrapper.style.top = "0";
    wrapper.style.zIndex = "-1";
    wrapper.style.background = "#fff";
    pai.insertBefore(wrapper, folha);
    wrapper.appendChild(folha);
    folha.style.display = "flex";
    try {
      await prepararImagensFolha(folha);
      const imagem = await window.htmlToImage.toJpeg(folha, {
        quality: 0.92,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true
      });
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const margem = 8;
      const largura = pdf.internal.pageSize.getWidth() - margem * 2;
      const altura = pdf.internal.pageSize.getHeight() - margem * 2;
      pdf.addImage(imagem, "JPEG", margem, margem, largura, altura);
      return pdf.output("datauristring");
    } finally {
      pai.insertBefore(folha, proximo);
      wrapper.remove();
      if (estiloOriginal === null) folha.removeAttribute("style");
      else folha.setAttribute("style", estiloOriginal);
    }
  }

  function abrirModalPublicacao() {
    if (CF.seguranca && !CF.seguranca.permite("abrirMolde")) {
      mostrarToast("error", "Permissao", "Seu papel nao pode publicar a grade.");
      return;
    }
    if (!estado.gradeAtual || !estado.molde) {
      mostrarToast("error", "Publicação", "Nenhuma grade aberta.");
      return;
    }
    const modal = el("modalPublicarGrade");
    if (!modal) return;
    const observacao = el("publicacaoObservacao");
    if (observacao) observacao.value = "";
    modal.querySelectorAll('input[name="statusPublicacao"]').forEach((radio) => {
      radio.checked = false;
    });
    const erro = el("publicacaoErro");
    if (erro) {
      erro.textContent = "";
      erro.hidden = true;
    }
    const btnConfirmar = el("btnConfirmarPublicacao");
    if (btnConfirmar) btnConfirmar.disabled = true;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    const primeiro = modal.querySelector('input[name="statusPublicacao"]');
    if (primeiro) primeiro.focus();
  }

  function fecharModalPublicacao() {
    const modal = el("modalPublicarGrade");
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }

  function statusPublicacaoSelecionado() {
    const marcado = document.querySelector('input[name="statusPublicacao"]:checked');
    return marcado ? marcado.value : "";
  }

  function mostrarPublicacaoCarregando(ativo, titulo, texto) {
    const overlay = el("publicacaoOverlay");
    if (!overlay) return;
    if (titulo) {
      const tituloEl = el("publicacaoLoadingTitulo");
      if (tituloEl) tituloEl.textContent = titulo;
    }
    if (texto) {
      const textoEl = el("publicacaoLoadingTexto");
      if (textoEl) textoEl.textContent = texto;
    }
    overlay.classList.toggle("active", !!ativo);
    overlay.setAttribute("aria-hidden", ativo ? "false" : "true");
    document.body.classList.toggle("publicando", !!ativo);
  }

  function iniciarModalPublicacao() {
    const modal = el("modalPublicarGrade");
    if (!modal) return;
    const btnConfirmar = el("btnConfirmarPublicacao");
    const btnCancelar = el("btnCancelarPublicacao");
    const erro = el("publicacaoErro");

    modal.querySelectorAll('input[name="statusPublicacao"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (btnConfirmar) btnConfirmar.disabled = false;
        if (erro) {
          erro.textContent = "";
          erro.hidden = true;
        }
      });
    });

    if (btnCancelar) btnCancelar.addEventListener("click", fecharModalPublicacao);

    if (btnConfirmar) {
      btnConfirmar.addEventListener("click", () => {
        const status = statusPublicacaoSelecionado();
        if (!status) {
          if (erro) {
            erro.textContent = "Selecione o status da publicação.";
            erro.hidden = false;
          }
          return;
        }
        const observacao = el("publicacaoObservacao");
        fecharModalPublicacao();
        publicarGrade(status, observacao ? observacao.value.trim() : "");
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) fecharModalPublicacao();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("active")) {
        fecharModalPublicacao();
      }
    });
  }

  async function publicarGrade(status, observacao) {
    if (CF.seguranca && !CF.seguranca.permite("abrirMolde")) {
      mostrarToast("error", "Permissao", "Seu papel nao pode publicar a grade.");
      return;
    }
    if (!estado.gradeAtual || !estado.molde) {
      mostrarToast("error", "Publicação", "Nenhuma grade aberta.");
      return;
    }
    const rotuloStatus = STATUS_PUBLICACAO[status];
    if (!rotuloStatus) {
      mostrarToast("error", "Publicação", "Selecione o status da publicação.");
      return;
    }
    if (!estado.dadosGrade) estado.dadosGrade = {};
    estado.dadosGrade.statusPublicacao = status;
    estado.dadosGrade.statusPublicacaoLabel = rotuloStatus;
    estado.dadosGrade.observacaoPublicacao = observacao || "";

    if (CF.registros && CF.registros.flushAutoSalvar) CF.registros.flushAutoSalvar();
    persistencia.persistirAtual();

    var cl = (estado.dadosGrade && estado.dadosGrade.checklist) || {};
    const btn = document.getElementById("btnPublicarGrade");
    if (btn) btn.disabled = true;
    mostrarPublicacaoCarregando(true, "Publicando grade...", "Salvando os dados da grade.");
    try {
      await persistencia.flush();
      const codigo = estado.molde.codigo;
      // monta a folha de impressao (A4) antes de capturar o HTML
      if (CF.impressao && typeof CF.impressao.montarFolhaImpressao === "function") {
        CF.impressao.montarFolhaImpressao();
      }
      const folha = document.getElementById("folhaImpressao");
      if (!folha) {
        throw new Error("Folha de impressao nao encontrada.");
      }
      mostrarPublicacaoCarregando(true, "Publicando grade...", "Gerando o PDF da grade.");
      const pdfBase64 = await gerarPdfGrade(folha);
      const ctx = estado.contextPath || "";
      mostrarPublicacaoCarregando(true, "Publicando grade...", "Enviando o documento ao GED. Aguarde.");
      const resp = await fetch(ctx + "/api/moldes/" + encodeURIComponent(codigo) + "/publicar-ged", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: "grade-" + codigo + ".pdf",
          fileBytes: pdfBase64,
          statusPublicacao: status,
          observacaoPublicacao: estado.dadosGrade.observacaoPublicacao,
          maquina: (estado.dadosGrade && estado.dadosGrade.maquina) || "",
          dataAbertura: (estado.dadosGrade && estado.dadosGrade.dataEntrada) || "",
          controlador: (estado.dadosGrade && (estado.dadosGrade.controladorAbertura || (cl && cl.controlador))) || "",
          situacaoChecklist: cl.situacao || "",
          statusChecklist: cl.status || "",
          observacaoChecklist: cl.observacoes || "",
          clRebarbas: cl.pontos ? (cl.pontos["REBARBAS"] || "") : "",
          clManchas: cl.pontos ? (cl.pontos["MANCHAS"] || "") : "",
          clOutrosAspectosVisuais: cl.pontos ? (cl.pontos["OUTROS ASPECTOS VISUAIS"] || "") : "",
          clDimensional: cl.pontos ? (cl.pontos["DIMENSIONAL"] || "") : "",
          clEstanqueidade: cl.pontos ? (cl.pontos["ESTANQUEIDADE"] || "") : "",
          clFurosAntiasfixiantes: cl.pontos ? (cl.pontos["FUROS ANTIASFIXIANTES DESOBSTRUÍDOS"] || "") : ""
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) {
        throw new Error(data.erro || ("HTTP " + resp.status));
      }
      // marca a grade como publicada/encerrada
      if (estado.gradeAtual && estado.gradeAtual.id) {
        const g = await persistencia.carregarGrade(estado.gradeAtual.id);
        if (g) {
          const dados = Object.assign({}, g.dadosGrade || {}, {
            publicado: true,
            dataPublicacao: new Date().toISOString().slice(0, 10),
            statusPublicacao: status,
            statusPublicacaoLabel: rotuloStatus,
            observacaoPublicacao: estado.dadosGrade.observacaoPublicacao
          });
          await persistencia.salvarGrade(
            g.id,
            g.moldeId || estado.gradeAtual.moldeId,
            estado.dadosCavidades || g.dadosCavidades || {},
            dados);
        }
      }
      mostrarPublicacaoCarregando(false);
      try {
        await voltarParaInicial();
      } catch (e) {
        console.error("Grade publicada, mas não foi possível voltar à lista:", e);
        mostrarToast("error", "Grade publicada", "Não foi possível atualizar a lista de grades.");
      }
      mostrarToast("success", "Publicado no GED",
        data.code ? "Documento " + data.code + " criado com sucesso." : "Grade publicada no GED com sucesso.");
    } catch (e) {
      mostrarPublicacaoCarregando(false);
      console.error("Falha ao publicar no GED", e);
      mostrarToast("error", "Falha na publicação", descreverErro(e));
    } finally {
      mostrarPublicacaoCarregando(false);
      if (btn) btn.disabled = false;
    }
  }

  async function iniciar() {
    const body = document.body;
    estado.contextPath = body.dataset.context || "";
    estado.onDetalhes = abrirDetalhes;

    initFormulario();
    initGrade();
    initModal();
    initRegistros();
    initImpressao();
    iniciarModalPublicacao();
    const btnPublicar = el("btnPublicarGrade");
    if (btnPublicar) btnPublicar.addEventListener("click", abrirModalPublicacao);
    if (CF.visualizador3d && CF.visualizador3d.init) {
      CF.visualizador3d.init();
    }
    telaInicial.init({ onAbrirGrade: abrirGrade, onAbrirMolde: criarEAbrirGrade });

    const btnVoltar = el("btnVoltar");
    if (btnVoltar) btnVoltar.addEventListener("click", voltarParaInicial);

    const campoData = el("data");
    if (campoData) campoData.value = estado.hoje;

    telaInicial.mostrar();
    if (telaInicial.carregando) telaInicial.carregando();

    // Moldes + grades são o mínimo para desenhar os cards. Os demais catálogos
    // só são usados ao abrir uma grade/modal e carregam em segundo plano.
    const cargaPrincipal = Promise.all([
      cfg.carregarMoldes(),
      persistencia.listarGrades()
    ]);
    let modelos3d = null;
    const aplicarModelos3d = () => {
      if (!modelos3d || !estado.moldes || !estado.moldes.length) return;
      estado.moldes.forEach((molde) => {
        molde.modelo3d = cfg.resolverModelo3d(molde, modelos3d);
      });
    };
    const cargaSecundaria = Promise.all([
      cfg.carregarMaquinas(),
      cfg.carregarFormas(),
      cfg.carregarDesenhos(),
      cfg.carregarModelos3d()
    ]).then(([maquinas, formas, desenhos, modelos]) => {
      estado.maquinas = maquinas;
      estado.formas = formas;
      estado.desenhos = desenhos;
      modelos3d = modelos;
      aplicarModelos3d();
    }).catch((e) => {
      console.warn("Falha ao carregar catálogos secundários: " + e.message);
    });
    const migracao = persistencia.migrarLocalStorage().catch((e) => {
      console.warn("Falha ao migrar o localStorage para o SQLite: " + e.message);
      return 0;
    });

    try {
      const [moldes] = await cargaPrincipal;
      estado.moldes = moldes;
      aplicarModelos3d();
      const migradas = await migracao;
      if (migradas) console.info("Grades migradas do localStorage para o SQLite: " + migradas);
      await renderTelaInicial();
    } catch (e) {
      console.error(e);
      if (telaInicial.carregando) {
        telaInicial.carregando("Não foi possível carregar as grades: " + e.message);
      }
    } finally {
      telaInicial.mostrar();
    }

    void cargaSecundaria;
  }

  CF.app = {
    abrirGrade: abrirGrade,
    criarEAbrirGrade: criarEAbrirGrade,
    voltarParaInicial: voltarParaInicial,
    montarCards: montarCards,
    renderTelaInicial: renderTelaInicial,
    mostrarToast: mostrarToast
  };

  iniciar();

})(window.CF = window.CF || {});
