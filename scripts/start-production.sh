#!/bin/sh
set -e

cd /app/api
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
API_PID=$!

# ponytail: 45s boot wait; upgrade = Render healthCheckPath + longer loop
i=0
while [ "$i" -lt 45 ]; do
  if curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 1
done

if ! curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
  echo "FastAPI failed to start within 45s" >&2
  kill "$API_PID" 2>/dev/null || true
  exit 1
fi

cd /app
exec node server.js
