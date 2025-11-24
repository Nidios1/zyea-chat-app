#!/bin/bash
# Bash script để quản lý Docker data services cho Zalo Clone
# Usage: ./docker-data.sh [command]

COMMAND=${1:-start}

show_status() {
    echo ""
    echo "=== Docker Data Services Status ==="
    docker-compose ps
    echo ""
}

show_logs() {
    SERVICE=${1:-""}
    if [ -n "$SERVICE" ]; then
        echo "=== Logs for $SERVICE ==="
        docker-compose logs -f "$SERVICE"
    else
        echo "=== All Logs ==="
        docker-compose logs -f
    fi
}

case "$COMMAND" in
    start)
        echo "Starting Docker data services..."
        docker-compose up -d
        sleep 5
        show_status
        echo "Services started! Use './docker-data.sh logs' to view logs."
        echo ""
        echo "Don't forget to update server/config.env:"
        echo "  DB_HOST=localhost"
        echo "  DB_USER=zalo_user (or root)"
        echo "  DB_PASSWORD=zalo_password (or root password)"
        echo "  DB_NAME=zalo_clone"
        ;;
    stop)
        echo "Stopping Docker data services..."
        docker-compose stop
        show_status
        ;;
    restart)
        echo "Restarting Docker data services..."
        docker-compose restart
        sleep 3
        show_status
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    shell-mysql)
        echo "Connecting to MySQL..."
        echo "Default credentials: root/root or zalo_user/zalo_password"
        docker-compose exec mysql mysql -u root -p
        ;;
    shell-redis)
        echo "Connecting to Redis..."
        docker-compose exec redis redis-cli
        ;;
    backup)
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_FILE="backup_${TIMESTAMP}.sql"
        ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-root}
        echo "Creating backup: $BACKUP_FILE"
        docker-compose exec -T mysql mysqldump -u root -p"$ROOT_PASSWORD" zalo_clone > "$BACKUP_FILE"
        if [ -f "$BACKUP_FILE" ]; then
            echo "Backup created: $BACKUP_FILE"
        else
            echo "Backup failed!"
        fi
        ;;
    clean)
        echo "WARNING: This will remove all containers and volumes (DATA WILL BE LOST)!"
        read -p "Are you sure? Type 'yes' to continue: " confirm
        if [ "$confirm" = "yes" ]; then
            docker-compose down -v
            echo "All data removed."
        else
            echo "Cancelled."
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|shell-mysql|shell-redis|backup|clean}"
        exit 1
        ;;
esac

