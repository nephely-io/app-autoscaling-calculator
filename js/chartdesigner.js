/* charts designer */
class ChartsDesigner {
	static DrawLoadOverTime(canvasId, coordonates) {
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
							labelString: 'Number of instances'
						},
						min: 0
					}]
				}
			}
		});
	}
	
	static DrawResults(canvasId, results) {
		// number of instances
		var instancesLoadPercentData = results.map(e => Math.round(e.instanceLoadPercent * 1000) / 10);
		var instancesReadyData = [{"x": results[0].time, "y": results[0].instancesReady}]
		var instancesTotalData = [{"x": results[0].time, "y": results[0].instancesWaiting.length}]
		for (var i=1; i<results.length; i++){
			if ((instancesTotalData[instancesTotalData.length-1].y != results[i].instancesWaiting.length) || (instancesReadyData[instancesReadyData.length-1].y != results[i].instancesReady)) {
				if (results[i-1].time != instancesTotalData[instancesTotalData.length-1].x) { // adding previous point to have stair curve
					instancesTotalData.push({"x": results[i-1].time, "y": results[i-1].instancesWaiting.length});
					instancesReadyData.push({"x": results[i-1].time, "y": results[i-1].instancesReady});
				}
				instancesTotalData.push({"x": results[i].time, "y": results[i].instancesWaiting.length});
				instancesReadyData.push({"x": results[i].time, "y": results[i].instancesReady});
			}
		}
		// adding last point
		if (instancesReadyData[instancesReadyData.length-1].x != results[results.length-1].time) {
			instancesTotalData.push({"x": results[results.length-1].time, "y": results[results.length-1].instancesWaiting.length});
			instancesReadyData.push({"x": results[results.length-1].time, "y": results[results.length-1].instancesReady});
		}

		// parsing labels
		new Chart(document.getElementById(canvasId).getContext('2d'), {
			type: 'line',
			data: {
				labels: results.map(e => e.time),
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
					data: results.map(e => Math.round(e.instanceLoadPercent * 1000) / 10)
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
}

/*
		var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		var config = {
			type: 'line',
			data: {
				labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
				datasets: [{
					label: 'My First dataset',
					backgroundColor: window.chartColors.red,
					borderColor: window.chartColors.red,
					data: [
						randomScalingFactor(),
						randomScalingFactor(),
						randomScalingFactor(),
						randomScalingFactor(),
						randomScalingFactor(),
						randomScalingFactor(),
						randomScalingFactor()
					],
					fill: false,
				}, {
					label: 'My Second dataset',
					fill: false,
					backgroundColor: window.chartColors.blue,
					borderColor: window.chartColors.blue,
					data: [
						randomScalingFactor(),
						randomScalingFactor(),
						randomScalingFactor(),
						randomScalingFactor(),
						randomScalingFactor(),
						randomScalingFactor(),
						randomScalingFactor()
					],
				}]
			},
			options: {
				responsive: true,
				title: {
					display: true,
					text: 'Chart.js Line Chart'
				},
				tooltips: {
					mode: 'index',
					intersect: false,
				},
				hover: {
					mode: 'nearest',
					intersect: true
				},
				scales: {
					xAxes: [{
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Month'
						}
					}],
					yAxes: [{
						display: true,
						scaleLabel: {
							display: true,
							labelString: 'Value'
						}
					}]
				}
			}
		};

		window.onload = function() {
			var ctx = document.getElementById('canvas').getContext('2d');
			window.myLine = new Chart(ctx, config);
		};

		document.getElementById('randomizeData').addEventListener('click', function() {
			config.data.datasets.forEach(function(dataset) {
				dataset.data = dataset.data.map(function() {
					return randomScalingFactor();
				});

			});

			window.myLine.update();
		});

		var colorNames = Object.keys(window.chartColors);
		document.getElementById('addDataset').addEventListener('click', function() {
			var colorName = colorNames[config.data.datasets.length % colorNames.length];
			var newColor = window.chartColors[colorName];
			var newDataset = {
				label: 'Dataset ' + config.data.datasets.length,
				backgroundColor: newColor,
				borderColor: newColor,
				data: [],
				fill: false
			};

			for (var index = 0; index < config.data.labels.length; ++index) {
				newDataset.data.push(randomScalingFactor());
			}

			config.data.datasets.push(newDataset);
			window.myLine.update();
		});

		document.getElementById('addData').addEventListener('click', function() {
			if (config.data.datasets.length > 0) {
				var month = MONTHS[config.data.labels.length % MONTHS.length];
				config.data.labels.push(month);

				config.data.datasets.forEach(function(dataset) {
					dataset.data.push(randomScalingFactor());
				});

				window.myLine.update();
			}
		});

		document.getElementById('removeDataset').addEventListener('click', function() {
			config.data.datasets.splice(0, 1);
			window.myLine.update();
		});

		document.getElementById('removeData').addEventListener('click', function() {
			config.data.labels.splice(-1, 1); // remove the label first

			config.data.datasets.forEach(function(dataset) {
				dataset.data.pop();
			});

			window.myLine.update();
		});
	
*/