FROM postgres:alpine
COPY setup.sh /docker-entrypoint-initdb.d/setup.sh
RUN mkdir -p /backup/archive && chown postgres:postgres /backup/archive
VOLUME /backup

