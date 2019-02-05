/* LoadCalculator */
class LoadCalculator {
	static Gauss(nbUsers, userLoadFunction, duration, nbCoordonates, nbIterations) {
		var coordonates = [];
		for (var i=0; i<=nbCoordonates; i++) {
			var load = 0;
			var t = i * duration / nbCoordonates
			for (var k=1; k<=nbIterations; k++) {
				var timeLoad = t - k / nbIterations * duration;
				var userLoad = userLoadFunction.getLoadAt(timeLoad);
				load += userLoad * 6 / (Math.sqrt(2 * Math.PI) * nbIterations) * Math.exp(-9 / 2 * Math.pow((2 * k - nbIterations) / nbIterations, 2));
			}
			coordonates.push({"x": t, "y": nbUsers * load});
		}
		return coordonates;
	}
}


/* UserLoadFunction */
class UserLoadFunction {
	constructor(parts) {
		this.parts = parts;
	}

	getLoadAt(time) {
		var el = null;
		for (var i=0;i<this.parts.length; i++){
			// is-it inside the borders?parts
			if (this.parts[i].from <= time && this.parts[i].to > time) {
				el = this.parts[i];
				break;
			}
		}
		return el.loadFunction(time);
	}
}
class UserLoadFunctionPart {
	constructor(from, to, loadFunction) {
		this.from = from;
		this.to = to;
		this.loadFunction = loadFunction;
	}
}

