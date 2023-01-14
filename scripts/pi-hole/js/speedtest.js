/* global Chart:false, moment:false */

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

  var speedChartctx = document.getElementById("speedOverTime");
  var speedChart = new Chart(speedChartctx, {
    type: "line",
    data: {
      labels: speedlabels,
      datasets: [
        {
          label: "Download Mbps",
          data: downloadspeed,
          backgroundColor: "rgba(0, 123, 255, 0.5)",
          borderColor: "rgba(0, 123, 255, 1)",
          borderWidth: 1,
          cubicInterpolationMode: "monotone",
          yAxisID: "y-axis-1",
        },
        {
          label: "Upload Mbps",
          data: uploadspeed,
          backgroundColor: "rgba(40, 167, 69, 0.5)",
          borderColor: "rgba(40, 167, 69, 1)",
          borderWidth: 1,
          yAxisID: "y-axis-1",
        },
        {
          label: "Ping ms",
          data: serverPing,
          backgroundColor: "rgba(108, 117, 125, 0.5)",
          borderColor: "rgba(108, 117, 125, 1)",
          borderWidth: 1,
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
          display: true,
          position: "bottom",
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          enabled: true,
          intersect: false,
          yAlign: "bottom",
          callbacks: {
            label: function (context) {
              var label = context.dataset.label || "";

              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y;
              }
              return label;
            }
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
          offset: true,
        },
      },
    },
  });

  updateSpeedTestData();
});
