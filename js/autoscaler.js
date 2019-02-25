/* Appication */
class ApplicationConfig {
	constructor(instanceMaxLoad, instanceStartDuration, minNbInstances) {
		this.instanceMaxLoad = instanceMaxLoad;
		this.instanceStartDuration = instanceStartDuration;
		this.minNbInstances = minNbInstances;
	}
}
class ApplicationState {
	constructor(time, instanceStartDuration, instancesReady, instancesWaiting){
		this.time = time;
		this.instancesReady = instancesReady;
		this.instancesWaiting = instancesWaiting;
		this.instanceLoadPercent = 0;
		this.wantedNumberInstances = null;

		// checking instance waiting hasn't started
		let deleteInstancesWaitingIndexes = [];
		for (let j=0; j<this.instancesWaiting.length; j++) {
			if (time - this.instancesWaiting[j].time >= instanceStartDuration) {
				this.instancesReady++;
				deleteInstancesWaitingIndexes.push(j);
			}
		}
		// removing instances that have started from waiting list
		deleteInstancesWaitingIndexes.reverse();
		for (let j=0; j<deleteInstancesWaitingIndexes.length; j++) {
			this.instancesWaiting.splice(deleteInstancesWaitingIndexes[j], 1);
		}
	}

	calculateInstanceLoad(instanceMaxLoad, totalLoad) {
		this.instanceLoadPercent = totalLoad / (this.instancesReady * instanceMaxLoad)
	}

	calculateWantedNbInstances(instanceMaxLoad, totalLoad, scaleUpPercent) {
		this.wantedNumberInstances = Math.ceil(totalLoad / (instanceMaxLoad * scaleUpPercent));
	}

	startInstances(nb) {
		for (let j=0; j < nb; j++) {
			this.instancesWaiting.push({time: this.time});
		}
	}

	downScaleTo(nbInstance, minNbInstances) {
		// we should not find any case where this.instancesWaiting.length > 0
		if (nbInstance <= minNbInstances) {
			this.instancesReady = minNbInstances - this.instancesWaiting.length;
		} else {
			this.instancesReady = nbInstance - this.instancesWaiting.length;
		}
	}

	cloneForNextState(time, instanceStartDuration) {
		return new ApplicationState(time, instanceStartDuration, this.instancesReady, this.instancesWaiting.slice(0));
	}

	clone() {
		let state = new ApplicationState(this.time, Infinity, this.instancesReady, this.instancesWaiting.slice(0));
		state.instanceLoadPercent = this.instanceLoadPercent;
		return state;
	}
}

/* Orchestrator */
class OrchestratorState {
	constructor(lastCheck, lastScaleUp, lastScaleDown) {
		this.lastCheck = lastCheck;
		this.lastScaleUp = lastScaleUp;
		this.lastScaleDown = lastScaleDown;
	}
}
class OrchestratorResult {
	constructor(appStates, scaleUpPercent) {
		this.states = appStates;
		this.scaleUpPercent = scaleUpPercent;
		
		// looking for max nb of instance and max load/instance
		this.maxLoad = 0;
		this.maxInstances = 0;
		for(let i=0; i<appStates.length; i++) {
			let nbInstances = appStates[i].instancesReady + appStates[i].instancesWaiting.length;
			if (nbInstances > this.maxInstances) {
				this.maxInstances = nbInstances;
			}
			if (appStates[i].instanceLoadPercent > this.maxLoad) {
				this.maxLoad = appStates[i].instanceLoadPercent;
			}
		}
	}
}
/* AutoScaler */
class AutoScaler {
	static resolveScaleUpPercent(loadCoordonates, nbIndexes, appConfig, autoScalerConfig, nextStateCallback) {
		return Dichotomy(function(scaleUpPercent) {
			let newLoadCoordonates = loadCoordonates.slice(0);
			for (let i=0; i<nbIndexes; i++) {
				let result = AutoScaler.testResult(newLoadCoordonates, appConfig, autoScalerConfig, scaleUpPercent, nextStateCallback);
				if (result < 0) {
					return -1;
				}
				newLoadCoordonates.splice(0,1);
			}
			return 1;
		});
	}

	static testResult(loadCoordonates, appConfig, autoScalerConfig, scaleUpPercent, nextStateCallback) {
		// creating application state
		let nbInstanceStart = Math.ceil(loadCoordonates[0].y / (appConfig.instanceMaxLoad * scaleUpPercent));
		if (nbInstanceStart < appConfig.minNbInstances) {
			nbInstanceStart = appConfig.minNbInstances;
		}
		let appState = new ApplicationState(loadCoordonates[0].x, appConfig.instanceStartDuration, nbInstanceStart, []);

		// creating orchestrator state
		let orchestratorState = new OrchestratorState(-Infinity, -Infinity, -Infinity);

		// checking each loadCoordonate to see if the result is valid
		let lastResult = {appState: appState, orchestratorState: orchestratorState};
		let appStateHistory = [appState];
		for (let i=1; i<loadCoordonates.length; i++) {
			lastResult = nextStateCallback(loadCoordonates[i], appStateHistory, lastResult.orchestratorState, appConfig, autoScalerConfig, scaleUpPercent);
			if (lastResult.appState.instanceLoadPercent >= 1) {
				return -1; // instance is too high, test doesn't pass
			}
			appStateHistory.push(lastResult.appState);
		}
		return 1; // every load coordonate have passed, test success
	}

