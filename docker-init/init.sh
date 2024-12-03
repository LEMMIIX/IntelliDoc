#!/bin/bash

# Install Python requirements
pip install -r /docker-init/pip-requirements.txt

# Initialize database
./docker-init/database-init.sh

# Start the application
node app.js --optimize-for-size