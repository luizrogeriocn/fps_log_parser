#!/bin/sh
# wait-for-it.sh: wait until a host:port becomes available
# Usage: ./wait-for-it.sh host:port -- command args

set -e

HOST=$1
shift
PORT=$1
shift

timeout=30
while ! nc -z "$HOST" "$PORT"; do
  echo "Waiting for $HOST:$PORT..."
  timeout=$((timeout-1))
  if [ $timeout -eq 0 ]; then
    echo "Timeout waiting for $HOST:$PORT"
    exit 1
  fi
  sleep 1
done

echo "$HOST:$PORT is up"
exec "$@"