	static calculateStates(loadCoordonates, appConfig, autoScalerConfig, scaleUpPercent, nextStateCallback) {
		// creating application state
		let nbInstanceStart = Math.ceil(loadCoordonates[0].y / (appConfig.instanceMaxLoad * scaleUpPercent));
		if (nbInstanceStart < appConfig.minNbInstances) {
			nbInstanceStart = appConfig.minNbInstances;
		}
		let appState = new ApplicationState(loadCoordonates[0].x, appConfig.instanceStartDuration, nbInstanceStart, []);
		appState.calculateInstanceLoad(appConfig.instanceMaxLoad, loadCoordonates[0].y);

		// creating orchestrator state
		let orchestratorState = new OrchestratorState(-Infinity, -Infinity, -Infinity);

		// checking each loadCoordonate to see if the result is valid
		let appStateHistory = [appState];
		let lastStates = {appState: appState, orchestratorState: orchestratorState};
		for (let i=1; i<loadCoordonates.length; i++) {
			lastStates = nextStateCallback(loadCoordonates[i], appStateHistory, lastStates.orchestratorState, appConfig, autoScalerConfig, scaleUpPercent);
			appStateHistory.push(lastStates.appState);
		}

		return new OrchestratorResult(appStateHistory, scaleUpPercent);
	}
}

function Dichotomy(checkCallback, min = 0, max = 1, precision = 0.001) {
	while(max - min > precision) {
		let current = (max + min) / 2;
		let result = checkCallback(current);
		if (result > 0) {
			min = current;
		} else { // propability to have 0 is quite null, and if it happens it's better lowering it a little
			max = current;
		}
	}
	let result = Math.floor(min / precision) * precision;
	return result;
}

/* Kubernetes <= 1.11 */
class Kubernetes_1_11Config {
	constructor(horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance, horizontalPodAutoscalerUpscaleDelay, horizontalPodAutoscalerDownscaleDelay) {
		this.horizontalPodAutoscalerSyncPeriod = horizontalPodAutoscalerSyncPeriod;
		this.horizontalPodAutoscalerTolerance = horizontalPodAutoscalerTolerance;
		this.horizontalPodAutoscalerUpscaleDelay = horizontalPodAutoscalerUpscaleDelay;
		this.horizontalPodAutoscalerDownscaleDelay = horizontalPodAutoscalerDownscaleDelay;
	}
}
class Kubernetes_1_11 {
	static resolveScaleUpPercent(loadCoordonates, appConfig, k8sConfig) {
		let nbIndexes = Math.ceil(k8sConfig.horizontalPodAutoscalerSyncPeriod / loadCoordonates[1].x);
		return AutoScaler.resolveScaleUpPercent(loadCoordonates, nbIndexes, appConfig, k8sConfig, Kubernetes_1_11._nextAppState);
	}

	static calculateStates(loadCoordonates, appConfig, k8sConfig, scaleUpPercent) {
		return AutoScaler.calculateStates(loadCoordonates, appConfig, k8sConfig, scaleUpPercent, Kubernetes_1_11._nextAppState);
	}

	static _nextAppState(loadCoordonate, appStateHistory, orchestratorState, appConfig, k8sConfig, scaleUpPercent) {
		let appState = appStateHistory[appStateHistory.length-1].cloneForNextState(loadCoordonate.x, appConfig.instanceStartDuration);

		// is sync period passed
		if (loadCoordonate.x - orchestratorState.lastCheck > k8sConfig.horizontalPodAutoscalerSyncPeriod) {
			let totalNumberOfInstances = appState.instancesReady + appState.instancesWaiting.length;
			let instanceRelativeLoadPercent = loadCoordonate.y / (totalNumberOfInstances * appConfig.instanceMaxLoad * scaleUpPercent);
			let wantedNumberInstances = Math.ceil(loadCoordonate.y / (appConfig.instanceMaxLoad * scaleUpPercent));
			// is load above or below tolerance?
			if ((instanceRelativeLoadPercent > 1 + k8sConfig.horizontalPodAutoscalerTolerance) && 
			(loadCoordonate.x - orchestratorState.lastScaleUp > k8sConfig.horizontalPodAutoscalerUpscaleDelay) && 
			(wantedNumberInstances > totalNumberOfInstances)) {
				// starting new instances
				appState.startInstances(wantedNumberInstances - totalNumberOfInstances);
				orchestratorState.lastScaleUp = loadCoordonate.x;
			} else if ((instanceRelativeLoadPercent < 1 - k8sConfig.horizontalPodAutoscalerTolerance) && 
			(loadCoordonate.x - orchestratorState.lastScaleDown > k8sConfig.horizontalPodAutoscalerDownscaleDelay) && 
			(wantedNumberInstances < totalNumberOfInstances)) {
				// scaling down
				appState.downScaleTo(wantedNumberInstances, appConfig.minNbInstances);
				orchestratorState.lastScaleDown = loadCoordonate.x;
			}
			orchestratorState.lastCheck = loadCoordonate.x;
		}

		// calcultating load
		appState.calculateInstanceLoad(appConfig.instanceMaxLoad, loadCoordonate.y);

		return {appState: appState, orchestratorState: orchestratorState};
	}
}

