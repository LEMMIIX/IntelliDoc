#!/bin/bash

echo "STOPPING ALL DOCKER CONTAINERS"

docker ps -q | while read container_id; do
  docker stop "$container_id"
done

echo "ALL CONTAINERS STOPPED"
