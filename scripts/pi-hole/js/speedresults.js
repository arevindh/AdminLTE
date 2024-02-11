/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */
/* global moment:false */

var tableApi;

function handleAjaxError(xhr, textStatus, _error) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else if (xhr.responseText.indexOf("Connection refused") >= 0) {
    alert("An error occurred while loading the data: Connection refused. Is FTL running?");
  } else {
    alert("An unknown error occurred while loading the data.\n" + xhr.responseText);
  }

  $("#all-queries_processing").hide();
  tableApi.clear();
  tableApi.draw();
}

$(document).ready(function () {
  // Do we want to filter queries?
  var GETDict = {};
  location.search
    .slice(1)
    .split("&")
    .forEach(function (item) {
      GETDict[item.split("=")[0]] = item.split("=")[1];
    });

  var APIstring = "api.php?getAllSpeedTestData";

  tableApi = $("#all-queries").DataTable({
    dom:
      "<'row'<'col-sm-12'f>>" +
      "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
      "<'row'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    ajax: { url: APIstring, error: handleAjaxError },
    autoWidth: true,
    processing: true,
    order: [[0, "desc"]],
    columns: [
      null,
      {
        render: function (data, type, _full, _meta) {
          if (type === "display") {
            data = moment.utc(data, "YYYY-MM-DD HH:mm:ss").local().format();
          }

          return data;
        },
      },
      {
        render: function (data, type, _full, _meta) {
          if (type === "display") {
            data = moment.utc(data, "YYYY-MM-DD HH:mm:ss").local().format();
          }

          return data;
        },
      },
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      {
        render: function (data, _type, _full, _meta) {
          data = '<a target="_blank" href="' + data + '"> View Result</a>';
          return data;
        },
      },
    ],

    columnDefs: [
      {
        targets: [0, 2],
        visible: false,
      },
    ],
  });
});
