function OnLoad() {
	// displaying back the selected orchestrator options
	SelectOrchestrator(document.getElementById("form-orchestrator"));
}

(function($) {
	"use strict";
	// Smooth scrolling using jQuery easing
	$('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function() {
		if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
			let target = $(this.hash);
			target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
			if (target.length) {
				$('html, body').animate({
					scrollTop: (target.offset().top)
				}, 1000, "easeInOutExpo");
				return false;
			}
		}
	});
})(jQuery);

function Run() {
	// hiding results & displaying loading gif
	let errorDivIds = ["results", "form-warning", "form-error", "form-app-error-row", "form-loadtest-error-row", "form-orchestrator-error-row", "form-computation-error-row"];
	for (let i=0; i<errorDivIds.length; i++) {
		document.getElementById(errorDivIds[i]).style.display = "none";
	}
	document.getElementById("loading-gif").style.display = "flex";
	// hiding previous results
	let classNames = ["results_kubernetes-1-11", "results_kubernetes-1-12", "results_marathon-autoscaler"];
	for (let i=0; i<classNames.length; i++) {
		let rows = document.getElementsByClassName(classNames[i]);
		for (let j=0; j<rows.length; j++) {
			rows[j].style.display = "none"; // back to default
		}
	}

	/* FORM */
	// application
	let instanceMaxLoad = parseFloat(document.getElementById("form-instance-max-load").value);
	if (isNaN(instanceMaxLoad) || instanceMaxLoad <= 0) {
		return FormApplicationError("Incorrect instance max load (must be a number > 0)");
	}
	let instanceStartDuration = parseInt(document.getElementById("form-instance-start-duration").value);
	if (isNaN(instanceStartDuration) || instanceStartDuration <= 0) {
		return FormApplicationError("Incorrect instance start duration (must be a nmber > 0)");
	}
	let minNbInstances = parseInt(document.getElementById("form-min-number-instances").value);
	if (isNaN(minNbInstances) || minNbInstances <= 0) {
		return FormApplicationError("Incorrect minimum number of instances (must be a number > 0)");
	}
	let appConfig = new ApplicationConfig(instanceMaxLoad, instanceStartDuration, minNbInstances);
	// load function
	let loadFunctionDuration = parseInt(document.getElementById("form-loadfunction-duration").value);
	if (isNaN(loadFunctionDuration) || loadFunctionDuration <= 0) {
		return FormLoadFunctionError("Incorrect duration of the load function (must be a number > 0)");
	}
	// load test
	let loadDuration = parseInt(document.getElementById("form-loadtest-duration").value);
	if (isNaN(loadDuration) || loadDuration <= 0) {
		return FormLoadTestError("Incorrect load test duration (must be a number > 0)");
	}
	let nbUsers = parseInt(document.getElementById("form-number-users").value);
	if (isNaN(nbUsers) || nbUsers <= 0) {
		return FormLoadTestError("Incorrect number of users (must be a number > 0)");
	}
	// computation
	let nbIterations = parseInt(document.getElementById("form-number-iterations").value);
	if (isNaN(nbIterations) || nbIterations <= 0) {
		return FormComputationError("Incorrect number of iterations (must be a number > 0)");
	}
	let nbPointSecond = parseInt(document.getElementById("form-number-point-second").value);
	if (isNaN(nbPointSecond) || nbPointSecond <= 0) {
		return FormComputationError("Incorrect number of points per second (must be a number > 0)");
	}
	if (nbIterations < nbPointSecond * loadDuration){
		FormWarning("The number of iteration for the Reimann sum is too low.<br />Should be a minimum of: " + (nbPointSecond * loadDuration));
	}
	
	// parsing load function
	let loadFunctions = [];
	let totalPercent = 0;
	for (let i=0; i<=loadFunctionNbRows; i++) {
		if (document.getElementById("form-loadfunction-row" + i) == null) {
			continue;
		}
		// hidding error
		document.getElementById("form-loadfunction-error" + i + "-row").style.display = "none";

		let loadFunction = null;
		try {
			eval("loadFunction =  " + document.getElementById("form-loadfunction-function" + i).value);
			if (typeof loadFunction !== "function") {
				return FormLoadFunctionError(i, "Load function is not a function.");
			}
		} catch(e) {
			return FormLoadFunctionError(i, "Could parse load function: " + e + ' (line: ' + e.lineNumber + ', col: ' + e.columnNumber + ')');
		}
		let userPercent = parseFloat(document.getElementById("form-loadfunction-user-percent" + i).value);

		totalPercent += userPercent;
		loadFunctions.push({percent: userPercent / 100, func: loadFunction});
	}
	if (totalPercent != 100) {
		return FormError("Load functions user percent total is not 100%.");
	}
	ChartsDesigner.DrawLoadFunctions('chart-loadfunctions', loadFunctions, nbPointSecond, loadFunctionDuration);
	let userLoadFunction = new UserLoadFunction(loadFunctions);

	/* COMPUTING */
	// calculating load
	let loadCoordonates = null;
	switch(document.getElementById("form-loadtest-distribution").value) {
		case "gauss":
			loadCoordonates = LoadCalculator.Gauss(nbUsers, userLoadFunction, Math.ceil(loadDuration * 3/2) + loadFunctionDuration, nbPointSecond, nbIterations);
			break;
		case "constant":
			loadCoordonates = LoadCalculator.Constant(nbUsers, userLoadFunction, loadDuration + loadFunctionDuration, nbPointSecond, nbIterations);
			break;
		case "linear":
			loadCoordonates = LoadCalculator.Linear(nbUsers, userLoadFunction, loadDuration + loadFunctionDuration, nbPointSecond, nbIterations);
			break;
	}
	// displaying load chart
	ChartsDesigner.DrawLoadOverTime('chart-load-time', loadCoordonates);

	// orchestrators
	let rowsClass = null;
	let results = null;
	switch(document.getElementById("form-orchestrator").value) {
		// kubernetes until 1.11
		case "kubernetes-1.11":
			var horizontalPodAutoscalerSyncPeriod = parseInt(document.getElementById("form-k8s-1-11-hpasp").value);
			if (isNaN(horizontalPodAutoscalerSyncPeriod) || horizontalPodAutoscalerSyncPeriod <= 0) {
				return FormOchestratorError("Incorrect horizontal pod autoscaler sync period (must be a number > 0)");
			}
			var horizontalPodAutoscalerTolerance = parseFloat(document.getElementById("form-k8s-1-11-hpat").value);
			if (isNaN(horizontalPodAutoscalerTolerance) || horizontalPodAutoscalerTolerance <= 0 || horizontalPodAutoscalerTolerance >= 1) {
				return FormOchestratorError("Incorrect horizontal pod autoscaler tolerance (must be a number between 0 and 1, both excluded)");
			}
			var horizontalPodAutoscalerUpscaleDelay = parseFloat(document.getElementById("form-k8s-1-11-hpaud").value);
			if (isNaN(horizontalPodAutoscalerUpscaleDelay) || horizontalPodAutoscalerUpscaleDelay <= 0) {
				return FormOchestratorError("Incorrect horizontal pod autoscaler upscale delay (must be a number > 0)");
			}
			var horizontalPodAutoscalerDownscaleDelay = parseFloat(document.getElementById("form-k8s-1-11-hpadd").value);
			if (isNaN(horizontalPodAutoscalerDownscaleDelay) || horizontalPodAutoscalerDownscaleDelay <= 0) {
				return FormOchestratorError("Incorrect horizontal pod autoscaler cownscale delay (must be a number > 0)");
			}
			var k8sConfig = new Kubernetes_1_11Config(horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance, horizontalPodAutoscalerUpscaleDelay, horizontalPodAutoscalerDownscaleDelay);
			appConfig.scaleUpPercent = Kubernetes_1_11.resolveScaleUpPercent(loadCoordonates, appConfig, k8sConfig);
			results = Kubernetes_1_11.calculateStates(loadCoordonates, appConfig, k8sConfig);

			rowsClass = "results_kubernetes-1-11";
			document.getElementById("results_kubernetes-1-11_targetCPUUtilizationPercentage").innerHTML = Math.floor(appConfig.scaleUpPercent * 1000) / 10;
			break;

		// kubernetes from 1.12
		case "kubernetes-1.12":
			var horizontalPodAutoscalerSyncPeriod = parseInt(document.getElementById("form-k8s-1-12-hpasp").value);
			if (isNaN(horizontalPodAutoscalerSyncPeriod) || horizontalPodAutoscalerSyncPeriod <= 0) {
				return FormOchestratorError("Incorrect horizontal pod autoscaler sync period (must be a number > 0)");
			}
			var horizontalPodAutoscalerTolerance = parseFloat(document.getElementById("form-k8s-1-12-hpat").value);
			if (isNaN(horizontalPodAutoscalerTolerance) || horizontalPodAutoscalerTolerance <= 0 || horizontalPodAutoscalerTolerance >= 1) {
				return FormOchestratorError("Incorrect horizontal pod autoscaler tolerance (must be a number between 0 and 1, both excluded)");
			}
			var horizontalPodAutoscalerInitialReadinessDelay = parseFloat(document.getElementById("form-k8s-1-12-hpaird").value);
			if (isNaN(horizontalPodAutoscalerInitialReadinessDelay) || horizontalPodAutoscalerInitialReadinessDelay <= 0) {
				return FormOchestratorError("Incorrect horizontal pod autoscaler readiness delay (must be a number > 0)");
			}
			var horizontalPodAutoscalerCooldownWindow = parseFloat(document.getElementById("form-k8s-1-12-hpadcw").value);
			if (isNaN(horizontalPodAutoscalerCooldownWindow) || horizontalPodAutoscalerCooldownWindow <= 0) {
				return FormOchestratorError("Incorrect hoAS_COOL_DOWN_FACTORrizontal pod autoscaler cooldown window (must be a number > 0)");
			}
			var k8sConfig = new Kubernetes_1_12Config(horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance, horizontalPodAutoscalerInitialReadinessDelay, horizontalPodAutoscalerCooldownWindow);
			appConfig.scaleUpPercent = Kubernetes_1_12.resolveScaleUpPercent(loadCoordonates, appConfig, k8sConfig);
			results = Kubernetes_1_12.calculateStates(loadCoordonates, appConfig, k8sConfig);

			rowsClass = "results_kubernetes-1-12";
			document.getElementById("results_kubernetes-1-12_targetAverageValue").innerHTML = Math.floor(appConfig.scaleUpPercent * 1000) / 10;
			break;

		// Mesosphere Marathon
		case "marathon-autoscaler":
			var asSynch = parseInt(document.getElementById("form-msm-sync").value);
			if (isNaN(asSynch) || asSynch <= 0) {
				return FormOchestratorError("Incorrect interval period (must be a number > 0)");
			}
			var asMultiply = parseFloat(document.getElementById("form-msm-mult").value);
			if (isNaN(asMultiply) || asMultiply <= 1) {
				return FormOchestratorError("Incorrect horizontal autoscale multiplier (must be a number > 1)");
			}
			var asSUF = parseFloat(document.getElementById("form-msm-suf").value);
			if (isNaN(asSUF) || asSUF <= 0) {
				return FormOchestratorError("Incorrect scale-up factor (must be a number > 0)");
			}
			var asSDF = parseFloat(document.getElementById("form-msm-sdf").value);
			if (isNaN(asSDF) || asSDF <= 0) {
				return FormOchestratorError("Incorrect scale-down factor (must be a number > 0)");
			}
			var msmConfig = new MarathonAutoScaleConfig(asSynch, asMultiply, asSUF, asSDF);
			appConfig.scaleUpPercent = MarathonAutoScale.resolveScaleUpPercent(loadCoordonates, appConfig, msmConfig);
			appConfig.scaleDownPercent = MarathonAutoScale.calculateScaleDownPercent(appConfig.minNbInstances, msmConfig.autoscaleMultiplier, appConfig.scaleUpPercent);
			results = MarathonAutoScale.calculateStates(loadCoordonates, appConfig, msmConfig);

			rowsClass = "results_marathon-autoscaler";
			document.getElementById("results_marathon-autoscaler_max-range").innerHTML = Math.floor(appConfig.scaleUpPercent * 1000) / 10;
			document.getElementById("results_marathon-autoscaler_min-range").innerHTML = Math.floor(appConfig.scaleDownPercent * 1000) / 10;
			break;

		default:
			return FormOchestratorError("You must select an orchestrator");
	}

	// displaying metrics results
	document.getElementById("results_max-nb-instance").innerHTML = results.maxInstances;
	document.getElementById("results_max-instance-load").innerHTML = (Math.round(results.maxLoad * 1000) / 1000) + ' (' + (Math.round(results.maxLoad / appConfig.instanceMaxLoad * 1000) / 10) + '%)';

	// drawing result graphs
	ChartsDesigner.DrawStates('chart-results', results.states);

	// displaying orchestrator results rows
	let rows = document.getElementsByClassName(rowsClass);
	for (let i=0; i<rows.length; i++) {
		rows[i].style.display = "block"; // back to default
	}

	// showing results
	document.getElementById("loading-gif").style.display = "none";
	document.getElementById('results').style.display = "block";

	// scrolling to results
	(function($) {
		"use strict";
		$('html, body').animate({
			scrollTop: ($('#results').offset().top)
		}, 1000, "easeInOutExpo");
	})(jQuery);
}

