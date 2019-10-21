#!/bin/sh
set -e

if [ $(echo "$1" | cut -c1) = "-" ]; then
  echo "$0: assuming arguments for biocoind"

  set -- biocoind "$@"
fi

if [ $(echo "$1" | cut -c1) = "-" ] || [ "$1" = "biocoind" ]; then
  mkdir -p "$BIOCOIN_DATA"
  chmod 700 "$BIOCOIN_DATA"
  chown -R biocoin "$BIOCOIN_DATA"

  echo "$0: setting data directory to $BIOCOIN_DATA"

  set -- "$@" -datadir="$BIOCOIN_DATA"
fi

if [ "$1" = "biocoind" ]; then
  echo
  exec su-exec biocoin "$@"
fi

echo
exec "$@"
