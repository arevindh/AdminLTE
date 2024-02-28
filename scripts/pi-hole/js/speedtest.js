/* global Chart:false, moment:false */

function getGraphType(speedtest = 0) {
  // Only return line if `barchart_chkbox` is explicitly set to false. Else return bar
  if (!speedtest) {
    return localStorage?.getItem("barchart_chkbox") === "false" ? "line" : "bar";
  }

  return localStorage?.getItem("speedtest_chart_type") || "line";
}

function getCSSval(cssclass, cssproperty) {
  var elem = $("<div class='" + cssclass + "'></div>"),
    val = elem.appendTo("body").css(cssproperty);
  elem.remove();
  return val;
}

var speedChart = null;
var speedlabels = [];
var downloadspeed = [];
var uploadspeed = [];
var serverPing = [];
function createChart() {
  var gridColor = getCSSval("graphs-grid", "background-color");
  var ticksColor = getCSSval("graphs-ticks", "color");
  const chartElement = document.getElementById("speedOverTimeChart");
  if (chartElement === null || chartElement === undefined) return;
  var speedChartctx = chartElement.getContext("2d");
  if (speedChartctx === null || speedChartctx === undefined) return;
  speedChart = new Chart(speedChartctx, {
    type: getGraphType(1),
    data: {
      labels: speedlabels,
      datasets: [
        {
          label: "Mbps Download",
          data: downloadspeed,
          backgroundColor: "rgba(0, 123, 255, 0.5)",
          borderColor: "rgba(0, 123, 255, 1)",
          borderWidth: 3,
          yAxisID: "y-axis-1",
          tension: 0.4,
          pointHitRadius: 5,
          pointHoverRadius: 5,
        },
        {
          label: "Mbps Upload",
          data: uploadspeed,
          backgroundColor: "rgba(40, 167, 69, 0.5)",
          borderColor: "rgba(40, 167, 69, 1)",
          borderWidth: 3,
          yAxisID: "y-axis-1",
          tension: 0.4,
          pointHitRadius: 5,
          pointHoverRadius: 5,
        },
        {
          label: "ms Ping",
          data: serverPing,
          backgroundColor: "rgba(108, 117, 125, 0.5)",
          borderColor: "rgba(108, 117, 125, 1)",
          borderWidth: 3,
          yAxisID: "y-axis-2",
          tension: 0.4,
          pointHitRadius: 5,
          pointHoverRadius: 5,
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
          intersect: getGraphType(1) === "bar",
          yAlign: "bottom",
          callbacks: {
            label: function (context) {
              return (
                Math.round(context?.parsed?.y ?? 0) + " " + (context?.dataset?.label ?? "") || null
              );
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
      elements: {
        point: {
          radius: speedlabels.length > 1 ? 0 : 6,
        },
      },
    },
  });
}

function formatDate(itemdate, results) {
  let output = "HH:mm";
  if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    return moment.utc(itemdate, "YYYY-MM-DD HH:mm:ss").local().format(output);
  }

  const first = moment(results.at(0).start_time, "YYYY-MM-DD HH:mm:ssZ");
  if (moment.utc().diff(first, "hours") > 24) {
    output = "Do HH:mm";
  }

  return moment.utc(itemdate, "YYYY-MM-DD HH:mm:ss").local().format(output);
}

function updateSpeedTestData() {
  const daysIsTheSame = days === localStorage?.getItem("speedtest_days");
  const typeIsTheSame = type === localStorage?.getItem("speedtest_chart_type");
  const beenHidden = localStorage?.getItem("speedtest_preview_hidden") === "true";
  days = localStorage?.getItem("speedtest_days") || "-2";
  type = localStorage?.getItem("speedtest_chart_type") || "line";

  speedlabels = [];
  downloadspeed = [];
  uploadspeed = [];
  serverPing = [];

  $.ajax({
    url: "api.php?getSpeedData=" + days,
    dataType: "json",
  }).done(function (results) {
    results?.forEach(function (packet) {
      // console.log(speedlabels.indexOf(formatDate(packet.start_time)));
      if (speedlabels.indexOf(formatDate(packet.start_time, results)) === -1) {
        speedlabels.push(formatDate(packet.start_time, results));
        uploadspeed.push(parseFloat(packet.upload));
        downloadspeed.push(parseFloat(packet.download));
        serverPing.push(parseFloat(packet.server_ping));
      }
    });
    if (
      speedChart &&
      (!daysIsTheSame ||
        !typeIsTheSame ||
        beenHidden ||
        (type === "line" && speedChart.data?.labels?.length < 2 && speedlabels?.length > 1)) &&
      days !== "-2"
    ) {
      speedChart.destroy();
      speedChart = null;
    }

    if (!speedChart) {
      localStorage.setItem(
        "speedtest_preview_hidden",
        !localStorage?.getItem("speedtest_preview_shown")
      );
      createChart();
    }

    if (
      speedChart &&
      speedChart !== null &&
      speedChart !== undefined &&
      speedChart.data.labels !== speedlabels
    ) {
      speedChart.data.labels = speedlabels;
      speedChart.data.datasets[0].data = downloadspeed;
      speedChart.data.datasets[1].data = uploadspeed;
      speedChart.data.datasets[2].data = serverPing;
      speedChart.update();
    }

    $("#speedOverTimeChartOverlay").css("display", "none");
  });
}

var days = "";
var type = "";

$(function () {
  updateSpeedTestData();
  setInterval(function () {
    updateSpeedTestData();
  }, 1000);
});
