#!/bin/bash
set -e

# Hier können wir spezifische DB setups noch hinzufügen - obwohl mir
# das ein paar Probleme bereitet hat,. da manches irgendiw nicht
# richtig funktioniert. Kann sein dass das Skript gar nicht ausgeführt
# wird, oder es Konflikte wegen Rechten gibt. bevor hier reingeschrieben
# sollte dieses Problem behoben werden.

#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
until pg_isready -h localhost -p 5432 -U postgres; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

# Verify vector extension
psql -U postgres -d postgres -c "SELECT extname, extnamespace::regnamespace as schema FROM pg_extension WHERE extname = 'vector';"

# Verify schema exists
psql -U postgres -d postgres -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'main';"

echo "Database initialization completed"