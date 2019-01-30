function Run() {
	var loadDuration = 360;
	var nbUsers = 10000;
	var instanceMaxLoad = 1;
	var nbIterations = 1000;
	var step = 1;

	var loadFunctionElements = [
		new UserLoadFunctionPart(Infinity, 0, 0),
		new UserLoadFunctionPart(0, 0.8, 0.1),
		new UserLoadFunctionPart(0.8, 1, 0),
		new UserLoadFunctionPart(1, 1.8, 0.01),
		new UserLoadFunctionPart(1.8, Infinity, 0.01)
	];

	var loadFunction = new UserLoadFunction(loadFunctionElements);
	var loadCalculator = new LoadCalculator(loadDuration, nbUsers, nbIterations, loadFunction);
	var loadCoordonates = loadCalculator.getLoadCoordonates(step);
	var autoScaler = new AutoScaler(loadCoordonates, instanceMaxLoad);

	// drawing charts
	ChartsDesigner.DrawLoadOverTime('chart-loadovertime', loadCoordonates);
	ChartsDesigner.DrawNbInstancesOverTime('chart-instancesovertime', autoScaler.getNbInstancesCoordonates());
}

