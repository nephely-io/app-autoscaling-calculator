/* AutoScaler */
class AutoScaler {
	static rawNbInstancesForLoadCoordonates(loadCoordonates, instanceMaxLoad) {
		// calculating nb instances
		var coordonates = [];
		var oldNbInstances = 0;
		for (var i=0; i<loadCoordonates.length; i++) {
			var nbInstances = Math.ceil(loadCoordonates[i].y / instanceMaxLoad);
			if (nbInstances == oldNbInstances) {
				continue;
			}
			oldNbInstances = nbInstances;
			coordonates.push({"x": loadCoordonates[i].x, "y": nbInstances});
		}
		
		// adding first point (shouldn't happen if user load function != 0 at t=0)
		if (coordonates[0].x != 0) {
			coordonates = [{"x": 0, "y": 0}].concat(coordonates);
		}

		// adding last point (for graphing purposes)
		if (coordonates[coordonates.length-1].x != loadCoordonates[loadCoordonates.length-1].x) {
			coordonates.push({"x": loadCoordonates[loadCoordonates.length-1].x, "y": oldNbInstances});
		}
		
		return coordonates;
	}

	static rawNbInstancesKubernetes(loadCoordonates, instanceMaxLoad, horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance) {
		var coordonates = [];
		var lastSync = -Infinity;
		for (var i=0; i<loadCoordonates.length; i++) {
			var nbInstances = Math.ceil(loadCoordonates[i].y / instanceMaxLoad);

		}
	}
}