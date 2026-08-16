#!/bin/bash

set -e

set -o pipefail

echo "🛑 Stopping and removing containers..."
sudo docker-compose down

echo "🏗️ Rebuilding and starting containers..."
sudo docker-compose up -d --build

echo "⏳ Waiting 60 seconds for Elasticsearch to wake up..."
sleep 60

echo "🔓 Unlocking Elasticsearch disk watermark limits..."
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'{
  "persistent": {
    "cluster.routing.allocation.disk.threshold_enabled": false
  }
}'
echo ""

curl -X PUT "localhost:9200/_all/_settings" -H 'Content-Type: application/json' -d'{
  "index.blocks.read_only_allow_delete": null
}'
echo ""

echo "🔄 Syncing PostgreSQL data to Elasticsearch..."
sudo docker exec -it tket_django python manage.py sync_es

echo "✅ Rebuild complete! Your API is ready."