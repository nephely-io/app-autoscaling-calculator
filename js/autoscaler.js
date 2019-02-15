/* AutoScaler */
class AutoScaler {
	static findScaleUpPercentKubernetes_1_11(loadCoordonates, instanceMaxLoad, instanceStartDuration, minNbInstances, horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance, horizontalPodAutoscalerUpscaleDelay, horizontalPodAutoscalerDownscaleDelay) {
		var nbIndexes = Math.ceil(horizontalPodAutoscalerSyncPeriod / loadCoordonates[1].x);
		return AutoScaler._dichotomy(function(scaleUpPercent) {
			var newLoadCoordonates = loadCoordonates.slice(0);
			for (var i=0; i<nbIndexes; i++) {
				var result = Kubernetes_1_11.instancesStatusOverTime(newLoadCoordonates, instanceMaxLoad, scaleUpPercent, instanceStartDuration, minNbInstances, horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance, horizontalPodAutoscalerUpscaleDelay, horizontalPodAutoscalerDownscaleDelay, true)
				if (result < 0) {
					return -1;
				}
				newLoadCoordonates.splice(0,1);
			}
			return 1;
		});
	}

	static findScaleUpPercentKubernetes_1_12(loadCoordonates, instanceMaxLoad, instanceStartDuration, minNbInstances, horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance, horizontalPodAutoscalerInitialReadinessDelay, horizontalPodAutoscalerDownscaleStabilizationWindow) {
		var nbIndexes = Math.ceil(horizontalPodAutoscalerSyncPeriod / loadCoordonates[1].x);
		return AutoScaler._dichotomy(function(scaleUpPercent) {
			var newLoadCoordonates = loadCoordonates.slice(0);
			for (var i=0; i<nbIndexes; i++) {
				var result = Kubernetes_1_12.instancesStatusOverTime(newLoadCoordonates, instanceMaxLoad, scaleUpPercent, instanceStartDuration, minNbInstances, horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance, horizontalPodAutoscalerInitialReadinessDelay, horizontalPodAutoscalerDownscaleStabilizationWindow, true)
				if (result < 0) {
					return -1;
				}
				newLoadCoordonates.splice(0,1);
			}
			return 1;
		});
	}

	// private
	static _dichotomy(checkCallback, min = 0, max = 1, precision = 0.001) {
		while(max - min > precision) {
			var current = (max + min) / 2;
			var result = checkCallback(current);
			if (result > 0) {
				min = current;
			} else { // propability to have 0 is quite null, and if it happens it's better lowering it a little
				max = current;
			}
		}
		var result = Math.floor(min / precision) * precision;
		return result;
	}
}

