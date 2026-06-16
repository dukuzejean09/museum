"""
YOLO Detection Microservice for Kandt House Museum AR System.

Provides artifact/exhibition detection via YOLOv8.
Falls into the recognition pipeline as Phase 3:
  QR Detection -> OpenCV Matching -> YOLO Detection -> GPT-4o Fallback
"""
import io
import time
import logging
from pathlib import Path
from contextlib import asynccontextmanager

import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import settings
from model_registry import ModelRegistry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

registry = ModelRegistry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load the active YOLO model
    registry.load_active_model()
    yield
    # Shutdown: cleanup
    registry.unload()


app = FastAPI(
    title="Kandt Museum YOLO Detection Service",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# --- Response Models ---

class Detection(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    bbox: list[float]  # [x1, y1, x2, y2]


class DetectionResponse(BaseModel):
    detections: list[Detection]
    inference_time_ms: float
    model_version: str
    image_size: list[int]  # [width, height]


class ClassifyResponse(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    top_5: list[dict]
    inference_time_ms: float
    model_version: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    active_model: str
    available_models: list[str]


class ModelInfo(BaseModel):
    name: str
    version: str
    accuracy: float | None = None
    precision: float | None = None
    recall: float | None = None
    trained_at: str | None = None
    is_active: bool = False


# --- Helpers ---

async def read_image(file: UploadFile) -> np.ndarray:
    """Read uploaded file into OpenCV BGR image."""
    contents = await file.read()
    pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)


# --- Endpoints ---

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        model_loaded=registry.is_loaded,
        active_model=settings.active_model,
        available_models=registry.list_models(),
    )


@app.post("/detect", response_model=DetectionResponse)
async def detect(
    file: UploadFile = File(...),
    confidence: float | None = None,
):
    """Run object detection on uploaded image."""
    if not registry.is_loaded:
        raise HTTPException(503, "No model loaded")

    image = await read_image(file)
    h, w = image.shape[:2]
    conf = confidence or settings.confidence_threshold

    start = time.perf_counter()
    results = registry.model(
        image,
        conf=conf,
        iou=settings.iou_threshold,
        max_det=settings.max_detections,
        verbose=False,
    )
    elapsed = (time.perf_counter() - start) * 1000

    detections = []
    for r in results:
        for box in r.boxes:
            detections.append(Detection(
                class_id=int(box.cls[0]),
                class_name=registry.model.names[int(box.cls[0])],
                confidence=float(box.conf[0]),
                bbox=box.xyxy[0].tolist(),
            ))

    return DetectionResponse(
        detections=detections,
        inference_time_ms=round(elapsed, 2),
        model_version=settings.active_model,
        image_size=[w, h],
    )


@app.post("/classify", response_model=ClassifyResponse)
async def classify(file: UploadFile = File(...)):
    """Run image classification on uploaded image."""
    if not registry.is_loaded:
        raise HTTPException(503, "No model loaded")

    image = await read_image(file)

    start = time.perf_counter()
    results = registry.model(image, verbose=False)
    elapsed = (time.perf_counter() - start) * 1000

    r = results[0]
    probs = r.probs
    if probs is None:
        raise HTTPException(400, "Model does not support classification. Use a classification model.")

    top5_indices = probs.top5
    top5_confs = probs.top5conf.tolist()

    return ClassifyResponse(
        class_id=probs.top1,
        class_name=registry.model.names[probs.top1],
        confidence=float(probs.top1conf),
        top_5=[
            {"class_id": idx, "class_name": registry.model.names[idx], "confidence": round(c, 4)}
            for idx, c in zip(top5_indices, top5_confs)
        ],
        inference_time_ms=round(elapsed, 2),
        model_version=settings.active_model,
    )


@app.get("/models", response_model=list[ModelInfo])
async def list_models():
    """List available models in the registry."""
    return registry.get_model_info()


@app.post("/models/{model_name}/activate")
async def activate_model(model_name: str):
    """Switch the active model."""
    try:
        registry.activate(model_name)
        return {"message": f"Model {model_name} activated", "active": model_name}
    except FileNotFoundError:
        raise HTTPException(404, f"Model {model_name} not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
