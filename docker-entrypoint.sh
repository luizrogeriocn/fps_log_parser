#!/bin/sh
set -e

echo "Waiting for Postgres..."
sh ./wait-for-it.sh $DB_HOST $DB_PORT -- echo "Postgres is ready!"

echo "Running migrations..."
npm run typeorm -- migration:run

echo "Starting NestJS server (watch mode)"
npm run start:dev

