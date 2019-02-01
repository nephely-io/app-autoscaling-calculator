function Run() {
	var loadDuration = 3600;
	var nbUsers = 10000;
	var instanceStartDuration = 30;
	var instanceMaxLoad = 1;
	var minNbInstances = 1;
	var nbIterations = 100000;
	var nbCoordonates = 3600;
	// 
	var horizontalPodAutoscalerSyncPeriod = 15;
	var horizontalPodAutoscalerTolerance = 0.1;

	// load
	var userLoadFunction = new UserLoadFunction([
		new UserLoadFunctionPart(-Infinity, 0, 0),
		new UserLoadFunctionPart(0, 0.8, 0.1),
		new UserLoadFunctionPart(0.8, 1, 0),
		new UserLoadFunctionPart(1, 1.8, 0.01),
		new UserLoadFunctionPart(1.8, Infinity, 0.01)
	]);
	var loadCoordonates = LoadCalculator.Gauss(nbUsers, userLoadFunction, loadDuration, nbCoordonates, nbIterations);
	ChartsDesigner.DrawLoadOverTime('chart-loadovertime', loadCoordonates);

	// nb of instance for load RAW
	ChartsDesigner.DrawNbInstancesOverTime('chart-instancesovertime', AutoScaler.minNbInstancesForLoadCoordonates(loadCoordonates, instanceMaxLoad));

	var scaleUpPercent = AutoScaler.findScaleUpPercentKubernetes_1_12(loadCoordonates, instanceMaxLoad, instanceStartDuration, minNbInstances, horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance);
	console.log('scaleUpPercent: ' + scaleUpPercent);

	var k8sInstances = Kubernetes_1_12.instancesStatusOverTime(loadCoordonates, instanceMaxLoad, scaleUpPercent, instanceStartDuration, minNbInstances, horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance);
	ChartsDesigner.DrawResults('chart-results', k8sInstances);
}

