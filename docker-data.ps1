# PowerShell script để quản lý Docker data services cho Zalo Clone
# Usage: .\docker-data.ps1 [command]

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "restart", "status", "logs", "shell-mysql", "shell-redis", "backup", "clean")]
    [string]$Command = "start"
)

$ErrorActionPreference = "Stop"

function Show-Status {
    Write-Host "`n=== Docker Data Services Status ===" -ForegroundColor Cyan
    docker-compose ps
    Write-Host ""
}

function Show-Logs {
    param([string]$Service = "")
    if ($Service) {
        Write-Host "`n=== Logs for $Service ===" -ForegroundColor Cyan
        docker-compose logs -f $Service
    } else {
        Write-Host "`n=== All Logs ===" -ForegroundColor Cyan
        docker-compose logs -f
    }
}

switch ($Command) {
    "start" {
        Write-Host "Starting Docker data services..." -ForegroundColor Green
        docker-compose up -d
        Start-Sleep -Seconds 5
        Show-Status
        Write-Host "Services started! Use '.\docker-data.ps1 logs' to view logs." -ForegroundColor Green
        Write-Host "`nDon't forget to update server/config.env:" -ForegroundColor Yellow
        Write-Host "  DB_HOST=localhost" -ForegroundColor Yellow
        Write-Host "  DB_USER=zalo_user (or root)" -ForegroundColor Yellow
        Write-Host "  DB_PASSWORD=zalo_password (or root password)" -ForegroundColor Yellow
        Write-Host "  DB_NAME=zalo_clone" -ForegroundColor Yellow
    }
    "stop" {
        Write-Host "Stopping Docker data services..." -ForegroundColor Yellow
        docker-compose stop
        Show-Status
    }
    "restart" {
        Write-Host "Restarting Docker data services..." -ForegroundColor Yellow
        docker-compose restart
        Start-Sleep -Seconds 3
        Show-Status
    }
    "status" {
        Show-Status
    }
    "logs" {
        Show-Logs
    }
    "shell-mysql" {
        Write-Host "Connecting to MySQL..." -ForegroundColor Cyan
        Write-Host "Default credentials: root/root or zalo_user/zalo_password" -ForegroundColor Yellow
        docker-compose exec mysql mysql -u root -p
    }
    "shell-redis" {
        Write-Host "Connecting to Redis..." -ForegroundColor Cyan
        docker-compose exec redis redis-cli
    }
    "backup" {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "backup_$timestamp.sql"
        Write-Host "Creating backup: $backupFile" -ForegroundColor Cyan
        $rootPassword = $env:MYSQL_ROOT_PASSWORD
        if (-not $rootPassword) {
            $rootPassword = "root"
        }
        docker-compose exec -T mysql mysqldump -u root -p$rootPassword zalo_clone > $backupFile
        if (Test-Path $backupFile) {
            Write-Host "Backup created: $backupFile" -ForegroundColor Green
        } else {
            Write-Host "Backup failed!" -ForegroundColor Red
        }
    }
    "clean" {
        Write-Host "WARNING: This will remove all containers and volumes (DATA WILL BE LOST)!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? Type 'yes' to continue"
        if ($confirm -eq "yes") {
            docker-compose down -v
            Write-Host "All data removed." -ForegroundColor Yellow
        } else {
            Write-Host "Cancelled." -ForegroundColor Green
        }
    }
}

