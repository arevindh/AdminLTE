/* global Chart:false, moment:false, utils:false */

$(function () {
  var speedlabels = [];
  var downloadspeed = [];
  var uploadspeed = [];
  var serverPing = [];

  function updateSpeedTestData() {
    function formatDate(itemdate, results) {
      // if the the first and last time are 24 hours apart or more
      // then return the date and time, otherwise return the time
      let format = "HH:mm";
      if (results.length > 1) {
        const first = moment(results[0].start_time);
        const last = moment(results[results.length - 1].start_time);
        if (last.diff(first, "hours") >= 24) format = "Do " + format;
      }

      return moment(itemdate).format(format);
    }

    $.ajax({
      url: "api.php?getSpeedData24hrs&PHP",
      dataType: "json",
    }).done(function (results) {
      results.forEach(function (packet) {
        // console.log(speedlabels.indexOf(formatDate(packet.start_time)));
        if (speedlabels.indexOf(formatDate(packet.start_time, results)) === -1) {
          speedlabels.push(formatDate(packet.start_time, results));
          uploadspeed.push(parseFloat(packet.upload));
          downloadspeed.push(parseFloat(packet.download));
          serverPing.push(parseFloat(packet.server_ping));
        }
      });
      speedChart.update();
    });
  }

  setInterval(function () {
    // console.log('updateSpeedTestData');
    updateSpeedTestData();
  }, 6000);

  var gridColor = $(".graphs-grid").css("background-color");
  var ticksColor = $(".graphs-ticks").css("color");

  var speedChartctx = document.getElementById("speedOverTimeChart").getContext("2d");
  var speedChart = new Chart(speedChartctx, {
    type: utils.getGraphType(1),
    data: {
      labels: speedlabels,
      datasets: [
        {
          label: "Mbps Download",
          data: downloadspeed,
          backgroundColor: "rgba(0, 123, 255, 0.5)",
          borderColor: "rgba(0, 123, 255, 1)",
          borderWidth: 1,
          cubicInterpolationMode: "monotone",
          yAxisID: "y-axis-1",
        },
        {
          label: "Mbps Upload",
          data: uploadspeed,
          backgroundColor: "rgba(40, 167, 69, 0.5)",
          borderColor: "rgba(40, 167, 69, 1)",
          borderWidth: 1,
          cubicInterpolationMode: "monotone",
          yAxisID: "y-axis-1",
        },
        {
          label: "ms Ping",
          data: serverPing,
          backgroundColor: "rgba(108, 117, 125, 0.5)",
          borderColor: "rgba(108, 117, 125, 1)",
          borderWidth: 1,
          cubicInterpolationMode: "monotone",
          yAxisID: "y-axis-2",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "nearest",
        axis: "x",
      },
      plugins: {
        legend: {
          display: false,
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          mode: "index",
          intersect: utils.getGraphType(1) === "bar",
          yAlign: "bottom",
          callbacks: {
            label: function (context) {
              return Math.round(context.parsed?.y) + " " + context?.dataset?.label || null;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: gridColor,
          },
          ticks: {
            color: ticksColor,
          },
        },
        "y-axis-1": {
          type: "linear",
          position: "left",
          grid: {
            color: gridColor,
          },
          ticks: {
            color: ticksColor,
          },
        },
        "y-axis-2": {
          type: "linear",
          position: "right",
        },
      },
    },
  });

  updateSpeedTestData();
});