/* FORM */
let loadFunctionNbRows = 0;
function LoadFunctionAddRow() {
	// searching for next row id
	let rowId = 0;
	while(true) {
		if (document.getElementById("form-loadfunction-row" + rowId) == null) {
			if (loadFunctionNbRows < rowId) {
				loadFunctionNbRows = rowId;
			}
			break;
		}
		rowId++;
	}

	// user percent
	let userPercentSpan = document.createElement("span");
	userPercentSpan.innerHTML = "Pourcentage of user: "
	let userPercentInput = document.createElement("input");
	userPercentInput.type = "number";
	userPercentInput.id = "form-loadfunction-user-percent" + rowId;
	userPercentInput.min = "0.1";
	userPercentInput.max = "100";
	userPercentInput.step = "0.1";
	userPercentInput.value = "10";
	let userPercentPercentSpan = document.createElement("span");
	userPercentPercentSpan.innerHTML = "%"
	let userPercent = document.createElement("div");
	userPercent.className = "col-lg-3";
	userPercent.appendChild(userPercentSpan);
	userPercent.appendChild(userPercentInput);
	userPercent.appendChild(userPercentPercentSpan);

	// function label
	let functionSpan = document.createElement("span");
	functionSpan.innerHTML = "JavaScript function:"
	let functionSpanCol = document.createElement("div");
	functionSpanCol.className = "col-lg-2";
	functionSpanCol.appendChild(functionSpan);
	// function textarea
	let functionTextarea = document.createElement("textarea");
	functionTextarea.className = "form-control";
	functionTextarea.id = "form-loadfunction-function" + rowId;
	functionTextarea.innerHTML = "function(time) {return 0;}";
	let functionCol = document.createElement("div");
	functionCol.className = "col-lg-6";
	functionCol.appendChild(functionTextarea);

	// buttons
	let buttonRemove = document.createElement("input");
	buttonRemove.type = "button";
	buttonRemove.className = "btn btn-secondary";
	buttonRemove.setAttribute("onclick", "LoadFunctionRemoveRow(" + rowId + ");");
	buttonRemove.value = "-";
	let buttonsCol = document.createElement("div");
	buttonsCol.className = "col-lg-1 text-center";
	buttonsCol.appendChild(buttonRemove);

	// row
	let row = document.createElement("div");
	row.className = "row loadfunction";
	row.id = "form-loadfunction-row" + rowId;
	row.appendChild(userPercent);
	row.appendChild(functionSpanCol);
	row.appendChild(functionCol);
	row.appendChild(buttonsCol);

	// error row
	let errorSpan = document.createElement("span");
	errorSpan.id = "form-loadfunction-error" + rowId;
	errorSpan.className = "error";
	let errorDiv = document.createElement("div");
	errorDiv.className = "col-lg-12";
	errorDiv.appendChild(errorSpan)
	let errorRow = document.createElement("div");
	errorRow.id = "form-loadfunction-error" + rowId + "-row";
	errorRow.className = "row error-row";
	errorRow.appendChild(errorDiv);

	// displaying HTML
	document.getElementById("form-loadfunction-rows").appendChild(errorRow);
	document.getElementById("form-loadfunction-rows").appendChild(row);
}

