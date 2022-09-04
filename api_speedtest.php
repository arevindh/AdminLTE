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

$setupVars = parse_ini_file('/etc/pihole/setupVars.conf');

if (isset($_GET['getSpeedData24hrs']) && $auth) {
    $data = array_merge($data, getSpeedData24hrs($dbSpeedtest));
}

if (isset($_GET['getLastSpeedtestResult']) && $auth) {
    $data = array_merge($data, getLastSpeedtestResult($dbSpeedtest));
}

if (isset($_GET['getAllSpeedTestData']) && $auth) {
    $data = array_merge($data, getAllSpeedTestData($dbSpeedtest));
}

function getAllSpeedTestData($dbSpeedtest)
{
    $data = getSpeedTestData($dbSpeedtest, -1);
    if (isset($data['errr'])) {
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

function getSpeedData24hrs($dbSpeedtest)
{
    global $log, $setupVars;
    if (isset($setupVars['SPEEDTEST_CHART_DAYS'])) {
        $dataFromSpeedDB = getSpeedTestData($dbSpeedtest, $setupVars['SPEEDTEST_CHART_DAYS']);
    } else {
        $dataFromSpeedDB = getSpeedTestData($dbSpeedtest);
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
