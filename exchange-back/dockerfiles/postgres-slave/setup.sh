#!/bin/bash
set -e
echo STOP PG
pg_ctl stop && sleep 2
echo RM DATA
echo db-master:5432:replication:replication:$REPLICA_PASSWORD >> $HOME/.pgpass && chmod 0600 $HOME/.pgpass
cd $PGDATA 
mv pg_hba.conf /tmp
rm -rf ./*
echo BASEBACKUP
pg_basebackup -h db-master -D $PGDATA -R -P -U replication --xlog-method=stream
echo START PG
mv /tmp/pg_hba.conf ./
echo "local replication postgres trust" >> pg_hba.conf
echo "hot_standby = on" >> postgresql.conf
echo "trigger_file = '$PGDATA/trigger_file'" >> recovery.conf
crond
pg_ctl start && sleep 2
