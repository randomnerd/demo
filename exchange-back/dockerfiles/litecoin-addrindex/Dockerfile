FROM debian:stable-slim

COPY addrindex.patch /addrindex.patch

RUN adduser --system litecoin

ENV BERKELEYDB_VERSION=db-4.8.30.NC
ENV BERKELEYDB_PREFIX=/opt/${BERKELEYDB_VERSION}

ENV LITECOIN_VERSION=0.13.2.1
ENV LITECOIN_PREFIX=/opt/litecoin-${LITECOIN_VERSION} \
    LITECOIN_SHASUM="cb07472b32f713bb37ea37cfcc336816a38c8684844c259c89203ed9fe54f85b  v${LITECOIN_VERSION}.tar.gz" \
    LITECOIN_DATA=/home/litecoin/.litecoin
ENV PATH=${LITECOIN_PREFIX}/bin:$PATH
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
  && wget -O /tmp/build/v${LITECOIN_VERSION}.tar.gz https://github.com/litecoin-project/litecoin/archive/v${LITECOIN_VERSION}.tar.gz \
  && cd /tmp/build \
  && echo "${LITECOIN_SHASUM}" | sha256sum -c \
  && tar -xzf v${LITECOIN_VERSION}.tar.gz \
  && cd /tmp/build/litecoin-${LITECOIN_VERSION} \
  && ./autogen.sh \
  && ./configure LDFLAGS=-L${BERKELEYDB_PREFIX}/lib/ CPPFLAGS=-I${BERKELEYDB_PREFIX}/include/ \
    --prefix=${LITECOIN_PREFIX} \
    --mandir=/usr/share/man \
    --disable-tests \
    --disable-bench \
    --disable-ccache \
    --with-gui=no \
    --with-utils \
    --with-libs \
    --with-daemon \
  && patch -p1 < /addrindex.patch \
  && make -j5 \
  && make install \
  && wget -O /tmp/build/suexec.tar.gz https://github.com/ncopa/su-exec/archive/v0.2.tar.gz \
  && tar -xzf /tmp/build/suexec.tar.gz -C /tmp/build \
  && cd /tmp/build/su-exec-0.2 \
  && make && cp su-exec /usr/sbin \
  && cd / \
  && strip ${LITECOIN_PREFIX}/bin/litecoin-cli ${LITECOIN_PREFIX}/bin/litecoind ${LITECOIN_PREFIX}/bin/litecoin-tx ${LITECOIN_PREFIX}/lib/libbitcoinconsensus.a ${LITECOIN_PREFIX}/lib/libbitcoinconsensus.so.0.0.0 \
  && rm -rf /tmp/build ${BERKELEYDB_PREFIX}/docs \
  && apt-get remove --purge -y $BUILD_PACKAGES $(apt-mark showauto) \
  && apt-get install -y --no-install-recommends $PACKAGES \
  && rm -rf /var/lib/apt/lists/*

VOLUME ["/home/litecoin/.litecoin"]

COPY docker-entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 9332 9333 19332 19333 19444

CMD ["litecoind"]
