<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
require 'scripts/pi-hole/php/header_authenticated.php';

?>
<div class="row">
    <div class="col-md-12">
        <div class="box" id="recent-queries">
            <div class="box-header with-border">
                <h3 class="box-title">Speedtest Results <?php echo $showing; ?><a href="/admin/api.php?csv-export=1">Export as CSV</a></h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="table-responsive">
                    <table id="all-queries" class="display table table-striped table-bordered" cellspacing="0" width="100%">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Timestamp</th>
                                <th>End Time</th>
                                <th>Provider</th>
                                <th>Your IP</th>
                                <th>Server</th>
                                <th>Distance</th>
                                <th>Ping</th>
                                <th>Download</th>
                                <th>Upload</th>
                                <th>Results</th>
                            </tr>
                        </thead>
                        <tfoot>
                            <tr>
                                <th>ID</th>
                                <th>Timestamp</th>
                                <th>End Time</th>
                                <th>Provider</th>
                                <th>Your IP</th>
                                <th>Server</th>
                                <th>Distance</th>
                                <th>Ping</th>
                                <th>Download</th>
                                <th>Upload</th>
                                <th>Results</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>
<!-- /.row -->

<?php
require 'scripts/pi-hole/php/footer.php';
?>

<script src="scripts/vendor/moment.min.js"></script>
<script src="scripts/pi-hole/js/speedresults.js"></script>
