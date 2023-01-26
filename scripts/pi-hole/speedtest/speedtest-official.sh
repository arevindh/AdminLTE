#!/bin/bash

start=$(date +"%Y-%m-%d %H:%M:%S")

readonly setupVars="/etc/pihole/setupVars.conf"
serverid=$(grep 'SPEEDTEST_SERVER' ${setupVars} | cut -d '=' -f2)
if [[ -z "${serverid}" ]]; then
    echo "Running Speedtest..."
else
    echo "Running Speedtest with server ${serverid}..."
fi

function nointernet(){
    stop=$(date +"%Y-%m-%d %H:%M:%S")
    sqlite3 /etc/pihole/speedtest.db  "insert into speedtest values (NULL, '${start}', '${stop}', 'No Internet', '-', '-', 0, 0, 0, 0, '#');"
    exit 0
}

version=$(echo $(speedtest --version) | grep -oE '[0-9\.]+[ -]*' | head -1 | sed -e 's/^[ \t]*//' -e 's/[ \t]*$//')
[ -z "$version" ] && version=$(echo "$output" | grep -oE '[0-9\.]+' | head -1)

if [[ "$serverid" =~ ^[0-9]+$ ]]; then
    /usr/bin/speedtest -s $serverid --accept-gdpr --accept-license -f json-pretty > /tmp/speedtest.log || nointernet
if [[ ! "$version" < "2.0.0" ]] && [ -f /etc/apt/sources.list.d/ookla_speedtest-cli.list ]; then
    if [[ "$serverid" =~ ^[0-9]+$ ]]; then
        /usr/bin/speedtest -s $serverid --json --share --secure > /tmp/speedtest.log || nointernet
    else
        /usr/bin/speedtest --json --share --secure > /tmp/speedtest.log || nointernet
    fi
else
    /usr/bin/speedtest --accept-gdpr --accept-license -f json-pretty > /tmp/speedtest.log || nointernet
    if [[ "$serverid" =~ ^[0-9]+$ ]]; then
        /usr/bin/speedtest -s $serverid --accept-gdpr --accept-license -f json-pretty > /tmp/speedtest.log || nointernet
    else
        /usr/bin/speedtest --accept-gdpr --accept-license -f json-pretty > /tmp/speedtest.log || nointernet
    fi
fi

# sed 's/,/./g' fix for those regions use , instead of .

FILE=/tmp/speedtest.log
if [[ -f "$FILE" ]]; then
    stop=$(date +"%Y-%m-%d %H:%M:%S")
    server_name=`cat /tmp/speedtest.log| jq -r '.server.name'`
    server_dist=0

    if [[ ! "$version" < "2.0.0" ]] && [ -f /etc/apt/sources.list.d/ookla_speedtest-cli.list ]; then
        download=`cat /tmp/speedtest.log| jq -r '.download' | awk '{$1=$1/1000/1000; print $1;}' | sed 's/,/./g' `
        upload=`cat /tmp/speedtest.log| jq -r '.upload' | awk '{$1=$1/1000/1000; print $1;}' | sed 's/,/./g'`
        isp=`cat /tmp/speedtest.log| jq -r '.client.isp'`
        server_ip=`cat /tmp/speedtest.log| jq -r '.server.host'`
        from_ip=`cat /tmp/speedtest.log| jq -r '.client.ip'`
        server_ping=`cat /tmp/speedtest.log| jq -r '.ping'`
        share_url=`cat /tmp/speedtest.log| jq -r '.share'`
    else
        download=`cat /tmp/speedtest.log| jq -r '.download.bandwidth' | awk '{$1=$1*8/1000/1000; print $1;}' | sed 's/,/./g' `
        upload=`cat /tmp/speedtest.log| jq -r '.upload.bandwidth' | awk '{$1=$1*8/1000/1000; print $1;}' | sed 's/,/./g'`
        isp=`cat /tmp/speedtest.log| jq -r '.isp'`
        server_ip=`cat /tmp/speedtest.log| jq -r '.server.ip'`
        from_ip=`cat /tmp/speedtest.log| jq -r '.interface.externalIp'`
        server_ping=`cat /tmp/speedtest.log| jq -r '.ping.latency'`
        share_url=`cat /tmp/speedtest.log| jq -r '.result.url'`
    fi

    rm /tmp/speedtest.log

    sep="\t"
    quote=""
    opts=

    # Output CSV results
    sep="$quote$sep$quote"
    printf "$quote$start$sep$stop$sep$isp$sep$from_ip$sep$server_name$sep$server_dist$sep$server_ping$sep$download$sep$upload$sep$share_url$quote\n"

    sqlite3 /etc/pihole/speedtest.db  "insert into speedtest values (NULL, '${start}', '${stop}', '${isp}', '${from_ip}', '${server_name}', ${server_dist}, ${server_ping}, ${download}, ${upload}, '${share_url}');"
fi

exit 0
