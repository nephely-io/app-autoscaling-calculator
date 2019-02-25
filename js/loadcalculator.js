/* LoadCalculator */
class LoadCalculator {
	static Gauss(nbUsers, userLoadFunction, duration, nbPointSecond, nbIterations) {
		let coordonates = [];
		let const1 = nbUsers * 6 / (Math.sqrt(2 * Math.PI) * nbIterations);
		for (let i=0; i<=(duration * nbPointSecond); i++) {
			let t = i / nbPointSecond;
			let load = userLoadFunction.getLoadAt(t);
			for (let k=1; k<=nbIterations; k++) {
				load += userLoadFunction.getLoadAt(t - k / nbIterations * duration) * Math.exp(-9 / 2 * Math.pow((2 * k - nbIterations) / nbIterations, 2));
			}
			coordonates.push({x: t, y: const1 * load});
		}
		return coordonates;
	}

	static Constant(nbUsers, userLoadFunction, duration, nbPointSecond, nbIterations) {
		let coordonates = [];
		let const1 = nbUsers / nbIterations;
		for (let i=0; i<=(duration * nbPointSecond); i++) {;
			let t = i / nbPointSecond;
			let load = userLoadFunction.getLoadAt(t);
			for (let k=1; k<=nbIterations; k++) {
				load += userLoadFunction.getLoadAt(t - k / nbIterations * duration);
			}
			coordonates.push({x: t, y: const1 * load});
		}
		return coordonates;
	}

	static Linear(nbUsers, userLoadFunction, duration, nbPointSecond, nbIterations) {
		let coordonates = [];
		let const1 = 2 * nbUsers / Math.pow(nbIterations, 2);
		for (let i=0; i<=(duration * nbPointSecond); i++) {
			let t = i / nbPointSecond;
			let load = userLoadFunction.getLoadAt(t);
			for (let k=1; k<=nbIterations; k++) {
				load += k * userLoadFunction.getLoadAt(t - k / nbIterations * duration);
			}
			coordonates.push({x: t, y: const1 * load});
		}
		return coordonates;
	}
}

/* UserLoadFunction */
class UserLoadFunction {
	constructor(functions) {
		this.functions = functions;
	}

	getLoadAt(time) {
		let load = 0;
		for (let i=0;i<this.functions.length; i++){
			load += this.functions[i].func(time) * this.functions[i].percent;
		}
		return load;
	}
}

