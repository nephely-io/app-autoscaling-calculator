function Run() {
	var loadDuration = 360;
	var nbUsers = 10000;
	var instanceMaxLoad = 1;
	var nbIterations = 100000;
	var nbCoordonates = 360;
	var nbXAxeCuts = 20;

	// load
	var userLoadFunction = new UserLoadFunction([
		new UserLoadFunctionPart(-Infinity, 0, 0),
		new UserLoadFunctionPart(0, 0.8, 0.1),
		new UserLoadFunctionPart(0.8, 1, 0),
		new UserLoadFunctionPart(1, 1.8, 0.01),
		new UserLoadFunctionPart(1.8, Infinity, 0.01)
	]);
	var loadCoordonates = LoadCalculator.Gauss(nbUsers, userLoadFunction, loadDuration, nbCoordonates, nbIterations);
	console.log(loadCoordonates);
	ChartsDesigner.DrawLoadOverTime('chart-loadovertime', loadCoordonates, nbXAxeCuts);

	// nb of instance for load RAW
	ChartsDesigner.DrawNbInstancesOverTime('chart-instancesovertime', AutoScaler.rawNbInstancesForLoadCoordonates(loadCoordonates, instanceMaxLoad));
}

