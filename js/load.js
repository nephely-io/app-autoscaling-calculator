
/* UserLoadFunction */
class UserLoadFunction {
	constructor(elements) {
	/*
		if (! elements instanceof Array) {
			alert('class UserLoadFunction.constructor :: elements argument is not instance of Array');
			return null;
		}
		for (var i=0;i<elements.length; i++){
			if (! elements[i] instanceof UserLoadFunctionPart) {
				alert('class UserLoadFunction.constructor :: element at index ' + i.toString() + ' is not instance of UserLoadFunctionPart');
				return null;
			}
		}*/
		this.elements = elements;
		// !TODO see if missing gaps (and case 1 element -Infinity to +Infinity)
	}

	getLoadAt(time) {
		var el = null;
		for (var i=0;i<this.elements.length; i++){
			// is-it inside the borders?
			if (((this.elements[i].from == Infinity) && (this.elements[i].to > time)) ||
			((this.elements[i].from <= time) && (this.elements[i].to == Infinity)) ||
			((this.elements[i].from <= time) && (this.elements[i].to > time))) {
				el = this.elements[i];
				break;
			}
		}
		if (el.loadFunction != undefined && el.loadFunction != null) {
			return el.loadFunction(time);
		}
		return el.load;
	}
}
class UserLoadFunctionPart {
	constructor(from, to, load, loadFunction) {
		this.from = from;
		this.to = to;
		this.load = load;
		this.loadFunction = loadFunction;
	}
}

/* LoadCalculator */
class LoadCalculator {
	constructor(timeTotal, nbUsers, nbIterations, loadFunction) {
		if (! loadFunction instanceof UserLoadFunction) {
			alert('class LoadCalculator.constructor :: loadFunction argument is not instance of UserLoadFunction');
			return null;
		}
		if (nbIterations < 1) {
			alert('class LoadCalculator.calculate :: the number of iteration has to be greater than 1');
			return null;
		}

		this.loadFunction = loadFunction;
		this.nbUsers = nbUsers;
		this.timeTotal = timeTotal;
		this.nbIterations = nbIterations;
	}

	getLoadCoordonates(step) {
		var coordonates = [];
		for (var i=0; i<=this.timeTotal; i+=step) {
			coordonates.push({"x": i, "y": this._calculateDotAt(i, this.nbIterations)});
		}
		return coordonates;
	}

	_calculateDotAt(time, n) {
		var sum = 0.0;
		for (var k=1; k<=n; k++) {
			var timeLoad = time - k / n * this.timeTotal;
			var userLoad = this.loadFunction.getLoadAt(timeLoad);
			sum += userLoad * 6 / (Math.sqrt(2 * Math.PI) * n) * Math.exp(-9 / 2 * Math.pow((2 * k - n) / n, 2));
		}
		return this.nbUsers * sum;
	}
}
