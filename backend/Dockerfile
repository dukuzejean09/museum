# ─────────────────────────────────────────────────────
# Combined Backend + YOLO Service
# Deploy root: backend/
# ─────────────────────────────────────────────────────

FROM node:20-slim

WORKDIR /app

# ── System deps: Python 3 + OpenCV native libs ──
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    libgl1-mesa-glx libglib2.0-0 wget curl \
    && rm -rf /var/lib/apt/lists/*

# ── YOLO Python service setup ──
COPY yolo-service/requirements.txt /app/yolo-service/requirements.txt
RUN python3 -m venv /app/yolo-venv && \
    /app/yolo-venv/bin/pip install --no-cache-dir -r /app/yolo-service/requirements.txt

# Pre-download YOLOv8 nano model into the image
RUN /app/yolo-venv/bin/python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

COPY yolo-service/ /app/yolo-service/
RUN mkdir -p /app/yolo-service/models /app/yolo-service/datasets

# ── Node.js backend setup ──
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Create required directories
RUN mkdir -p /app/uploads /app/uploads/descriptors

# ── Startup script ──
RUN printf '#!/bin/bash\nset -e\n\necho "Starting YOLO service on port 8001..."\ncd /app/yolo-service\n/app/yolo-venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001 &\nYOLO_PID=$!\n\nsleep 3\n\necho "Starting Node.js backend on port ${PORT:-7860}..."\ncd /app\nnode server.js &\nNODE_PID=$!\n\necho "Both services running (YOLO: $YOLO_PID, Node: $NODE_PID)"\n\ntrap "kill $YOLO_PID $NODE_PID 2>/dev/null; exit 0" SIGTERM SIGINT\n\nwait -n $YOLO_PID $NODE_PID\nkill $YOLO_PID $NODE_PID 2>/dev/null\nexit $?\n' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:7860/health || exit 1

CMD ["/app/start.sh"]
