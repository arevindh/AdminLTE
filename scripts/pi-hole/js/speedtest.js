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
            title: function (context) {
              const tick = context.slice(0, 1).shift().label ?? "";
              const spaces = (tick.match(/ /g) || []).length;
              const words = tick.split(" ");
              let title = "Speedtest results";
              if (spaces === 0) {
                title += " at " + words[0];
              } else if (spaces === 1) {
                title += " on the " + words[0] + " at " + words[1];
              } else if (spaces === 2) {
                title += " on " + words[0] + " " + words[1] + " at " + words[2];
              } else if (spaces === 3) {
                title += " on " + words[0] + " " + words[1] + " " + words[2] + " at " + words[3];
              }
              return title;
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
    if (results === null || results === undefined) return;

    // concat() can be used to make a shallow copy of the array
    // aka duplicate its top level elements, or the references to its objects
    // instead of using slice(0, 1) or slice(-1)
    // shift() is used to remove and return the first element of the array
    // pop() can be used to remove and return the last element of the array
    // this is all to avoid using at(), which not supported in Safari
    // and to avoid using [], which is looked down upon by the linter
    const firstStartTime = results.slice(0, 1).shift().start_time;
    const currDateTime = moment.utc();
    const formats = {
      YYYY: "YYYY MMM D HH:mm",
      MM: "MMM D HH:mm",
      DD: "Do HH:mm",
    };
    let dateFormat = "HH:mm";

    for (const [key, value] of Object.entries(formats)) {
      if (moment(firstStartTime, "YYYY-MM-DD HH:mm:ss").format(key) !== currDateTime.format(key)) {
        dateFormat = value;
        break;
      }
    }

    results.forEach(function (packet) {
      speedlabels.push(
        moment.utc(packet.start_time, "YYYY-MM-DD HH:mm:ss").local().format(dateFormat)
      );
      uploadspeed.push(parseFloat(packet.upload));
      downloadspeed.push(parseFloat(packet.download));
      serverPing.push(parseFloat(packet.server_ping));
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
