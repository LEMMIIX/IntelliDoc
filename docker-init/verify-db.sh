#!/bin/bash
until psql -U postgres -d postgres -c "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = 'main';" | grep -q 1; do
  echo "Waiting for schema initialization..."
  sleep 1
done
echo "Schema initialized successfully"