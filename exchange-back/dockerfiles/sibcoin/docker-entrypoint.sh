#!/bin/bash
set -e

if [[ "$1" == "sibcoin-cli" || "$1" == "sibcoin-tx" || "$1" == "sibcoind" || "$1" == "test_sibcoin" ]]; then
	mkdir -p "$SIBCOIN_DATA"

	if [[ ! -s "$SIBCOIN_DATA/sibcoin.conf" ]]; then
		cat <<-EOF > "$SIBCOIN_DATA/sibcoin.conf"
		printtoconsole=1
		rpcallowip=::/0
		rpcpassword=${SIBCOIN_RPC_PASSWORD:-password}
		rpcuser=${SIBCOIN_RPC_USER:-sibcoin}
		EOF
		chown sibcoin:sibcoin "$SIBCOIN_DATA/sibcoin.conf"
	fi

	# ensure correct ownership and linking of data directory
	# we do not update group ownership here, in case users want to mount
	# a host directory and still retain access to it
	chown -R sibcoin "$SIBCOIN_DATA"
	ln -sfn "$SIBCOIN_DATA" /home/sibcoin/.sibcoin
	chown -h sibcoin:sibcoin /home/sibcoin/.sibcoin

	exec gosu sibcoin "$@"
fi

exec "$@"
