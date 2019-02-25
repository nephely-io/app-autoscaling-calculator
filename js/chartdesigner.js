/* charts designer */
class ChartsDesigner {
	static DrawLoadFunctions(canvasId, loadFunctions, nbPointSecond, loadFunctionDuration) {
	// clearing canvas
	ChartsDesigner._resetCanvas(canvasId);

	// calculating load functions coordonates
	var inTime = -5;
	var lineColors = ["#e49d23", "#8b7356", "#904349", "#20445f", "#aecff0"];
	var datasets = [];
	for (var i=0; i<loadFunctions.length; i++) {
		var data = [];
		for (var j=inTime; j<=loadFunctionDuration; j+= 1/nbPointSecond) {
			data.push(loadFunctions[i].func(j));
		}
		var color = lineColors[i % lineColors.length];
		if (i >= lineColors.length) {
			color = RandomColor();
		}
		datasets.push({
			type: 'line',
			label: 'Load function ' + i + ' (' + (loadFunctions[i].percent * 100) + '% of users)',
			borderColor: color,
			backgroundColor: color,
			borderWidth: 2,
			fill: false,
			data: data
		});
	}

	// labels
	var labels = [];
	for (var j=inTime; j<=loadFunctionDuration; j+= 1/nbPointSecond) {
		labels.push(j);
	}

	// drawing chart
	new Chart(document.getElementById(canvasId).getContext('2d'), {
		type: 'line',
		data: {
			labels: labels,
			datasets: datasets
		},
		options: {
			title: {
				display: true,
				text: 'Load functions over time'
			},
			legend: {
				position: "bottom",
			},
			tooltips: {
				mode: 'index',
				intersect: true
			},
			scales: {
				xAxes: [{
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'Time (seconds)'
					},
					min: 0
				}],
				yAxes: [{
					type: 'linear',
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'Load per user'
					},
					min: 0
				}]
			}
		}
	});
	}

	static DrawLoadOverTime(canvasId, coordonates) {
		// clearing canvas
		ChartsDesigner._resetCanvas(canvasId);
		
		// drawing chart
		new Chart(document.getElementById(canvasId).getContext('2d'), {
			type: 'line',
			data: {
				labels: coordonates.map(e => e.x),
				datasets: [{
					type: 'line',
					label: 'Total load',
					borderColor: '#e49d23',
					backgroundColor: '#e49d23',
					borderWidth: 2,
					fill: false,
					data: coordonates.map(e => Math.round(e.y * 10) / 10)
				}]
			},
			options: {
				title: {
					display: true,
					text: 'Total load over time'
				},
				legend: {
					position: "bottom",
				},
				tooltips: {
					mode: 'index',
					intersect: true
				},
				scales: {
					xAxes: [{
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Time (seconds)'
						},
						min: 0
					}],
					yAxes: [{
						type: 'linear',
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Load'
						},
						min: 0
					}]
				}
			}
		});
	}
	
	static DrawStates(canvasId, states) {
		// number of instances
		var instancesReadyData = [{"x": states[0].time, "y": states[0].instancesReady}]
		var instancesTotalData = [{"x": states[0].time, "y": states[0].instancesWaiting.length}]
		for (var i=1; i<states.length; i++){
			if ((instancesTotalData[instancesTotalData.length-1].y != states[i].instancesWaiting.length) || (instancesReadyData[instancesReadyData.length-1].y != states[i].instancesReady)) {
				if (states[i-1].time != instancesTotalData[instancesTotalData.length-1].x) { // adding previous point to have stair curve
					instancesTotalData.push({"x": states[i-1].time, "y": states[i-1].instancesWaiting.length});
					instancesReadyData.push({"x": states[i-1].time, "y": states[i-1].instancesReady});
				}
				instancesTotalData.push({"x": states[i].time, "y": states[i].instancesWaiting.length});
				instancesReadyData.push({"x": states[i].time, "y": states[i].instancesReady});
			}
		}
		// adding last point
		if (instancesReadyData[instancesReadyData.length-1].x != states[states.length-1].time) {
			instancesTotalData.push({"x": states[states.length-1].time, "y": states[states.length-1].instancesWaiting.length});
			instancesReadyData.push({"x": states[states.length-1].time, "y": states[states.length-1].instancesReady});
		}

		// clearing canvas
		ChartsDesigner._resetCanvas(canvasId);

		// drawing chart
		new Chart(document.getElementById(canvasId).getContext('2d'), {
			type: 'line',
			data: {
				labels: states.map(e => e.time),
				datasets: [{
					type: 'line',
					label: 'Instances ready',
					borderColor: '#20445f',
					backgroundColor: '#20445f',
					borderWidth: 2,
					yAxisID: 'y-instances',
					stack: 'nbInstances',
					lineTension: 0,
					fill: false,
					data: instancesReadyData
				},{
					type: 'line',
					label: 'Instances waiting (stacked)',
					borderColor: '#aecff0',
					backgroundColor: '#aecff0',
					borderWidth: 2,
					yAxisID: 'y-instances',
					stack: 'nbInstances',
					lineTension: 0,
					fill: false,
					data: instancesTotalData
				},{
					type: 'line',
					label: 'Load per instance (right axis)',
					borderColor: '#e49d23',
					backgroundColor: '#e49d23',
					borderWidth: 2,
					yAxisID: 'y-percent',
					stack: 'loadInstance',
					fill: false,
					data: states.map(e => Math.round(e.instanceLoadPercent * 1000) / 10)
				}]
			},
			options: {
				title: {
					display: true,
					text: 'Number of instances & load per instance over time'
				},
				legend: {
					position: "bottom",
				},
				tooltips: {
					mode: 'index',
					intersect: true
				},
				scales: {
					xAxes: [{
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Time (seconds)'
						},
						min: 0
					}],
					yAxes: [{
						type: 'linear',
						display: true,
						position: 'left',
						id: 'y-instances',
						stacked: true,
						scaleLabel: {
							display: true,
							labelString: 'Number of instances'
						},
						min: 0
					}, {
						type: 'linear',
						display: true,
						position: 'right',
						id: 'y-percent',
						gridLines: {
							drawOnChartArea: false
						},
						scaleLabel: {
							display: true,
							labelString: 'Instance load %'
						},
						min: 0,
						max: 100
					}]
				}
			}
		});
	}

	static _resetCanvas(id) {
		var row = document.getElementById(id + "-row");
		row.innerHTML = "";
		var canvas = document.createElement("canvas");
		canvas.id = id;
		row.appendChild(canvas);
	}
}
