FROM debian:jessie-slim

RUN adduser --system biocoin

ENV BERKELEYDB_VERSION=db-4.8.30.NC
ENV BERKELEYDB_PREFIX=/usr/local

ENV BIOCOIN_PREFIX=/usr/local \
    BIOCOIN_DATA=/home/biocoin/.biocoin
ENV PATH=${BERKELEYDB_PREFIX}/bin:${BIOCOIN_PREFIX}/bin:$PATH
ENV DEBIAN_FRONTED=noninteractive
ENV PACKAGES="\
libboost-system1.55.0 \
libboost-filesystem1.55.0 \
libboost-program-options1.55.0 \
libboost-thread1.55.0 \
libboost-chrono1.55.0 \
libssl1.0.0 \
openssl \
libevent-2.0-5 \
libevent-pthreads-2.0-5 \
libprotobuf9 \
libzmq3 \
"
ENV BUILD_PACKAGES="\
git \
pkg-config \
wget \
autoconf \
automake \
curl \
openssl \
ca-certificates \
libboost-dev \
libboost-system-dev \
libboost-filesystem-dev \
libboost-program-options-dev \
libboost-thread-dev \
build-essential \
libevent-dev \
libssl-dev \
libtool \
libprotobuf-dev \
libzmq3-dev \
"

RUN sed -i.bak -e 's/deb.debian.org/mirror.yandex.ru/g' /etc/apt/sources.list\
  && apt-get update \
  && apt-get install -y --no-install-recommends $BUILD_PACKAGES \
  && mkdir -p /tmp/build \
  && wget -O /tmp/build/${BERKELEYDB_VERSION}.tar.gz http://download.oracle.com/berkeley-db/${BERKELEYDB_VERSION}.tar.gz \
  && tar -xzf /tmp/build/${BERKELEYDB_VERSION}.tar.gz -C /tmp/build/ \
  && sed s/__atomic_compare_exchange/__atomic_compare_exchange_db/g -i /tmp/build/${BERKELEYDB_VERSION}/dbinc/atomic.h \
  && mkdir -p ${BERKELEYDB_PREFIX} \
  && cd /tmp/build/${BERKELEYDB_VERSION}/build_unix \
  && ../dist/configure --enable-cxx --disable-shared --with-pic --prefix=${BERKELEYDB_PREFIX} \
  && make -j5 \
  && make install \
  && cd /tmp/build \
  && git clone https://github.com/Blackithart/biocoin.git biocoin \
  && cd /tmp/build/biocoin/src \
  && LDFLAGS=-L${BERKELEYDB_PREFIX}/lib/ CPPFLAGS=-I${BERKELEYDB_PREFIX}/include/ make -j3 -f makefile.unix \
  && cp BioCoind ${BIOCOIN_PREFIX}/bin/biocoind \
  && wget -O /tmp/build/suexec.tar.gz https://github.com/ncopa/su-exec/archive/v0.2.tar.gz \
  && tar -xzf /tmp/build/suexec.tar.gz -C /tmp/build \
  && cd /tmp/build/su-exec-0.2 \
  && make && cp su-exec /usr/sbin \
  && cd / \
  && strip ${BIOCOIN_PREFIX}/bin/biocoind \
  && rm -rf /tmp/build ${BERKELEYDB_PREFIX}/docs \
  && apt-get remove --purge -y --force-yes $BUILD_PACKAGES \
  && apt-get install -y --force-yes --no-install-recommends $PACKAGES \
  && rm -rf /var/lib/apt/lists/*

VOLUME ["/home/biocoin/.biocoin"]

COPY docker-entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 24889 24885 18345 17778

CMD ["biocoind"]
