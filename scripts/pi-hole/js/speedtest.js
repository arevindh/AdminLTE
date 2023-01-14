/* global Chart:false, moment:false */

// speedOverTimeLineChart
$(function () {
  var speedlabels = [];
  var downloadspeed = [];
  var uploadspeed = [];
  var serverPing = [];

  function updateSpeedTestData() {
    function formatDate(itemdate) {
      return moment(itemdate).format("Do HH:mm");
    }

    $.ajax({
      url: "api.php?getSpeedData24hrs&PHP",
      dataType: "json",
    }).done(function (results) {
      results.forEach(function (packet) {
        // console.log(speedlabels.indexOf(formatDate(packet.start_time)));
        if (speedlabels.indexOf(formatDate(packet.start_time)) === -1) {
          speedlabels.push(formatDate(packet.start_time));
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
    type: utils.getGraphType(),
    data: {
      labels: speedlabels,
      datasets: [
        {
          label: "Download Mbps",
          data: downloadspeed,
        },
        {
          label: "Upload Mbps",
          data: uploadspeed,
        },
        {
          label: "Ping ms",
          data: serverPing,
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
          display: true,
          position: "bottom",
        },
        tooltip: {
          enabled: true,
          intersect: false,
          yAlign: "bottom",
        }
      },
      scales: {
        yAxes: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            color: ticksColor,
            precision: 0,
          },
          grid: {
            color: gridColor,
            drawBorder: false,
          },
        },
        xAxes: {
          type: "time",
          stacked: true,
          offset: false,
          time: {
            unit: "day",
            displayFormats: {
              day: "Do HH:mm",
            },
            tooltipFormat: "Do HH:mm",
            minUnit: "hour",
            min: moment().subtract(24, "hours"),
            max: moment(),
            stepSize: 1,
          },
          grid: {
            color: gridColor,
            offset: false,
            drawBorder: false,
          },
          ticks: {
            color: ticksColor,
          },
        },
      },
      elements: {
        line: {
          borderWidth: 0,
          spanGaps: false,
          fill: true,
        },
        point: {
          radius: 0,
          hoverRadius: 5,
          hitRadius: 5,
        },
      },
    },
  });

  updateSpeedTestData();
});
