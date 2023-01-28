#!/bin/bash
FILE=/tmp/speedtest.log
readonly setupVars="/etc/pihole/setupVars.conf"
serverid=$(grep 'SPEEDTEST_SERVER' ${setupVars} | cut -d '=' -f2)
start=$(date +"%Y-%m-%d %H:%M:%S")

speedtest() {
    if [[ -z "${serverid}" ]]; then
        echo "Running Speedtest..."
    else
        echo "Running Speedtest with server ${serverid}..."
    fi
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

abort(){
    stop=$(date +"%Y-%m-%d %H:%M:%S")
    echo "No Internet"
    sqlite3 /etc/pihole/speedtest.db  "insert into speedtest values (NULL, '${start}', '${stop}', 'No Internet', '-', '-', 0, 0, 0, 0, '#');"
    exit 1
}

nointernet(){
    rm -f $FILE
    if grep -q official <<< "$(/usr/bin/speedtest --version)"; then
        echo "Trying Python Version..."
        apt-get install -y speedtest- speedtest-cli || abort
    else
        echo "Trying Official Version..."
        apt-get install -y speedtest-cli- speedtest || abort
    fi
    start=$(date +"%Y-%m-%d %H:%M:%S")
    speedtest > $FILE && internet || abort
}

internet() {
    stop=$(date +"%Y-%m-%d %H:%M:%S")
    catFILE=$(sudo cat $FILE)
    server_name=$($catFILE | jq -r '.server.name')
    server_dist=0

    if grep -q official <<< "$(/usr/bin/speedtest --version)"; then
        download=$($catFILE | jq -r '.download.bandwidth' | awk '{$1=$1*8/1000/1000; print $1;}' | sed 's/,/./g')
        upload=$($catFILE | jq -r '.upload.bandwidth' | awk '{$1=$1*8/1000/1000; print $1;}' | sed 's/,/./g')
        isp=$($catFILE | jq -r '.isp')
        server_ip=$($catFILE | jq -r '.server.ip')
        from_ip=$($catFILE | jq -r '.interface.externalIp')
        server_ping=$($catFILE | jq -r '.ping.latency')
        share_url=$($catFILE | jq -r '.result.url')
    else
        download=$($catFILE | jq -r '.download' | awk '{$1=$1/1000/1000; print $1;}' | sed 's/,/./g')
        upload=$($catFILE | jq -r '.upload' | awk '{$1=$1/1000/1000; print $1;}' | sed 's/,/./g')
        isp=$($catFILE | jq -r '.client.isp')
        server_ip=$($catFILE | jq -r '.server.host')
        from_ip=$($catFILE | jq -r '.client.ip')
        server_ping=$($catFILE | jq -r '.ping')
        share_url=$($catFILE | jq -r '.share')
    fi

    rm -f $FILE

    sep="\t"
    quote=""
    opts=

    # Output CSV results
    sep="$quote$sep$quote"
    printf "$quote$start$sep$stop$sep$isp$sep$from_ip$sep$server_name$sep$server_dist$sep$server_ping$sep$download$sep$upload$sep$share_url$quote\n"

    sqlite3 /etc/pihole/speedtest.db "insert into speedtest values (NULL, '${start}', '${stop}', '${isp}', '${from_ip}', '${server_name}', ${server_dist}, ${server_ping}, ${download}, ${upload}, '${share_url}');"
    exit 0
}

main() {
    speedtest > $FILE && internet || nointernet
}
    
main
