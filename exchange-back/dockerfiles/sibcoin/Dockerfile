FROM debian:stretch-slim

RUN groupadd -r sibcoin && useradd -r -m -g sibcoin sibcoin

RUN set -ex \
	&& apt-get update \
	&& apt-get install -qq --no-install-recommends ca-certificates dirmngr gosu gpg wget \
	&& rm -rf /var/lib/apt/lists/*

ENV SIBCOIN_VERSION 0.16.1.1
ENV SIBCOIN_URL https://github.com/ivansib/sibcoin/releases/download/v0.16.1.1/sibcoin-0.16.1-linux64.tar.gz

# install sibcoin binaries
RUN set -ex \
	&& SIBCOIN_DIST=$(basename $SIBCOIN_URL) \
	&& wget -qO $SIBCOIN_DIST $SIBCOIN_URL \
	&& tar -xzvf $SIBCOIN_DIST -C /usr/local --strip-components=1 --exclude=*-qt \
	&& rm sibcoin*

# create data directory
ENV SIBCOIN_DATA /data
RUN mkdir $SIBCOIN_DATA \
	&& chown -R sibcoin:sibcoin $SIBCOIN_DATA \
	&& ln -sfn $SIBCOIN_DATA /home/sibcoin/.sibcoin \
	&& chown -h sibcoin:sibcoin /home/sibcoin/.sibcoin
VOLUME /data

COPY docker-entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 1944 1945 11944 11945
CMD ["sibcoind"]

