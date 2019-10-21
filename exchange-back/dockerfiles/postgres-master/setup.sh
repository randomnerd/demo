#!/bin/bash
set -e

echo "host replication replication 10.42.0.0/16 md5" >> $PGDATA/pg_hba.conf
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    ALTER SYSTEM SET wal_level = replica;
    ALTER SYSTEM SET fsync = on;
    ALTER SYSTEM SET archive_mode = on;
    ALTER SYSTEM SET archive_command = 'test ! -f /backup/archive/%f && cp %p /backup/archive/%f';
    ALTER SYSTEM SET max_wal_senders = 3;
    ALTER SYSTEM SET wal_keep_segments = 128;

    CREATE ROLE replication WITH REPLICATION PASSWORD '$REPLICA_PASSWORD' LOGIN;
EOSQL
