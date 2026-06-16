"""
Model Registry — manages YOLO model versions, loading, and switching.
"""
import json
import logging
from pathlib import Path
from datetime import datetime

from config import settings

logger = logging.getLogger(__name__)


class ModelRegistry:
    def __init__(self):
        self.model = None
        self.is_loaded = False
        self._metadata_path = settings.model_dir / "registry.json"
        self._metadata = self._load_metadata()

    def _load_metadata(self) -> dict:
        if self._metadata_path.exists():
            return json.loads(self._metadata_path.read_text())
        return {"models": {}, "active": settings.active_model}

    def _save_metadata(self):
        settings.model_dir.mkdir(parents=True, exist_ok=True)
        self._metadata_path.write_text(json.dumps(self._metadata, indent=2))

    def load_active_model(self):
        """Load the currently active YOLO model."""
        model_name = self._metadata.get("active", settings.active_model)
        model_path = settings.model_dir / model_name

        # If custom model doesn't exist, fall back to default ultralytics model
        if not model_path.exists():
            logger.info(f"Custom model {model_path} not found, using default {model_name}")
            model_path = model_name  # ultralytics will download it

        try:
            from ultralytics import YOLO
            self.model = YOLO(str(model_path))
            self.is_loaded = True
            logger.info(f"Loaded YOLO model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            self.is_loaded = False

    def unload(self):
        self.model = None
        self.is_loaded = False

    def activate(self, model_name: str):
        """Switch the active model."""
        model_path = settings.model_dir / model_name
        if not model_path.exists():
            # Check if it's a valid ultralytics model name
            valid_defaults = ["yolov8n.pt", "yolov8s.pt", "yolov8m.pt", "yolov8l.pt", "yolov8x.pt"]
            if model_name not in valid_defaults:
                raise FileNotFoundError(f"Model {model_name} not found")

        self._metadata["active"] = model_name
        self._save_metadata()
        self.load_active_model()

    def list_models(self) -> list[str]:
        """List all available model files."""
        settings.model_dir.mkdir(parents=True, exist_ok=True)
        models = [f.name for f in settings.model_dir.glob("*.pt")]
        # Add default models
        defaults = ["yolov8n.pt", "yolov8s.pt", "yolov8m.pt"]
        for d in defaults:
            if d not in models:
                models.append(d)
        return sorted(models)

    def get_model_info(self) -> list[dict]:
        """Get metadata for all models."""
        models = self.list_models()
        active = self._metadata.get("active", settings.active_model)
        info = []
        for name in models:
            meta = self._metadata.get("models", {}).get(name, {})
            info.append({
                "name": name,
                "version": meta.get("version", "1.0"),
                "accuracy": meta.get("accuracy"),
                "precision": meta.get("precision"),
                "recall": meta.get("recall"),
                "trained_at": meta.get("trained_at"),
                "is_active": name == active,
            })
        return info

    def register_model(self, name: str, metrics: dict = None):
        """Register a model with optional training metrics."""
        if "models" not in self._metadata:
            self._metadata["models"] = {}
        self._metadata["models"][name] = {
            "version": metrics.get("version", "1.0") if metrics else "1.0",
            "accuracy": metrics.get("accuracy") if metrics else None,
            "precision": metrics.get("precision") if metrics else None,
            "recall": metrics.get("recall") if metrics else None,
            "trained_at": datetime.utcnow().isoformat(),
        }
        self._save_metadata()