/* Kubernetes >= 1.12 */
class Kubernetes_1_12Config {
	constructor(horizontalPodAutoscalerSyncPeriod, horizontalPodAutoscalerTolerance, horizontalPodAutoscalerInitialReadinessDelay, horizontalPodAutoscalerDownscaleStabilizationWindow) {
		this.horizontalPodAutoscalerSyncPeriod = horizontalPodAutoscalerSyncPeriod;
		this.horizontalPodAutoscalerTolerance = horizontalPodAutoscalerTolerance;
		this.horizontalPodAutoscalerInitialReadinessDelay = horizontalPodAutoscalerInitialReadinessDelay;
		this.horizontalPodAutoscalerDownscaleStabilizationWindow = horizontalPodAutoscalerDownscaleStabilizationWindow;
	}
}
class Kubernetes_1_12 {
	static resolveScaleUpPercent(loadCoordonates, appConfig, k8sConfig) {
		let nbIndexes = Math.ceil(k8sConfig.horizontalPodAutoscalerSyncPeriod / loadCoordonates[1].x);
		return AutoScaler.resolveScaleUpPercent(loadCoordonates, nbIndexes, appConfig, k8sConfig, Kubernetes_1_12._nextAppState);
	}

	static calculateStates(loadCoordonates, appConfig, k8sConfig, scaleUpPercent) {
		return AutoScaler.calculateStates(loadCoordonates, appConfig, k8sConfig, scaleUpPercent, Kubernetes_1_12._nextAppState);
	}

	static _nextAppState(loadCoordonate, appStateHistory, orchestratorState, appConfig, k8sConfig, scaleUpPercent) {
		let appState = appStateHistory[appStateHistory.length-1].cloneForNextState(loadCoordonate.x, appConfig.instanceStartDuration);

		// is sync period passed
		if (loadCoordonate.x - orchestratorState.lastCheck > k8sConfig.horizontalPodAutoscalerSyncPeriod) {
			let totalNumberOfInstances = appState.instancesReady + appState.instancesWaiting.length;
			let instanceRelativeLoadPercent = loadCoordonate.y / (totalNumberOfInstances * appConfig.instanceMaxLoad * scaleUpPercent);
			let wantedNumberInstances = Math.ceil(loadCoordonate.y / (appConfig.instanceMaxLoad * scaleUpPercent));
			// is load above or below tolerance?
			if ((instanceRelativeLoadPercent > 1 + k8sConfig.horizontalPodAutoscalerTolerance) &&
			(wantedNumberInstances > totalNumberOfInstances)) {
				// starting new instances
				appState.startInstances(wantedNumberInstances - totalNumberOfInstances);
			} else if ((instanceRelativeLoadPercent < 1 - k8sConfig.horizontalPodAutoscalerTolerance) &&
			(wantedNumberInstances < totalNumberOfInstances)) {
				// looking for max recommendation over cooldown delay
				let maxWantedInstanceNumber = wantedNumberInstances;
				for (let j=0; j<appStateHistory.length; j++) {
					if ((appStateHistory[j].wantedNumberInstances != null) &&
					(appStateHistory[j].time + k8sConfig.horizontalPodAutoscalerDownscaleStabilizationWindow > appState.time) &&
					(appStateHistory[j].wantedNumberInstances > maxWantedInstanceNumber)) {
						maxWantedInstanceNumber = status[j].wantedNumberInstances;
					}
				}

				// scaling down if needed
				if (maxWantedInstanceNumber < totalNumberOfInstances) {
					appState.downScaleTo(maxWantedInstanceNumber, appConfig.minNbInstances);
				}
			}

			orchestratorState.lastCheck = loadCoordonate.x;
			appState.calculateWantedNbInstances(appConfig.instanceMaxLoad, loadCoordonate.y, scaleUpPercent); // only checked once a while
		}

		// calcultating loadinstanceMaxLoad, totalLoad
		appState.calculateInstanceLoad(appConfig.instanceMaxLoad, loadCoordonate.y);

		return {appState: appState, orchestratorState: orchestratorState};
	}
}