class Kubernetes_1_11 {
	static instancesStatusOverTime(loadCoordonates, instanceMaxLoad, scaleUpPercent, instanceStartDuration, minNbInstances, horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance, horizontalPodAutoscalerUpscaleDelay, horizontalPodAutoscalerDownscaleDelay, testingScaleUpPercent = false) {
		var nbInstanceStart = Math.ceil(loadCoordonates[0].y / (instanceMaxLoad * scaleUpPercent));
		if (nbInstanceStart < minNbInstances) {
			nbInstanceStart = minNbInstances;
		}
		var lastStatus = {
			time: 0,
			instancesReady: nbInstanceStart,
			instancesWaiting: [],
			wantedNumberInstances: nbInstanceStart,
			instanceLoadPercent: loadCoordonates[0].y / (nbInstanceStart * instanceMaxLoad)
		};
		var status = [lastStatus];
		var lastSync = -Infinity;
		var lastScaleUp = -Infinity;
		var lastScaleDown = -Infinity;
		for (var i=1; i<loadCoordonates.length; i++) {
			var currentStatus = {
				time: loadCoordonates[i].x,
				instancesReady: lastStatus.instancesReady,
				instancesWaiting: lastStatus.instancesWaiting.slice(0),
				instanceLoadPercent: 0
			};

			// checking if instances has s, horizontalPodAutoscalerInitialReadinessDelay, horizontalPodAutoscalerDownscaleStabilizationWindowtarted (passed from 'waiting' to 'ready')
			var deleteInstancesWaitingIndexes = [];
			for (var j=0; j<currentStatus.instancesWaiting.length; j++) {
				if (loadCoordonates[i].x - currentStatus.instancesWaiting[j].time >= instanceStartDuration) {
					currentStatus.instancesReady++;
					deleteInstancesWaitingIndexes.push(j);
				}
			}
			// removing instances that have started from waiting list
			deleteInstancesWaitingIndexes.reverse();
			for (var j=0; j<deleteInstancesWaitingIndexes.length; j++) {
				currentStatus.instancesWaiting.splice(deleteInstancesWaitingIndexes[j], 1);
			}

			// is sync period passed
			if (loadCoordonates[i].x - lastSync > horizontalPodAutoscalerSyncPeriod) {
				var totalNumberOfInstances = currentStatus.instancesReady + currentStatus.instancesWaiting.length;
				var instanceRelativeLoadPercent = loadCoordonates[i].y / (totalNumberOfInstances * instanceMaxLoad * scaleUpPercent);
				var wantedNumberInstances = Math.ceil(loadCoordonates[i].y / (instanceMaxLoad * scaleUpPercent));
				// is load above or below tolerance?
				if ((instanceRelativeLoadPercent > 1 + horizontalPodAutoscalerTolerance) && (loadCoordonates[i].x - lastScaleUp > horizontalPodAutoscalerUpscaleDelay) && (wantedNumberInstances > totalNumberOfInstances)) {
					// starting new instances
					for (var j=0; j < (wantedNumberInstances - totalNumberOfInstances); j++) {
						currentStatus.instancesWaiting.push({time: loadCoordonates[i].x});
					}
					lastScaleUp = loadCoordonates[i].x;
				} else if ((instanceRelativeLoadPercent < 1 - horizontalPodAutoscalerTolerance) && (loadCoordonates[i].x - lastScaleDown > horizontalPodAutoscalerDownscaleDelay) && (wantedNumberInstances < totalNumberOfInstances)) {
					// scaling down
					currentStatus.instancesReady = wantedNumberInstances - currentStatus.instancesWaiting.length;
					if (currentStatus.instancesReady + currentStatus.instancesWaiting.length < minNbInstances) {
						currentStatus.instancesReady = minNbInstances - currentStatus.instancesWaiting.length;
					}
					lastScaleDown = loadCoordonates[i].x;
				}
				lastSync = loadCoordonates[i].x;
			}

			// current load
			currentStatus.instanceLoadPercent = loadCoordonates[i].y / (currentStatus.instancesReady * instanceMaxLoad);

			// if we are checking for the scale up percentage, checking if instances can handle current load
			if (testingScaleUpPercent) {
				if (currentStatus.instanceLoadPercent >= 1) {
					return -1;
				}
			}

			lastStatus = currentStatus;
			status.push(currentStatus);
		}

		if (testingScaleUpPercent) {
			return 1;
		}

		return status;
	}
}

