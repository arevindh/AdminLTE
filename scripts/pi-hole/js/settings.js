/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, checkMessages:false */
var token = $("#token").text();

$(function () {
  $("[data-static]").on("click", function () {
    var row = $(this).closest("tr");
    var mac = row.find("#MAC").text();
    var ip = row.find("#IP").text();
    var host = row.find("#HOST").text();
    $('input[name="AddHostname"]').val(host);
    $('input[name="AddIP"]').val(ip);
    $('input[name="AddMAC"]').val(mac);
  });

  // prepare Teleporter Modal & iframe for operation
  $("#teleporterModal").on("show.bs.modal", function () {
    $('iframe[name="teleporter_iframe"]').removeAttr("style").contents().find("body").html("");
    $(this).find("button").prop("disabled", true);
    $(this).find(".overlay").show();
  });

  // set Teleporter iframe's font, enable Modal's button(s), ...
  $('iframe[name="teleporter_iframe"]').on("load", function () {
    var font = {
      "font-family": $("pre").css("font-family"),
      "font-size": $("pre").css("font-size"),
      color: $("pre").css("color"),
    };
    var contents = $(this).contents();
    contents.find("body").css(font);
    $("#teleporterModal").find(".overlay").hide();
    var BtnEls = $(this).parents(".modal-content").find("button").prop("disabled", false);

    // force user to reload the page if necessary
    var reloadEl = contents.find("span[data-forcereload]");
    if (reloadEl.length > 0) {
      var msg = "The page must now be reloaded to display the imported entries";
      reloadEl.append(msg);
      BtnEls.toggleClass("hidden")
        .not(".hidden")
        .on("click", function () {
          // window.location.href avoids a browser warning for resending form data
          window.location = window.location.href;
        });
    }

    // expand iframe's height
    var contentHeight = contents.find("html").height();
    if (contentHeight > $(this).height()) {
      $(this).height(contentHeight);
    }
  });

  // display selected import file on button's adjacent textfield
  $("#zip_file").on("change", function () {
    var fileName = $(this)[0].files.length === 1 ? $(this)[0].files[0].name : "";
    $("#zip_filename").val(fileName);
  });
});
$(".confirm-poweroff").confirm({
  text: "Are you sure you want to send a poweroff command to your Pi-hole?",
  title: "Confirmation required",
  confirm: function () {
    $("#poweroffform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, poweroff",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});
$(".confirm-reboot").confirm({
  text: "Are you sure you want to send a reboot command to your Pi-hole?",
  title: "Confirmation required",
  confirm: function () {
    $("#rebootform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, reboot",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-restartdns").confirm({
  text: "Are you sure you want to send a restart command to your DNS server?",
  title: "Confirmation required",
  confirm: function () {
    $("#restartdnsform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, restart DNS",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-flushlogs").confirm({
  text: "Are you sure you want to flush your logs?",
  title: "Confirmation required",
  confirm: function () {
    $("#flushlogsform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, flush logs",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-flusharp").confirm({
  text: "Are you sure you want to flush your network table?",
  title: "Confirmation required",
  confirm: function () {
    $("#flusharpform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, flush my network table",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-warning",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-disablelogging-noflush").confirm({
  text: "Are you sure you want to disable logging?",
  title: "Confirmation required",
  confirm: function () {
    $("#disablelogsform-noflush").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, disable logs",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-warning",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".api-token").confirm({
  text: "Make sure that nobody else can scan this code around you. They will have full access to the API without having to know the password. Note that the generation of the QR code will take some time.",
  title: "Confirmation required",
  confirm: function () {
    $("#apiTokenModal").modal("show");
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, show API token",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$("#apiTokenModal").on("show.bs.modal", function () {
  var bodyStyle = {
    "font-family": $("body").css("font-family"),
    "background-color": "white",
  };
  $('iframe[name="apiToken_iframe"]').contents().find("body").css(bodyStyle);
  var qrCodeStyle = {
    margin: "auto",
  };
  $('iframe[name="apiToken_iframe"]').contents().find("table").css(qrCodeStyle);
});

$("#DHCPchk").on("click", function () {
  $("input.DHCPgroup").prop("disabled", !this.checked);
  $("#dhcpnotice").prop("hidden", !this.checked).addClass("lookatme");
});

function loadCacheInfo() {
  $.getJSON("api.php?getCacheInfo", function (data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    // Fill table with obtained values
    $("#cache-size").text(parseInt(data.cacheinfo["cache-size"], 10));
    $("#cache-inserted").text(parseInt(data.cacheinfo["cache-inserted"], 10));

    // Highlight early cache removals when present
    var cachelivefreed = parseInt(data.cacheinfo["cache-live-freed"], 10);
    $("#cache-live-freed").text(cachelivefreed);
    if (cachelivefreed > 0) {
      $("#cache-live-freed").parent("tr").children("th").children("span").addClass("lookatme");
      $("#cache-live-freed").parent("tr").children("td").addClass("lookatme");
      $("#cache-live-freed")
        .parent("tr")
        .children("td")
        .attr("lookatme-text", cachelivefreed.toString());
    } else {
      $("#cache-live-freed").parent("tr").children("th").children("span").removeClass("lookatme");
      $("#cache-live-freed").parent("tr").children("td").removeClass("lookatme");
    }

    // Update cache info every 10 seconds
    setTimeout(loadCacheInfo, 10000);
  });
}

var leasetable, staticleasetable;
$(function () {
  if (document.getElementById("DHCPLeasesTable")) {
    leasetable = $("#DHCPLeasesTable").DataTable({
      dom:
        "<'row'<'col-sm-12'f>>" +
        "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
        "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
        "<'row'<'col-sm-5'i><'col-sm-7'p>>",
      lengthMenu: [
        [5, 10, 25, 50, 100, -1],
        [5, 10, 25, 50, 100, "All"],
      ],
      columnDefs: [
        { bSortable: false, orderable: false, targets: -1 },
        {
          targets: [0, 1],
          render: $.fn.dataTable.render.text(),
        },
        {
          targets: 2,
          render: function (data) {
            // Show "unknown", when host is "*"
            var str;
            if (data === "*") {
              str = "<i>unknown</i>";
            } else {
              str = typeof data === "string" ? utils.escapeHtml(data) : data;
            }

            return str;
          },
        },
      ],
      paging: true,
      order: [[2, "asc"]],
      stateSave: true,
      stateDuration: 0,
      stateSaveCallback: function (settings, data) {
        utils.stateSaveCallback("activeDhcpLeaseTable", data);
      },
      stateLoadCallback: function () {
        return utils.stateLoadCallback("activeDhcpLeaseTable");
      },
    });
  }

  if (document.getElementById("DHCPStaticLeasesTable")) {
    staticleasetable = $("#DHCPStaticLeasesTable").DataTable({
      dom:
        "<'row'<'col-sm-12'f>>" +
        "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
        "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
        "<'row'<'col-sm-5'i><'col-sm-7'p>>",
      lengthMenu: [
        [5, 10, 25, 50, 100, -1],
        [5, 10, 25, 50, 100, "All"],
      ],
      columnDefs: [
        { bSortable: false, orderable: false, targets: -1 },
        {
          targets: [0, 1, 2],
          render: $.fn.dataTable.render.text(),
        },
      ],
      paging: true,
      order: [[2, "asc"]],
      stateSave: true,
      stateSaveCallback: function (settings, data) {
        utils.stateSaveCallback("staticDhcpLeaseTable", data);
      },
      stateLoadCallback: function () {
        return utils.stateLoadCallback("staticDhcpLeaseTable");
      },
    });
  }

  //call draw() on each table... they don't render properly with scrollX and scrollY set... ¯\_(ツ)_/¯
  $('a[data-toggle="tab"]').on("shown.bs.tab", function () {
    leasetable.draw();
    staticleasetable.draw();
  });

  loadCacheInfo();
});

// Handle hiding of alerts
$(function () {
  $("[data-hide]").on("click", function () {
    $(this)
      .closest("." + $(this).attr("data-hide"))
      .hide();
  });
});

// DHCP leases tooltips
$(function () {
  $('[data-toggle="tooltip"]').tooltip({ html: true, container: "body" });
});

// Auto dismissal for info notifications
$(function () {
  var alInfo = $("#alInfo");
  if (alInfo.length > 0) {
    alInfo.delay(3000).fadeOut(2000, function () {
      alInfo.hide();
    });
  }

  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", false);

  // En-/disable conditional forwarding input fields based
  // on the checkbox state
  $('input[name="rev_server"]').on("click", function () {
    $('input[name="rev_server_cidr"]').prop("disabled", !this.checked);
    $('input[name="rev_server_target"]').prop("disabled", !this.checked);
    $('input[name="rev_server_domain"]').prop("disabled", !this.checked);
  });
});

// Change "?tab=" parameter in URL for save and reload
$(".nav-tabs a").on("shown.bs.tab", function (e) {
  var tab = e.target.hash.substring(1);
  window.history.pushState("", "", "?tab=" + tab);
  window.scrollTo(0, 0);
});

// Bar/Smooth chart toggle
$(function () {
  var bargraphs = $("#bargraphs");
  var chkboxData = localStorage ? localStorage.getItem("barchart_chkbox") : null;

  if (chkboxData === null) {
    // Initialize checkbox
    bargraphs.prop("checked", true);
    if (localStorage) {
      localStorage.setItem("barchart_chkbox", true);
    }
  } else {
    // Restore checkbox state
    bargraphs.prop("checked", chkboxData === "true");
  }

  bargraphs.on("click", function () {
    localStorage.setItem("barchart_chkbox", bargraphs.prop("checked"));
  });
});

$(function () {
  var colorfulQueryLog = $("#colorfulQueryLog");
  var chkboxData = localStorage ? localStorage.getItem("colorfulQueryLog_chkbox") : null;

  if (chkboxData === null) {
    // Initialize checkbox
    colorfulQueryLog.prop("checked", false);
    if (localStorage) {
      localStorage.setItem("colorfulQueryLog_chkbox", false);
    }
  } else {
    // Restore checkbox state
    colorfulQueryLog.prop("checked", chkboxData === "true");
  }

  colorfulQueryLog.on("click", function () {
    localStorage.setItem("colorfulQueryLog_chkbox", colorfulQueryLog.prop("checked"));
  });
});

// Delete dynamic DHCP lease
$('button[id="removedynamic"]').on("click", function () {
  var tr = $(this).closest("tr");
  var ipaddr = utils.escapeHtml(tr.children("#IP").text());
  var name = utils.escapeHtml(tr.children("#HOST").text());
  var ipname = name + " (" + ipaddr + ")";

  utils.disableAll();
  utils.showAlert("info", "", "Deleting DHCP lease...", ipname);
  $.ajax({
    url: "api.php",
    method: "get",
    dataType: "json",
    data: {
      delete_lease: ipaddr,
      token: token,
    },
    success: function (response) {
      utils.enableAll();
      if (response.delete_lease.startsWith("OK")) {
        utils.showAlert(
          "success",
          "far fa-trash-alt",
          "Successfully deleted DHCP lease for ",
          ipname
        );
        // Remove column on success
        tr.remove();
        // We have to hide the tooltips explicitly or they will stay there forever as
        // the onmouseout event does not fire when the element is already gone
        $.each($(".tooltip"), function () {
          $(this).remove();
        });
      } else {
        utils.showAlert("error", "Error while deleting DHCP lease for " + ipname, response);
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "Error while deleting DHCP lease for " + ipname, jqXHR.responseText);
      console.log(exception); // eslint-disable-line no-console
    },
  });
});

// Non-fatal dnsmasq warnings toggle
$(function () {
  var nonfatalwarnigns = $("#hideNonfatalDnsmasqWarnings");
  var chkboxData = localStorage ? localStorage.getItem("hideNonfatalDnsmasqWarnings_chkbox") : null;

  if (chkboxData === null) {
    // Initialize checkbox
    nonfatalwarnigns.prop("checked", false);
    if (localStorage) {
      localStorage.setItem("hideNonfatalDnsmasqWarnings_chkbox", false);
    }
  } else {
    // Restore checkbox state
    nonfatalwarnigns.prop("checked", chkboxData === "true");
  }

  nonfatalwarnigns.on("click", function () {
    localStorage.setItem("hideNonfatalDnsmasqWarnings_chkbox", nonfatalwarnigns.prop("checked"));
    // Call check messages to make new setting effective
    checkMessages();
  });
});

// Speedtest toggles
$(function () {
  const speedtestDays = $("#speedtestdays");
  const speedtestTest = $("#speedtesttest");
  const speedtestStatus = $("#speedteststatus");
  const speedtestStatusBtn = $("#speedteststatusBtn");

  const speedtestServer = $("#speedtestserver");
  const speedtestServerBtn = $("#closestServersBtn");
  const speedtestServerCtr = $("#closestServers");

  const speedtestChartType = $("#speedtestcharttype");
  const speedtestChartTypeSave = $("#speedtestcharttypesave");
  const speedtestChartPreview = $("#speedtestchartpreview");
  const speedtestChartPreviewBtn = $("#speedtestchartpreviewBtn");

  const speedtestUpdate = $("#speedtestupdate");
  const speedtestUninstall = $("#speedtestuninstall");
  const speedtestDelete = $("#speedtestdelete");
  const speedtestDeleteLabel = speedtestDelete.parent().children("label");

  const speedtestLog = $("#latestLog");
  const speedtestLogBtn = $("#latestLogBtn");

  const speedtestSubmit = $("#st-submit");
  const defaultClass = "btn-primary";
  const colorClasses = ["btn-success", "btn-warning", "btn-danger"];

  let type = localStorage?.getItem("speedtest_chart_type") || speedtestChartType.attr("value");
  speedtestChartType.prop("checked", type === "bar");
  localStorage.setItem("speedtest_chart_type", type);

  const preCode = content => {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    if (typeof content === "string") {
      code.textContent = content;
    } else {
      code.append(content);
    }

    code.style.whiteSpace = "pre";
    code.style.overflowWrap = "normal";
    pre.style.width = "100%";
    pre.style.maxWidth = "100%";
    pre.style.maxHeight = "500px";
    pre.style.overflow = "auto";
    pre.style.whiteSpace = "pre";
    pre.style.marginTop = "1vw";
    pre.append(code);
    return pre;
  };

  const codeBlock = (element, text, button, output) => {
    if (element.find("pre").length > 0) {
      element.find("pre code").text(text);
    } else {
      button.text("Hide " + output);
      element.append(preCode(text));
    }
  };

  const serviceStatus = () => {
    $.ajax({
      url: "api.php?getSpeedTestStatus",
      dataType: "json",
    })
      .done(function (data) {
        const status = data?.data;
        let scheduleStatusText = "inactive";
        let triggerText = speedtestTest.attr("value") ? " awaiting confirmation" : " disabled";
        if (status) {
          if (!status.includes("timer")) {
            scheduleStatusText = "active";
            if (!speedtestTest.attr("value")) {
              const triggerPattern = /(\d+s)/;
              const triggerMatch = status.match(triggerPattern);

              let statusText = status;
              if (triggerMatch) {
                const now = new Date();
                const secondsUntilNextMinute = 60 - now.getSeconds();
                const statusSeconds = parseInt(triggerMatch[0].replace("s", ""), 10);
                statusText =
                  statusSeconds > secondsUntilNextMinute
                    ? `${statusSeconds - secondsUntilNextMinute}s`
                    : "0s";
              }

              triggerText = statusText === "0s" ? " queued" : ` in ${status}`;
            }
          } else {
            const scheduleStatusPattern = /pihole-speedtest\.timer.*?Active:\s+(\w+)/s;
            const triggerPattern = /Trigger:.*?;\s*([\d\s\w]+)\s+left/s;

            const scheduleStatusMatch = status.match(scheduleStatusPattern);
            const triggerMatch = status.match(triggerPattern);

            scheduleStatusText = scheduleStatusMatch ? scheduleStatusMatch[1] : "missing";
            if (!speedtestTest.attr("value")) {
              if (triggerMatch) {
                triggerText = ` in ${triggerMatch[1]}`;
              } else if (scheduleStatusText === "active") {
                triggerText = " running";
              }
            }
          }
        }

        $.ajax({
          url: "api.php?getLatestRun",
          dataType: "json",
        })
          .done(function (data) {
            const lastRun = data?.data;
            let lastRunText = "Latest run is unavailable";
            if (lastRun) {
              lastRunText = `Latest run:\n\n${lastRun}`;
            }

            const statusText = `Schedule is ${scheduleStatusText}\nNext run is${triggerText}\n${lastRunText}`;
            codeBlock(speedtestStatus, statusText, speedtestStatusBtn, "status");
          })
          .fail(function () {
            const lastRunText = "\nLatest run is unavailable";
            const statusText = `Schedule is ${scheduleStatusText}\nNext run is${triggerText}${lastRunText}`;
            codeBlock(speedtestStatus, statusText, speedtestStatusBtn, "status");
          });
      })
      .fail(function () {
        const triggerText = speedtestTest.attr("value") ? " awaiting confirmation" : " unknown";
        const lastRunText = "\nLatest run is unavailable";
        const statusText = "Schedule is unavailable\nNext run is" + triggerText + lastRunText;
        codeBlock(speedtestStatus, statusText, speedtestStatusBtn, "status");
      });
  };

  const previewChart = preview => {
    if (!preview) {
      localStorage.setItem("speedtest_preview_hidden", "true");
      localStorage.setItem("speedtest_preview_shown", "false");
      speedtestChartPreview.find("div").remove();
    } else {
      let speedtestdays = speedtestDays.val();
      localStorage.setItem("speedtest_days", speedtestdays);
      localStorage.setItem("speedtest_chart_type", type);
      localStorage.setItem("speedtest_preview_shown", "true");

      if (speedtestdays === "1") {
        speedtestdays = "24 hours";
      } else if (speedtestdays === "-1") {
        speedtestdays = "however many days";
      } else {
        speedtestdays += " days";
      }

      const colDiv = document.createElement("div");
      const boxDiv = document.createElement("div");
      const boxHeaderDiv = document.createElement("div");
      const h3 = document.createElement("h3");
      const boxBodyDiv = document.createElement("div");
      const chartDiv = document.createElement("div");
      const canvas = document.createElement("canvas");
      const overlayDiv = document.createElement("div");
      const i = document.createElement("i");

      colDiv.className = "col-md-12";
      colDiv.style.marginTop = "1vw";
      boxDiv.className = "box";
      boxDiv.id = "queries-over-time";
      boxHeaderDiv.className = "box-header with-border";
      h3.className = "box-title";
      h3.textContent = `Speedtest results over last ${speedtestdays}`;
      boxBodyDiv.className = "box-body";
      chartDiv.className = "chart";
      chartDiv.style.position = "relative";
      chartDiv.style.width = "100%";
      chartDiv.style.height = "180px";
      canvas.id = "speedOverTimeChart";
      canvas.setAttribute("value", type);
      overlayDiv.className = "overlay";
      overlayDiv.id = "speedOverTimeChartOverlay";
      i.className = "fa fa-sync fa-spin";

      colDiv.append(boxDiv);
      boxDiv.append(boxHeaderDiv);
      boxDiv.append(boxBodyDiv);
      boxDiv.append(overlayDiv);
      boxHeaderDiv.append(h3);
      boxBodyDiv.append(chartDiv);
      overlayDiv.append(i);
      chartDiv.append(canvas);

      speedtestChartPreview.find("div").remove();
      speedtestChartPreview.append(colDiv);
    }

    speedtestChartPreviewBtn.text(preview ? "Hide preview" : "Show chart preview");
  };

  const latestLog = () => {
    $.ajax({
      url: "api.php?getLatestLog",
      dataType: "json",
    })
      .done(function (data) {
        const log = data?.data;
        if (log) {
          speedtestLog.find("p").remove();
          codeBlock(speedtestLog, log, speedtestLogBtn, "log");
        } else {
          codeBlock(
            speedtestLog,
            "tmux a -t pimod; cat /var/log/pihole/mod.log",
            speedtestLogBtn,
            "log"
          );
          if (speedtestLog.find("p").length === 0) {
            speedtestLog.append(
              `<p style="margin-top: .5vw;">Use this command to get the log while I look for it</p>`
            );
          }
        }
      })
      .fail(function () {
        codeBlock(
          speedtestLog,
          "tmux a -t pimod; cat /var/log/pihole/mod.log",
          speedtestLogBtn,
          "log"
        );
        if (speedtestLog.find("p").length === 0) {
          speedtestLog.append(
            `<p style="margin-top: .5vw;">Use this command to get the log while I look for it</p>`
          );
        }
      });
  };

  const closestServers = cmds => {
    const tryNextCmd = () => {
      if (cmds.length === 1) {
        speedtestServerBtn.text("Failed to display servers");
        if (speedtestServerCtr.find("p").length === 0) {
          speedtestServerCtr.append(
            `<p style="margin-top: .5vw;">Please download the results: <a href="https://c.speedtest.net/speedtest-servers-static.php" target="_blank" rel="noopener noreferrer">XML</a> | <a href="https://www.speedtest.net/api/js/servers" target="_blank" rel="noopener noreferrer">JSON</a></p>`
          );
        }
      } else {
        closestServers(cmds.slice(1));
      }
    };

    if (!cmds || cmds.length === 0) {
      cmds = ["JSONClosestServers", "getClosestServers", "curlClosestServers"];
    }

    $.ajax({
      url: `api.php?${cmds[0]}`,
      dataType: "json",
    })
      .done(function (data) {
        const serversInfo = data?.data;
        if (serversInfo) {
          speedtestServerCtr.find("p").remove();
          codeBlock(speedtestServerCtr, serversInfo, speedtestServerBtn, "servers");
        } else {
          tryNextCmd();
        }
      })
      .fail(function () {
        tryNextCmd();
      });
  };

  const hasBackup = callback => {
    $.ajax({
      url: "api.php?hasSpeedTestBackup",
      dataType: "json",
    })
      .done(function (backupExists) {
        callback(true, backupExists);
      })
      .fail(function () {
        callback(true, false);
      });
  };

  const hasHistory = callback => {
    $.ajax({
      url: "api.php?getAllSpeedTestData",
      dataType: "json",
    })
      .done(function (results) {
        callback(null, results?.data?.length !== 0);
      })
      .fail(function () {
        callback(true, false);
      });
  };

  const canRestore = () => {
    hasBackup((errorBackup, backupExists) => {
      hasHistory((errorHistory, historyExists) => {
        if (errorBackup && errorHistory && !errorHistory) {
          return;
        }

        const didFlush = backupExists && !historyExists;
        let newClass = defaultClass;
        speedtestDeleteLabel.text(
          didFlush ? "Restore History (available until the next speedtest)" : "Clear History"
        );

        if (speedtestUninstall.attr("value")) {
          newClass =
            (didFlush && speedtestDelete.attr("value")) ||
            (historyExists && !speedtestDelete.attr("value"))
              ? colorClasses[1]
              : colorClasses[2];
        } else if (speedtestDelete.attr("value")) {
          newClass = didFlush ? colorClasses[0] : colorClasses[1];
        }

        speedtestSubmit.removeClass([...colorClasses, defaultClass].join(" ")).addClass(newClass);
      });
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    speedtestDays.attr("value", speedtestDays.val());
    speedtestChartTypeSave.attr("value", null);
    speedtestUpdate.attr("value", null);
    speedtestUninstall.attr("value", null);
    speedtestDelete.attr("value", null);
    speedtestTest.attr("value", null);
  });

  localStorage.setItem("speedtest_days", speedtestDays.val());
  speedtestDays.on("change", function () {
    speedtestDays.attr("value", speedtestDays.val());
    if (speedtestDays.val()) {
      localStorage.setItem("speedtest_days", speedtestDays.val());
      previewChart(speedtestChartPreview.find("div").length > 0);
    }
  });

  speedtestChartType.on("click", function () {
    // if type null, set to "bar", else toggle
    type = type ? (type === "bar" ? "line" : "bar") : "bar";
    speedtestChartType.attr("value", type);
    localStorage.setItem("speedtest_chart_type", type);
    // Call check messages to make new setting effective
    checkMessages();
    previewChart(speedtestChartPreview.find("div").length > 0);
  });

  speedtestChartTypeSave.on("click", function () {
    speedtestChartTypeSave.attr("value", speedtestChartTypeSave.attr("value") ? null : type);
  });

  speedtestChartPreviewBtn.on("click", function () {
    previewChart(speedtestChartPreview.find("div").length === 0);
  });

  speedtestUpdate.on("click", function () {
    speedtestUpdate.attr("value", speedtestUpdate.attr("value") ? null : "up");
  });

  speedtestTest.on("click", function () {
    speedtestTest.attr("value", speedtestTest.attr("value") ? null : "yes");
    const status = speedtestStatus.find("pre");
    if (status.length > 0) {
      serviceStatus();
    }
  });

  speedtestStatusBtn.on("click", function () {
    const status = speedtestStatus.find("pre");
    if (status.length > 0) {
      speedtestStatusBtn.text("Show service status");
      status.remove();
    } else {
      speedtestStatusBtn.text("Hide status");
      serviceStatus();
    }
  });

  speedtestServer.on("change", function () {
    speedtestServer.attr("value", speedtestServer.val());
  });

  speedtestLogBtn.on("click", function () {
    const log = speedtestLog.find("pre");
    const info = speedtestLog.find("p");
    if (log.length > 0 || info.length > 0) {
      log.remove();
      info.remove();
      speedtestLogBtn.text("Show latest log");
    } else {
      latestLog();
    }
  });

  speedtestServerBtn.on("click", function () {
    const closestServersList = speedtestServerCtr.find("pre");
    if (closestServersList.length > 0) {
      closestServersList.remove();
      speedtestServerBtn.text("Show closest servers");
    } else {
      speedtestServerBtn.text("Retrieving servers...");
      closestServers();
    }
  });

  speedtestUninstall.on("click", function () {
    speedtestUninstall.attr("value", speedtestUninstall.attr("value") ? null : "un");
    canRestore();
  });

  speedtestDelete.on("click", function () {
    speedtestDelete.attr("value", speedtestDelete.attr("value") ? null : "db");
    canRestore();
  });

  setInterval(() => {
    if (speedtestStatus.find("pre").length > 0) {
      serviceStatus();
    }

    if (speedtestLog.find("pre").length > 0) {
      latestLog();
    }

    // if speedtestLog has a p element, cycle through ellipsis
    const info = speedtestLog.find("p");
    if (info.length > 0) {
      const text = info.text();
      if (text.includes("...")) {
        info.text(text.replace(/\.{3}/, ""));
      } else {
        info.text(text + ".");
      }
    }

    if (speedtestServerCtr.find("p").length > 0) {
      closestServers();
    }

    canRestore();
  }, 1000);
});
