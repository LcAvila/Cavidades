"use strict";

(function (CF) {

  const estado = {
    carregado: false,
    usuario: null,
    permissoes: null,
    papeis: [],
    filtro: "",
    comboAberto: false,
    comboAtivo: -1
  };

  const CAMPOS = [
    ["visualizar", "Visualizar", "Visualizar o projeto e consultar as grades"],
    ["imprimir", "Imprimir", "Imprimir a grade"],
    ["abrirMolde", "Abrir", "Abrir grade, editar dados e publicar no GED"],
    ["cadastrarMolde", "Cadastrar", "Cadastrar um molde novo"],
    ["editarMolde", "Editar", "Editar ou excluir um molde existente"],
    ["excluirGrade", "Excluir grade", "Excluir uma grade aberta e seus registros"],
    ["configurar", "Configurar", "Alterar as permissões dos papéis"]
  ];

  function ctx() {
    return (document.body && document.body.dataset && document.body.dataset.context) || "";
  }

  function el(id) {
    return document.getElementById(id);
  }

  function mostrar(id, visivel) {
    const node = typeof id === "string" ? el(id) : id;
    if (!node) return;
    node.style.display = visivel ? "" : "none";
  }

  function toast(tipo, titulo, mensagem) {
    if (CF.app && typeof CF.app.mostrarToast === "function") {
      CF.app.mostrarToast(tipo, titulo, mensagem || "");
    } else {
      alert(titulo + (mensagem ? ": " + mensagem : ""));
    }
  }

  function permite(acao) {
    return !!(estado.permissoes && estado.permissoes[acao]);
  }

  async function carregar() {
    try {
      const resp = await fetch(ctx() + "/api/usuario-atual", {
        cache: "no-store",
        credentials: "same-origin"
      });
      const dados = await resp.json().catch(() => ({}));
      estado.usuario = dados && dados.autenticado ? dados : null;
      estado.permissoes = (dados && dados.permissoes) || {};
    } catch (e) {
      estado.usuario = null;
      estado.permissoes = {};
    }
    estado.carregado = true;
    aplicar();
    if (CF.app && typeof CF.app.renderTelaInicial === "function") {
      CF.app.renderTelaInicial().catch((e) => {
        console.error("Falha ao atualizar as opções das grades após carregar permissões:", e);
      });
    }
  }

  function aplicar() {
    const p = estado.permissoes || {};
    const somenteLeitura = !p.abrirMolde;

    mostrar("btnCadastrarMolde", !!p.cadastrarMolde);
    mostrar("btnEditarMolde", !!p.editarMolde);
    mostrar("btnAbrirGrade", !!p.abrirMolde);
    mostrar("btnConfigurarPapeis", !!p.configurar);
    mostrar("btnExcluirCadMolde", !!p.editarMolde);

    document.body.classList.toggle("somente-leitura", somenteLeitura);

    document.querySelectorAll("[contenteditable]").forEach((node) => {
      node.setAttribute("contenteditable", somenteLeitura ? "false" : "true");
      node.classList.toggle("is-readonly", somenteLeitura);
    });

    ["desvio", "observacao"].forEach((id) => {
      const campo = el(id);
      if (campo) campo.readOnly = somenteLeitura;
    });
    const data = el("data");
    if (data) data.disabled = somenteLeitura;
    document.querySelectorAll('input[name="vedado"]').forEach((radio) => {
      radio.disabled = somenteLeitura;
    });

    mostrar("btnExcluir", !somenteLeitura);
    mostrar("btnPublicarGrade", !somenteLeitura);
    mostrar("btnImprimir", !!p.imprimir);

    const helpAuto = document.querySelector(".help-auto");
    if (helpAuto) helpAuto.textContent = somenteLeitura ? "Somente leitura" : "Auto-save ativo";
    const autoSave = el("autoSaveMensagem");
    if (autoSave && somenteLeitura) {
      autoSave.textContent = "Modo somente leitura. Você pode consultar a grade e o desenho 3D.";
    }
  }

  // ---- Modal de permissoes ------------------------------------------------

  function normalizar(txt) {
    return String(txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function cabecalho() {
    const linha = document.createElement("div");
    linha.className = "papeis-linha papeis-cab";
    const nome = document.createElement("div");
    nome.className = "papeis-nome";
    nome.textContent = "Papel / grupo do Fusion";
    linha.appendChild(nome);
    CAMPOS.forEach(([, rotulo, titulo]) => {
      const cel = document.createElement("div");
      cel.className = "papeis-op papeis-op-cab";
      cel.textContent = rotulo;
      cel.title = titulo;
      linha.appendChild(cel);
    });
    return linha;
  }

  function linhaPapel(papel) {
    const linha = document.createElement("div");
    linha.className = "papeis-linha";
    linha.dataset.codigo = papel.codigo || "";
    linha.dataset.nome = papel.nome || papel.codigo || "";
    const nome = document.createElement("div");
    nome.className = "papeis-nome";
    const forte = document.createElement("strong");
    forte.textContent = papel.nome || papel.codigo || "(sem nome)";
    const meta = document.createElement("div");
    meta.className = "papeis-meta-linha";
    const cod = document.createElement("span");
    cod.className = "papeis-codigo";
    cod.textContent = papel.codigo || "";
    meta.appendChild(cod);
    if (!papel.configurado) {
      const badge = document.createElement("span");
      badge.className = "papeis-badge nao-configurado";
      badge.textContent = "N\u00e3o configurado";
      meta.appendChild(badge);
    }
    nome.appendChild(forte);
    nome.appendChild(meta);
    linha.appendChild(nome);
    CAMPOS.forEach(([campo, rotulo, titulo]) => {
      const cel = document.createElement("label");
      cel.className = "papeis-op";
      cel.title = titulo;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.campo = campo;
      input.checked = !!papel[campo];
      input.addEventListener("change", () => ajustarLinha(input));
      const texto = document.createElement("span");
      texto.textContent = rotulo;
      cel.appendChild(input);
      cel.appendChild(texto);
      linha.appendChild(cel);
    });
    return linha;
  }

  function ajustarLinha(input) {
    const linha = input.closest(".papeis-linha");
    if (!linha) return;
    const campo = input.dataset.campo;
    if (campo === "visualizar" && !input.checked) {
      linha.querySelectorAll('input[type="checkbox"]').forEach((outro) => { outro.checked = false; });
      return;
    }
    if (campo !== "visualizar" && input.checked) {
      const visualizar = linha.querySelector('input[data-campo="visualizar"]');
      if (visualizar) visualizar.checked = true;
    }
  }

  function linhasPapeis() {
    const lista = el("papeisLista");
    return lista ? Array.from(lista.querySelectorAll(".papeis-linha:not(.papeis-cab)")) : [];
  }

  function filtrarLista() {
    const busca = normalizar(estado.filtro);
    const linhas = linhasPapeis();
    let visiveis = 0;
    linhas.forEach((linha) => {
      const texto = normalizar((linha.dataset.codigo || "") + " " + (linha.dataset.nome || ""));
      const ok = !busca || texto.indexOf(busca) !== -1;
      linha.style.display = ok ? "" : "none";
      if (ok) visiveis++;
    });
    const cont = el("papeisContagem");
    if (cont) cont.textContent = busca ? visiveis + " de " + linhas.length + " pap\u00e9is/grupos" : linhas.length + " pap\u00e9is/grupos";
    const vazio = el("papeisVazioFiltro");
    if (vazio) vazio.style.display = busca && visiveis === 0 && linhas.length ? "" : "none";
  }

  function renderizar(papeis, aviso) {
    const lista = el("papeisLista");
    if (!lista) return;
    lista.innerHTML = "";
    lista.appendChild(cabecalho());
    (papeis || []).forEach((papel) => lista.appendChild(linhaPapel(papel)));
    const vazioFiltro = document.createElement("div");
    vazioFiltro.id = "papeisVazioFiltro";
    vazioFiltro.className = "papeis-vazio";
    vazioFiltro.textContent = "Nenhum papel corresponde ao filtro.";
    vazioFiltro.style.display = "none";
    lista.appendChild(vazioFiltro);
    if (!papeis || !papeis.length) {
      const vazio = document.createElement("div");
      vazio.className = "papeis-vazio";
      vazio.textContent = "Nenhum papel ou grupo encontrado no Fusion. Adicione pelo c\u00f3digo manualmente.";
      lista.appendChild(vazio);
    }
    const avisoEl = el("papeisAviso");
    if (avisoEl) avisoEl.textContent = aviso || "";
    filtrarLista();
    renderizarComboBusca();
  }

  function opcoesComboBusca() {
    const busca = normalizar(estado.filtro);
    return (estado.papeis || []).filter((p) => !busca || normalizar((p.codigo || "") + " " + (p.nome || "")).indexOf(busca) !== -1).slice(0, 30);
  }

  function renderizarComboBusca() {
    const lista = el("listaPapeisBusca");
    const input = el("papeisBuscaInput");
    if (!lista || !input) return;
    lista.innerHTML = "";
    const itens = opcoesComboBusca();
    if (!itens.length) {
      const vazio = document.createElement("div");
      vazio.className = "combo-empty";
      vazio.textContent = estado.papeis.length ? 'Nenhum resultado para "' + (input.value || "").trim() + '"' : "Nenhum papel carregado do Fusion";
      lista.appendChild(vazio);
    } else {
      itens.forEach((papel, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "combo-item" + (idx === estado.comboAtivo ? " active" : "");
        btn.setAttribute("role", "option");
        const titulo = document.createElement("span");
        titulo.className = "combo-item-titulo";
        titulo.textContent = papel.nome || papel.codigo || "(sem nome)";
        const sub = document.createElement("span");
        sub.className = "combo-item-sub";
        sub.textContent = papel.codigo || "";
        btn.appendChild(titulo);
        btn.appendChild(sub);
        btn.addEventListener("click", () => selecionarPapelBusca(papel));
        lista.appendChild(btn);
      });
    }
    lista.hidden = !estado.comboAberto;
    input.setAttribute("aria-expanded", estado.comboAberto ? "true" : "false");
  }

  function abrirComboBusca(abrir) {
    estado.comboAberto = abrir;
    if (!abrir) estado.comboAtivo = -1;
    renderizarComboBusca();
  }

  function selecionarPapelBusca(papel) {
    estado.filtro = (papel && (papel.nome || papel.codigo)) || "";
    const input = el("papeisBuscaInput");
    if (input) input.value = estado.filtro;
    abrirComboBusca(false);
    filtrarLista();
    const alvo = linhasPapeis().find((l) => l.dataset.codigo === (papel && papel.codigo));
    if (alvo) { alvo.scrollIntoView({ block: "center" }); alvo.classList.add("papeis-linha-destaque"); setTimeout(() => alvo.classList.remove("papeis-linha-destaque"), 1200); }
  }

  function abrirConfiguracao() {
    if (!permite("configurar")) { toast("error", "Permiss\u00f5es", "Seu papel n\u00e3o pode configurar as permiss\u00f5es."); return; }
    const overlay = el("modalPapeis");
    if (overlay) overlay.classList.add("active");
    estado.filtro = ""; estado.comboAberto = false; estado.comboAtivo = -1;
    const busca = el("papeisBuscaInput"); if (busca) busca.value = "";
    const lista = el("papeisLista");
    if (lista) { lista.innerHTML = ""; const c = document.createElement("div"); c.className = "papeis-vazio"; c.textContent = "Carregando pap\u00e9is e grupos do Fusion..."; lista.appendChild(c); }
    const avisoEl = el("papeisAviso"); if (avisoEl) avisoEl.textContent = "";
    const cont = el("papeisContagem"); if (cont) cont.textContent = "";
    fetch(ctx() + "/api/papeis", { cache: "no-store", credentials: "same-origin" })
      .then(async (resp) => { const dados = await resp.json().catch(() => ({})); if (!resp.ok || dados.erro) throw new Error(dados.erro || ("HTTP " + resp.status)); return dados; })
      .then((dados) => { estado.papeis = dados.papeis || []; renderizar(estado.papeis, dados.aviso || ""); })
      .catch((e) => { if (lista) lista.innerHTML = ""; if (avisoEl) avisoEl.textContent = "Falha ao carregar: " + (e && e.message ? e.message : e); toast("error", "Permiss\u00f5es", "N\u00e3o foi poss\u00edvel carregar os pap\u00e9is do Fusion."); });
  }

  function fecharConfiguracao() { const o = el("modalPapeis"); if (o) o.classList.remove("active"); abrirComboBusca(false); }

  function adicionarManual(codigoInformado) {
    const campo = el("papelManualCodigo");
    const lista = el("papeisLista"); if (!lista) return;
    const codigo = String(codigoInformado || (campo ? campo.value : "") || "").trim();
    if (!codigo) { toast("error", "Permiss\u00f5es", "Informe o c\u00f3digo do papel ou grupo."); if (campo) campo.focus(); return; }
    const existente = linhasPapeis().find((l) => normalizar(l.dataset.codigo) === normalizar(codigo));
    if (existente) { existente.style.display = ""; existente.scrollIntoView({ block: "center" }); existente.classList.add("papeis-linha-destaque"); setTimeout(() => existente.classList.remove("papeis-linha-destaque"), 1200); if (campo) campo.value = ""; filtrarLista(); return; }
    const doFusion = (estado.papeis || []).find((p) => normalizar(p.codigo) === normalizar(codigo));
    const papel = doFusion ? Object.assign({}, doFusion) : { codigo: codigo, nome: codigo, configurado: false, visualizar: true, imprimir: false, abrirMolde: false, cadastrarMolde: false, editarMolde: false, excluirGrade: false, configurar: false };
    const vazio = lista.querySelector(".papeis-vazio:not(#papeisVazioFiltro)"); if (vazio) vazio.remove();
    if (!lista.querySelector(".papeis-cab")) lista.insertBefore(cabecalho(), lista.firstChild);
    const linha = linhaPapel(papel);
    const vazioFiltro = el("papeisVazioFiltro"); if (vazioFiltro) lista.insertBefore(linha, vazioFiltro); else lista.appendChild(linha);
    if (campo) campo.value = "";
    filtrarLista();
    linha.scrollIntoView({ block: "center" }); linha.classList.add("papeis-linha-destaque"); setTimeout(() => linha.classList.remove("papeis-linha-destaque"), 1200);
  }

  function coletar() {
    return linhasPapeis().map((linha) => {
      const papel = { codigo: linha.dataset.codigo || "", nome: linha.dataset.nome || linha.dataset.codigo || "" };
      linha.querySelectorAll('input[type="checkbox"]').forEach((input) => { papel[input.dataset.campo] = input.checked; });
      return papel;
    }).filter((p) => p.codigo);
  }

  function salvar() {
    const papeis = coletar();
    if (!papeis.length) { toast("error", "Permiss\u00f5es", "Nenhum papel para salvar."); return; }
    const btn = el("btnSalvarPapeis"); if (btn) btn.disabled = true;
    fetch(ctx() + "/api/papeis", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ papeis: papeis }) })
      .then(async (resp) => { const dados = await resp.json().catch(() => ({})); if (!resp.ok || dados.erro) throw new Error(dados.erro || ("HTTP " + resp.status)); return dados; })
      .then(() => { fecharConfiguracao(); toast("success", "Permiss\u00f5es salvas", "As permiss\u00f5es dos pap\u00e9is/grupos foram atualizadas."); carregar(); })
      .catch((e) => { toast("error", "Falha ao salvar", e && e.message ? e.message : String(e)); })
      .finally(() => { if (btn) btn.disabled = false; });
  }

  function iniciar() {
    const btnConfig = el("btnConfigurarPapeis"); if (btnConfig) btnConfig.addEventListener("click", abrirConfiguracao);
    const btnCancelar = el("btnCancelarPapeis"); if (btnCancelar) btnCancelar.addEventListener("click", fecharConfiguracao);
    const btnFechar = el("btnFecharPapeis"); if (btnFechar) btnFechar.addEventListener("click", fecharConfiguracao);
    const btnSalvar = el("btnSalvarPapeis"); if (btnSalvar) btnSalvar.addEventListener("click", salvar);
    const btnAdicionar = el("btnAdicionarPapelManual"); if (btnAdicionar) btnAdicionar.addEventListener("click", () => adicionarManual());
    const campoManual = el("papelManualCodigo"); if (campoManual) campoManual.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); adicionarManual(); } });
    const busca = el("papeisBuscaInput"); const toggle = el("togglePapeisBusca");
    if (busca) {
      busca.addEventListener("input", () => { estado.filtro = busca.value || ""; estado.comboAtivo = -1; abrirComboBusca(true); filtrarLista(); });
      busca.addEventListener("focus", () => abrirComboBusca(true));
      busca.addEventListener("keydown", (e) => {
        const itens = opcoesComboBusca();
        if (e.key === "ArrowDown") { e.preventDefault(); abrirComboBusca(true); estado.comboAtivo = Math.min(estado.comboAtivo + 1, itens.length - 1); renderizarComboBusca(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); abrirComboBusca(true); estado.comboAtivo = Math.max(estado.comboAtivo - 1, 0); renderizarComboBusca(); }
        else if (e.key === "Enter" && estado.comboAtivo >= 0 && itens[estado.comboAtivo]) { e.preventDefault(); selecionarPapelBusca(itens[estado.comboAtivo]); }
        else if (e.key === "Escape") { abrirComboBusca(false); }
      });
    }
    if (toggle) toggle.addEventListener("click", () => { if (busca) busca.focus(); abrirComboBusca(!estado.comboAberto); });
    const overlay = el("modalPapeis"); if (overlay) overlay.addEventListener("click", (e) => { if (e.target.id === "modalPapeis") fecharConfiguracao(); });
    document.addEventListener("click", (e) => { const combo = el("comboPapelBusca"); if (combo && !combo.contains(e.target)) abrirComboBusca(false); });
    carregar();
  }

  CF.seguranca = {
    aplicar: aplicar,
    carregar: carregar,
    permite: permite,
    permissoes: () => estado.permissoes
  };

  iniciar();

})(window.CF = window.CF || {});
