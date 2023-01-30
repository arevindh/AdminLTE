#!/bin/bash

echo "$(date) - Restoring Pi-hole..."

cd /opt/
if [ ! -f /opt/pihole/webpage.sh.org ]; then
    rm -rf org_pihole
    git clone https://github.com/pi-hole/pi-hole org_pihole
    cd org_pihole
    git fetch --tags -q
    localVer=$(pihole -v | grep "Pi-hole" | cut -d ' ' -f 6)
    remoteVer=$(curl -s https://api.github.com/repos/pi-hole/pi-hole/releases/latest | grep "tag_name" | cut -d '"' -f 4)
    if [[ "$localVer" < "$remoteVer" && "$localVer" == *.* ]]; then
        remoteVer=$localVer
    fi
    git checkout -q $remoteVer
    cp advanced/Scripts/webpage.sh ../pihole/webpage.sh.org
    cd - > /dev/null
    rm -rf org_pihole
fi

cd /var/www/html
if [ ! -d /var/www/html/org_admin ]; then
    rm -rf org_admin
    git clone https://github.com/pi-hole/AdminLTE org_admin
    cd org_admin
    git fetch --tags -q
    localVer=$(pihole -v | grep "AdminLTE" | cut -d ' ' -f 6)
    remoteVer=$(curl -s https://api.github.com/repos/pi-hole/AdminLTE/releases/latest | grep "tag_name" | cut -d '"' -f 4)
    if [[ "$localVer" < "$remoteVer" && "$localVer" == *.* ]]; then
        remoteVer=$localVer
    fi
    git checkout -q $remoteVer
    cd - > /dev/null
fi

if [ "${1-}" == "db" ] && [ -f /etc/pihole/speedtest.db ]; then
    mv /etc/pihole/speedtest.db /etc/pihole/speedtest.db.old
    echo "$(date) - Configured Database..."
fi

echo "$(date) - Uninstalling Current Speedtest Mod..."

if [ -d /var/www/html/admin ]; then
    rm -rf mod_admin
    mv admin mod_admin
fi
mv org_admin admin
cd /opt/pihole/
cp webpage.sh webpage.sh.mod
mv webpage.sh.org webpage.sh
chmod +x webpage.sh

echo "$(date) - Uninstall Complete"
exit 0
