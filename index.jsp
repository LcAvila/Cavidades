<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" session="false"%>
<%
	// Remove o JSESSIONID legado do /cavidades (Path=/cavidades) para não
	// disputar com o JSESSIONID do Fusion (Path=/). O cookie novo deste app
	// passou a se chamar CAVIDADES_SESSIONID.
	jakarta.servlet.http.Cookie sessaoLegada = new jakarta.servlet.http.Cookie("JSESSIONID", "");
	sessaoLegada.setPath(request.getContextPath());
	sessaoLegada.setMaxAge(0);
	sessaoLegada.setHttpOnly(true);
	response.addCookie(sessaoLegada);
%>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cavidades não conformes - Compactor</title>
<link rel="stylesheet"
	href="${pageContext.request.contextPath}/css/style.css?v=20261116d">
</head>

<body data-context="${pageContext.request.contextPath}">

	<section class="tela-inicial" id="telaInicial">

		<nav class="navbar" id="navbarInicial">
			<div class="nav-brand">
				<img src="${pageContext.request.contextPath}/assets/logos/Logo%20Compactor.svg" alt="Compactor">
				<div class="nav-brand-text">
					<span class="nav-nome">Controle de Cavidades</span>
				</div>
			</div>
			<div class="nav-acoes">
				<button class="btn nav-btn nav-btn-ghost" id="btnConfigurarPapeis" type="button" title="Configurar permissões por papel ou grupo do Fusion" style="display: none">PERMISSÕES</button>
				<button class="btn nav-btn nav-btn-secondary" id="btnEditarMolde" type="button" style="display: none">EDITAR MOLDE</button>
				<button class="btn nav-btn nav-btn-secondary" id="btnCadastrarMolde" type="button" style="display: none">CADASTRAR MOLDE</button>
				<button class="btn nav-btn nav-btn-primary" id="btnAbrirGrade" type="button" style="display: none">+ ABRIR GRADE</button>
			</div>
		</nav>

		<header class="ti-cabecalho">
			<div class="ti-titulo">
				<h1>Grades de moldes abertas</h1>
				<p>Selecione uma grade para registrar não conformidades.</p>
			</div>
			<div class="grades-controles" role="search" aria-label="Filtrar e ordenar grades">
				<div class="grades-filtro">
					<label for="filtroGrades">Filtrar grades</label>
					<input id="filtroGrades" type="search" autocomplete="off"
						placeholder="Molde, peça, máquina, material, situação ou data">
				</div>
				<div class="grades-ordenacao">
					<label for="ordenarGrades">Ordenar por</label>
					<select id="ordenarGrades">
						<option value="abertura-recente">Abertura mais recente</option>
						<option value="abertura-antiga">Abertura mais antiga</option>
						<option value="molde-az">Molde: código A–Z</option>
						<option value="peca-az">Peça: nome A–Z</option>
					</select>
				</div>
			</div>
			<div class="ti-contador" id="gradesContador">0 grades ativas</div>
		</header>







		<div class="grades-grid" id="listaGrades"></div>



		<div class="grades-vazio" id="gradesVazio" style="display: none">



			<div class="vazio-icone">&#9638;</div>



			<p id="gradesVazioMensagem">Nenhuma grade aberta no momento.</p>

			<p id="gradesVazioAjuda">
				Clique em <strong>+ ABRIR GRADE</strong> na barra superior para



				começar.
			</p>



		</div>



	</section>







	<div class="app" id="telaGrade" style="display: none">







		<aside class="painel-form">







			<div class="grade-atual">



				<button class="btn btn-secondary btn-voltar" id="btnVoltar" type="button" aria-label="Voltar para a lista de grades"><svg class="btn-voltar-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg><span>Voltar às grades</span></button>



				<div class="hint" id="moldeInfo"></div>



			</div>







			<h2>REGISTRAR NÃO CONFORMIDADE</h2>







			<div class="resumo-status">



				<div class="resumo-card">



					<div class="num" id="resTotal">64</div>



					<div class="lbl">Total</div>



				</div>



				<div class="resumo-card res-ok">



					<div class="num" id="resOk">64</div>



					<div class="lbl">OK</div>



				</div>



				<div class="resumo-card res-def">



					<div class="num" id="resDef">0</div>



					<div class="lbl">Defeitos</div>



				</div>



				<div class="resumo-card res-ved">



					<div class="num" id="resVed">0</div>



					<div class="lbl">Vedadas</div>



				</div>



			</div>







			<div class="form-group">



				<label for="cavidade" id="lblCavidade">Cavidade</label> <select
					id="cavidade"><option value="">Selecione a



						cavidade</option></select>



				<div class="hint" id="selecaoInfo">Nenhuma cavidade



					selecionada.</div>



			</div>







			<div class="form-group">



				<label for="desvio">Desvio / Defeito</label> <input type="text"
					id="desvio" list="listaDesvios"
					placeholder="Selecione um item da lista ou digite livremente"
					autocomplete="off">



				<datalist id="listaDesvios">



					<option value="F.P.F.Q.">F.P.F.Q. - Frente do pino de



						formato quebrada</option>



					<option value="P.F.Q.">P.F.Q. - Pino do formato quebrado</option>



					<option value="V.P.F.">V.P.F. - Vedada pela ferramentaria</option>



					<option value="REB.">REB. - Rebarba</option>



					<option value="B.V.">B.V. - Bucha virada</option>



					<option value="C.P.Q.">C.P.Q. - Contra pino quebrado</option>



					<option value="B.B.F.Q.">B.B.F.Q. - Boca da bucha do



						formato quebrada</option>



				</datalist>



			</div>







			<div class="form-group" id="obsField" style="display: none">



				<label for="observacao">Observação / Descrição</label>



				<textarea id="observacao"
					placeholder="Descreva o defeito ou a região da rebarba..."></textarea>



			</div>







			<div class="form-group">



				<label for="data">Data do Registro</label> <input type="date"
					id="data">



			</div>







			<div class="form-group">

				<div class="vedado-panel">
					<div class="vedado-head">
						<span class="vedado-title" id="lblVedado">Vedado?</span>
						<span class="vedado-helper">Bloqueia a cavidade na produção</span>
					</div>
					<div class="vedado-segmented" role="radiogroup" aria-labelledby="lblVedado">
						<label class="vedado-option vedado-option-nao">
							<input type="radio" name="vedado" value="N" checked>
							<span>Não</span>
						</label>
						<label class="vedado-option vedado-option-sim">
							<input type="radio" name="vedado" value="S">
							<span>Sim</span>
						</label>
					</div>
				</div>



			</div>







			<div class="form-group">



				<label for="controlador">Controlador Responsável</label> <input
					type="text" id="controlador" class="is-readonly" readonly
					aria-readonly="true" autocomplete="off"
					placeholder="Usuário ativo no Fusion" value="">



			</div>







			<div class="btn-group btn-acoes-principais">
				<button class="btn btn-danger" id="btnExcluir" type="button">EXCLUIR REG.</button>
				<button class="btn btn-secondary" id="btnImprimir" type="button" style="display:none">IMPRIMIR</button>
				<button class="btn btn-success" id="btnPublicarGrade" type="button">PUBLICAR</button>
			</div>
			<div class="auto-save-status" id="autoSaveStatus" role="status" aria-live="polite">
				<span class="auto-save-dot" aria-hidden="true"></span>
				<span id="autoSaveMensagem">Preencha um desvio/defeito. As alterações serão salvas automaticamente.</span>
			</div>













			<aside class="help-box" aria-label="Como usar o registro de não conformidades">



				<div class="help-head">
					<div class="help-badge" aria-hidden="true">?</div>
					<div><h4>Como usar</h4><p>Registre não conformidades sem botão de salvar.</p></div>
					<span class="help-auto">Auto-save ativo</span>
				</div>



				<ol class="help-steps">
					<li><span class="help-step">1</span><div><strong>Selecione a cavidade</strong><small>Clique no diagrama ou na tabela. Use <b>Ctrl/Cmd + clique</b> para várias cavidades; clique no número central da zona para selecionar todas as 16.</small></div></li>



					<li><span class="help-step">2</span><div><strong>Descreva o desvio ou defeito</strong><small>Escolha um item da lista ou digite livremente. Para REB. ou OUTRO, descreva no campo Observação.</small></div></li>



					<li><span class="help-step">3</span><div><strong>Defina se está vedado</strong><small>Marque <b>NÃO É VEDADO</b> para registrar defeito ou <b>É VEDADO</b> para bloquear a produção da cavidade.</small></div></li>



					<li><span class="help-step">4</span><div><strong>Confira e finalize</strong><small>O sistema aplica o registro e salva automaticamente. Use <b>EXCLUIR REGISTRO</b> apenas para apagar uma seleção incorreta. Ao finalizar, imprima ou publique a grade.</small></div></li>



				</ol>



				<div class="help-legend">
					<span class="help-legend-title">Legenda</span>
					<span><i class="help-dot help-dot-red"></i><b>Vermelho</b> Vedada (S)</span>
					<span><i class="help-dot help-dot-yellow"></i><b>Amarelo</b> Defeito (N)</span>
					<span><i class="help-dot help-dot-neutral"></i><b>Cinza</b> Sem registro</span>
				</div>



				<div class="help-foot"><strong>Dica:</strong> clique duas vezes em uma cavidade com registro para ver os detalhes. A impressão gera uma folha A4 única.</div>



			</aside>



		</aside>







		<section class="painel-grade">



			<div class="header-grade">



				<div class="logo-box">



					<img
						src="${pageContext.request.contextPath}/assets/logos/Logo%20Compactor.svg"
						alt="Logo Compactor">



					<div class="logo-fallback" id="logoFallback">



						<div class="logo-text">COMPACTOR</div>



						<div class="logo-sub">Cia. de Canetas</div>



					</div>



				</div>



				<div class="title-box">



					<h1>CAVIDADES NÃO CONFORMES</h1>



				</div>



				<div class="info-molde">



					<div class="produto">



						<span class="editable" data-field="produto" contenteditable="true">CONEXÕES



							ESFEROGRÁFICAS</span>



					</div>



					<div class="molde-num">



						<strong>Molde </strong><span class="editable"
							data-field="moldeNum" contenteditable="true">168</span>



					</div>



					<div class="molde-mod">



						<span class="editable" data-field="moldeMod"
							contenteditable="true">Coreano SW 1307</span>



					</div>



				</div>



			</div>







			<div class="corpo-grade">



				<div class="tabela-cav">



					<table>



						<thead>



							<tr>



								<th>Cav</th>



								<th>Desvio</th>



								<th>Data</th>



								<th>Vedado</th>



								<th>Controlador</th>



								<th>Cav</th>



								<th>Desvio</th>



								<th>Data</th>



								<th>Vedado</th>



								<th>Controlador</th>



							</tr>



						</thead>



						<tbody id="tbodyCavidades"></tbody>



					</table>



				</div>







				<div class="area-direita">



					<div class="diagrama-box">



						<svg viewBox="0 0 1300 1350" id="svgDiagrama"
							xmlns="http://www.w3.org/2000/svg"></svg>



						<div class="aviso-box" id="avisoLayout" style="display: none"></div>



					</div>







					<div class="peca-box" id="pecaBox">



						<div class="peca-box-header">



							<h3 class="peca-box-title">DESENHO DA PEÇA</h3>



							<button type="button" class="btn-peca-3d" id="btnAbrir3D"
								title="Abrir peça em 3D com vistas do SolidWorks (Ctrl+1 a Ctrl+8)">



								<svg viewBox="0 0 24 24" width="13" height="13" fill="none"
									stroke="currentColor" stroke-width="2">



									<path
										d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>



									<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>



									<line x1="12" y1="22.08" x2="12" y2="12"></line>



								</svg>



								<span>VER EM 3D</span>



							</button>



						</div>



						<div class="peca-card-preview" id="pecaGatilho"
							title="Clique para abrir e girar a peça em 3D (SolidWorks)">



							<img id="pecaImg"
								src="${pageContext.request.contextPath}/assets/images/conex%C3%A3o%20esferografica.png"
								alt="Desenho da peça - Conexão Esferográfica"
								onerror="this.style.display='none'; document.getElementById('pecaErro').style.display='block';">



							<div class="peca-erro" id="pecaErro" style="display: none">



								Imagem não encontrada.</div>



							<div class="peca-hover-badge">



								<svg viewBox="0 0 24 24" width="12" height="12" fill="none"
									stroke="currentColor" stroke-width="2">



									<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>



								</svg>




							</div>



						</div>



					</div>







					<div class="legenda-box">



						<h3>LEGENDA</h3>



						<div class="leg-item">



							<span class="leg-sigla">F.P.F.Q.</span> Frente do pino de formato



							quebrada



						</div>



						<div class="leg-item">



							<span class="leg-sigla">P.F.Q.</span> Pino do formato quebrado



						</div>



						<div class="leg-item">



							<span class="leg-sigla">V.P.F.</span> Vedada pela ferramentaria



						</div>



						<div class="leg-item">



							<span class="leg-sigla">REB.</span> Rebarba - especificar região



						</div>



						<div class="leg-item">



							<span class="leg-sigla">B.V.</span> Bucha virada



						</div>



						<div class="leg-item">



							<span class="leg-sigla">C.P.Q.</span> Contra pino quebrado



						</div>



						<div class="leg-item">



							<span class="leg-sigla">B.B.F.Q.</span> Boca da bucha do formato



							quebrada



						</div>



					</div>







					<div class="info-entrada">



						<h3>INFORMAÇÕES DE ENTRADA DO MOLDE</h3>



						<div class="info-linha">



							<span class="info-label">Material</span><span class="editable"
								data-field="material" contenteditable="true">POLIPROPILENO



								PP</span>



						</div>



						<div class="info-linha">



							<span class="info-label">Máquinas</span><span
								data-field="maquina"></span>
						</div>

						<div class="info-linha">
							<span class="info-label">TOTAL DE CAVIDADES NO MOLDE</span><span data-field="cavidadesTotais"></span>
						</div>

						<div class="info-linha">
							<span class="info-label">CAVIDADES ATIVAS</span><span data-field="cavidadesAtivas"></span>



						</div>



						<div class="info-linha">



							<span class="info-label">Controlador resp. abertura</span><span
								data-field="controladorAbertura"></span>



						</div>



						<div class="info-linha">



							<span class="info-label">Data da entrada do molde</span><span
								data-field="dataEntrada"></span>



						</div>



						<div class="info-linha">



							<span class="info-label">Atualização / responsável</span><span
								class="editable" data-field="dataAtualizacao"
								contenteditable="true"></span>



						</div>



						<div class="info-linha">



							<span class="info-label">Observações adicionais</span><span
								class="editable" data-field="observacoes" contenteditable="true"></span>



						</div>



					</div>







					<div class="revisao">



						Revisão <span data-field="revisaoNum">07</span> - Data <span
							data-field="revisaoData">02/01/2027</span>



					</div>



				</div>



			</div>



		</section>



	</div>







	<!-- ===== FOLHA DE IMPRESSÃO (montada via JS, dimensionada em mm reais de A4) ===== -->



	<div class="folha-impressao" id="folhaImpressao">



		<div class="folha-cabecalho">



			<div class="folha-cab-logo" id="folhaLogoBox">



				<img id="folhaLogoImg"
					src="${pageContext.request.contextPath}/assets/logos/Logo%20Compactor.svg"
					alt="Logo"
					onerror="this.style.display='none'; document.getElementById('folhaLogoFallback').style.display='block';">



				<div id="folhaLogoFallback" style="display: none">



					<div class="fb-nome">COMPACTOR</div>



					<div class="fb-sub">Cia. de Canetas</div>



				</div>



			</div>



			<div class="folha-cab-titulo">



				<h1>CAVIDADES NÃO CONFORMES</h1>



			</div>



			<div class="folha-cab-info">



				<div class="produto" id="folhaProduto">CONEXÕES ESFEROGRÁFICAS</div>



				<div class="molde" id="folhaMoldeNum">Molde 168</div>



				<div id="folhaMoldeMod">Coreano SW 1307</div>



			</div>



		</div>



		<div class="folha-corpo-impressao">



			<div class="folha-col">



				<div class="tabela-esquerda-wrap">



					<table class="folha-tabela">



						<thead>



							<tr>



								<th>Cav.</th>



								<th>Desvio</th>



								<th>Data</th>



								<th>Vedado</th>



								<th>Controlador</th>



							</tr>



						</thead>



						<tbody id="folhaTbodyEsquerda"></tbody>



					</table>



				</div>



			</div>



			<div class="folha-col folha-bloco-direita">



				<div class="tabela-direita-wrap">



					<table class="folha-tabela">



						<thead>



							<tr>



								<th>Cav.</th>



								<th>Desvio</th>



								<th>Data</th>



								<th>Vedado</th>



								<th>Controlador</th>



							</tr>



						</thead>



						<tbody id="folhaTbodyDireita"></tbody>



					</table>



				</div>



				<div class="folha-diagrama" id="folhaDiagramaBox"></div>



				<div class="folha-peca">



					<img id="folhaPecaImg" alt="Peça">



				</div>



				<div class="folha-legenda">



					<h3>LEGENDA:</h3>



					<div class="fl-item">



						<span class="fl-sigla">F.P.F.Q.</span><span>Frente do pino



							de formato quebrada</span>



					</div>



					<div class="fl-item">



						<span class="fl-sigla">P.F.Q.</span><span>Pino do formato



							Quebrado</span>



					</div>



					<div class="fl-item">



						<span class="fl-sigla">V.P.F.</span><span>Vedada pela



							ferramentaria</span>



					</div>



					<div class="fl-item">



						<span class="fl-sigla">REB.</span><span>Rebarba



							(especificar região da rebarba)</span>



					</div>



					<div class="fl-item">



						<span class="fl-sigla">B.V.</span><span>Bucha Virada</span>



					</div>



					<div class="fl-item">



						<span class="fl-sigla">C.P.Q.</span><span>Contra pino



							quebrado</span>



					</div>



					<div class="fl-item">



						<span class="fl-sigla">B.B.F.Q.</span><span>Boca da bucha



							do formato quebrada</span>



					</div>



				</div>



				<div class="folha-info">



					<h3>INFORMAÇÕES DE ENTRADA DO MOLDE</h3>



					<div class="fi-linha">



						<span>Material:</span><strong id="folhaMaterial"></strong>



					</div>



					<div class="fi-linha">



						<span>Máquina:</span><strong id="folhaMaquina"></strong>
					</div>

					<div class="fi-linha">
						<span>Cavidades (total / ativas):</span><strong id="folhaCavidades"></strong>



					</div>



					<div class="fi-linha">



						<span>Controlador resp.(abertura do documento):</span><strong
							id="folhaControladorAbertura"></strong>



					</div>



					<div class="fi-linha">



						<span>Data da entrada do molde:</span><strong
							id="folhaDataEntrada"></strong>



					</div>



					<div class="fi-linha">



						<span>Data de atualização da grade/Responsável:</span><strong
							id="folhaDataAtualizacao"></strong>



					</div>



					<div style="margin-top: 1mm;">



						<em>Observações adicionais:</em> <span id="folhaObservacoes"></span>



					</div>



				</div>



				<div class="folha-revisao" id="folhaRevisao"></div>



			</div>



		</div>



	</div>







	<div class="modal-overlay" id="modalOverlay">



		<div class="modal">



			<h3>



				Detalhes da Cavidade <span id="modalCavNum"></span>



			</h3>



			<div id="modalConteudo"></div>



			<div class="modal-actions">



				<button class="btn" id="modalEditar" type="button">EDITAR</button>



				<button class="btn btn-danger" id="modalExcluir" type="button">EXCLUIR</button>



				<button class="btn btn-secondary" id="modalFechar" type="button">FECHAR</button>



			</div>



		</div>



	</div>







	<div class="modal-overlay" id="modalAbrirGrade">
		<div class="modal modal-abrir modal-checklist" role="dialog" aria-modal="true" aria-labelledby="modalAbrirTitle">
			<div class="modal-head modal-head-abrir">
				<div class="modal-abrir-badge" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
						<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11z"></path>
						<path d="M8 8h8M8 12h8M8 16h4"></path>
					</svg>
				</div>
				<div class="modal-abrir-headcopy">
					<div class="modal-kicker">CONTROLE DE QUALIDADE</div>
					<h3 id="modalAbrirTitle">Check-list de Moldes</h3>
					<div class="hint">Preencha os dados de entrada e valide o check-list antes de liberar a produção.</div>
				</div>
				<div class="modal-abrir-status">
					<span class="modal-abrir-status-dot"></span>
					Pré-liberação
				</div>
			</div>

			<div class="modal-bloco">
				<div class="form-grid form-grid-abrir">
					<div class="form-group form-span-2">
						<label for="selMoldeBusca">Qual molde?</label>
						<div class="combo" id="comboMolde">
							<div class="combo-control">
								<input id="selMoldeBusca" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="listaComboMoldes" autocomplete="off" placeholder="Digite para filtrar ou escolher um molde">
								<button class="combo-toggle" id="toggleComboMolde" type="button" aria-label="Mostrar moldes">
									<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
								</button>
							</div>
							<div class="combo-list" id="listaComboMoldes" role="listbox" aria-label="Lista de moldes" hidden></div>
							<input type="hidden" id="selMolde" value="">
						</div>
					</div>

					<div class="form-group">
						<label for="selMaquinaBusca">Qual máquina?</label>
						<div class="combo" id="comboMaquina">
							<div class="combo-control">
								<input id="selMaquinaBusca" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="listaComboMaquinas" autocomplete="off" placeholder="Digite para filtrar ou escolher">
								<button class="combo-toggle" id="toggleComboMaquina" type="button" aria-label="Mostrar máquinas">
									<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
								</button>
							</div>
							<div class="combo-list" id="listaComboMaquinas" role="listbox" aria-label="Lista de máquinas" hidden></div>
							<input type="hidden" id="selMaquina" value="">
						</div>
					</div>

					<div class="form-group">
						<label for="dataAbertura">Data de entrada</label>
						<input type="date" id="dataAbertura">
					</div>

					<div class="form-group">
						<label for="cavidadesTotal">Quantidade total de cavidades no molde</label>
						<input type="number" id="cavidadesTotal" min="1" step="1" inputmode="numeric" placeholder="Ex.: 64">
					</div>

					<div class="form-group">
						<label for="cavidadesAtivas">Quantidade de cavidades ativas</label>
						<input type="number" id="cavidadesAtivas" min="0" step="1" inputmode="numeric" placeholder="Ex.: 58">
					</div>

					<div class="form-group form-span-2">
						<label for="materiaPrima">Matéria-prima</label>
						<input type="text" id="materiaPrima" autocomplete="off" placeholder="Ex.: POLIPROPILENO (PP), PS, ABS...">
					</div>

				</div>
			</div>

			<div class="modal-bloco modal-bloco-checklist">

				<div class="form-grid cols-3 form-grid-checklist">
					<div class="form-group">
						<label for="clSituacao">Situação da entrada</label>
						<select id="clSituacao">
							<option value="">Selecione</option>
							<option value="RETORNO PARA PRODUÇÃO">RETORNO PARA PRODUÇÃO</option>
							<option value="RETORNO PÓS-AJUSTE">RETORNO PÓS-AJUSTE</option>
							<option value="MOLDE NOVO">MOLDE NOVO</option>
							<option value="TROCA DE MÁQUINA">TROCA DE MÁQUINA</option>
						</select>
					</div>
					<div class="form-group">
						<label for="clControlador">Controlador</label>
						<input type="text" id="clControlador" autocomplete="off" readonly aria-readonly="true" placeholder="Usuário ativo no Fusion">
					</div>
					<div class="form-group">
						<label for="clStatus">Status</label>
						<select id="clStatus">
							<option value="">Selecione</option>
							<option value="LIBERADO">LIBERADO</option>
							<option value="REPROVADO">REPROVADO</option>
						</select>
					</div>
				</div>

				<div class="cl-tabela" id="clTabela"></div>

				<div class="form-group">
					<label for="clObservacoes">Observações</label>
					<textarea id="clObservacoes" rows="2" placeholder="Observações do controle de qualidade"></textarea>
				</div>
			</div>

			<div class="form-erro" id="abrirGradeErro" style="display: none" role="alert"></div>

			<div class="modal-actions">
				<button class="btn btn-secondary" id="btnCancelarAbrir" type="button">CANCELAR</button>
				<button class="btn btn-success" id="btnConfirmarAbrir" type="button" disabled>ABRIR GRADE</button>
			</div>
		</div>
	</div>

	<div class="modal-overlay" id="modalPublicarGrade" aria-hidden="true">
		<div class="modal modal-publicar" role="dialog" aria-modal="true" aria-labelledby="modalPublicarTitle">
			<h3 id="modalPublicarTitle">Publicar grade no GED</h3>
			<p class="hint">Selecione o status da publicação. O status é obrigatório.</p>

			<div class="pub-status-group" role="radiogroup" aria-label="Status da publicação">
				<label class="pub-status-option">
					<input type="radio" name="statusPublicacao" value="TERMINO_PRODUCAO">
					<span>Término de produção</span>
				</label>
				<label class="pub-status-option">
					<input type="radio" name="statusPublicacao" value="DEFEITO_MOLDE">
					<span>Defeito no molde</span>
				</label>
				<label class="pub-status-option">
					<input type="radio" name="statusPublicacao" value="MUDANCA_MAQUINA">
					<span>Mudança de máquina</span>
				</label>
			</div>

			<div class="form-group">
				<label for="publicacaoObservacao">Observação <span class="opcional">(opcional)</span></label>
				<textarea id="publicacaoObservacao" rows="4" maxlength="500" placeholder="Descreva detalhes da publicação, se necessário."></textarea>
			</div>

			<div class="form-erro" id="publicacaoErro" hidden role="alert"></div>

			<div class="modal-actions">
				<button class="btn btn-secondary" id="btnCancelarPublicacao" type="button">CANCELAR</button>
				<button class="btn btn-success" id="btnConfirmarPublicacao" type="button" disabled>PUBLICAR</button>
			</div>
		</div>
	</div>

	<div class="publicacao-overlay" id="publicacaoOverlay" role="status" aria-live="polite" aria-hidden="true">
		<div class="publicacao-card">
			<div class="publicacao-spinner" aria-hidden="true"></div>
			<strong id="publicacaoLoadingTitulo">Publicando grade...</strong>
			<span id="publicacaoLoadingTexto">Gerando o PDF e enviando ao GED. Aguarde.</span>
		</div>
	</div>

	<div class="modal-overlay" id="modalCadastrarMolde">
		<div class="modal modal-abrir">
                        <div class="modal-head">
                                <h3 id="cadMoldeTitulo">Cadastrar molde</h3>
                                <div class="hint" id="cadMoldeHint">Preencha os dados e anexe os arquivos. O SVG da
                                        grade abre o diagrama no padrao do molde; o arquivo 3D/Solid e
                                        usado na visualizacao e fica anexado ao molde.</div>
                        </div>

                        <div class="form-grid" id="cadEditarBloco" style="display:none; margin-bottom:12px;">
                                <div class="form-group" style="grid-column:1 / -1;">
                                        <label for="cadMoldeEditBusca">Molde para editar</label>
                                        <div class="combo" id="comboCadMoldeEdit">
                                                <div class="combo-control">
                                                        <input id="cadMoldeEditBusca" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="listaComboCadMoldeEdit" autocomplete="off" placeholder="Digite para filtrar ou escolher o molde">
                                                        <button class="combo-toggle" id="toggleComboCadMoldeEdit" type="button" aria-label="Mostrar moldes">
                                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                        </button>
                                                </div>
                                                <div class="combo-list" id="listaComboCadMoldeEdit" role="listbox" aria-label="Lista de moldes" hidden></div>
                                                <input type="hidden" id="cadMoldeEditCodigo" value="">
                                        </div>
                                </div>
                        </div>

                        <div class="form-grid">
				<div class="form-group">
					<label for="cadCodigo">Codigo do molde</label> <input type="text"
						id="cadCodigo" placeholder="Ex.: 11A">
				</div>

				<div class="form-group">
					<label for="cadNomePeca">Nome da peca</label> <input type="text"
						id="cadNomePeca" placeholder="Ex.: Bico Para Frasco De Cola 40G">
				</div>

				<div class="form-group">
					<label for="cadFamilia">Familia</label> <input type="text"
						id="cadFamilia" placeholder="Ex.: Colas, Esferograficas...">
				</div>

				<div class="form-group">
					<label for="cadCavidades">Quantidade de cavidades</label> <input
						type="number" id="cadCavidades" min="1" value="16">
				</div>

				<div class="form-group">
					<label for="cadMaterial">Material</label> <input type="text"
						id="cadMaterial" placeholder="Ex.: PP 400">
				</div>

                                <div class="form-group">
                                        <label for="cadMaquinaBusca">Maquina</label>
                                        <div class="combo" id="comboCadMaquina">
                                                <div class="combo-control">
                                                        <input id="cadMaquinaBusca" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="listaComboCadMaquinas" autocomplete="off" placeholder="Digite para filtrar ou escolher">
                                                        <button class="combo-toggle" id="toggleComboCadMaquina" type="button" aria-label="Mostrar máquinas">
                                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                                                        </button>
                                                </div>
                                                <div class="combo-list" id="listaComboCadMaquinas" role="listbox" aria-label="Lista de máquinas" hidden></div>
                                                <input type="hidden" id="cadMaquina" value="">
                                        </div>
                                </div>
			</div>

			<div class="form-grid form-grid-upload">
				<div class="form-group upload-group">
					<label class="upload-label">Grade do molde (SVG)</label> <label
						class="upload-btn" for="cadGradeSvg"> <span class="upload-icone">⬆</span>
						<span class="upload-texto" id="cadGradeSvgNome">Selecionar SVG da grade</span>
					</label> <input type="file" id="cadGradeSvg"
						accept=".svg,image/svg+xml" class="upload-input">
					<div class="upload-preview" id="cadGradeSvgPreview"></div>
				</div>

				<div class="form-group upload-group">
					<label class="upload-label">Desenho da peca injetada (PNG/JPG/SVG)</label>
					<label class="upload-btn" for="cadImagem"> <span class="upload-icone">🖼</span>
						<span class="upload-texto" id="cadImagemNome">Selecionar desenho</span>
					</label> <input type="file" id="cadImagem"
						accept="image/png,image/jpeg,image/svg+xml" class="upload-input">
					<div class="upload-preview" id="cadImagemPreview"></div>
				</div>

				<div class="form-group upload-group">
					<label class="upload-label">Arquivo 3D / Solid (STL, SLDPRT, STEP...)</label>
					<label class="upload-btn" for="cadArquivoCad"> <span
						class="upload-icone">⬆</span> <span class="upload-texto"
						id="cadArquivoCadNome">Selecionar arquivo 3D/Solid</span>
					</label> <input type="file" id="cadArquivoCad"
						accept=".stl,.sldprt,.sldasm,.step,.stp,.igs,.iges,.x_t,.x_b,.jt,.3dxml"
						class="upload-input">
					<div class="upload-preview" id="cadArquivoCadPreview"></div>
				</div>
			</div>

			<div class="form-erro" id="cadMoldeErro" style="display: none"></div>

                        <div class="modal-actions">
                                <button class="btn btn-danger" id="btnExcluirCadMolde"
                                        type="button" style="display:none; margin-right:auto;">EXCLUIR MOLDE</button>
                                <button class="btn btn-secondary" id="btnCancelarCadMolde"
                                        type="button">CANCELAR</button>
                                <button class="btn btn-success" id="btnConfirmarCadMolde"
                                        type="button">CADASTRAR</button>
                        </div>
		</div>
	</div>

	<div class="modal-overlay" id="modalConfirmarExclusao" aria-hidden="true">
		<div class="modal modal-confirmar" role="dialog" aria-modal="true" aria-labelledby="confirmarExclusaoTitulo">
			<div class="modal-head">
				<h3 id="confirmarExclusaoTitulo">Excluir molde</h3>
			</div>
			<p class="confirmar-texto" id="confirmarExclusaoMsg">Essa ação remove o cadastro e pode afetar grades vinculadas.</p>
			<div class="modal-actions">
				<button class="btn btn-secondary" id="btnCancelarExclusao" type="button">CANCELAR</button>
				<button class="btn btn-danger" id="btnConfirmarExclusao" type="button">EXCLUIR</button>
			</div>
		</div>
	</div>

	<div class="modal-overlay" id="modalConfirmarExclusaoGrade" aria-hidden="true">
		<div class="modal modal-confirmar" role="dialog" aria-modal="true"
			aria-labelledby="confirmarExclusaoGradeTitulo">
			<div class="modal-head">
				<h3 id="confirmarExclusaoGradeTitulo">Excluir grade</h3>
			</div>
			<p class="confirmar-texto" id="confirmarExclusaoGradeMsg">
				Essa ação exclui a grade e seus registros associados. Não pode ser desfeita.
			</p>
			<div class="modal-actions">
				<button class="btn btn-secondary" id="btnCancelarExclusaoGrade" type="button">CANCELAR</button>
				<button class="btn btn-danger" id="btnConfirmarExclusaoGrade" type="button">EXCLUIR GRADE</button>
			</div>
		</div>
	</div>

	<div class="modal-overlay" id="modalPapeis" aria-hidden="true">
		<div class="modal modal-papeis" role="dialog" aria-modal="true" aria-labelledby="modalPapeisTitulo">
			<div class="modal-head">
				<h3 id="modalPapeisTitulo">Permissões por papel do Fusion</h3>
				<p class="hint">As permissões são somadas quando o usuário possui mais de um papel.
					Um papel sem <strong>Visualizar</strong> não acessa o projeto.</p>
			</div>
			<div class="papeis-toolbar">
				<input type="text" id="papelManualCodigo" autocomplete="off"
					placeholder="Código do papel (ex.: ferramentaria-grades)">
				<button class="btn btn-secondary" id="btnAdicionarPapelManual" type="button">ADICIONAR PAPEL</button>
			</div>
			<div class="papeis-aviso" id="papeisAviso" role="status"></div>
			<div class="papeis-lista" id="papeisLista"></div>
			<div class="modal-actions">
				<button class="btn btn-secondary" id="btnCancelarPapeis" type="button">CANCELAR</button>
				<button class="btn btn-success" id="btnSalvarPapeis" type="button">SALVAR PERMISSÕES</button>
			</div>
		</div>
	</div>

	<script
		src="${pageContext.request.contextPath}/js/core/estado.js?v=20261029f"></script>
	<script
		src="${pageContext.request.contextPath}/js/core/persistencia.js?v=20261116d"></script>
	<script
		src="${pageContext.request.contextPath}/js/layouts/generators.js"></script>
	<script src="${pageContext.request.contextPath}/js/render/svg.js"></script>
	<script
		src="${pageContext.request.contextPath}/js/render/formulario.js?v=20261113a"></script>
	<script
		src="${pageContext.request.contextPath}/js/render/cabecalho.js?v=20261029f"></script>
	<script src="${pageContext.request.contextPath}/js/render/tabela.js"></script>
	<script src="${pageContext.request.contextPath}/js/render/diagrama.js"></script>
	<script src="${pageContext.request.contextPath}/js/render/resumo.js"></script>
	<script src="${pageContext.request.contextPath}/js/core/registros.js?v=20261116b"></script>
	<script src="${pageContext.request.contextPath}/js/render/modal.js"></script>
	<script
		src="${pageContext.request.contextPath}/js/render/impressao.js?v=20261116a"></script>
	<script
		src="${pageContext.request.contextPath}/js/core/configLoader.js?v=20261113a"></script>
	<script
		src="${pageContext.request.contextPath}/js/render/telaInicial.js?v=20261116d"></script>
		<!-- Modal 3D (visualizador da peca) -->
	<div class="modal-overlay" id="modalPeca3D">
		<div class="modal modal-3d modal-3d-dark" role="dialog" aria-modal="true"
			aria-labelledby="modalPeca3dTitulo">

			<div class="m3d-topbar">

				<div class="m3d-topbar-left">
					<span class="m3d-mark" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
							stroke-width="1.8">
							<path d="M12 2 21 7v10l-9 5-9-5V7z"></path>
							<path d="m3 7 9 5 9-5M12 12v10"></path>
						</svg>
					</span>
					<div class="m3d-topbar-text">
						<h3 class="m3d-title" id="modalPeca3dTitulo">Desenho 3D da Peça</h3>
						<div class="m3d-subtitle" id="modalPeca3dSub">Visualização técnica 3D</div>
					</div>
					<span class="m3d-chip m3d-chip-solid">SOLIDWORKS 3D</span>
				</div>

				<div class="m3d-topbar-right">
					<button class="m3d-icon-btn" id="btnFecharModal3D" type="button"
						aria-label="Fechar visualizador 3D"
						onclick="if(window.CF &amp;&amp; CF.visualizador3d) CF.visualizador3d.fecharModal3D();"
						title="Fechar visualizador 3D (Esc)">
						<svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor"
							stroke-width="2" fill="none">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>

			</div>

			<div class="m3d-workspace">

				<div class="m3d-stage">

					<div class="m3d-viewport" id="m3dViewport">
						<div class="m3d-loading" id="m3dLoading" style="display:flex">Modelo 3D indisponível</div>
						<canvas id="m3dCanvas" width="934" height="477"></canvas>
						<div class="m3d-viewport-vignette" aria-hidden="true"></div>
						<div class="m3d-hud-view" id="m3dViewIndicator">
							<span class="m3d-hud-dot"></span><span id="m3dViewTexto">Vista:
								Perspectiva Isométrica (Ctrl+7)</span>
						</div>
						<div class="m3d-hud-measure" id="m3dHudMeasure" style="display:none">
							<span class="m3d-hud-measure-dot"></span><span
								id="m3dHudMeasureText">PONTO 1 DE 2 · selecione a origem</span>
						</div>
						<div class="m3d-cursor-tag" id="m3dSnapTag" style="display:none">VÉRTICE</div>
						<div class="m3d-callout" id="m3dCallout" style="display:none">
							<span id="m3dCalloutValue">0,00 mm</span>
						</div>
						<div class="m3d-gizmo" id="m3dGizmo" aria-hidden="true">
							<span class="m3d-axis axis-x" title="Eixo X (Vermelho)">X</span>
							<span class="m3d-axis axis-y" title="Eixo Y (Verde)">Y</span>
							<span class="m3d-axis axis-z" title="Eixo Z (Azul)">Z</span>
						</div>

						<!-- Dock de ferramentas centralizado no rodapé do viewport (estilo Autodesk) -->
						<!-- HUD: medições e anotações no canto superior esquerdo -->
						<div class="m3d-hud" id="m3dHud" aria-label="Medições e anotações">
							<div class="m3d-hud-card">
								<div class="m3d-hud-card-head">
									<span class="m3d-hud-card-title">MEDIÇÕES</span>
									<span class="m3d-hud-count" id="m3dResultsCount">0</span>
									<button type="button" class="m3d-link-btn" id="btnM3dLimparMedicoes"
										title="Remover todas as medições" disabled>Limpar</button>
								</div>
								<div class="m3d-hud-list" id="m3dMeasureList"></div>
							</div>

							<div class="m3d-hud-card">
								<div class="m3d-hud-card-head">
									<span class="m3d-hud-card-title">ANOTAÇÕES</span>
									<span class="m3d-hud-count" id="m3dNotasCount">0</span>
									<button type="button" class="m3d-link-btn" id="btnM3dLimparNotas"
										title="Remover somente as suas anotações" disabled>Minhas</button>
								</div>
								<div class="m3d-hud-list m3d-notas-list" id="m3dNotasList"></div>
							</div>
						</div>

						<!-- Balão de configuração da ferramenta ativa (acima do dock) -->
						<div class="m3d-tool-panel" id="tpMedicao" role="toolbar" aria-label="Configuração da medição">
							<div class="m3d-unit-switch" role="group" aria-label="Unidade de medida">
								<button type="button" class="m3d-unit-btn ativo" data-unit="mm"
									aria-pressed="true" title="Milímetros">mm</button>
								<button type="button" class="m3d-unit-btn" data-unit="cm"
									aria-pressed="false" title="Centímetros">cm</button>
							</div>
							<span class="m3d-sep" aria-hidden="true"></span>
							<button type="button" class="m3d-mode-btn" aria-pressed="true"
								data-measure-mode="distancia" title="Distância entre 2 pontos (M)">
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none"
									stroke="currentColor" stroke-width="1.8">
									<path d="M5 12h14M5 8v8M19 8v8"></path>
									<path d="m8 9-3 3 3 3m8-6 3 3-3 3"></path>
								</svg>
								<span class="m3d-mode-short">Distância</span>
							</button>
							<button type="button" class="m3d-mode-btn" aria-pressed="false"
								data-measure-mode="diametro"
								title="Diâmetro por 3 pontos da circunferência">
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none"
									stroke="currentColor" stroke-width="1.7">
									<circle cx="12" cy="12" r="8"></circle>
									<path d="M4 12h16m-4-3 4 3-4 3M8 9l-4 3 4 3"></path>
								</svg>
								<span class="m3d-mode-short">Diâmetro</span>
							</button>
							<button type="button" class="m3d-mode-btn" aria-pressed="false"
								data-measure-mode="angulo"
								title="Ângulo entre dois segmentos (3 pontos)">
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none"
									stroke="currentColor" stroke-width="1.7">
									<path d="M4 19h16M4 19 16 5"></path>
									<path d="M10 19a6 6 0 0 0-1.76-4.24"></path>
									<circle cx="4" cy="19" r="1.25"></circle>
								</svg>
								<span class="m3d-mode-short">Ângulo</span>
							</button>
							<button type="button" class="m3d-mode-btn" aria-pressed="false"
								data-measure-mode="caixa"
								title="Medir os limites X, Y e Z do modelo">
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none"
									stroke="currentColor" stroke-width="1.7">
									<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"></path>
									<path d="m4 7.5 8 4.5 8-4.5M12 12v9M2 19h5m-2.5-2.5L2 19l2.5 2.5"></path>
								</svg>
								<span class="m3d-mode-short">Caixa</span>
							</button>
							<span class="m3d-sep" aria-hidden="true"></span>
							<span class="m3d-tool-status" id="m3dMeasureStatus" role="status" aria-live="polite">
								<span class="m3d-status-dot"></span><span
									id="m3dMeasureStatusText">Clique na peça para medir</span>
							</span>
						</div>

						<div class="m3d-tool-panel" id="tpCorte" role="toolbar" aria-label="Configuração do corte">
							<label class="m3d-corte-switch">
								<input type="checkbox" id="corteAtivoCheck"> Ligar corte
							</label>
							<span class="m3d-sep" aria-hidden="true"></span>
							<button type="button" class="m3d-corte-eixo" data-eixo="x">X</button>
							<button type="button" class="m3d-corte-eixo ativo" data-eixo="y">Y</button>
							<button type="button" class="m3d-corte-eixo" data-eixo="z">Z</button>
							<span class="m3d-sep" aria-hidden="true"></span>
							<input type="range" class="m3d-corte-range" id="corteOffset" min="-100"
								max="100" value="0" aria-label="Deslizamento do plano de corte">
							<span class="m3d-tool-extra" id="corteOffsetTexto">0%</span>
							<span class="m3d-sep" aria-hidden="true"></span>
							<label class="m3d-corte-switch">
								<input type="checkbox" id="corteInverter"> Inverter lado
							</label>
						</div>

						<div class="m3d-tool-panel" id="tpExibicao" role="toolbar" aria-label="Estilo de exibição">
							<button type="button" class="m3d-estilo-opt ativo" data-estilo="sombreado-arestas"
								aria-pressed="true" title="Sombreado com arestas">Sombreado com arestas</button>
							<button type="button" class="m3d-estilo-opt" data-estilo="sombreado"
								aria-pressed="false" title="Sombreado">Sombreado</button>
							<button type="button" class="m3d-estilo-opt" data-estilo="linhas-ocultas-removidas"
								aria-pressed="false" title="Linhas ocultas removidas">Linhas ocultas removidas</button>
							<button type="button" class="m3d-estilo-opt" data-estilo="linhas-ocultas-visiveis"
								aria-pressed="false" title="Linhas ocultas visíveis">Linhas ocultas visíveis</button>
							<button type="button" class="m3d-estilo-opt" data-estilo="wireframe"
								aria-pressed="false" title="Estrutura de arame">Estrutura de arame</button>
						</div>

						<div class="m3d-dock" role="toolbar" aria-label="Ferramentas do visualizador 3D">
						<div class="m3d-dock-group m3d-dock-views">
							<button type="button" class="m3d-view-btn" data-view="1" title="Vista Frontal (Ctrl + 1)">Frontal<span class="m3d-kbd">1</span></button>
							<button type="button" class="m3d-view-btn" data-view="2" title="Vista Posterior (Ctrl + 2)">Posterior<span class="m3d-kbd">2</span></button>
							<button type="button" class="m3d-view-btn" data-view="3" title="Vista Lateral Esquerda (Ctrl + 3)">Esq<span class="m3d-kbd">3</span></button>
							<button type="button" class="m3d-view-btn" data-view="4" title="Vista Lateral Direita (Ctrl + 4)">Dir<span class="m3d-kbd">4</span></button>
							<button type="button" class="m3d-view-btn" data-view="5" title="Vista Superior (Ctrl + 5)">Superior<span class="m3d-kbd">5</span></button>
							<button type="button" class="m3d-view-btn" data-view="6" title="Vista Inferior (Ctrl + 6)">Inferior<span class="m3d-kbd">6</span></button>
							<button type="button" class="m3d-view-btn ativo" data-view="7" title="Perspectiva Isométrica (Ctrl + 7)">Isométrica<span class="m3d-kbd">7</span></button>
							<button type="button" class="m3d-view-btn" data-view="8" title="Vista Normal / Alinhada (Ctrl + 8)">Normal<span class="m3d-kbd">8</span></button>
						</div>
						<span class="m3d-dock-sep" aria-hidden="true"></span>
						<button type="button" class="m3d-dock-btn m3d-dock-btn-icon m3d-dock-btn-primary" id="btnM3dMedir"
							title="Medir (M)" aria-pressed="false">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="M4 5h16v14H4zM8 5v4m4-4v2m4-2v4m-8 4v4m4-4v2m4-2v4"></path>
							</svg>
						</button>
						<button type="button" class="m3d-dock-btn m3d-dock-btn-icon" id="btnM3dCorte"
							title="Corte (C)" aria-pressed="false">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"></path>
								<path d="m4 7.5 8 4.5 8-4.5M12 12v9M3 17l18-10"></path>
							</svg>
						</button>
						<button type="button" class="m3d-dock-btn m3d-dock-btn-icon" id="btnM3dEstilo"
							title="Estilo de exibição">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"></path>
								<path d="m12 3 0 9 8-4.5M12 12l-8-4.5m8 4.5v9"></path>
							</svg>
						</button>
						<button type="button" class="m3d-dock-btn m3d-dock-btn-icon" id="btnM3dAnotar"
							title="Nova anotação (N)" aria-pressed="false">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none"
								stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
								<path d="M5 3.5h14v12H9l-4 4v-16Z"></path>
								<path d="M8 7.5h8M8 11h5m3 10 5-5-3-3-5 5-1 4 4-1Z"></path>
							</svg>
						</button>
						<span class="m3d-dock-sep" aria-hidden="true"></span>
						<button type="button" class="m3d-dock-btn m3d-dock-btn-icon" id="btnM3dFit" title="Ajustar (F)">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="m8 3 4 4 4-4M12 7V2m4 19-4-4-4 4m4-4v5M3 8l4 4-4 4m4-4H2m19-4-4 4 4 4m-4-4h5"></path>
							</svg>
						</button>
						<button type="button" class="m3d-dock-btn m3d-dock-btn-icon" id="btnM3dGirar"
							title="Auto-Girar">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="M20 7a9 9 0 1 0 1 7M20 3v4h-4"></path>
								<path d="m12 8 3 2v4l-3 2-3-2v-4l3-2Z"></path>
							</svg>
						</button>
						<button type="button" class="m3d-dock-btn m3d-dock-btn-icon" id="btnM3dGrade"
							title="Mostrar/Ocultar grade">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="m3 17 9 4 9-4M3 12l9 4 9-4M3 7l9 4 9-4M12 3v18"></path>
								<path d="M3 7 12 3l9 4"></path>
							</svg>
						</button>
						<button type="button" class="m3d-dock-btn m3d-dock-btn-icon" id="btnM3dRotL"
							title="Girar 90° à esquerda (Q)">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="M4 8V3m0 5h5M4.5 8A9 9 0 1 1 4 15"></path>
								<path d="m12 7 3 2v4l-3 2-3-2V9l3-2Z"></path>
							</svg>
						</button>
						<button type="button" class="m3d-dock-btn m3d-dock-btn-icon" id="btnM3dRotR"
							title="Girar 90° à direita (E)">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="M20 8V3m0 5h-5m4.5 0A9 9 0 1 0 20 15"></path>
								<path d="m12 7 3 2v4l-3 2-3-2V9l3-2Z"></path>
							</svg>
						</button>
						<button type="button" class="m3d-dock-btn m3d-dock-btn-icon" id="btnM3dFerramentas"
							title="Mostrar/ocultar painel de ferramentas" aria-pressed="true">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="M4 6h16M4 12h16M4 18h16"></path>
								<circle cx="9" cy="6" r="2"></circle>
								<circle cx="15" cy="12" r="2"></circle>
								<circle cx="7" cy="18" r="2"></circle>
							</svg>
						</button>
					</div>
			</div>

			<div class="m3d-statusbar">
				<div class="m3d-statusbar-info">
					<span class="m3d-origem-row"><svg class="m3d-icon-mini" viewBox="0 0 24 24" width="12"
							height="12" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
							<polyline points="14 2 14 8 20 8"></polyline>
						</svg><span id="m3dInfoOrigem">Modelo 3D</span></span>
				</div>
				<div class="m3d-statusbar-right">
					<span class="m3d-footer-shortcuts"><code>M</code> medir · <code>F</code> ajustar ·
						<code>Esc</code> fechar</span>
					<button class="m3d-status-close" id="btnFecharModal3DRodape" type="button"
						onclick="if(window.CF &amp;&amp; CF.visualizador3d) CF.visualizador3d.fecharModal3D();">FECHAR</button>
				</div>
			</div>

		</div>
	</div>

	<div class="modal-overlay" id="modalAnotacao3d" aria-hidden="true">
		<div class="modal modal-anotacao-3d" role="dialog" aria-modal="true"
			aria-labelledby="modalAnotacao3dTitulo">
			<div class="modal-anotacao-head">
				<h3 id="modalAnotacao3dTitulo">Nova anotação</h3>
				<p id="modalAnotacao3dAjuda">Escreva e salve; depois clique na peça para posicionar.</p>
			</div>
			<div class="m3d-editor-toolbar" id="m3dEditorToolbar" role="toolbar" aria-label="Formatação do texto">
				<button type="button" data-command="bold" aria-label="Negrito" title="Negrito"><strong>B</strong></button>
				<button type="button" data-command="italic" aria-label="Itálico" title="Itálico"><em>I</em></button>
				<button type="button" data-command="underline" aria-label="Sublinhado" title="Sublinhado"><u>U</u></button>
				<span aria-hidden="true"></span>
				<button type="button" data-command="insertUnorderedList" aria-label="Lista com marcadores"
					title="Lista com marcadores">• Lista</button>
				<button type="button" data-command="insertOrderedList" aria-label="Lista numerada"
					title="Lista numerada">1. Lista</button>
			</div>
			<div id="m3dAnotacaoEditor" class="m3d-rich-editor" contenteditable="true"
				role="textbox" aria-label="Texto da anotação" aria-multiline="true"></div>
			<div id="m3dAnotacaoStatus" class="m3d-anotacao-status" role="status" aria-live="polite"></div>
			<div class="modal-actions">
				<button class="btn btn-secondary" id="btnCancelarAnotacao3d" type="button">FECHAR</button>
				<button class="btn btn-success" id="btnSalvarAnotacao3d" type="button">SALVAR</button>
			</div>
		</div>
	</div>

