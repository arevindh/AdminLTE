$(function () {
  var speedlabels = [];
  var downloadspeed = [];
  var uploadspeed = [];
  var speeddata = [];
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
      speeddata = results;
    });
  }

  setInterval(function () {
    // console.log('updateSpeedTestData');
    updateSpeedTestData();
  }, 6000);

  var uploadColor = $(".speedtest-upload").css("background-color");
  var downloadColor = $(".speedtest-download").css("background-color");
  var pingColor = $(".speedtest-ping").css("background-color");

  var gridColor = $(".graphs-grid").css("background-color");
  var ticksColor = $(".graphs-ticks").css("color");

  var speedChartctx = document.getElementById("speedtestChart");
  var speedChart = new Chart(speedChartctx, {
    type: "line",
    data: {
      labels: speedlabels,
      datasets: [
        {
          label: "Download Mbps",
          data: downloadspeed,
          backgroundColor: downloadColor,
          fill: false,
          borderColor: downloadColor,
          borderWidth: 1,
          cubicInterpolationMode: "monotone",
          yAxisID: "y-axis-1",
        },
        {
          label: "Upload Mbps",
          data: uploadspeed,
          backgroundColor: uploadColor,
          fill: false,
          borderColor: uploadColor,
          borderWidth: 1,
          yAxisID: "y-axis-1",
        },
        {
          label: "Ping ms",
          data: serverPing,
          backgroundColor: pingColor,
          fill: false,
          borderColor: pingColor,
          borderWidth: 1,
          borderDash: [5, 5],
          yAxisID: "y-axis-2",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        display: true,
        position: "bottom",
      },
      scales: {
        yAxes: [
          {
            type: "linear", // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
            display: true,
            position: "left",
            id: "y-axis-1",
            ticks: {
              // min: 0,
              fontColor: ticksColor,
            },
            gridLines: {
              color: gridColor,
            },
          },
          {
            type: "linear", // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
            display: true,
            position: "right",
            id: "y-axis-2",
            ticks: {
              // min: 0,
              fontColor: ticksColor,
            },
            gridLines: {
              color: gridColor,
            },
          },
        ],
        xAxes: [
          {
            // type :'time',
            display: true,
            scaleLabel: {
              display: true,
            },
            gridLines: {
              color: gridColor,
              zeroLineColor: gridColor,
            },
            ticks: {
              // autoSkip: true,
              maxTicksLimit: 10,
              maxRotation: 0,
              minRotation: 0,
              fontColor: ticksColor,
            },
          },
        ],
      },
      tooltips: {
        enabled: true,
        mode: "x-axis",
        intersect: false,
      },
    },
  });

  updateSpeedTestData();
});
