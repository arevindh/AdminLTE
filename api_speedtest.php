<?php

/**
 * Created by PhpStorm.
 * User: SYSTEM
 * Date: 8/7/2018
 * Time: 8:49 PM.
 */
if (!isset($api)) {
    exit('Direct call to api_PHP.php is not allowed!');
}

date_default_timezone_set(exec('date +%Z'));

$dbSpeedtest = '/etc/pihole/speedtest.db';
$dbSpeedtestOld = '/etc/pihole/speedtest.db.old';

$setupVars = parse_ini_file('/etc/pihole/setupVars.conf');

$cmdLog = '[[ -f /tmp/pimod.log ]] && cat /tmp/pimod.log || { [[ -f /var/log/pihole/mod.log ]] && cat /var/log/pihole/mod.log || echo ""; }';
$cmdServers = 'speedtest -h | grep -q official && sudo speedtest -L || speedtest --list';
if (file_exists('/opt/pihole/speedtestmod/schedule_check.sh')) {
    $remaining_seconds = getRemainingTime();
    if ($remaining_seconds < 0) {
        $cmdStatus = 'echo ""';
    } else {
        $remaining_date = sprintf('%dd %dh %dmin %ds', $remaining_seconds / 86400, $remaining_seconds / 3600 % 24, $remaining_seconds / 60 % 60, $remaining_seconds % 60);
        $remaining_date = preg_replace('/^0d |(^|(?<= ))0h |(^|(?<= ))0min /', '', $remaining_date); // remove 0d 0h 0min
        $remaining_date = preg_replace('/\s(\d+s)/', '', $remaining_date); // remove seconds if not needed
        $cmdStatus = 'echo '.$remaining_date;
    }
} elseif (!file_exists('/bin/systemctl')) {
    $cmdStatus = 'echo ""';
} else {
    $cmdStatus = 'systemctl status pihole-speedtest.timer';
}
$cmdRun = '[[ -f /tmp/speedtest.log ]] && cat /tmp/speedtest.log || { [[ -f /var/log/pihole/speedtest.log ]] && cat /var/log/pihole/speedtest.log || echo ""; }';
$cmdServersCurl = "curl 'https://c.speedtest.net/speedtest-servers-static.php' --compressed -H 'Upgrade-Insecure-Requests: 1' -H 'DNT: 1' -H 'Sec-GPC: 1'";
$cmdServersJSON = "curl 'https://www.speedtest.net/api/js/servers' --compressed -H 'Upgrade-Insecure-Requests: 1' -H 'DNT: 1' -H 'Sec-GPC: 1'";

if ($auth) {
    if (isset($_GET['hasSpeedTestBackup'])) {
        $data = array_merge($data, hasSpeedTestBackup($dbSpeedtestOld));
    }
    if (isset($_GET['getSpeedData'])) {
        $data = array_merge($data, getSpeedData($dbSpeedtest, $_GET['getSpeedData']));
    }
    if (isset($_GET['getAllSpeedTestData'])) {
        $data = array_merge($data, getAllSpeedTestData($dbSpeedtest));
    }
    if (isset($_GET['getLatestLog'])) {
        $data = array_merge($data, speedtestExecute($cmdLog));
    }
    if (isset($_GET['getClosestServers'])) {
        $data = array_merge($data, getServers($cmdServers));
    }
    if (isset($_GET['getSpeedTestStatus'])) {
        $data = array_merge($data, speedtestExecute($cmdStatus));
    }
    if (isset($_GET['getLatestRun'])) {
        $data = array_merge($data, speedtestExecute($cmdRun));
    }
    if (isset($_GET['curlClosestServers'])) {
        $data = array_merge($data, curlServers($cmdServersCurl));
    }
    if (isset($_GET['JSONClosestServers'])) {
        $data = array_merge($data, JSONServers($cmdServersJSON));
    }
    if (isset($_GET['getNumberOfDaysInDB'])) {
        $data = array_merge($data, getNumberOfDaysInDB($dbSpeedtest));
    }
}

function hasSpeedTestBackup($dbSpeedtestOld)
{
    $exists = file_exists($dbSpeedtestOld);

    if ($exists) {
        $data = getAllSpeedTestData($dbSpeedtestOld);
    } else {
        $data = array();
    }

    return array('data' => !empty($data) && !empty($data['data']) ? true : false);
}

function getAllSpeedTestData($dbSpeedtest)
{
    $data = getSpeedTestData($dbSpeedtest, -1);
    if (isset($data['error'])) {
        return array();
    }
    $newarr = array();
    foreach ($data as $array) {
        array_push($newarr, array_values($array));
    }

    return array('data' => $newarr);
}

function getSpeedTestData($dbSpeedtest, $durationdays = '1')
{
    if (!file_exists($dbSpeedtest)) {
        return array();
    }
    $db = new SQLite3($dbSpeedtest);
    if (!$db) {
        return array();
    }

    if ((int) $durationdays == -1) {
        $sql = 'SELECT * from speedtest order by id asc';
    } else {
        $curdate = new DateTime('now', new DateTimeZone('UTC'));
        $daysago = new DateTime('now', new DateTimeZone('UTC'));
        $daysago->modify('-'.$durationdays.' day');
        $curdate = $curdate->format('Y-m-d H:i:s');
        $daysago = $daysago->format('Y-m-d H:i:s');
        $sql = "SELECT * from speedtest where start_time between '{$daysago}' and '{$curdate}' order by id asc";
    }

    $dbResults = $db->query($sql);
    $dataFromSpeedDB = array();
    if (!empty($dbResults)) {
        while ($row = $dbResults->fetchArray(SQLITE3_ASSOC)) {
            array_push($dataFromSpeedDB, $row);
        }
    }
    $db->close();

    return $dataFromSpeedDB;
}

