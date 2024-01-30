#!/bin/bash
LOG_FILE="/var/log/pimod.log"

admin_dir=/var/www/html
curr_wp=/opt/pihole/webpage.sh
last_wp=$curr_wp.old
org_wp=$curr_wp.org

curr_db=/etc/pihole/speedtest.db
last_db=$curr_db.old
db_table="speedtest"
create_table="create table if not exists $db_table (
id integer primary key autoincrement,
start_time integer,
stop_time text,
from_server text,
from_ip text,
server text,
server_dist real,
server_ping real,
download real,
upload real,
share_url text
);"

help() {
    echo "Uninstall Latest Speedtest Mod."
    echo "Usage: sudo $0 [db]"
    echo "db - flush database (restore for a short while after)"
    echo "If no option is specified, the mod will simply be uninstalled."
}

setTags() {
    local path=${1-}
    local name=${2-}
    if [ ! -z "$path" ]; then
        cd "$path"
        git fetch origin -q
        git fetch --tags -f -q
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
    local branch=${5-master}
    local dest=$path/$name
    if [ ! -d $dest ]; then # replicate
        cd "$path"
        rm -rf "$name"
        git clone --depth=1 -b "$branch" "$url" "$name"
        setTags "$name" "$src"
        if [ ! -z "$src" ]; then
            if [[ "$localTag" == *.* ]] && [[ "$localTag" < "$latestTag" ]]; then
                latestTag=$localTag
                git fetch --unshallow
            fi
        fi
    else # replace
        setTags $dest
        if [ ! -z "$src" ]; then
            if [ "$url" != "old" ]; then
                git config --global --add safe.directory "$dest"
                git remote -v | grep -q "old" || git remote rename origin old
                git remote -v | grep -q "origin" && git remote remove origin
                git remote add origin $url
            else
                git remote remove origin
                git remote rename old origin
            fi
            git fetch origin -q
        fi
        git reset --hard origin/$branch
    fi

    git -c advice.detachedHead=false checkout $latestTag
    cd ..
}

isEmpty() {
    db=$1
    if [ -f $db ]; then
        if ! sqlite3 "$db" "select * from $db_table limit 1;" >/dev/null 2>&1 || [ -z "$(sqlite3 "$db" "select * from $db_table limit 1;")" ]; then
            return 0
        fi
    fi
    return 1
}

manageHistory() {
    if [ "${1-}" == "db" ]; then
        if [ -f $curr_db ] && ! isEmpty $curr_db; then
            if [ -z "${2-}" ]; then
                echo "Flushing Database..."
                mv -f $curr_db $last_db
            fi
        elif [ -f $last_db ]; then
            echo "Restoring Database..."
            mv -f $last_db $curr_db
        fi
        echo "Configuring Database..."
        sqlite3 "$curr_db" "$create_table"
    fi
}

uninstall() {
    if [ -f $curr_wp ] && cat $curr_wp | grep -q SpeedTest; then
        echo "Restoring Pi-hole..."

        if [ ! -f $org_wp ]; then
            if [ ! -d /opt/org_pihole ]; then
                download /opt org_pihole https://github.com/pi-hole/pi-hole Pi-hole
            fi
            cd /opt
            cp org_pihole/advanced/Scripts/webpage.sh $org_wp
            rm -rf org_pihole
        fi

        pihole -a -su
        download /var/www/html admin https://github.com/pi-hole/AdminLTE web
        if [ ! -f $last_wp ]; then
            cp $curr_wp $last_wp
        fi
        cp $org_wp $curr_wp
        chmod +x $curr_wp
    fi

    manageHistory ${1-}
}

purge() {
    rm -rf "$admin_dir"*_admin
    rm -rf /opt/mod_pihole
    if [ -f /etc/systemd/system/pihole-speedtest.timer ]; then
        rm -f /etc/systemd/system/pihole-speedtest.service
        rm -f /etc/systemd/system/pihole-speedtest.timer
        systemctl daemon-reload
    fi

    rm -f "$curr_wp".*
    rm -f "$curr_db".*
    rm -f "$curr_db"_*
    if isEmpty $curr_db; then
        rm -f $curr_db
    fi
}

abort() {
    echo "Process Aborting..."

    if [ -f $last_wp ]; then
        cp $last_wp $curr_wp
        chmod +x $curr_wp
        rm -f $last_wp
    fi
    if [ -f $last_db ] && [ ! -f $curr_db ]; then
        mv $last_db $curr_db
    fi
    if [ ! -f $curr_wp ] || ! cat $curr_wp | grep -q SpeedTest; then
        purge
    fi
    if [ -d $admin_dir/admin/.git/refs/remotes/old ]; then
        download $admin_dir admin old web
    fi

    if (($aborted == 0)); then
        pihole restartdns
        printf "Please try again or try manually.\n\n$(date)\n"
    fi
    aborted=1
    exit 1
}

commit() {
    cd $admin_dir/admin
    git remote -v | grep -q "old" && git remote remove old
    rm -f $last_wp
    pihole restartdns
    printf "Done!\n\n$(date)\n"
    exit 0
}

main() {
    printf "Thanks for using Speedtest Mod!\nScript by @ipitio\n\n$(date)\n\n"
    local db=${1-}
    if [ "$op" == "-h" ] || [ "$op" == "--help" ]; then
        help
        exit 0
    fi
    if [ $EUID != 0 ]; then
        sudo "$0" "$@"
        exit $?
    fi
    aborted=0
    set -Eeuo pipefail
    trap '[ "$?" -eq "0" ] && commit || abort' EXIT
    trap 'abort' INT TERM

    uninstall $db
    purge
    exit 0
}

main "$@" 2>&1 | sudo tee -- "$LOG_FILE"