<!-- Modal 3D Autodesk Platform Services -->

	<div class="modal-overlay" id="modalPeca3DAps">
		<div class="modal modal-3d modal-3d-aps">
			<div class="m3d-header">
				<div class="m3d-header-info">
					<div class="m3d-badge-row">
						<span class="m3d-mark" aria-hidden="true"> <svg
								viewBox="0 0 24 24" width="16" height="16" fill="none"
								stroke="currentColor" stroke-width="1.8">
								<path d="M12 2 21 7v10l-9 5-9-5V7z"></path>
								<path d="m3 7 9 5 9-5M12 12v10"></path>
							</svg>
						</span> <span class="m3d-chip m3d-chip-solid">AUTODESK APS</span> <span
							class="m3d-chip m3d-chip-soft">SVF2</span> <span
							class="m3d-chip m3d-chip-soft" id="m3dApsChipArquivo">STL</span>
					</div>
					<h3 class="m3d-title" id="modalPeca3DApsTitulo">Visualização
						3D — Autodesk Platform Services</h3>
					<div class="m3d-subtitle" id="modalPeca3DApsSub">Modelo
						traduzido e medido na nuvem Autodesk</div>
				</div>
				<div class="m3d-header-actions">
					<button class="m3d-btn-close" id="btnFecharModal3DAps"
						type="button" aria-label="Fechar visualizador Autodesk"
						title="Fechar visualizador (Esc)">
						<svg viewBox="0 0 24 24" width="16" height="16"
							stroke="currentColor" stroke-width="2.2" fill="none">
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
			</div>

			<div class="m3d-workspace">
				<div class="m3d-stage">
					<div class="m3d-aps-wrap">
						<div class="m3d-aps-viewport" id="m3dApsViewer"></div>
						<div class="m3d-aps-overlay" id="m3dApsOverlay">
							<div class="m3d-aps-overlay-card">
								<span class="m3d-aps-spinner" id="m3dApsSpinner"
									aria-hidden="true"></span> <strong id="m3dApsOverlayTitulo">Conectando
									ao Autodesk Platform Services</strong> <span id="m3dApsOverlayTexto">Solicitando
									token...</span>
								<div class="m3d-aps-progress" role="progressbar"
									aria-label="Progresso da tradução">
									<i id="m3dApsProgresso"></i>
								</div>
							</div>
						</div>
					</div>
				</div>


			</div>

			<div class="m3d-footer">
				<div class="m3d-footer-info">
					<div class="m3d-origem-row">
						<svg class="m3d-icon-mini" viewBox="0 0 24 24" width="13"
							height="13" fill="none" stroke="currentColor" stroke-width="2">
							<path
								d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
							<polyline points="14 2 14 8 20 8"></polyline>
						</svg>
						<span id="m3dApsInfoOrigem">Modelo STL traduzido para SVF2
							no Autodesk Platform Services</span>
					</div>
					<div class="m3d-hint-row">
						Dica: use <strong>Calibrar</strong> se o STL não declarar unidade.
						Pressione
						<code>M</code>
						para medir.
					</div>
				</div>
				<div class="m3d-footer-actions">
					<span class="m3d-footer-shortcuts"><code>M</code> medir · <code>F</code>
						ajustar · <code>Esc</code> fechar</span>
					<button class="btn btn-secondary m3d-btn-fechar"
						id="btnFecharModal3DApsRodape" type="button">FECHAR</button>
				</div>
			</div>
		</div>
	</div>
	<div class="cf-toast-container" id="cfToastContainer" aria-live="polite" aria-atomic="false"></div>
	<script src="${pageContext.request.contextPath}/js/app.js?v=20261116e"></script>

	<script src="${pageContext.request.contextPath}/js/seguranca.js?v=20261116a"></script>

	<script defer
		src="${pageContext.request.contextPath}/js/lib/three/three.min.js"></script>

	<script defer
		src="${pageContext.request.contextPath}/js/lib/three/OrbitControls.js"></script>

	<script defer
		src="${pageContext.request.contextPath}/js/lib/three/STLLoader.js"></script>

	<script defer
		src="${pageContext.request.contextPath}/js/render/visualizador3d.js?v=20261116e"></script>

	<script defer
		src="${pageContext.request.contextPath}/js/render/visualizador3dAps.js?v=20261030c"></script>

	<script defer
		src="${pageContext.request.contextPath}/js/render/visualizador3dFacade.js?v=20261030c"></script>

</body>



</html>