function getSpeedData($dbSpeedtest, $durationdays = '-2')
{
    global $setupVars;
    if (isset($setupVars['SPEEDTEST_CHART_DAYS']) && $durationdays == '-2') {
        $durationdays = $setupVars['SPEEDTEST_CHART_DAYS'];
    } else {
        $durationdays = (int) $durationdays < -1 ? '1' : $durationdays;
    }

    $data = getSpeedTestData($dbSpeedtest, $durationdays);
    if (isset($data['error'])) {
        return array();
    }

    return $data;
}

if (!empty($_GET['csv-export'])) {
    exportData();
    exit;
}

function exportData()
{
    // time for filename
    $time = date('Y-m-d-H-i-s');

    header('Content-type: text/csv');
    header("Content-Disposition: attachment; filename=speedtest-export-$time.csv");
    header('Pragma: no-cache');
    header('Expires: 0');

    // DB Location
    $speedtestDB = '/etc/pihole/speedtest.db';

    // Connect to DB
    $conn = new PDO('sqlite:'.$speedtestDB);

    // Query
    $query = $conn->query('SELECT * FROM speedtest');

    // Fetch the first row
    $row = $query->fetch(PDO::FETCH_ASSOC);

    // If no results are found, echo a message and stop
    if ($row == false) {
        echo 'No results';
        exit;
    }

    // Print the titles using the first line
    print_titles($row);
    // Iterate over the results and print each one in a line
    while ($row != false) {
        // Print the line
        echo implode(',', array_values($row))."\n";
        // Fetch the next line
        $row = $query->fetch(PDO::FETCH_ASSOC);
    }

    // Close the connection
    $conn = null;
}

function print_titles($row)
{
    echo implode(',', array_keys($row))."\n";
}

function speedtestExecute($command)
{
    $output = array();
    $return_status = -1;
    exec('/bin/bash -c \''.$command.'\'', $output, $return_status);

    if ($return_status !== 0) {
        trigger_error("Executing {$command} failed.", E_USER_WARNING);
    }

    return array('data' => implode("\n", $output));
}

function getServers($cmdServers)
{
    $array = speedtestExecute($cmdServers);
    $servers = $array['data'];

    $output = explode("\n", $servers);
    $output = array_filter($output);
    if (count($output) > 1) {
        array_shift($output);
    }
    $servers = implode("\n", $output);

    if ($servers === false) {
        return array('error' => 'Error fetching servers');
    } else {
        return array('data' => $servers);
    }
}

function curlServers($cmdServersCurl)
{
    $array = speedtestExecute($cmdServersCurl);
    $xmlContent = $array['data'];

    if ($xmlContent === false) {
        return array('error' => 'Error fetching XML');
    } else {
        $xml = simplexml_load_string($xmlContent);
        if ($xml === false) {
            return array('error' => 'Error parsing XML');
        }
        $serverList = array();
        foreach ($xml->servers->server as $server) {
            $serverList[] = str_pad($server['id'], 5, ' ', STR_PAD_LEFT).') '.$server['sponsor'].' ('.$server['name'].', '.$server['cc'].') ('.$server['lat'].', '.$server['lon'].')';
        }

        return array('data' => implode("\n", $serverList));
    }
}

function JSONServers($cmdServersJSON)
{
    $array = speedtestExecute($cmdServersJSON);
    $jsonContent = $array['data'];

    if ($jsonContent === false) {
        return array('error' => 'Error fetching JSON');
    } else {
        $json = json_decode($jsonContent);
        if ($json === false) {
            return array('error' => 'Error parsing JSON');
        }

        $serverList = array();
        foreach ($json as $server) {
            $serverList[] = str_pad($server->id, 5, ' ', STR_PAD_LEFT).') '.$server->sponsor.' ('.$server->name.', '.$server->cc.') [Distance '.$server->distance.']';
        }

        return array('data' => implode("\n", $serverList));
    }
}

function getRemainingTime()
{
    $interval_seconds = speedtestExecute("grep 'interval_seconds=' /opt/pihole/speedtestmod/schedule_check.sh | cut -d'=' -f2")['data'];

    // if interval_seconds is "nan", then schedule has never been set
    if (strpos($interval_seconds, 'nan') !== false) {
        return -1;
    }

    $interval_seconds = (int) $interval_seconds;

    // if interval_seconds is less than 0, then schedule is disabled
    if ($interval_seconds < 0) {
        return -1;
    }

    $last_run_time = -1;
    if (file_exists('/etc/pihole/last_speedtest')) {
        $last_run_time = file_get_contents('/etc/pihole/last_speedtest');
        $last_run_time = (int) $last_run_time;
    }

    // if last_run_time is -1, then speedtest has never been run
    if ($last_run_time == -1) {
        return 0;
    }

    return max(0, $interval_seconds - (time() - $last_run_time));
}

function getNumberOfDaysInDB($dbSpeedtest)
{
    $db = new SQLite3($dbSpeedtest);
    if (!$db) {
        return array('data' => 0);
    }

    $sql = 'SELECT start_time from speedtest order by id asc';
    $dbResults = $db->query($sql);
    $dataFromSpeedDB = array();
    if (!empty($dbResults)) {
        while ($row = $dbResults->fetchArray(SQLITE3_ASSOC)) {
            array_push($dataFromSpeedDB, $row);
        }
    }
    $db->close();

    if (empty($dataFromSpeedDB)) {
        return array('data' => 0);
    }

    $first_date = new DateTime($dataFromSpeedDB[0]['start_time']);
    $last_date = new DateTime($dataFromSpeedDB[count($dataFromSpeedDB) - 1]['start_time']);
    $diff = $first_date->diff($last_date);

    return array('data' => $diff->days + 1);
}
