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
    echo "$(<$FILE)"
    server_name=$(sudo jq -r '.server.name' $FILE)
    server_dist=0

    if grep -q official <<< "$(/usr/bin/speedtest --version)"; then
        download=$(sudo jq -r '.download.bandwidth' $FILE | awk '{$1=$1*8/1000/1000; print $1;}' | sed 's/,/./g')
        upload=$(sudo jq -r '.upload.bandwidth' $FILE| awk '{$1=$1*8/1000/1000; print $1;}' | sed 's/,/./g')
        isp=$(sudo jq -r '.isp' $FILE)
        server_ip=$(sudo jq -r '.server.ip' $FILE)
        from_ip=$(sudo jq -r '.interface.externalIp' $FILE)
        server_ping=$(sudo jq -r '.ping.latency' $FILE)
        share_url=$(sudo jq -r '.result.url' $FILE)
    else
        download=$(sudo jq -r '.download' $FILE | awk '{$1=$1/1000/1000; print $1;}' | sed 's/,/./g')
        upload=$(sudo jq -r '.upload' $FILE | awk '{$1=$1/1000/1000; print $1;}' | sed 's/,/./g')
        isp=$(sudo jq -r '.client.isp' $FILE)
        server_ip=$(sudo jq -r '.server.host' $FILE)
        from_ip=$(sudo jq -r '.client.ip' $FILE)
        server_ping=$(sudo jq -r '.ping' $FILE)
        share_url=$(sudo jq -r '.share' $FILE)
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
    speedtest > $FILE && internet || nointernet
}

main() {
    echo "Test has been initiated, please wait."
    speedtest > "$FILE" && internet || tryagain
}
    
main
