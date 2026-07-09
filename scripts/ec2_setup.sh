#!/bin/bash
set -e

# Parse arguments
EC2_USER="ubuntu"
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --user) EC2_USER="$2"; shift ;;
    *) echo "Unknown parameter passed: $1"; exit 1 ;;
  esac
  shift
done

echo "Setting up EC2 environment for gpsurvey..."
APP_DIR="/opt/gpsurvey"
LOG_DIR="/var/log/gpsurvey"

# Install Java 17 if not installed
if ! command -v java &> /dev/null || ! java -version 2>&1 | grep -q "17."; then
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y openjdk-17-jre-headless
  sudo update-alternatives --set java /usr/lib/jvm/java-17-openjdk-amd64/bin/java || true
fi

# Create directories
sudo mkdir -p ${APP_DIR}/releases
sudo mkdir -p ${LOG_DIR}
sudo chown -R ${EC2_USER}:${EC2_USER} ${APP_DIR}
sudo chown -R ${EC2_USER}:${EC2_USER} ${LOG_DIR}

# Create systemd service files
cat << EOF | sudo tee /etc/systemd/system/gpsurvey-blue.service
[Unit]
Description=GPSurvey Backend (Blue)
After=syslog.target network.target

[Service]
User=${EC2_USER}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/java -Dserver.port=8080 -jar ${APP_DIR}/releases/current.jar
SuccessExitStatus=143
TimeoutStopSec=10
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat << EOF | sudo tee /etc/systemd/system/gpsurvey-green.service
[Unit]
Description=GPSurvey Backend (Green)
After=syslog.target network.target

[Service]
User=${EC2_USER}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/java -Dserver.port=8081 -jar ${APP_DIR}/releases/current.jar
SuccessExitStatus=143
TimeoutStopSec=10
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Setup initial Nginx routing (optional, assumes Nginx is installed)
if command -v nginx &> /dev/null; then
  sudo mkdir -p /etc/nginx/gpsurvey
  
  # Create upstream configurations
  cat << EOF | sudo tee /etc/nginx/gpsurvey/upstream_blue.conf
upstream backend_app {
    server 127.0.0.1:8080;
}
EOF

  cat << EOF | sudo tee /etc/nginx/gpsurvey/upstream_green.conf
upstream backend_app {
    server 127.0.0.1:8081;
}
EOF

  # Set active to blue by default
  if [ ! -L /etc/nginx/gpsurvey/app_backend.conf ]; then
    sudo ln -s /etc/nginx/gpsurvey/upstream_blue.conf /etc/nginx/gpsurvey/app_backend.conf
  fi

  # Create server block for gpsurvey API
  cat << EOF | sudo tee /etc/nginx/sites-available/gpsurvey.conf
server {
    listen 80;
    server_name 13.204.243.30;
    
    # Include the active upstream
    include /etc/nginx/gpsurvey/app_backend.conf;

    location /api/ {
        proxy_pass http://backend_app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

  sudo ln -sf /etc/nginx/sites-available/gpsurvey.conf /etc/nginx/sites-enabled/
  sudo systemctl reload nginx

  echo "Nginx configuration prepared in /etc/nginx/gpsurvey/"
else
  echo "Nginx not found. Skipping Nginx setup."
fi

echo "EC2 setup complete."
