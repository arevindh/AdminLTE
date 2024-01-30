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

// $data = array();

$dbSpeedtest = '/etc/pihole/speedtest.db';
$dbSpeedtestOld = '/etc/pihole/speedtest.db.old';

$setupVars = parse_ini_file('/etc/pihole/setupVars.conf');

$cmdLog = 'cat /var/log/pimod.log';
$cmdServers = 'speedtest -h | grep -q official && sudo speedtest -L || speedtest --list';
$cmdStatus = 'systemctl status pihole-speedtest.timer ; systemctl status pihole-speedtest --no-pager -l';
$cmdRun = 'cat /tmp/speedtest.log';
$cmdServersCurl = "curl 'https://c.speedtest.net/speedtest-servers-static.php' --compressed -H 'Upgrade-Insecure-Requests: 1' -H 'DNT: 1' -H 'Sec-GPC: 1'";

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
    if (isset($_GET['getLastSpeedtestResult'])) {
        $data = array_merge($data, getLastSpeedtestResult($dbSpeedtest));
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
}

function hasSpeedTestBackup($dbSpeedtestOld)
{
    $data = file_exists($dbSpeedtestOld);

    return array('data' => $data);
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

function getLastSpeedtestResult($dbSpeedtest)
{
    if (!file_exists($dbSpeedtest)) {
        // create db of not exists
        exec('sudo pihole -a -sn');

        return array();
    }

    $db = new SQLite3($dbSpeedtest);
    if (!$db) {
        return array('error' => 'Unable to open DB');
    } else {
        // return array("status"=>"success");
    }

    $curdate = date('Y-m-d H:i:s');
    $date = new DateTime();
    // $date->modify('-'.$durationdays.' day');
    $start_date = $date->format('Y-m-d H:i:s');

    $sql = 'SELECT * from speedtest order by id DESC limit 1';

    $dbResults = $db->query($sql);

    $dataFromSpeedDB = array();

    if (!empty($dbResults)) {
        while ($row = $dbResults->fetchArray(SQLITE3_ASSOC)) {
            array_push($dataFromSpeedDB, $row);
        }

        return $dataFromSpeedDB;
    } else {
        return array('error' => 'No Results');
    }
    $db->close();
}

function getSpeedTestData($dbSpeedtest, $durationdays = '1')
{
    if (!file_exists($dbSpeedtest)) {
        // create db of not exists
        exec('sudo pihole -a -sn');

        return array();
    }
    $db = new SQLite3($dbSpeedtest);
    if (!$db) {
        return array('error' => 'Unable to open DB');
    } else {
        // return array("status"=>"success");
    }

    $curdate = date('Y-m-d H:i:s');
    $date = new DateTime();
    $date->modify('-'.$durationdays.' day');
    $start_date = $date->format('Y-m-d H:i:s');

    if ($durationdays == -1) {
        $sql = 'SELECT * from speedtest order by id asc';
    } else {
        $sql = "SELECT * from speedtest where start_time between '{$start_date}' and  '{$curdate}'  order by id asc;";
    }

    $dbResults = $db->query($sql);

    $dataFromSpeedDB = array();

    if (!empty($dbResults)) {
        while ($row = $dbResults->fetchArray(SQLITE3_ASSOC)) {
            array_push($dataFromSpeedDB, $row);
        }

        return $dataFromSpeedDB;
    } else {
        return array('error' => 'No Results');
    }
    $db->close();
}

function getSpeedData($dbSpeedtest, $durationdays = '-2')
{
    global $log, $setupVars;
    if (isset($setupVars['SPEEDTEST_CHART_DAYS']) && $durationdays == '-2') {
        $dataFromSpeedDB = getSpeedTestData($dbSpeedtest, $setupVars['SPEEDTEST_CHART_DAYS']);
    } else {
        $durationdays = (int) $durationdays < -1 ? '1' : $durationdays;
        $dataFromSpeedDB = getSpeedTestData($dbSpeedtest, $durationdays);
    }

    return $dataFromSpeedDB;
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