class Kubernetes_1_12 {
	static instancesStatusOverTime(loadCoordonates, instanceMaxLoad, scaleUpPercent, instanceStartDuration, minNbInstances, horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance, horizontalPodAutoscalerInitialReadinessDelay, horizontalPodAutoscalerDownscaleStabilizationWindow, testingScaleUpPercent = false) {
		var nbInstanceStart = Math.ceil(loadCoordonates[0].y / (instanceMaxLoad * scaleUpPercent));
		if (nbInstanceStart < minNbInstances) {
			nbInstanceStart = minNbInstances;
		}
		var lastStatus = {
			time: 0,
			instancesReady: nbInstanceStart,
			instancesWaiting: [],
			wantedNumberInstances: nbInstanceStart,
			instanceLoadPercent: loadCoordonates[0].y / (nbInstanceStart * instanceMaxLoad)
		};
		var status = [lastStatus];
		var lastSync = -Infinity;
		for (var i=1; i<loadCoordonates.length; i++) {
			var currentStatus = {
				time: loadCoordonates[i].x,
				instancesReady: lastStatus.instancesReady,
				instancesWaiting: lastStatus.instancesWaiting.slice(0),
				wantedNumberInstances: null,
				instanceLoadPercent: 0
			};

			// checking if instances has started (passed from 'waiting' to 'ready')
			var deleteInstancesWaitingIndexes = [];
			for (var j=0; j<currentStatus.instancesWaiting.length; j++) {
				if (loadCoordonates[i].x - currentStatus.instancesWaiting[j].time >= instanceStartDuration) {
					currentStatus.instancesReady++;
					deleteInstancesWaitingIndexes.push(j);
				}
			}
			// removing instances that have started from waiting list
			deleteInstancesWaitingIndexes.reverse();
			for (var j=0; j<deleteInstancesWaitingIndexes.length; j++) {
				currentStatus.instancesWaiting.splice(deleteInstancesWaitingIndexes[j], 1);
			}

			// is sync period passed
			if (loadCoordonates[i].x - lastSync > horizontalPodAutoscalerSyncPeriod) {
				var totalNumberOfInstances = currentStatus.instancesReady + currentStatus.instancesWaiting.length;
				var instanceRelativeLoadPercent = loadCoordonates[i].y / (totalNumberOfInstances * instanceMaxLoad * scaleUpPercent);
				currentStatus.wantedNumberInstances = Math.ceil(loadCoordonates[i].y / (instanceMaxLoad * scaleUpPercent));
				// is load above or below tolerance?
				if ((instanceRelativeLoadPercent > 1 + horizontalPodAutoscalerTolerance) && (currentStatus.wantedNumberInstances > totalNumberOfInstances)) {
					// starting new instances
					for (var j=0; j < (currentStatus.wantedNumberInstances - totalNumberOfInstances); j++) {
						currentStatus.instancesWaiting.push({time: loadCoordonates[i].x});
					}
				} else if ((instanceRelativeLoadPercent < 1 - horizontalPodAutoscalerTolerance) && (currentStatus.wantedNumberInstances < totalNumberOfInstances)) {
					// looking for max recommendation over cooldown delay
					var maxWantedInstanceNumber = currentStatus.wantedNumberInstances;
					for (var j=0; j<status.length; j++) {
						if ((status[j].wantedNumberInstances != null) && (status[j].time + horizontalPodAutoscalerDownscaleStabilizationWindow > currentStatus.time) && (status[j].wantedNumberInstances > maxWantedInstanceNumber)) {
							maxWantedInstanceNumber = status[j].wantedNumberInstances;
						}
					}

					// scaling down if needed
					if (maxWantedInstanceNumber < totalNumberOfInstances) {
						currentStatus.instancesReady = maxWantedInstanceNumber - currentStatus.instancesWaiting.length;
						if (currentStatus.instancesReady + currentStatus.instancesWaiting.length < minNbInstances) {
							currentStatus.instancesReady = minNbInstances - currentStatus.instancesWaiting.length;
						}
					}
				}
				lastSync = loadCoordonates[i].x;
			}

			// current load
			currentStatus.instanceLoadPercent = loadCoordonates[i].y / (currentStatus.instancesReady * instanceMaxLoad);

			// if we are checking for the scale up percentage, checking if instances can handle current load
			if (testingScaleUpPercent) {
				if (currentStatus.instanceLoadPercent >= 1) {
					return -1;
				}
			}

			lastStatus = currentStatus;
			status.push(currentStatus);
		}

		if (testingScaleUpPercent) {
			return 1;
		}

		return status;
	}
}