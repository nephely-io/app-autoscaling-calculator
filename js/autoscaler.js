
/* AutoScaler */
class AutoScaler {
	constructor(loadCoordonates, instanceMaxLoad) {
		this.events = [];
		var oldNbInstances = 0;
		for (var i=0; i<loadCoordonates.length; i++){
			var nbInstances = Math.ceil(loadCoordonates[i].x / instanceMaxLoad);
			if (nbInstances > oldNbInstances) {
				this.events.push(new AutoScaleEvent(AutoScalerAction.UP, loadCoordonates[i].y))
				oldNbInstances = nbInstances;
			} else if (nbInstances < oldNbInstances) {
				this.events.push(new AutoScaleEvent(AutoScalerAction.DOWN, loadCoordonates[i].y))
				oldNbInstances = nbInstances;
			}
		}

		this.instanceMaxLoad = instanceMaxLoad;
		this.totalDuration = loadCoordonates[loadCoordonates.length-1].y;
	}

	getNbInstancesCoordonates() {
		var coordonates = [];
		var nbInstances = 0;
		for (var i=0; i<this.events.length; i++) {
			if (this.events[i].action == AutoScalerAction.UP) {
				nbInstances++;
			} else {
				nbInstances--;
			}
			coordonates.push({"x": this.events[i].time, "y": nbInstances});
		}
		// adding last point
		coordonates.push({"x": this.totalDuration, "y": nbInstances});
		return coordonates;
	}
}
class AutoScaleEvent {
	constructor(action, time) {
		this.action = action;
		this.time = time;
	}
}
var AutoScalerAction = Object.freeze({"UP":1, "DOWN":2});