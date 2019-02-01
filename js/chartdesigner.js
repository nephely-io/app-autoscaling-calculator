
/* charts designer */
class ChartsDesigner {
	static DrawLoadOverTime(canvasId, coordonates) {
		// parsing labels and data
		var data = coordonates.map(e => e.y);
		var labels = coordonates.map(e => moment(e.x.toChartDuration(), ChartsTimeFormat));
		
		new Chart(document.getElementById(canvasId).getContext('2d'), {
			type: 'line',
			data: {
				labels: labels,
				datasets: [{
					type: 'line',
					label: 'Total load',
					borderColor: '#AFAFAF',
					borderWidth: 2,
					fill: false,
					data: data
				}]
			},
			options: {
				title: {
					display: true,
					text: 'Total load over time'
				},
				tooltips: {
					mode: 'index',
					intersect: true
				},
				scales: {
					xAxes: [{
						type: 'time',
						time: {
							unit: 'second',
							format: ChartsTimeFormat
						},
						min: moment('00:00', 'HH:mm'),
						distribution: 'series',
						ticks: {
							source: 'labels'
						}
					}]
				}
			}
		});
	}
	
	static DrawNbInstancesOverTime(canvasId, coordonates) {
		// parsing labels and data
		var data = coordonates.map(e => e.y);
		var labels = coordonates.map(e => moment(e.x.toChartDuration(), ChartsTimeFormat));

		new Chart(document.getElementById(canvasId).getContext('2d'), {
			type: 'line',
			data: {
				labels: labels,
				datasets: [{
					type: 'line',
					label: 'Number of instances',
					borderColor: '#AFAFAF',
					borderWidth: 2,
					fill: false,
					data: data
				}]
			},
			options: {
				title: {
					display: true,
					text: 'Number of instances over time'
				},
				tooltips: {
					mode: 'index',
					intersect: true
				},
				scales: {
					xAxes: [{
						type: 'time',
						time: {
							unit: 'second',
							format: ChartsTimeFormat
						},
						min: moment('00:00', 'HH:mm'),
						distribution: 'series',
						ticks: {
							source: 'labels'
						}
					}]
				}
			}
		});
	}

	static DrawResults(canvasId, coordonates) {
		// console.log(coordonates);
		// parsing labels and data
		var instancesReadyData = coordonates.map(e => e.instancesReady);
		var instancesTotalData = coordonates.map(e => e.instancesReady + e.instancesWaiting.length);
		var instancesLoadPercentData = coordonates.map(e => e.instanceLoadPercent * 100);
		var labels = coordonates.map(e => moment(e.time.toChartDuration(), ChartsTimeFormat));

		new Chart(document.getElementById(canvasId).getContext('2d'), {
			type: 'bar',
			data: {
				labels: labels,
				datasets: [{
					type: 'line',
					label: 'Instances ready',
					borderColor: '#20445f',
					borderWidth: 2,
					fill: false,
					yAxisID: 'y-axis-1',
					data: instancesReadyData
				},{
					type: 'line',
					label: 'Instances total',
					borderColor: '#aecff0',
					borderWidth: 2,
					fill: false,
					yAxisID: 'y-axis-1',
					data: instancesTotalData
				},{
					type: 'line',
					label: 'Instances load percent',
					borderColor: '#e49d23',
					borderWidth: 2,
					fill: false,
					yAxisID: 'y-axis-2',
					data: instancesLoadPercentData
				}]
			},
			options: {
				title: {
					display: true,
					text: 'Number of instances over time'
				},
				tooltips: {
					mode: 'index',
					intersect: true
				},
				scales: {
					xAxes: [{
						type: 'time',
						time: {
							unit: 'second',
							format: ChartsTimeFormat
						},
						min: moment('00:00', 'HH:mm'),
						distribution: 'series',
						ticks: {
							source: 'labels'
						}
					}],
					yAxes: [{
						type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
						display: true,
						position: 'left',
						id: 'y-axis-1',
						min: 0
					}, {
						type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
						display: true,
						position: 'right',
						id: 'y-axis-2',
						gridLines: {
							drawOnChartArea: false
						},
						min: 0,
						max: 100
					}]
				}
			}
		});
	}
}

const ChartsTimeFormat = "HH:mm:ss.SSS";
Number.prototype.toChartDuration = function() {
	var hours = Math.floor(this / 3600);
	var minutes = Math.floor((this - (hours * 3600)) / 60);
	var seconds = this - (hours * 3600) - (minutes * 60);
	var milliseconds = Math.round((this - (hours * 3600) - (minutes * 60) - seconds) * 1000);

	if (hours < 10) {hours   = "0"+hours;}
	if (minutes < 10) {minutes = "0"+minutes;}
	if (seconds < 10) {seconds = "0"+seconds;}
	if (milliseconds < 10) {milliseconds = "00"+milliseconds;}
	else if (milliseconds < 100) {milliseconds = "0"+milliseconds;}
	
	return hours+':'+minutes+':'+seconds+"."+milliseconds;
}