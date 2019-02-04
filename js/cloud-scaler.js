function OnLoad() {
	// displaying back the selected cloud provider options
	SelectCloudProvider(document.getElementById("form-cloud-provider"));
}

(function($) {
	"use strict";

	// Smooth scrolling using jQuery easing
	$('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function() {
		if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
			var target = $(this.hash);
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
	//displaying loading gif
	document.getElementById("loading-gif").style.display = "flex";

	// TODO!!!!
	var userLoadFunction = new UserLoadFunction([
		new UserLoadFunctionPart(-Infinity, 0, 0),
		new UserLoadFunctionPart(0, 0.8, 0.1),
		new UserLoadFunctionPart(0.8, 1, 0),
		new UserLoadFunctionPart(1, 1.8, 0.01),
		new UserLoadFunctionPart(1.8, Infinity, 0.01)
	]);

	/* FORM */
	// application
	var instanceMaxLoad = parseFloat(document.getElementById("form-instance-max-load").value);
	var instanceStartDuration = parseInt(document.getElementById("form-instance-start-duration").value);
	var minNbInstances = parseInt(document.getElementById("form-min-number-instances").value);
	// load test
	var nbUsers = parseInt(document.getElementById("form-number-users").value);
	var loadDuration = parseInt(document.getElementById("form-loadtest-duration").value);
	// computation & graphics
	var nbIterations = parseInt(document.getElementById("form-number-iterations").value);
	var nbCoordonates = Math.ceil(loadDuration / 3); // !!TODO

	/* COMPUTING */
	// calculating load
	var loadCoordonates = null;
	switch(document.getElementById("form-loadtest-distribution").value) {
		case "gauss":
			loadCoordonates = LoadCalculator.Gauss(nbUsers, userLoadFunction, loadDuration, nbCoordonates, nbIterations);
			break;
	}
	// displaying load chart
	ChartsDesigner.DrawLoadOverTime('chart-load-time', loadCoordonates);

	// cloud providers
	var rowsClass = null;
	var resultCoordonates = null;
	switch(document.getElementById("form-cloud-provider").value) {
		// kubernetes 1.12
		case "kubernetes-1.12":
			var horizontalPodAutoscalerSyncPeriod = parseInt(document.getElementById("form-k8s-1-12-hpasp").value);
			var horizontalPodAutoscalerTolerance = parseFloat(document.getElementById("form-k8s-1-12-hpat").value);
			var scaleUpPercent = AutoScaler.findScaleUpPercentKubernetes_1_12(loadCoordonates, instanceMaxLoad, instanceStartDuration, minNbInstances, horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance);

			rowsClass = "results_kubernetes-1-12";
			document.getElementById("results_kubernetes-1-12_targetAverageValue").innerHTML = Math.floor(scaleUpPercent * 1000) / 1000; // should I add instanceMaxLoad?

			resultCoordonates = Kubernetes_1_12.instancesStatusOverTime(loadCoordonates, instanceMaxLoad, scaleUpPercent, instanceStartDuration, minNbInstances, horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance);
			break;

		default: break;
	}
	// displaying cloud provider results rows
	if (rowsClass != null) {
		var rows = document.getElementsByClassName(rowsClass);
		for (var i=0; i<rows.length; i++) {
			rows[i].style.display = "flex"; // back to default
		}
	}

	// displaying metrics results
	var maxNbInstances = 0;
	var maxLoadInstance = 0;
	for (var i=0; i<resultCoordonates.length; i++) {
		if (maxNbInstances < resultCoordonates[i].instancesReady) {
			maxNbInstances = resultCoordonates[i].instancesReady;
		}
		if (maxLoadInstance < resultCoordonates[i].instanceLoadPercent) {
			maxLoadInstance = resultCoordonates[i].instanceLoadPercent;
		}
	}
	document.getElementById("results_max-nb-instance").innerHTML = maxNbInstances;
	document.getElementById("results_max-instance-load").innerHTML = (Math.round(maxLoadInstance * instanceMaxLoad * 1000) / 1000) + ' (' + (Math.round(maxLoadInstance * 1000) / 10) + '%)';

	// drawing result graphs
	ChartsDesigner.DrawResults('chart-results', resultCoordonates);

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
function SelectCloudProvider(selectElement) {
	// undisplay every rows
	["kubernetes-1-12"].forEach(element => {
		var rows = document.getElementsByClassName(element);
		for (var i=0; i<rows.length; i++) {
			rows[i].style.display = "none";
		}
	});

	// selecting rows to display
	var rowsClass = null;
	switch (selectElement.value) {
		case "kubernetes-1.12": rowsClass = "kubernetes-1-12";
			break;

		default: break;
	}

	// displaying rows
	var rows = document.getElementsByClassName(rowsClass);
	for (var i=0; i<rows.length; i++) {
		rows[i].style.display = "flex"; // back to default
	}
}

function ResetForm() {
	SelectCloudProvider(document.getElementById("form-cloud-provider"));
	document.getElementById("loading-gif").style.display = "none";
	document.getElementById('results').style.display = "none";
}