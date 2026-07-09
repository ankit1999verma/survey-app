#!/bin/bash
set -e

# Parse arguments
JAR_PATH=""
EC2_USER="ubuntu"
BLUE_GREEN=false

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --jar) JAR_PATH="$2"; shift ;;
    --user) EC2_USER="$2"; shift ;;
    --blue-green) BLUE_GREEN=true ;;
    *) echo "Unknown parameter passed: $1"; exit 1 ;;
  esac
  shift
done

if [ -z "$JAR_PATH" ]; then
  echo "Error: --jar argument is required."
  exit 1
fi

APP_DIR="/opt/gpsurvey"
RELEASE_DIR="${APP_DIR}/releases"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
NEW_JAR="${RELEASE_DIR}/app-${TIMESTAMP}.jar"

echo "Copying new JAR to ${NEW_JAR}..."
sudo cp "${JAR_PATH}" "${NEW_JAR}"
sudo chown ${EC2_USER}:${EC2_USER} "${NEW_JAR}"

echo "Updating current.jar symlink..."
sudo ln -sf "${NEW_JAR}" "${RELEASE_DIR}/current.jar"

if [ "$BLUE_GREEN" = true ]; then
  echo "Starting Blue/Green deployment..."
  
  # Determine active service
  ACTIVE_SERVICE=""
  if [[ -L /etc/nginx/gpsurvey/app_backend.conf ]]; then
    TARGET=$(readlink -f /etc/nginx/gpsurvey/app_backend.conf)
    if [[ "$TARGET" == *"blue"* ]]; then
      ACTIVE_SERVICE="blue"
    elif [[ "$TARGET" == *"green"* ]]; then
      ACTIVE_SERVICE="green"
    fi
  fi
  
  if [ -z "$ACTIVE_SERVICE" ]; then
    echo "Could not determine active service from Nginx. Defaulting to blue active, deploying to green."
    ACTIVE_SERVICE="blue"
  fi
  
  # Determine inactive service
  if [ "$ACTIVE_SERVICE" == "blue" ]; then
    INACTIVE_SERVICE="green"
    INACTIVE_PORT=8081
  else
    INACTIVE_SERVICE="blue"
    INACTIVE_PORT=8080
  fi
  
  echo "Active service is ${ACTIVE_SERVICE}. Deploying to ${INACTIVE_SERVICE} (port ${INACTIVE_PORT})..."
  
  # Restart inactive service
  sudo systemctl restart gpsurvey-${INACTIVE_SERVICE}
  
  # Wait for health check
  echo "Waiting for ${INACTIVE_SERVICE} to start..."
  ATTEMPTS=0
  MAX_ATTEMPTS=30
  HEALTH_URL="http://127.0.0.1:${INACTIVE_PORT}/api/v1/master/states" # Using states API as health check since no auth required
  
  while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 $HEALTH_URL || echo "000")
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "405" ] || [ "$HTTP_CODE" == "404" ]; then
      echo "Service is up and responding (HTTP ${HTTP_CODE})."
      break
    fi
    echo "Attempt $((ATTEMPTS+1))/${MAX_ATTEMPTS}... (HTTP ${HTTP_CODE})"
    sleep 3
    ATTEMPTS=$((ATTEMPTS+1))
  done
  
  if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
    echo "Deployment failed: New service did not start properly."
    echo "Rolling back (keeping ${ACTIVE_SERVICE} active)."
    sudo systemctl stop gpsurvey-${INACTIVE_SERVICE}
    exit 1
  fi
  
  echo "Swapping Nginx upstream to ${INACTIVE_SERVICE}..."
  sudo ln -sf /etc/nginx/gpsurvey/upstream_${INACTIVE_SERVICE}.conf /etc/nginx/gpsurvey/app_backend.conf
  sudo systemctl reload nginx || sudo nginx -s reload
  
  echo "Stopping old active service (${ACTIVE_SERVICE}) to free up resources..."
  sudo systemctl stop gpsurvey-${ACTIVE_SERVICE}
  
  echo "Blue/Green Deployment completed successfully!"
else
  echo "Single instance deployment (Blue/Green disabled)..."
  # Restart both in case one is stuck, but mainly restart blue
  sudo systemctl restart gpsurvey-blue
  sudo systemctl stop gpsurvey-green || true
  
  if [[ -d /etc/nginx/gpsurvey ]]; then
    sudo ln -sf /etc/nginx/gpsurvey/upstream_blue.conf /etc/nginx/gpsurvey/app_backend.conf
    sudo systemctl reload nginx || sudo nginx -s reload
  fi
  
  echo "Deployment completed!"
fi
