<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/

$indexpage = true;
require 'scripts/pi-hole/php/header_authenticated.php';
require_once 'scripts/pi-hole/php/gravity.php';
$setupVars = parse_ini_file('/etc/pihole/setupVars.conf');
?>
<!-- Small boxes (Stat box) -->
<div class="row">
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-aqua no-user-select" id="total_queries" title="only A + AAAA queries">
            <div class="inner">
                <p>Total queries</p>
                <h3 class="statistic"><span id="dns_queries_today">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-globe-americas"></i>
            </div>
            <a href="network.php" class="small-box-footer" title="">
                <span id="unique_clients">-</span> active clients <i class="fa fa-arrow-circle-right"></i>
            </a>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-red no-user-select">
            <div class="inner">
                <p>Queries Blocked</p>
                <h3 class="statistic"><span id="queries_blocked_today">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-hand-paper"></i>
            </div>
            <a href="queries.php?forwarddest=blocked" class="small-box-footer" title="">
                List blocked queries <i class="fa fa-arrow-circle-right"></i>
            </a>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-yellow no-user-select">
            <div class="inner">
                <p>Percentage Blocked</p>
                <h3 class="statistic"><span id="percentage_blocked_today">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-chart-pie"></i>
            </div>
            <a href="queries.php" class="small-box-footer" title="">
                List all queries <i class="fa fa-arrow-circle-right"></i>
            </a>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-green no-user-select" title="<?php echo gravity_last_update(); ?>">
            <div class="inner">
                <p>Domains on Adlists</p>
                <h3 class="statistic"><span id="domains_being_blocked">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-list-alt"></i>
            </div>
            <a href="groups-adlists.php" class="small-box-footer" title="">
                Manage adlists <i class="fa fa-arrow-circle-right"></i>
            </a>
        </div>
    </div>
    <!-- ./col -->
</div>

<div class="row">
    <div class="col-md-12">
        <div class="box" id="queries-over-time">
            <div class="box-header with-border">
                <h3 class="box-title">Total queries over last <span class="maxlogage-interval">24</span> hours</h3>
            </div>
            <div class="box-body">
                <div class="chart" style="width: 100%; height: 180px">
                    <canvas id="queryOverTimeChart"></canvas>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
    </div>
</div>
<?php
// If the user is logged in, then we show the more detailed index page.
// Even if we would include them here anyhow, there would be nothing to
// show since the API will respect the privacy of the user if he defines
// a password

?>

<?php
$speedtestcharttype = 'line';
if (isset($setupVars['SPEEDTEST_CHART_TYPE'])) {
    $speedtestcharttype = $setupVars['SPEEDTEST_CHART_TYPE'];
}
if ($auth && $speedtestshedule) { ?>
    <div class="row">
        <div class="col-md-12">
            <div class="box" id="queries-over-time">
                <div class="box-header with-border">
                    <h3 class="box-title">Speedtest results over last <?php echo htmlspecialchars($speedtestdays); ?></h3>
                </div>
                <div class="box-body">
                    <div class="chart" style="width: 100%; height: 180px">
                        <canvas id="speedOverTimeChart" value=<?php echo $speedtestcharttype; ?>></canvas>
                    </div>
                    <div class="overlay">
                        <i class="fa fa-sync fa-spin"></i>
                    </div>
                    <!-- /.box-body -->
                </div>
            </div>
        </div>
    </div>
<?php }  ?>

<div class="row">
    <div class="col-md-12">
        <div class="box" id="clients">
            <div class="box-header with-border">
                <h3 class="box-title">Client activity over last <span class="maxlogage-interval">24</span> hours</h3>
            </div>
            <div class="box-body">
                <div class="chart" style="width: 100%; height: 180px">
                    <canvas id="clientsChart" class="extratooltipcanvas no-user-select"></canvas>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-6">
        <div class="box" id="query-types-pie">
            <div class="box-header with-border">
                <h3 class="box-title">Query Types</h3>
            </div>
            <div class="box-body">
                <div style="width:50%">
                    <canvas id="queryTypePieChart" width="280" height="280"></canvas>
                </div>
                <div class="chart-legend" style="width:50%" id="query-types-legend" ></div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
    </div>
    <div class="col-md-6">
        <div class="box" id="forward-destinations-pie">
            <div class="box-header with-border">
                <h3 class="box-title">Upstream servers</h3>
            </div>
            <div class="box-body">
                <div style="width:50%">
                    <canvas id="forwardDestinationPieChart" width="280" height="280" class="extratooltipcanvas no-user-select"></canvas>
                </div>
                <div class="chart-legend" style="width:50%" id="forward-destinations-legend"></div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
    </div>
</div>

<?php
    if ($boxedlayout) {
        $tablelayout = 'col-md-6';
    } else {
        $tablelayout = 'col-md-6 col-lg-6';
    } ?>
<div class="row">
    <div class="<?php echo $tablelayout; ?>">
        <div class="box" id="domain-frequency">
            <div class="box-header with-border">
                <h3 class="box-title">Top Permitted Domains</h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                            <th>Domain</th>
                            <th>Hits</th>
                            <th>Frequency</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
    <!-- /.col -->
    <div class="<?php echo $tablelayout; ?>">
        <div class="box" id="ad-frequency">
            <div class="box-header with-border">
                <h3 class="box-title">Top Blocked Domains</h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                            <th>Domain</th>
                            <th>Hits</th>
                            <th>Frequency</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>
<div class="row">
    <!-- /.col -->
    <div class="<?php echo $tablelayout; ?>">
        <div class="box" id="client-frequency">
            <div class="box-header with-border">
                <h3 class="box-title">Top Clients (total)</h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                            <th>Client</th>
                            <th>Requests</th>
                            <th>Frequency</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
    <!-- /.col -->
    <div class="<?php echo $tablelayout; ?>">
        <div class="box" id="client-frequency-blocked">
            <div class="box-header with-border">
                <h3 class="box-title">Top Clients (blocked only)</h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                            <th>Client</th>
                            <th>Requests</th>
                            <th>Frequency</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
    <!-- /.col -->
</div>
<!-- /.row -->

<script src="<?php echo fileversion('scripts/pi-hole/js/index.js'); ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>

<script src="scripts/pi-hole/js/index.js"></script>
<script src="scripts/pi-hole/js/speedtest.js"></script>
<script src="scripts/vendor/moment.min.js"></script>
