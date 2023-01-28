#!/bin/bash
FILE=/tmp/speedtest.log
readonly setupVars="/etc/pihole/setupVars.conf"
serverid=$(grep 'SPEEDTEST_SERVER' ${setupVars} | cut -d '=' -f2)
start=$(date +"%Y-%m-%d %H:%M:%S")

speedtest() {
    if [[ "$(/usr/bin/speedtest --version)" =~ *Python* ]]; then
        if [[ "$serverid" =~ ^[0-9]+$ ]]; then
            /usr/bin/speedtest -s $serverid --json --share --secure
        else
            /usr/bin/speedtest --json --share --secure
        fi
    else 
        if [[ "$serverid" =~ ^[0-9]+$ ]]; then
            /usr/bin/speedtest -s $serverid --accept-gdpr --accept-license -f json-pretty
        else
            /usr/bin/speedtest --accept-gdpr --accept-license -f json-pretty
        fi
    fi
}

nointernet(){
    rm -f $FILE
    if [ $1 == 1 ]; then
        stop=$(date +"%Y-%m-%d %H:%M:%S")
        sqlite3 /etc/pihole/speedtest.db  "insert into speedtest values (NULL, '${start}', '${stop}', 'No Internet', '-', '-', 0, 0, 0, 0, '#');"
        exit 0
    fi
    if [[ $version == *"Python"* ]]; then
        apt-get install -y speedtest-cli- speedtest
    else
        apt-get install -y speedtest- speedtest-cli
    fi
    start=$(date +"%Y-%m-%d %H:%M:%S")
    speedtest > $FILE && internet || nointernet 1
}

internet() {
    stop=$(date +"%Y-%m-%d %H:%M:%S")
    server_name=`cat /tmp/speedtest.log| jq -r '.server.name'`
    server_dist=0

    if [[ "$(/usr/bin/speedtest --version)" =~ *Python* ]]; then
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

    rm -f $FILE

    sep="\t"
    quote=""
    opts=

    # Output CSV results
    sep="$quote$sep$quote"
    printf "$quote$start$sep$stop$sep$isp$sep$from_ip$sep$server_name$sep$server_dist$sep$server_ping$sep$download$sep$upload$sep$share_url$quote\n"

    sqlite3 /etc/pihole/speedtest.db  "insert into speedtest values (NULL, '${start}', '${stop}', '${isp}', '${from_ip}', '${server_name}', ${server_dist}, ${server_ping}, ${download}, ${upload}, '${share_url}');"
    exit 0
}

main() {
    if [[ -z "${serverid}" ]]; then
        echo "Running Speedtest..."
    else
        echo "Running Speedtest with server ${serverid}..."
    fi
    speedtest && internet || nointernet
}
    
main
