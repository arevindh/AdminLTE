#!/bin/bash

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
        git reset --hard origin/master
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
                echo "$(date) - Flushing Database..."
                mv -f $curr_db $last_db
            fi
        elif [ -f $last_db ]; then
            echo "$(date) - Restoring Database..."
            mv -f $last_db $curr_db
        fi
        echo "$(date) - Configuring Database..."
        sqlite3 "$curr_db" "$create_table"
    fi
}

uninstall() {
    if [ -f $curr_wp ] && cat $curr_wp | grep -q SpeedTest; then
        echo "$(date) - Uninstalling Current Speedtest Mod..."

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
    echo "$(date) - Cleaning up..."
    rm -rf "$curr_wp".*
    rm -rf "$admin_dir"*_admin
    rm -rf "$curr_db".*
    rm -rf "$curr_db"_*
    rm -rf /opt/mod_pihole

    if isEmpty $curr_db; then
        rm -f $curr_db
    fi
}

uninstall ${1-}
purge
echo "$(date) - Done!"
exit 0