function LoadFunctionRemoveRow(rowIndex) {
	RemoveHTML('form-loadfunction-error-row' + rowIndex);
	RemoveHTML('form-loadfunction-row' + rowIndex);
}

function FormApplicationError(error) {
	AbstractFormError("form-app-error", error);
	return FormError("Error in the application section (see above)");
}

function FormLoadFunctionError(rowIndex, error) {
	AbstractFormError("form-loadfunction-error" + rowIndex, error);
	return FormError("Error with a load function (see above)");
}

function FormLoadTestError(error) {
	AbstractFormError("form-loadtest-error", error);
	return FormError("Error in the load test section (see above)");
}

function FormOchestratorError(error) {
	AbstractFormError("form-orchestrator-error", error);
	return FormError("Error in the orchestrator section (see above)");
}

function FormComputationError(error) {
	AbstractFormError("form-computation-error", error);
	return FormError("Error in the computation section (see above)");
}

function AbstractFormError(id, error) {
	document.getElementById(id).innerHTML = "<i class=\"fas fa-bug warning\"></i> &darr; " + error;
	document.getElementById(id + "-row").style.display = "flex";
	return false;
}

function FormWarning(error) {
	document.getElementById('form-warning').innerHTML = "<i class=\"fas fa-exclamation-triangle error\"></i> " + error;
	document.getElementById('form-warning').style.display = "block";
	return false;
}

