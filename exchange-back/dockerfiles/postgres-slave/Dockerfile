FROM postgres:alpine
COPY setup.sh /docker-entrypoint-initdb.d/setup.sh
RUN \
    mkdir -p /backup/hour && chown postgres:postgres /backup/hour &&\
    echo "* * * * * postgres /usr/local/bin/pg_basebackup -x  -U postgres -D /backup/hour/$(date +%Y-%m-%d-%H)" | crontab -
VOLUME /backup
