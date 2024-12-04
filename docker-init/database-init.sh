# Hier können wir spezifische DB setups noch hinzufügen - obwohl mir
# das ein paar Probleme bereitet hat,. da manches irgendiw nicht
# richtig funktioniert. Kann sein dass das Skript gar nicht ausgeführt
# wird, oder es Konflikte wegen Rechten gibt. bevor hier reingeschrieben
# sollte dieses Problem behoben werden.

#!/bin/bash
set -e

MAX_RETRIES=30
RETRY_INTERVAL=2

wait_for_postgres() {
    local retries=0
    until pg_isready -h postgres -U postgres || [ $retries -eq $MAX_RETRIES ]; do
        echo "Waiting for PostgreSQL... ($((MAX_RETRIES - retries)) attempts remaining)"
        sleep $RETRY_INTERVAL
        retries=$((retries + 1))
    done

    if [ $retries -eq $MAX_RETRIES ]; then
        echo "Failed to connect to PostgreSQL after $MAX_RETRIES attempts"
        exit 1
    fi
}

initialize_database() {
    echo "Initializing database..."
    
    # Install vector extension
    psql -v ON_ERROR_STOP=1 -U postgres -d postgres -f /docker-entrypoint-initdb.d/02-extension-inst.sql
    
    # Restore database structure
    psql -v ON_ERROR_STOP=1 -U postgres -d postgres -f /docker-entrypoint-initdb.d/01-init.sql
    
    # Insert test data if in development
    if [ "$ENVIRONMENT" = "development" ]; then
        psql -v ON_ERROR_STOP=1 -U postgres -d postgres -f /docker-entrypoint-initdb.d/03-insert-test-users.sql
    fi
}

# Main execution
wait_for_postgres
initialize_database

echo "Database initialization completed successfully"