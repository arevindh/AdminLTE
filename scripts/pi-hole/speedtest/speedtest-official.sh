#!/bin/bash
FILE=/tmp/speedtest.log
readonly setupVars="/etc/pihole/setupVars.conf"
serverid=$(grep 'SPEEDTEST_SERVER' ${setupVars} | cut -d '=' -f2)
start=$(date +"%Y-%m-%d %H:%M:%S")

speedtest() {
    if grep -q official <<< "$(/usr/bin/speedtest --version)"; then
        if [[ -z "${serverid}" ]]; then
            /usr/bin/speedtest --accept-gdpr --accept-license -f json-pretty
        else
            /usr/bin/speedtest -s $serverid --accept-gdpr --accept-license -f json-pretty  
        fi
    else
        if [[ -z "${serverid}" ]]; then
            /usr/bin/speedtest --json --share --secure
        else
            /usr/bin/speedtest -s $serverid --json --share --secure
        fi
    fi
}

nointernet(){
    stop=$(date +"%Y-%m-%d %H:%M:%S")
    echo "No Internet"
    sqlite3 /etc/pihole/speedtest.db  "insert into speedtest values (NULL, '${start}', '${stop}', 'No Internet', '-', '-', 0, 0, 0, 0, '#');"
    exit 1
}

internet() {
    stop=$(date +"%Y-%m-%d %H:%M:%S")
    server_name=`/tmp/speedtest.log | jq -r '.server.name'`
    server_dist=0

    if grep -q official <<< "$(/usr/bin/speedtest --version)"; then
        download=`/tmp/speedtest.log | jq -r '.download.bandwidth' | awk '{$1=$1*8/1000/1000; print $1;}' | sed 's/,/./g'`
        upload=`/tmp/speedtest.log | jq -r '.upload.bandwidth' | awk '{$1=$1*8/1000/1000; print $1;}' | sed 's/,/./g'`
        isp=`/tmp/speedtest.log | jq -r '.isp'`
        server_ip=`/tmp/speedtest.log | jq -r '.server.ip'`
        from_ip=`/tmp/speedtest.log | jq -r '.interface.externalIp'`
        server_ping=`/tmp/speedtest.log | jq -r '.ping.latency'`
        share_url=`/tmp/speedtest.log | jq -r '.result.url'`
    else
        download=`/tmp/speedtest.log | jq -r '.download' | awk '{$1=$1/1000/1000; print $1;}' | sed 's/,/./g'`
        upload=`/tmp/speedtest.log | jq -r '.upload' | awk '{$1=$1/1000/1000; print $1;}' | sed 's/,/./g'`
        isp=`/tmp/speedtest.log | jq -r '.client.isp'`
        server_ip=`/tmp/speedtest.log | jq -r '.server.host'`
        from_ip=`/tmp/speedtest.log | jq -r '.client.ip'`
        server_ping=`/tmp/speedtest.log | jq -r '.ping'`
        share_url=`/tmp/speedtest.log | jq -r '.share'`
    fi

    sep="\t"
    quote=""
    opts=
    sep="$quote$sep$quote"
    printf "$quote$start$sep$stop$sep$isp$sep$from_ip$sep$server_name$sep$server_dist$sep$server_ping$sep$download$sep$upload$sep$share_url$quote\n"
    sqlite3 /etc/pihole/speedtest.db "insert into speedtest values (NULL, '${start}', '${stop}', '${isp}', '${from_ip}', '${server_name}', ${server_dist}, ${server_ping}, ${download}, ${upload}, '${share_url}');"
    exit 0
}

tryagain(){
    if grep -q official <<< "$(/usr/bin/speedtest --version)"; then
        echo "Trying Python Version..."
        apt-get install -y speedtest- speedtest-cli || nointernet
    else
        echo "Trying Official Version..."
        apt-get install -y speedtest-cli- speedtest || nointernet
    fi
    start=$(date +"%Y-%m-%d %H:%M:%S")
    speedtest 2>&1 | sudo tee -- "$FILE"
    internet || nointernet
}

main() {
    speedtest 2>&1 | sudo tee -- "$FILE"
    internet || tryagain
}
    
main
