from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # Model paths
    model_dir: Path = Path("models")
    active_model: str = "yolov8n.pt"  # Default to nano for speed

    # Detection settings
    confidence_threshold: float = 0.5
    iou_threshold: float = 0.45
    max_detections: int = 10

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8001
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Dataset paths
    dataset_dir: Path = Path("datasets")

    class Config:
        env_file = ".env"
        env_prefix = "YOLO_"


settings = Settings()