function FormError(error) {
	document.getElementById('form-error').innerHTML = "<i class=\"fas fa-bug warning\"></i> " + error;
	document.getElementById('form-error').style.display = "block";
	// removing loading gif
	document.getElementById("loading-gif").style.display = "none";
	return false;
}

function SelectOrchestrator(selectElement) {
	// undisplay every rows
	["kubernetes-1-11", "kubernetes-1-12", "marathon-autoscaler"].forEach(element => {
		let rows = document.getElementsByClassName(element);
		for (let i=0; i<rows.length; i++) {
			rows[i].style.display = "none";
		}
	});

	// selecting rows to display
	let rowsClass = null;
	switch (selectElement.value) {
		case "kubernetes-1.11": rowsClass = "kubernetes-1-11";
			break;
		case "kubernetes-1.12": rowsClass = "kubernetes-1-12";
			break;
		case "marathon-autoscaler": rowsClass = "marathon-autoscaler";
			break;

		default: break;
	}

	// displaying rows
	let rows = document.getElementsByClassName(rowsClass);
	for (let i=0; i<rows.length; i++) {
		rows[i].style.display = "flex"; // back to default
	}
}

function ResetForm() {
	SelectOrchestrator(document.getElementById("form-orchestrator"));
	document.getElementById("loading-gif").style.display = "none";
	document.getElementById('results').style.display = "none";
}

/* COMMON */
function RemoveHTML(id) {
	let elem = document.getElementById(id);
	elem.parentNode.removeChild(elem);
	return false;
}

function RandomColor() {
	let letters = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}