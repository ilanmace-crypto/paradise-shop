#!/bin/bash

# Backup script for Paradise Shop
BACKUP_DIR="/path/to/paradise-shop/backups"
DB_PATH="/path/to/paradise-shop/database/paradise-shop.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database
cp $DB_PATH $BACKUP_DIR/paradise-shop-$TIMESTAMP.db

# Keep only last 7 days of backups
find $BACKUP_DIR -name "paradise-shop-*.db" -mtime +7 -delete

echo "Backup completed: paradise-shop-$TIMESTAMP.db"
