"use strict";

(function (CF) {

  const { estado, compararId } = CF.estado;

  let onAbrirGrade = null;
  let onAbrirMolde = null;
  let modoCadastro = "criar";
  let gradesAbertas = [];
  let gradeExclusaoPendente = null;

  function init(opts) {
    const o = opts || {};
    onAbrirGrade = o.onAbrirGrade || null;
    onAbrirMolde = o.onAbrirMolde || null;

    const filtroGrades = document.getElementById("filtroGrades");
    if (filtroGrades) filtroGrades.addEventListener("input", atualizarListaGrades);
    const ordenarGrades = document.getElementById("ordenarGrades");
    if (ordenarGrades) ordenarGrades.addEventListener("change", atualizarListaGrades);

    const btnAbrir = document.getElementById("btnAbrirGrade");
    if (btnAbrir) btnAbrir.addEventListener("click", abrirModal);

    const btnCadastrar = document.getElementById("btnCadastrarMolde");
    if (btnCadastrar) btnCadastrar.addEventListener("click", () => abrirModalCadastro("criar"));
    const btnEditarMolde = document.getElementById("btnEditarMolde");
    if (btnEditarMolde) btnEditarMolde.addEventListener("click", () => abrirModalCadastro("editar"));

    registrarCombobox("cadMoldeEdit", {
      rootId: "comboCadMoldeEdit",
      buscaId: "cadMoldeEditBusca",
      listaId: "listaComboCadMoldeEdit",
      toggleId: "toggleComboCadMoldeEdit",
      hiddenId: "cadMoldeEditCodigo",
      rotuloVazio: "Digite para filtrar ou escolher o molde",
      mensagemVazia: "Nenhum molde cadastrado",
      onChange: onMoldeCadastroSelecionado
    });
    registrarCombobox("cadMaquina", {
      rootId: "comboCadMaquina",
      buscaId: "cadMaquinaBusca",
      listaId: "listaComboCadMaquinas",
      toggleId: "toggleComboCadMaquina",
      hiddenId: "cadMaquina",
      rotuloVazio: "Digite para filtrar ou escolher",
      mensagemVazia: "Nenhuma máquina cadastrada",
      onChange: () => {}
    });

    registrarUpload("cadGradeSvg", "cadGradeSvgNome", "cadGradeSvgPreview", "Selecionar SVG da grade");
    registrarUpload("cadImagem", "cadImagemNome", "cadImagemPreview", "Selecionar desenho");
    registrarUpload("cadArquivoCad", "cadArquivoCadNome", "cadArquivoCadPreview", "Selecionar arquivo 3D/Solid");
    limparPreviewsCadastro();

    const btnCancelarCad = document.getElementById("btnCancelarCadMolde");
    if (btnCancelarCad) btnCancelarCad.addEventListener("click", fecharModalCadastro);
    const btnConfirmarCad = document.getElementById("btnConfirmarCadMolde");
    if (btnConfirmarCad) btnConfirmarCad.addEventListener("click", confirmarCadastro);
    const btnExcluirCad = document.getElementById("btnExcluirCadMolde");
    if (btnExcluirCad) btnExcluirCad.addEventListener("click", pedirExclusaoMolde);
    const overlayCad = document.getElementById("modalCadastrarMolde");
    if (overlayCad) overlayCad.addEventListener("click", (e) => { if (e.target.id === "modalCadastrarMolde") fecharModalCadastro(); });

    const btnCancelarExclusao = document.getElementById("btnCancelarExclusao");
    if (btnCancelarExclusao) btnCancelarExclusao.addEventListener("click", fecharConfirmacaoExclusao);
    const btnConfirmarExclusao = document.getElementById("btnConfirmarExclusao");
    if (btnConfirmarExclusao) btnConfirmarExclusao.addEventListener("click", confirmarExclusaoMolde);
    const overlayExcluir = document.getElementById("modalConfirmarExclusao");
    if (overlayExcluir) overlayExcluir.addEventListener("click", (e) => { if (e.target.id === "modalConfirmarExclusao") fecharConfirmacaoExclusao(); });

    const btnCancelarExclusaoGrade = document.getElementById("btnCancelarExclusaoGrade");
    if (btnCancelarExclusaoGrade) btnCancelarExclusaoGrade.addEventListener("click", fecharConfirmacaoExclusaoGrade);
    const btnConfirmarExclusaoGrade = document.getElementById("btnConfirmarExclusaoGrade");
    if (btnConfirmarExclusaoGrade) btnConfirmarExclusaoGrade.addEventListener("click", confirmarExclusaoGrade);
    const overlayExcluirGrade = document.getElementById("modalConfirmarExclusaoGrade");
    if (overlayExcluirGrade) overlayExcluirGrade.addEventListener("click", (e) => {
      if (e.target.id === "modalConfirmarExclusaoGrade") fecharConfirmacaoExclusaoGrade();
    });

    const btnCancelar = document.getElementById("btnCancelarAbrir");
    if (btnCancelar) btnCancelar.addEventListener("click", fecharModal);

    const btnConfirmar = document.getElementById("btnConfirmarAbrir");
    if (btnConfirmar) btnConfirmar.addEventListener("click", confirmarAbrir);

    registrarCombobox("molde", {
      rootId: "comboMolde",
      buscaId: "selMoldeBusca",
      listaId: "listaComboMoldes",
      toggleId: "toggleComboMolde",
      hiddenId: "selMolde",
      rotuloVazio: "Digite para filtrar ou escolher um molde",
      mensagemVazia: "Nenhum molde cadastrado",
      onChange: onMoldeSelecionado
    });

    registrarCombobox("maquina", {
      rootId: "comboMaquina",
      buscaId: "selMaquinaBusca",
      listaId: "listaComboMaquinas",
      toggleId: "toggleComboMaquina",
      hiddenId: "selMaquina",
      rotuloVazio: "Digite para filtrar ou escolher uma máquina",
      mensagemVazia: "Nenhuma máquina cadastrada",
      onChange: onMaquinaSelecionada
    });

    const cavidadesTotal = document.getElementById("cavidadesTotal");
    if (cavidadesTotal) cavidadesTotal.addEventListener("input", function () {
      validarCavidades(false);
      limparErro();
    });

    const cavidadesAtivas = document.getElementById("cavidadesAtivas");
    if (cavidadesAtivas) cavidadesAtivas.addEventListener("input", function () {
      validarCavidades(false);
      limparErro();
    });

    const materiaPrima = document.getElementById("materiaPrima");
    if (materiaPrima) materiaPrima.addEventListener("input", limparErro);

    const overlay = document.getElementById("modalAbrirGrade");
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target.id === "modalAbrirGrade") fecharModal();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        fecharModal();
        fecharConfirmacaoExclusaoGrade();
        fecharMenusGrade();
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".gc-opcoes")) fecharMenusGrade();
    });
  }

  function onMoldeSelecionado(valor) {
    preencherDadosMolde(valor);
  }

  function onMaquinaSelecionada() {
    limparErro();
  }

  function mostrar() {
    const ti = document.getElementById("telaInicial");
    const tg = document.getElementById("telaGrade");
    if (ti) ti.style.display = "block";
    if (tg) tg.style.display = "none";
    window.scrollTo(0, 0);
  }

  function esconder() {
    const ti = document.getElementById("telaInicial");
    const tg = document.getElementById("telaGrade");
    if (ti) ti.style.display = "none";
    if (tg) tg.style.display = "";
  }

  function carregando(texto) {
    const cont = document.getElementById("listaGrades");
    const vazio = document.getElementById("gradesVazio");
    if (vazio) vazio.style.display = "none";
    if (!cont) return;
    cont.innerHTML = "";
    const aviso = document.createElement("div");
    aviso.className = "grades-carregando";
    aviso.textContent = texto || "Carregando grades...";
    cont.appendChild(aviso);
  }

  function renderizar(cards) {
    if (Array.isArray(cards)) gradesAbertas = cards.slice();
    atualizarListaGrades();
  }

  function atualizarListaGrades() {
    const cont = document.getElementById("listaGrades");
    const vazio = document.getElementById("gradesVazio");
    const contador = document.getElementById("gradesContador");
    if (!cont) return;

    cont.innerHTML = "";
    const filtro = normalizarTexto((document.getElementById("filtroGrades") || {}).value || "");
    const ordenacao = (document.getElementById("ordenarGrades") || {}).value || "abertura-recente";
    const lista = gradesAbertas
      .filter((card) => correspondeAoFiltro(card, filtro))
      .map((card, indice) => ({ card: card, indice: indice }))
      .sort((a, b) => compararCards(a.card, b.card, ordenacao) || a.indice - b.indice)
      .map((item) => item.card);

    if (contador) {
      const total = gradesAbertas.length;
      contador.textContent = filtro
        ? lista.length + " de " + total + (total === 1 ? " grade ativa" : " grades ativas")
        : lista.length === 1 ? "1 grade ativa" : lista.length + " grades ativas";
      contador.classList.toggle("zero", lista.length === 0);
    }
    if (!lista.length) {
      if (vazio) {
        vazio.style.display = "block";
        const mensagem = document.getElementById("gradesVazioMensagem");
        const ajuda = document.getElementById("gradesVazioAjuda");
        const semGrades = gradesAbertas.length === 0;
        if (mensagem) mensagem.textContent = semGrades
          ? "Nenhuma grade aberta no momento."
          : "Nenhuma grade corresponde ao filtro.";
        if (ajuda) ajuda.style.display = semGrades ? "" : "none";
      }
      return;
    }
    if (vazio) vazio.style.display = "none";
    lista.forEach((c) => cont.appendChild(cardEl(c)));
  }

  function correspondeAoFiltro(card, filtro) {
    if (!filtro) return true;
    const situacao = (card.defeitos || 0) > 0 || (card.vedadas || 0) > 0
      ? "com ocorrencias"
      : "ativa";
    const valores = [
      card.moldeCodigo,
      card.moldeNome,
      card.maquina,
      card.material,
      situacao,
      card.abertaEm,
      formatarData(card.abertaEm)
    ];
    return valores.some((valor) => normalizarTexto(valor).includes(filtro));
  }

  function compararCards(a, b, ordenacao) {
    if (ordenacao === "molde-az") return compararTexto(a.moldeCodigo, b.moldeCodigo);
    if (ordenacao === "peca-az") return compararTexto(a.moldeNome, b.moldeNome);

    const dataA = obterTimestamp(a.abertaEm);
    const dataB = obterTimestamp(b.abertaEm);
    if (dataA === null && dataB !== null) return 1;
    if (dataA !== null && dataB === null) return -1;
    if (dataA === null && dataB === null) return 0;
    return ordenacao === "abertura-antiga" ? dataA - dataB : dataB - dataA;
  }

  function compararTexto(a, b) {
    return String(a || "").localeCompare(String(b || ""), "pt-BR", {
      numeric: true,
      sensitivity: "base"
    });
  }

  function obterTimestamp(valor) {
    if (!valor) return null;
    const timestamp = new Date(valor).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  function normalizarTexto(valor) {
    return String(valor == null ? "" : valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();
  }

  function cardEl(c) {
    const card = document.createElement("article");
    card.className = "grade-card";
    card.dataset.id = c.id;
    card.setAttribute("tabindex", "0");

    const top = document.createElement("div");
    top.className = "gc-top";

    const molde = document.createElement("span");
    molde.className = "gc-molde";
    molde.textContent = "Molde " + c.moldeCodigo;

    const comDefeito = (c.defeitos || 0) > 0 || (c.vedadas || 0) > 0;
    if (comDefeito) card.classList.add("com-defeito");

    const status = document.createElement("span");
    status.className = "gc-status" + (comDefeito ? " com-defeito" : "");
    status.textContent = comDefeito ? "Com ocorrências" : "Ativa";

    const acoes = document.createElement("div");
    acoes.className = "gc-top-acoes";
    acoes.appendChild(status);
    if (CF.seguranca && CF.seguranca.permite("excluirGrade")) {
      const opcoes = document.createElement("div");
      opcoes.className = "gc-opcoes";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "gc-opcoes-toggle";
      toggle.setAttribute("aria-label", "Opções da grade");
      toggle.setAttribute("aria-haspopup", "menu");
      toggle.setAttribute("aria-expanded", "false");
      toggle.title = "Opções da grade";
      toggle.textContent = "⋮";

      const menu = document.createElement("div");
      menu.className = "gc-opcoes-menu";
      menu.setAttribute("role", "menu");
      menu.hidden = true;
      const excluir = document.createElement("button");
      excluir.type = "button";
      excluir.className = "gc-opcoes-item";
      excluir.setAttribute("role", "menuitem");
      excluir.textContent = "Excluir grade";
      excluir.addEventListener("click", (e) => {
        e.stopPropagation();
        fecharMenusGrade();
        pedirExclusaoGrade(c);
      });

      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const abrirMenu = menu.hidden;
        fecharMenusGrade();
        menu.hidden = !abrirMenu;
        toggle.setAttribute("aria-expanded", String(abrirMenu));
      });
      toggle.addEventListener("keydown", (e) => e.stopPropagation());
      excluir.addEventListener("keydown", (e) => e.stopPropagation());
      menu.appendChild(excluir);
      opcoes.appendChild(toggle);
      opcoes.appendChild(menu);
      acoes.appendChild(opcoes);
    }

    top.appendChild(molde);
    top.appendChild(acoes);
    card.appendChild(top);

    const nome = document.createElement("div");
    nome.className = "gc-nome";
    nome.textContent = c.moldeNome || "";
    card.appendChild(nome);

    const chips = document.createElement("div");
    chips.className = "gc-chips";
    chips.appendChild(chipEl(c.maquina || "Máquina não informada", false));
    chips.appendChild(chipEl("Material: " + (c.material || "—"), true));
    card.appendChild(chips);

    const stats = document.createElement("div");
    stats.className = "gc-stats";
    stats.appendChild(statEl(c.ativas, "Ativas", ""));
    stats.appendChild(statEl(c.defeitos || 0, "Defeitos", "gc-def"));
    stats.appendChild(statEl(c.vedadas, "Vedadas", "gc-ved"));
    card.appendChild(stats);

    const abrir = document.createElement("div");
    abrir.className = "gc-abrir";

    const aberta = document.createElement("span");
    aberta.className = "gc-aberta";
    aberta.textContent = formatarData(c.abertaEm);
    abrir.appendChild(aberta);

    const acaoTxt = document.createElement("span");
    acaoTxt.textContent = "Abrir grade";
    const seta = document.createElement("span");
    seta.className = "gc-seta";
    seta.textContent = "›";
    acaoTxt.appendChild(seta);
    abrir.appendChild(acaoTxt);
    card.appendChild(abrir);

    const acao = () => { if (onAbrirGrade) onAbrirGrade(c.id); };
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".gc-opcoes")) acao();
    });
    card.addEventListener("keydown", (e) => {
      if (e.target.closest(".gc-opcoes")) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); acao(); }
    });

    return card;
  }

  function fecharMenusGrade() {
    document.querySelectorAll(".gc-opcoes-menu:not([hidden])").forEach((menu) => {
      menu.hidden = true;
      const toggle = menu.parentElement && menu.parentElement.querySelector(".gc-opcoes-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  }

  function pedirExclusaoGrade(grade) {
    if (!CF.seguranca || !CF.seguranca.permite("excluirGrade")) {
      if (CF.app && CF.app.mostrarToast) {
        CF.app.mostrarToast("error", "Permissão", "Seu papel não pode excluir grades.");
      }
      return;
    }
    gradeExclusaoPendente = grade;
    const msg = document.getElementById("confirmarExclusaoGradeMsg");
    if (msg) {
      msg.textContent = "Excluir a grade do molde " + grade.moldeCodigo
        + " (" + grade.moldeNome + ")? Os registros associados também serão excluídos. Essa ação não pode ser desfeita.";
    }
    const overlay = document.getElementById("modalConfirmarExclusaoGrade");
    if (overlay) {
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");
    }
  }

  function fecharConfirmacaoExclusaoGrade() {
    gradeExclusaoPendente = null;
    const overlay = document.getElementById("modalConfirmarExclusaoGrade");
    if (overlay) {
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
    }
  }

  async function confirmarExclusaoGrade() {
    if (!CF.seguranca || !CF.seguranca.permite("excluirGrade")) {
      fecharConfirmacaoExclusaoGrade();
      if (CF.app && CF.app.mostrarToast) {
        CF.app.mostrarToast("error", "Permissão", "Seu papel não pode excluir grades.");
      }
      return;
    }
    const grade = gradeExclusaoPendente;
    if (!grade) return;

    const btn = document.getElementById("btnConfirmarExclusaoGrade");
    if (btn) btn.disabled = true;
    try {
      if (!CF.persistencia || typeof CF.persistencia.removerGrade !== "function") {
        throw new Error("Serviço de exclusão de grades indisponível.");
      }
      await CF.persistencia.removerGrade(grade.id);
      fecharConfirmacaoExclusaoGrade();
      if (CF.app && typeof CF.app.renderTelaInicial === "function") {
        try {
          await CF.app.renderTelaInicial();
        } catch (e) {
          if (CF.app.mostrarToast) {
            CF.app.mostrarToast("error", "Grade excluída", "A grade foi excluída, mas a lista não pôde ser atualizada. Recarregue a página.");
          }
          return;
        }
      }
      if (CF.app && CF.app.mostrarToast) {
        CF.app.mostrarToast("success", "Grade excluída", "A grade foi removida.");
      }
    } catch (e) {
      if (CF.app && CF.app.mostrarToast) {
        CF.app.mostrarToast("error", "Falha ao excluir grade", e && e.message ? e.message : String(e));
      } else {
        alert("Falha ao excluir grade: " + (e && e.message ? e.message : e));
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function chipEl(texto, muted) {
    const span = document.createElement("span");
    span.className = "gc-chip" + (muted ? " gc-chip-muted" : "");
    span.textContent = texto;
    return span;
  }

  function formatarData(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    try {
      return "Aberta em " + d.toLocaleDateString("pt-BR") + " · " +
        d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "Aberta em " + d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
    }
  }

  function statEl(valor, rotulo, classe) {
    const div = document.createElement("div");
    div.className = "gc-stat " + (classe || "");
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = valor;
    const lbl = document.createElement("span");
    lbl.className = "lbl";
    lbl.textContent = rotulo;
    div.appendChild(num);
    div.appendChild(lbl);
    return div;
  }

  function hojeISO() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mes + "-" + dia;
  }

  function acharDocumentoMolde(moldeId) {
    return (estado.moldes || []).find((m) => m.id === moldeId) || null;
  }

  function preencherDadosMolde(moldeId) {
    const totalEl = document.getElementById("cavidadesTotal");
    const activeEl = document.getElementById("cavidadesAtivas");
    const materialEl = document.getElementById("materiaPrima");
    if (!totalEl || !activeEl || !materialEl) return;

    const molde = moldeId ? acharDocumentoMolde(moldeId) : null;
    const list = molde && Array.isArray(molde.cavidades) ? molde.cavidades : [];
    const total = list.length;

    totalEl.value = total ? String(total) : "";
    activeEl.value = total ? String(total) : "";
    activeEl.max = total ? String(total) : "";
    materialEl.value = molde && molde.padroes && molde.padroes.material
      ? String(molde.padroes.material)
      : "";
    totalEl.removeAttribute("aria-invalid");
    activeEl.removeAttribute("aria-invalid");
    materialEl.removeAttribute("aria-invalid");
  }

  function lerDadosMolde() {
    const totalRaw = String((document.getElementById("cavidadesTotal") || {}).value || "").trim();
    const activeRaw = String((document.getElementById("cavidadesAtivas") || {}).value || "").trim();
    const material = String((document.getElementById("materiaPrima") || {}).value || "").trim();
    const total = /^\d+$/.test(totalRaw) ? parseInt(totalRaw, 10) : NaN;
    const ativas = /^\d+$/.test(activeRaw) ? parseInt(activeRaw, 10) : NaN;
    return { total, ativas, material: material };
  }

  function validarDadosMolde(mostrarErroAoFalhar) {
    const dados = lerDadosMolde();
    const totalEl = document.getElementById("cavidadesTotal");
    const activeEl = document.getElementById("cavidadesAtivas");
    const materialEl = document.getElementById("materiaPrima");
    [totalEl, activeEl, materialEl].forEach((el) => { if (el) el.setAttribute("aria-invalid", "true"); });

    let msg = "";
    if (!Number.isFinite(dados.total) || dados.total < 1) {
      msg = "Informe a quantidade total de cavidades no molde.";
    } else if (!Number.isFinite(dados.ativas) || dados.ativas < 0) {
      msg = "Informe a quantidade de cavidades ativas.";
    } else if (dados.ativas > dados.total) {
      msg = "As cavidades ativas não podem ser maiores que o total do molde.";
    } else if (!dados.material) {
      msg = "Informe a matéria-prima da grade.";
    }

    if (msg) {
      if (mostrarErroAoFalhar) mostrarErro(msg);
      return null;
    }
    if (totalEl) totalEl.removeAttribute("aria-invalid");
    if (activeEl) activeEl.removeAttribute("aria-invalid");
    if (materialEl) materialEl.removeAttribute("aria-invalid");
    return dados;
  }

  // Compatibilidade com a validação incremental dos campos numéricos.
  function validarCavidades(mostrarErroAoFalhar) {
    return !!validarDadosMolde(mostrarErroAoFalhar);
  }

  function abrirModal() {
    if (CF.seguranca && !CF.seguranca.permite("abrirMolde")) {
      if (CF.app && CF.app.mostrarToast) {
        CF.app.mostrarToast("error", "Permissao", "Seu papel nao pode abrir grade.");
      }
      return;
    }
    const overlay = document.getElementById("modalAbrirGrade");
    const buscaMolde = document.getElementById("selMoldeBusca");
    const buscaMaquina = document.getElementById("selMaquinaBusca");
    const dataAbertura = document.getElementById("dataAbertura");
    if (!overlay || !buscaMolde || !buscaMaquina || !dataAbertura) return;

    // --- Moldes cadastrados ---
    definirCombobox("molde",
      (estado.moldes || [])
        .slice()
        .sort((a, b) => compararId(a.codigo, b.codigo))
        .map((m) => ({
          valor: m.id,
          texto: "Molde " + m.codigo + " — " + (m.nomePeca || "") +
            " (" + (m.cavidades || []).length + " cav.)"
        })));

    // --- Máquinas cadastradas ---
    const maquinas = (CF.cfg && CF.cfg.listarMaquinas) ? CF.cfg.listarMaquinas() : [];
    definirCombobox("maquina", maquinas.map((nome) => ({ valor: nome, texto: nome })));

    // --- Dados de entrada do molde (totais, ativas e matéria-prima) ---
    preencherDadosMolde("");

    // --- Data: sempre a data de hoje, editável ---
    const hoje = hojeISO();
    dataAbertura.value = hoje;

    // --- Check-list de validação ---
    montarChecklist();

    // --- Controlador: preenche com o usuário logado ---
    preencherControladorLogado();

    limparErro();
    atualizarBotaoConfirmar();
    overlay.classList.add("active");
    buscaMolde.focus();
  }

  async function preencherControladorLogado() {
    const campo = document.getElementById("clControlador");
    if (!campo) return;
    campo.readOnly = true;
    campo.classList.add("is-readonly");
    campo.value = "";
    const ctx = (document.body && document.body.dataset && document.body.dataset.context) || "/CustomFusionWeb";
    try {
      const resp = await fetch(ctx + "/api/usuario-atual", { cache: "no-store", credentials: "same-origin" });
      const dados = await resp.json().catch(() => ({}));
      const nome = dados && dados.nome ? String(dados.nome) : (dados && dados.login ? String(dados.login) : "");
      if (nome) {
        campo.value = nome;
      }
    } catch (e) {
    }
  }

  const comboboxes = {};

  function normalizarBusca(valor) {
    return String(valor || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function registrarCombobox(nome, config) {
    const root = document.getElementById(config.rootId);
    const busca = document.getElementById(config.buscaId);
    const lista = document.getElementById(config.listaId);
    const toggle = document.getElementById(config.toggleId);
    const hidden = document.getElementById(config.hiddenId);
    if (!root || !busca || !lista || !toggle || !hidden) return;

    const combo = {
      nome: nome,
      root: root,
      busca: busca,
      lista: lista,
      toggle: toggle,
      hidden: hidden,
      itens: [],
      filtrados: [],
      ativo: -1,
      onChange: config.onChange || null,
      rotuloVazio: config.rotuloVazio,
      mensagemVazia: config.mensagemVazia
    };
    comboboxes[nome] = combo;

    busca.addEventListener("input", function () {
      combo.hidden.value = "";
      combo.root.classList.remove("is-invalid");
      filtrarCombobox(nome, busca.value);
      abrirCombobox(nome);

      const exato = acharItemExato(nome, busca.value);
      if (exato) {
        combo.hidden.value = exato.valor;
        if (combo.onChange) combo.onChange(exato.valor, exato, true);
      } else {
        atualizarBotaoConfirmar();
      }
    });

    busca.addEventListener("focus", function () {
      filtrarCombobox(nome, busca.value);
      abrirCombobox(nome);
    });

    busca.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        abrirCombobox(nome);
        moverItemAtivo(nome, e.key === "ArrowDown" ? 1 : -1);
      } else if (e.key === "Enter" && combo.ativo >= 0) {
        e.preventDefault();
        selecionarCombobox(nome, combo.ativo);
      } else if (e.key === "Escape") {
        fecharCombobox(nome);
      } else if (e.key === "Tab") {
        fecharCombobox(nome);
      }
    });

    toggle.addEventListener("click", function () {
      if (toggle.disabled) return;
      const aberto = !lista.hidden;
      if (aberto) {
        fecharCombobox(nome);
      } else {
        filtrarCombobox(nome, busca.value);
        abrirCombobox(nome);
        busca.focus();
      }
    });

    lista.addEventListener("click", function (e) {
      const item = e.target.closest(".combo-item");
      if (!item) return;
      selecionarCombobox(nome, Number(item.dataset.index));
    });

    document.addEventListener("pointerdown", function (e) {
      if (!root.contains(e.target)) fecharCombobox(nome);
    });
  }

  function definirCombobox(nome, opcoes) {
    const combo = comboboxes[nome];
    if (!combo) return;

    combo.itens = (opcoes || []).slice();
    combo.filtrados = combo.itens.slice();
    combo.ativo = -1;
    combo.busca.value = "";
    combo.hidden.value = "";
    combo.hidden.dataset.count = String(combo.itens.length);
    combo.root.classList.toggle("is-disabled", combo.itens.length === 0);
    combo.root.classList.remove("is-invalid");
    combo.busca.disabled = combo.itens.length === 0;
    combo.toggle.disabled = combo.itens.length === 0;
    combo.busca.placeholder = combo.itens.length ? combo.rotuloVazio : combo.mensagemVazia;
    fecharCombobox(nome);
    renderizarCombobox(nome);
  }

  function filtrarCombobox(nome, consulta) {
    const combo = comboboxes[nome];
    if (!combo) return;
    const busca = normalizarBusca(consulta);
    combo.filtrados = !busca
      ? combo.itens.slice()
      : combo.itens.filter((item) => normalizarBusca(item.texto).includes(busca));
    combo.ativo = -1;
    renderizarCombobox(nome);
  }

  function acharItemExato(nome, consulta) {
    const combo = comboboxes[nome];
    if (!combo) return null;
    const busca = normalizarBusca(consulta);
    if (!busca) return null;
    return combo.itens.find((item) => {
      return normalizarBusca(item.texto) === busca || normalizarBusca(item.valor) === busca;
    }) || null;
  }

  function selecionarValorCombobox(nome, valor) {
    const combo = comboboxes[nome];
    if (!combo) return false;
    const alvo = normalizarBusca(valor);
    const item = combo.itens.find((entry) => {
      return normalizarBusca(entry.valor) === alvo || normalizarBusca(entry.texto) === alvo;
    });
    if (!item) return false;
    combo.busca.value = item.texto;
    combo.hidden.value = item.valor;
    combo.root.classList.remove("is-invalid");
    return true;
  }

  function renderizarCombobox(nome) {
    const combo = comboboxes[nome];
    if (!combo) return;
    const lista = combo.lista;
    lista.innerHTML = "";

    if (!combo.filtrados.length) {
      const vazio = document.createElement("div");
      vazio.className = "combo-empty";
      vazio.textContent = combo.busca.value.trim()
        ? "Nenhum resultado para \"" + combo.busca.value.trim() + "\""
        : combo.mensagemVazia;
      lista.appendChild(vazio);
      return;
    }

    combo.filtrados.forEach((item, index) => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "combo-item" + (index === combo.ativo ? " active" : "");
      botao.setAttribute("role", "option");
      botao.dataset.index = String(index);
      botao.textContent = item.texto;
      lista.appendChild(botao);
    });
  }

  function abrirCombobox(nome) {
    const combo = comboboxes[nome];
    if (!combo || combo.busca.disabled) return;
    combo.lista.hidden = false;
    combo.busca.setAttribute("aria-expanded", "true");
  }

  function fecharCombobox(nome) {
    const combo = comboboxes[nome];
    if (!combo) return;
    combo.lista.hidden = true;
    combo.ativo = -1;
    combo.busca.setAttribute("aria-expanded", "false");
    renderizarCombobox(nome);
  }

  function moverItemAtivo(nome, direcao) {
    const combo = comboboxes[nome];
    if (!combo || !combo.filtrados.length) return;
    combo.ativo = (combo.ativo + direcao + combo.filtrados.length) % combo.filtrados.length;
    renderizarCombobox(nome);
    const ativo = combo.lista.querySelector(".combo-item.active");
    if (ativo) ativo.scrollIntoView({ block: "nearest" });
  }

  function selecionarCombobox(nome, index) {
    const combo = comboboxes[nome];
    if (!combo) return;
    const item = combo.filtrados[index];
    if (!item) return;
    combo.busca.value = item.texto;
    combo.hidden.value = item.valor;
    combo.root.classList.remove("is-invalid");
    fecharCombobox(nome);
    if (combo.onChange) combo.onChange(item.valor, item, false);
    atualizarBotaoConfirmar();
  }

  function marcarComboErro(nome, invalido) {
    const combo = comboboxes[nome];
    if (combo) combo.root.classList.toggle("is-invalid", !!invalido);
  }

  function limparCombosErro() {
    Object.keys(comboboxes).forEach((nome) => marcarComboErro(nome, false));
  }

  function atualizarBotaoConfirmar() {
    const btn = document.getElementById("btnConfirmarAbrir");
    const selMolde = document.getElementById("selMolde");
    if (btn) btn.disabled = !selMolde || !selMolde.value;
    limparErro();
  }

  function mostrarErro(msg) {
    const erro = document.getElementById("abrirGradeErro");
    if (!erro) return;
    erro.textContent = msg;
    erro.style.display = "block";
  }

  function limparErro() {
    const erro = document.getElementById("abrirGradeErro");
    if (erro) {
      erro.textContent = "";
      erro.style.display = "none";
    }
    limparCombosErro();
  }

  const PONTOS_CHECKLIST = [
    "REBARBAS",
    "MANCHAS",
    "OUTROS ASPECTOS VISUAIS",
    "DIMENSIONAL",
    "ESTANQUEIDADE",
    "FUROS ANTIASFIXIANTES DESOBSTRUÍDOS"
  ];

  function montarChecklist() {
    const tabela = document.getElementById("clTabela");
    if (!tabela) return;
    tabela.innerHTML = "";
    const cab = document.createElement("div");
    cab.className = "cl-linha cl-cab";
    cab.innerHTML = '<span class="cl-ponto">PONTO VERIFICÁVEL</span>' +
      '<span class="cl-op">C</span><span class="cl-op">NC</span><span class="cl-op">NA</span>';
    tabela.appendChild(cab);
    PONTOS_CHECKLIST.forEach((ponto, idx) => {
      const linha = document.createElement("div");
      linha.className = "cl-linha";
      linha.innerHTML = '<span class="cl-ponto">' + ponto + '</span>' +
        '<label class="cl-op"><input type="radio" name="cl_' + idx + '" value="C"></label>' +
        '<label class="cl-op"><input type="radio" name="cl_' + idx + '" value="NC"></label>' +
        '<label class="cl-op"><input type="radio" name="cl_' + idx + '" value="NA"></label>';
      tabela.appendChild(linha);
    });
  }

  function coletarChecklist() {
    const pontos = {};
    PONTOS_CHECKLIST.forEach((ponto, idx) => {
      const sel = document.querySelector('input[name="cl_' + idx + '"]:checked');
      pontos[ponto] = sel ? sel.value : "";
    });
    return {
      situacao: (document.getElementById("clSituacao") || {}).value || "",
      pontos: pontos,
      controlador: (document.getElementById("clControlador") || {}).value || "",
      observacoes: (document.getElementById("clObservacoes") || {}).value || "",
      status: (document.getElementById("clStatus") || {}).value || ""
    };
  }

  async function confirmarAbrir() {
    if (CF.seguranca && !CF.seguranca.permite("abrirMolde")) {
      if (CF.app && CF.app.mostrarToast) {
        CF.app.mostrarToast("error", "Permissao", "Seu papel nao pode abrir grade.");
      }
      return;
    }
    const selMolde = document.getElementById("selMolde");
    const selMaquina = document.getElementById("selMaquina");
    const buscaMolde = document.getElementById("selMoldeBusca");
    const buscaMaquina = document.getElementById("selMaquinaBusca");
    const dataAbertura = document.getElementById("dataAbertura");
    if (!selMolde || !selMaquina || !dataAbertura) return;

    const moldeId = selMolde.value;
    if (!moldeId) {
      marcarComboErro("molde", true);
      mostrarErro("Selecione o molde para abrir a grade.");
      if (buscaMolde) buscaMolde.focus();
      return;
    }
    marcarComboErro("molde", false);

    const maquina = selMaquina.value;
    const temMaquinas = Number(selMaquina.dataset.count || 0) > 0;
    if (temMaquinas && !maquina) {
      marcarComboErro("maquina", true);
      mostrarErro("Selecione a máquina utilizada neste molde.");
      if (buscaMaquina) buscaMaquina.focus();
      return;
    }
    marcarComboErro("maquina", false);

    // Garante que o controlador de abertura seja o usuário ativo no momento.
    await preencherControladorLogado();

    const dadosMolde = validarDadosMolde(true);
    if (!dadosMolde) {
      const focusTarget = document.getElementById("cavidadesTotal") || document.getElementById("materiaPrima");
      if (focusTarget) focusTarget.focus();
      return;
    }

    const data = dataAbertura.value || hojeISO();

    fecharModal();
    if (onAbrirMolde) {
      onAbrirMolde(moldeId, {
        maquina: maquina,
        dataEntrada: data,
        cavidadesTotais: dadosMolde.total,
        cavidadesAtivas: dadosMolde.ativas,
        materiaPrima: dadosMolde.material,
        checklist: coletarChecklist()
      });
    }
  }

  function fecharModal() {
    const overlay = document.getElementById("modalAbrirGrade");
    if (overlay) overlay.classList.remove("active");
  }

  function abrirModalCadastro(modo) {
    const acao = modo === "editar" ? "editarMolde" : "cadastrarMolde";
    if (CF.seguranca && !CF.seguranca.permite(acao)) {
      if (CF.app && CF.app.mostrarToast) {
        CF.app.mostrarToast("error", "Permissao",
          modo === "editar" ? "Seu papel nao pode editar moldes." : "Seu papel nao pode cadastrar moldes.");
      }
      return;
    }
    const overlay = document.getElementById("modalCadastrarMolde");
    if (!overlay) return;
    modoCadastro = modo === "editar" ? "editar" : "criar";
    resetarFormularioCadastro();
    const editar = modoCadastro === "editar";
    const titulo = document.getElementById("cadMoldeTitulo");
    if (titulo) titulo.textContent = editar ? "Editar molde" : "Cadastrar molde";
    const hint = document.getElementById("cadMoldeHint");
    if (hint) hint.textContent = editar
      ? "Selecione o molde, ajuste os dados/anexos e salve. Deixe anexos em branco para manter os atuais."
      : "Preencha os dados e anexe os arquivos. O SVG da grade abre o diagrama no padrao do molde; o arquivo 3D/Solid e usado na visualizacao e fica anexado ao molde.";
    const bloco = document.getElementById("cadEditarBloco");
    if (bloco) bloco.style.display = editar ? "" : "none";
    const excluir = document.getElementById("btnExcluirCadMolde");
    if (excluir) excluir.style.display = editar ? "" : "none";
    const confirmar = document.getElementById("btnConfirmarCadMolde");
    if (confirmar) confirmar.textContent = editar ? "SALVAR" : "CADASTRAR";
    const codigo = document.getElementById("cadCodigo");
    if (codigo) codigo.readOnly = editar;

    definirCombobox("cadMoldeEdit",
      (estado.moldes || []).map((m) => ({ valor: m.codigo, texto: "Molde " + m.codigo + " - " + (m.nomePeca || "") })));
    const maquinas = (CF.cfg && CF.cfg.listarMaquinas) ? CF.cfg.listarMaquinas() : [];
    definirCombobox("cadMaquina", maquinas.map((nome) => ({ valor: nome, texto: nome })));

    overlay.classList.add("active");
  }

  function fecharModalCadastro() {
    const overlay = document.getElementById("modalCadastrarMolde");
    if (overlay) overlay.classList.remove("active");
  }

  function onMoldeCadastroSelecionado(valor) {
    if (!valor) return;
    const molde = (estado.moldes || []).find((m) => String(m.codigo) === String(valor));
    if (!molde) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v == null ? "" : String(v); };
    set("cadCodigo", molde.codigo);
    set("cadNomePeca", molde.nomePeca);
    set("cadFamilia", molde.familia);
    set("cadCavidades", Array.isArray(molde.cavidades) ? molde.cavidades.length : 0);
    const padroes = molde.padroes || {};
    set("cadMaterial", padroes.material);
    if (!selecionarValorCombobox("cadMaquina", padroes.maquina || "")) {
      if (comboboxes.cadMaquina) comboboxes.cadMaquina.busca.value = padroes.maquina || "";
      const h = document.getElementById("cadMaquina"); if (h) h.value = padroes.maquina || "";
    }
  }

  let codigoExclusaoPendente = null;

  function pedirExclusaoMolde() {
    if (CF.seguranca && !CF.seguranca.permite("editarMolde")) {
      mostrarErroCad("Seu papel nao tem permissao para excluir moldes.");
      return;
    }
    const codigo = ((document.getElementById("cadMoldeEditCodigo") || {}).value || (document.getElementById("cadCodigo") || {}).value || "").trim();
    if (!codigo) { mostrarErroCad("Selecione o molde para excluir."); return; }
    codigoExclusaoPendente = codigo;
    const msg = document.getElementById("confirmarExclusaoMsg");
    if (msg) msg.textContent = "Excluir o molde " + codigo + "? Essa ação remove o cadastro e pode afetar grades vinculadas.";
    const overlay = document.getElementById("modalConfirmarExclusao");
    if (overlay) { overlay.classList.add("active"); overlay.setAttribute("aria-hidden", "false"); }
  }

  function fecharConfirmacaoExclusao() {
    codigoExclusaoPendente = null;
    const overlay = document.getElementById("modalConfirmarExclusao");
    if (overlay) { overlay.classList.remove("active"); overlay.setAttribute("aria-hidden", "true"); }
  }

  async function confirmarExclusaoMolde() {
    if (CF.seguranca && !CF.seguranca.permite("editarMolde")) {
      fecharConfirmacaoExclusao();
      if (CF.app && CF.app.mostrarToast) {
        CF.app.mostrarToast("error", "Permissao", "Seu papel nao tem permissao para excluir moldes.");
      }
      return;
    }
    const codigo = codigoExclusaoPendente;
    if (!codigo) { fecharConfirmacaoExclusao(); return; }
    const btn = document.getElementById("btnConfirmarExclusao");
    if (btn) btn.disabled = true;
    try {
      const ctx = (document.body && document.body.dataset && document.body.dataset.context) || "/CustomFusionWeb";
      const resp = await fetch(ctx + "/api/moldes/" + encodeURIComponent(codigo), { method: "DELETE" });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) throw new Error(data.erro || ("HTTP " + resp.status));
      fecharConfirmacaoExclusao();
      fecharModalCadastro();
      await CF.cfg.recarregarCatalogo();
      if (CF.app && typeof CF.app.renderTelaInicial === "function") await CF.app.renderTelaInicial();
      if (CF.app && typeof CF.app.mostrarToast === "function") {
        CF.app.mostrarToast("success", "Molde excluído", "Molde " + codigo + " removido.");
      } else {
        alert("Molde " + codigo + " removido.");
      }
    } catch (e) {
      fecharConfirmacaoExclusao();
      if (CF.app && typeof CF.app.mostrarToast === "function") {
        CF.app.mostrarToast("error", "Falha ao excluir", e && e.message ? e.message : String(e));
      } else {
        mostrarErroCad("Falha ao excluir: " + (e && e.message ? e.message : e));
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function registrarUpload(inputId, nomeId, previewId, padrao) {
    const input = document.getElementById(inputId);
    if (!input) return;
    atualizarUpload(input, nomeId, previewId, padrao);
    input.addEventListener("change", () => atualizarUpload(input, nomeId, previewId, padrao));
  }

  function atualizarUpload(input, nomeId, previewId, padrao) {
    const nomeEl = document.getElementById(nomeId);
    const preview = document.getElementById(previewId);
    const arquivo = input && input.files && input.files[0] ? input.files[0] : null;
    if (nomeEl) nomeEl.textContent = arquivo ? arquivo.name : padrao;
    if (!preview) return;
    preview.innerHTML = "";
    preview.classList.toggle("vazio", !arquivo);
    if (!arquivo) return;

    const thumb = document.createElement("div");
    thumb.className = "upload-preview-thumb";
    const ext = extensaoArquivo(arquivo.name);
    if (/^image\/(png|jpeg|svg\+xml)$/.test(arquivo.type) || ["png", "jpg", "jpeg", "svg"].indexOf(ext) >= 0) {
      const img = document.createElement("img");
      const url = URL.createObjectURL(arquivo);
      img.src = url;
      img.alt = arquivo.name;
      img.onload = () => URL.revokeObjectURL(url);
      img.onerror = () => URL.revokeObjectURL(url);
      thumb.appendChild(img);
    } else {
      thumb.textContent = (ext || "ARQ").slice(0, 4).toUpperCase();
    }
    const nome = document.createElement("span");
    nome.className = "upload-preview-nome";
    nome.textContent = arquivo.name;
    nome.title = arquivo.name;
    preview.appendChild(thumb);
    preview.appendChild(nome);
  }

  function limparPreviewsCadastro() {
    [
      ["cadGradeSvgNome", "cadGradeSvgPreview", "Selecionar SVG da grade"],
      ["cadImagemNome", "cadImagemPreview", "Selecionar desenho"],
      ["cadArquivoCadNome", "cadArquivoCadPreview", "Selecionar arquivo 3D/Solid"]
    ].forEach((cfg) => {
      const nome = document.getElementById(cfg[0]);
      if (nome) nome.textContent = cfg[2];
      const preview = document.getElementById(cfg[1]);
      if (preview) { preview.innerHTML = ""; preview.classList.add("vazio"); }
    });
  }

  function extensaoArquivo(nome) {
    const i = String(nome || "").lastIndexOf(".");
    return i >= 0 ? String(nome).slice(i + 1).toLowerCase() : "";
  }

  async function confirmarCadastro() {
    const acao = modoCadastro === "editar" ? "editarMolde" : "cadastrarMolde";
    const editando = modoCadastro === "editar";
    if (CF.seguranca && !CF.seguranca.permite(acao)) {
      mostrarErroCad(modoCadastro === "editar"
        ? "Seu papel nao tem permissao para editar moldes."
        : "Seu papel nao tem permissao para cadastrar moldes.");
      return;
    }
    const err = document.getElementById("cadMoldeErro");
    const codigo = (document.getElementById("cadCodigo") || {}).value || "";
    const nomePeca = (document.getElementById("cadNomePeca") || {}).value || "";
    const familia = (document.getElementById("cadFamilia") || {}).value || "";
    const cavidades = parseInt((document.getElementById("cadCavidades") || {}).value || "0", 10);
    const material = (document.getElementById("cadMaterial") || {}).value || "";
    const maquina = (document.getElementById("cadMaquina") || {}).value || "";
    const cadFile = (document.getElementById("cadArquivoCad") || {}).files || [];
    const imgFile = (document.getElementById("cadImagem") || {}).files || [];
    const gradeFile = (document.getElementById("cadGradeSvg") || {}).files || [];
    const arquivo = cadFile.length ? cadFile[0] : null;

    if (!codigo.trim()) { mostrarErroCad("Informe o codigo do molde."); return; }
    if (!nomePeca.trim()) { mostrarErroCad("Informe o nome da peca."); return; }
    if (!cavidades || cavidades < 1) { mostrarErroCad("Informe a quantidade de cavidades."); return; }

    const fd = new FormData();
    fd.append("codigo", codigo.trim());
    fd.append("nomePeca", nomePeca.trim());
    fd.append("familia", familia.trim());
    fd.append("cavidades", String(cavidades));
    fd.append("material", material.trim());
    fd.append("maquina", maquina.trim());
    if (imgFile.length) fd.append("imagem", imgFile[0]);
    if (gradeFile.length) fd.append("gradeSvg", gradeFile[0]);
    if (arquivo) {
      const ext = extensaoArquivo(arquivo.name);
      if (ext === "stl") fd.append("cadFile", arquivo); else fd.append("solidFile", arquivo);
    }

    const btn = document.getElementById("btnConfirmarCadMolde");
    if (btn) btn.disabled = true;
    try {
      const ctx = (document.body && document.body.dataset && document.body.dataset.context) || "/CustomFusionWeb";
      const resp = await fetch(ctx + "/api/moldes/cadastrar", { method: "POST", body: fd });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) {
        throw new Error(data.erro || ("HTTP " + resp.status));
      }
      fecharModalCadastro();
      resetarFormularioCadastro();
      const mensagem = editando
        ? ("Molde " + codigo + " atualizado.")
        : ("Molde " + codigo + " disponível em + ABRIR GRADE."
          + (data.layoutPadrao ? " A grade anexada já está vinculada." : ""));
      if (CF.app && typeof CF.app.mostrarToast === "function") {
        CF.app.mostrarToast("success", editando ? "Molde atualizado" : "Molde cadastrado", mensagem);
      } else {
        alert(mensagem);
      }

      try {
        if (!CF.cfg || !CF.cfg.recarregarCatalogo) {
          throw new Error("Rotina de recarga do catálogo não disponível.");
        }
        await CF.cfg.recarregarCatalogo();
        if (CF.cfg.recarregarMaquinas) await CF.cfg.recarregarMaquinas();
        if (CF.app && typeof CF.app.renderTelaInicial === "function") {
          await CF.app.renderTelaInicial();
        }
      } catch (refreshError) {
        console.error("Molde salvo, mas o catálogo não foi recarregado:", refreshError);
        if (CF.app && typeof CF.app.mostrarToast === "function") {
          CF.app.mostrarToast("error", "Molde salvo", "Recarregue a página para atualizar a lista de moldes.");
        } else {
          alert("Molde " + codigo + " salvo. Recarregue a página para atualizar a lista de moldes.");
        }
      }
    } catch (e) {
      mostrarErroCad((modoCadastro === "editar" ? "Falha ao salvar: " : "Falha ao cadastrar: ") + (e && e.message ? e.message : e));
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function resetarFormularioCadastro() {
    ["cadCodigo", "cadNomePeca", "cadFamilia", "cadMaterial"].forEach((id) => {
      const campo = document.getElementById(id);
      if (campo) campo.value = "";
    });
    const cod = document.getElementById("cadCodigo");
    if (cod) cod.readOnly = false;

    const cavidades = document.getElementById("cadCavidades");
    if (cavidades) cavidades.value = "16";

    const cadFile = document.getElementById("cadArquivoCad");
    if (cadFile) cadFile.value = "";
    const imgFile = document.getElementById("cadImagem");
    if (imgFile) imgFile.value = "";
    const gradeFile = document.getElementById("cadGradeSvg");
    if (gradeFile) gradeFile.value = "";

    const cadNome = document.getElementById("cadArquivoCadNome");
    if (cadNome) cadNome.textContent = "Selecionar arquivo 3D/Solid";
    const imgNome = document.getElementById("cadImagemNome");
    if (imgNome) imgNome.textContent = "Selecionar desenho";
    const gradeNome = document.getElementById("cadGradeSvgNome");
    if (gradeNome) gradeNome.textContent = "Selecionar SVG da grade";
    limparPreviewsCadastro();

    if (comboboxes.cadMaquina) {
      comboboxes.cadMaquina.busca.value = "";
      comboboxes.cadMaquina.hidden.value = "";
      fecharCombobox("cadMaquina");
    } else {
      const m = document.getElementById("cadMaquina"); if (m) m.value = "";
      const mb = document.getElementById("cadMaquinaBusca"); if (mb) mb.value = "";
    }
    if (comboboxes.cadMoldeEdit) {
      comboboxes.cadMoldeEdit.busca.value = "";
      comboboxes.cadMoldeEdit.hidden.value = "";
      fecharCombobox("cadMoldeEdit");
    } else {
      const h = document.getElementById("cadMoldeEditCodigo"); if (h) h.value = "";
      const b = document.getElementById("cadMoldeEditBusca"); if (b) b.value = "";
    }

    const erro = document.getElementById("cadMoldeErro");
    if (erro) { erro.textContent = ""; erro.style.display = "none"; }
  }

  function mostrarErroCad(msg) {
    const err = document.getElementById("cadMoldeErro");
    if (err) {
      err.textContent = msg;
      err.style.display = "block";
    }
    if (CF.app && typeof CF.app.mostrarToast === "function") {
      CF.app.mostrarToast("error", "Não foi possível salvar", msg);
    }
  }

  CF.telaInicial = {
    init: init,
    mostrar: mostrar,
    esconder: esconder,
    carregando: carregando,
    renderizar: renderizar,
    abrirModal: abrirModal,
    fecharModal: fecharModal
  };

})(window.CF = window.CF || {});
