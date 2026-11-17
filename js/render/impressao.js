"use strict";

(function (CF) {

  const { estado, br } = CF.estado;
  const { coletarGrade } = CF.cabecalho;

  function calcularAlturaLinha(esquerda, direita, linhaConfigurada) {
    const linhaSolicitada = Number(linhaConfigurada);
    let linha = Number.isFinite(linhaSolicitada) && linhaSolicitada > 0
      ? linhaSolicitada
      : 4.5;

    if (esquerda > 0) linha = Math.min(linha, 256.8 / esquerda);
    if (direita > 0) linha = Math.min(linha, 77.8 / direita);
    return Math.max(0.5, Math.floor(linha * 100) / 100);
  }

  function montarFolhaImpressao() {
    if (CF.registros && CF.registros.flushAutoSalvar) CF.registros.flushAutoSalvar();
    coletarGrade();

    const blocos = estado.blocosImpressao || [];
    const esquerda = blocos[0] || [];
    let direita = [];
    for (let i = 1; i < blocos.length; i++) direita = direita.concat(blocos[i]);

    const configuracaoImpressao = estado.layout && estado.layout.impressao;
    const linhaMm = calcularAlturaLinha(
      esquerda.length,
      direita.length,
      configuracaoImpressao && configuracaoImpressao.linhaMm
    );
    const folha = document.getElementById("folhaImpressao");
    if (folha) folha.style.setProperty("--folha-linha-tabela", linhaMm + "mm");

    const tbE = document.getElementById("folhaTbodyEsquerda");
    const tbD = document.getElementById("folhaTbodyDireita");
    tbE.innerHTML = "";
    tbD.innerHTML = "";

    esquerda.forEach((id) => tbE.appendChild(linhaFolha(id)));
    direita.forEach((id) => tbD.appendChild(linhaFolha(id)));

    definir("folhaProduto", estado.dadosGrade.produto || (estado.molde ? estado.molde.nomePeca : ""));
    definir("folhaMoldeNum", "Molde " + (estado.molde ? estado.molde.codigo : ""));
    definir("folhaMoldeMod", estado.dadosGrade.moldeMod || "");
    definir("folhaMaterial", estado.dadosGrade.material || "");
    definir("folhaMaquina", estado.dadosGrade.maquina || "");
    const cavidadesTotal = estado.dadosGrade.cavidadesTotais;
    const cavidadesAtivas = estado.dadosGrade.cavidadesAtivas;
    const cavidadesTexto = (cavidadesTotal !== undefined && cavidadesTotal !== null && cavidadesTotal !== "" &&
        cavidadesAtivas !== undefined && cavidadesAtivas !== null && cavidadesAtivas !== "")
      ? cavidadesTotal + " / " + cavidadesAtivas
      : String(cavidadesTotal || cavidadesAtivas || "");
    definir("folhaCavidades", cavidadesTexto);
    definir("folhaControladorAbertura", estado.dadosGrade.controladorAbertura || "");
    definir("folhaDataEntrada", estado.dadosGrade.dataEntrada || "");
    definir("folhaDataAtualizacao", estado.dadosGrade.dataAtualizacao || "");
    definir("folhaObservacoes", estado.dadosGrade.observacoes || "");
    definir("folhaRevisao", "Revisão " + (estado.dadosGrade.revisaoNum || "") + " - Data " + (estado.dadosGrade.revisaoData || ""));

    const diagBox = document.getElementById("folhaDiagramaBox");
    diagBox.innerHTML = "";
    const svg = document.getElementById("svgDiagrama");
    if (svg && svg.childNodes.length) {
      const clone = svg.cloneNode(true);
      clone.removeAttribute("id");
      diagBox.appendChild(clone);
    }
  }

  function linhaFolha(id) {
    const d = estado.dadosCavidades[id] || {};
    const tr = document.createElement("tr");

    const tdN = document.createElement("td");
    tdN.className = "fc-num";
    tdN.textContent = id;
    tr.appendChild(tdN);

    const tdD = document.createElement("td");
    tdD.className = "fc-desvio";
    tdD.textContent = d.desvio || "";
    tr.appendChild(tdD);

    const tdT = document.createElement("td");
    tdT.textContent = br(d.data);
    tr.appendChild(tdT);

    const tdV = document.createElement("td");
    tdV.className = "fc-ved " + (d.vedado === "S" ? "fc-ved-s" : "fc-ved-n");
    tdV.textContent = d.vedado === "S" ? "S" : "N";
    tr.appendChild(tdV);

    const tdC = document.createElement("td");
    tdC.textContent = d.controlador || "";
    tr.appendChild(tdC);

    return tr;
  }

  function definir(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  function initImpressao() {
    document.getElementById("btnImprimir").addEventListener("click", () => {
      if (CF.seguranca && !CF.seguranca.permite("imprimir")) {
        if (CF.app && typeof CF.app.mostrarToast === "function") {
          CF.app.mostrarToast("error", "Permissao", "Seu papel nao pode imprimir a grade.");
        }
        return;
      }
      montarFolhaImpressao();
      window.print();
    });
    window.addEventListener("beforeprint", montarFolhaImpressao);
  }

  CF.impressao = {
    montarFolhaImpressao: montarFolhaImpressao,
    initImpressao: initImpressao
  };

})(window.CF = window.CF || {});
