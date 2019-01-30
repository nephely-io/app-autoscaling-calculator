
/* charts designer */
const ChartsTimeFormat = "HH:mm:ss.SSS";
class ChartsDesigner {
	static DrawLoadOverTime(canvasId, coordonates) {
	// parsing labels and data
	var data = coordonates.map(e => e.y);
	var labels = coordonates.map(e => moment(e.x.toChartDuration(), ChartsTimeFormat));

// var ctx = document.getElementById("MeSeStatusCanvas").getContext('2d');
// var myChart = new Chart(ctx, {
//    type: 'horizontalBar',
//    data: {
//       yLabels: labels,
//       datasets: [{
//          label: 'Voltage Fluctuation',
//          data: data,
//          borderWidth: 1
//       }]
//    },
//    options: {
//       scales: {
//          xAxes: [{
//             type: 'time',
//             time: {
//                unit: 'hour',
//                displayFormats: {
//                   hour: 'HH:mm'
//                },
//                /* (required to show first bar)
//                	set min prop, less than the minimum value of data.
//                	in this case minimum data value is '15:00', so we set '14:00'
//                 */
//                min: moment('14:00', 'HH:mm')
//             }
//          }]
//       }
//    }
// });

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
				// scales: {
				// 	xAxes: [{
				// 		type: 'time',
				// 		time: {
				// 			format: timeFormat,
				// 			// round: 'day'
				// 			tooltipFormat: 'll HH:mm'
				// 		},
				// 		scaleLabel: {
				// 			display: true,
				// 			labelString: 'Date'
				// 		}
				// 	}],
				// 	yAxes: [{
				// 		scaleLabel: {
				// 			display: true,
				// 			labelString: 'value'
				// 		}
				// 	}]
				// }
			}
		});
	}
}


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