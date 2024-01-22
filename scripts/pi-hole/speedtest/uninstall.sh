#!/bin/bash

setTags() {
    local path=${1-}
    local name=${2-}

    if [ ! -z "$path" ]; then
        cd "$path"
        git fetch --tags -q
        latestTag=$(git describe --tags $(git rev-list --tags --max-count=1))
    fi
    if [ ! -z "$name" ]; then
        localTag=$(pihole -v | grep "$name" | cut -d ' ' -f 6)
        [ "$localTag" == "HEAD" ] && localTag=$(pihole -v | grep "$name" | cut -d ' ' -f 7)
    fi
}

download() {
    local path=$1
    local name=$2
    local url=$3
    local src=${4-}
    local dest=$path/$name

    if [ ! -d $dest ]; then # replicate
        cd "$path"
        rm -rf "$name"
        git clone --depth=1 "$url" "$name"
        setTags "$name" "$src"
        if [ ! -z "$src" ]; then
            if [[ "$localTag" == *.* ]] && [[ "$localTag" < "$latestTag" ]]; then
                latestTag=$localTag
                git fetch --unshallow
            fi
        fi
    elif [ ! -z "$src" ]; then # revert
        setTags $dest
        git remote | grep -q upstream && git remote remove upstream
        git remote add upstream $url
        git fetch upstream -q
        git reset --hard upstream/master
    else # refresh
        setTags $dest
        git reset --hard origin/master
    fi

    git -c advice.detachedHead=false checkout $latestTag
}

manageHistory() {
    local init_db=/var/www/html/admin/scripts/pi-hole/speedtest/speedtest.db
    local curr_db=/etc/pihole/speedtest.db
    local last_db=/etc/pihole/speedtest.db.old
    if [ "${1-}" == "db" ]; then
        if [ -f $curr_db ] && [ -f $init_db ] && [ "$(hashFile $curr_db)" != "$(hashFile $init_db)" ]; then
            echo "$(date) - Flushing Database..."
            mv -f $curr_db $last_db
        elif [ -f $last_db ]; then
            echo "$(date) - Restoring Database..."
            mv -f $last_db $curr_db
        fi
    fi
}

uninstall() {
    if cat /opt/pihole/webpage.sh | grep -q SpeedTest; then
        echo "$(date) - Uninstalling Current Speedtest Mod..."

        if [ ! -f /opt/pihole/webpage.sh.org ]; then
            if [ ! -d /opt/org_pihole ]; then
                download /opt org_pihole https://github.com/pi-hole/pi-hole Pi-hole
            fi
            cd /opt
            cp org_pihole/advanced/Scripts/webpage.sh ../pihole/webpage.sh.org
            rm -rf org_pihole
        fi

        download /var/www/html admin https://github.com/pi-hole/AdminLTE web
        cd /opt/pihole/
        cp webpage.sh.org webpage.sh
        chmod +x webpage.sh
    fi

    manageHistory ${1-}
}

uninstall ${1-}
echo "$(date) - Done!"
exit 0
