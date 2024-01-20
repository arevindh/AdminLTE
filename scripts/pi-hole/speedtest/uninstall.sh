#!/bin/bash

clone() {
	local path=$1
	local dest=$2
	local src=$3
	local name=${4-} # if set, will keep local tag if older than latest

	cd "$path"
	rm -rf "$dest"
	git clone --depth=1 "$src" "$dest"
	cd "$dest"
	git fetch --tags -q
	local latestTag=$(git describe --tags $(git rev-list --tags --max-count=1))
	if [ ! -z "$name" ]; then
		local localTag=$(pihole -v | grep "$name" | cut -d ' ' -f 6)
		[ "$localTag" == "HEAD" ] && localTag=$(pihole -v | grep "$name" | cut -d ' ' -f 7)
		if [[ "$localTag" == *.* ]] && [[ "$localTag" < "$latestTag" ]]; then
			latestTag=$localTag
			git fetch --unshallow
		fi
	fi
	git -c advice.detachedHead=false checkout $latestTag
}

uninstall() {
	if cat /opt/pihole/webpage.sh | grep -q SpeedTest; then
		echo "$(date) - Uninstalling Current Speedtest Mod..."

		if [ ! -f /opt/pihole/webpage.sh.org ]; then
			clone /opt org_pihole https://github.com/pi-hole/pi-hole Pi-hole
			cp advanced/Scripts/webpage.sh ../pihole/webpage.sh.org
			cd ..
			rm -rf org_pihole
		fi

		if [ ! -d /var/www/html/org_admin ]; then
			clone /var/www/html org_admin https://github.com/pi-hole/AdminLTE web
		fi

		cd /var/www/html
		if [ -d /var/www/html/admin ]; then
			rm -rf mod_admin
			mv admin mod_admin
		fi
		mv org_admin admin
		cd /opt/pihole/
		cp webpage.sh webpage.sh.mod
		mv webpage.sh.org webpage.sh
		chmod +x webpage.sh
	fi

	if [ "${1-}" == "db" ] && [ -f /etc/pihole/speedtest.db ]; then
		echo "$(date) - Flushing Database..."
		mv /etc/pihole/speedtest.db /etc/pihole/speedtest.db.old
	fi

     echo "$(date) - Speedtest Mod is Uninstalled!"
}

uninstall ${1-}
exit 0
