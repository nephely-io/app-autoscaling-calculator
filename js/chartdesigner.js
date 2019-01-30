
/* charts designer */
class ChartsDesigner {
	static DrawLoadOverTime(canvasId, coordonates, nbXAxeCuts) {
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