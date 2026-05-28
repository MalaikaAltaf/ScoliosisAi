"""
app/router.py — ConditionalRouter class for SpineAI.

Loads both EfficientNet-B0 and EfficientNet-SE models at construction time.
predict() routes to the SE model when available, falls back to B0.
Returns a plain dict consumed by main.py's /predict endpoint.
"""

import logging
import math
from typing import Optional

import torch
import torch.nn as nn

from .models import build_model, load_pth

logger = logging.getLogger(__name__)

MODEL_B0_PATH = "/app/models/best_efficientnet_s4"
MODEL_SE_PATH = "/app/models/best_efficientnet_se_s4"


class ConditionalRouter:
    """Loads and routes inference across EfficientNet-B0 and SE variants.

    Parameters
    ----------
    device : torch.device
        Device to load and run models on (typically cpu).
    """

    def __init__(self, device: torch.device):
        self.device = device
        self.models_loaded: list[str] = []

        self._model_b0: Optional[nn.Module] = None
        self._model_se: Optional[nn.Module] = None

        self._load_b0()
        self._load_se()

    # ------------------------------------------------------------------
    # Private loaders
    # ------------------------------------------------------------------

    def _load_b0(self) -> None:
        try:
            logger.info("Loading EfficientNet-B0 screener from %s …", MODEL_B0_PATH)
            model = build_model("efficientnet")
            logger.info("  → Built model architecture")
            sd = load_pth(MODEL_B0_PATH, self.device)
            logger.info(f"  → Loaded state dict with {len(sd)} keys")
            model.load_state_dict(sd)
            logger.info("  → State dict applied to model")
            model.to(self.device).eval()
            self._model_b0 = model
            self.models_loaded.append("efficientnet_b0")
            logger.info("✓ EfficientNet-B0 ready")
        except Exception:
            logger.exception("✗ Failed to load EfficientNet-B0")

    def _load_se(self) -> None:
        try:
            logger.info("Loading EfficientNet-SE model from %s …", MODEL_SE_PATH)
            model = build_model("efficientnet_se")
            logger.info("  → Built model architecture")
            sd = load_pth(MODEL_SE_PATH, self.device)
            logger.info(f"  → Loaded state dict with {len(sd)} keys")
            model.load_state_dict(sd)
            logger.info("  → State dict applied to model")
            model.to(self.device).eval()
            self._model_se = model
            self.models_loaded.append("efficientnet_se")
            logger.info("✓ EfficientNet-SE ready")
        except Exception:
            logger.exception("✗ Failed to load EfficientNet-SE")

    # ------------------------------------------------------------------
    # Public predict
    # ------------------------------------------------------------------

    def predict(self, tensor: torch.Tensor) -> dict:
        """Run inference and return a result dict (no processing_ms).

        Routing:
          1. Prefer EfficientNet-SE (better accuracy).
          2. Fall back to EfficientNet-B0.
          3. Raise RuntimeError if neither is loaded.

        Parameters
        ----------
        tensor : torch.Tensor
            Preprocessed input of shape (1, 3, H, W) on any device.

        Returns
        -------
        dict with keys: pt_angle, mt_angle, tl_angle, severity,
                        model_used, routing_reason
        """
        if self._model_se is not None:
            chosen = self._model_se
            model_used = "EfficientNet-B0 SE (Squeeze-and-Excitation)"
            routing_reason = (
                "SE variant selected — provides enhanced channel attention "
                "for improved Cobb angle estimation accuracy."
            )
        elif self._model_b0 is not None:
            chosen = self._model_b0
            model_used = "EfficientNet-B0 (Standard)"
            routing_reason = (
                "Standard variant selected — SE model unavailable; "
                "using baseline EfficientNet-B0 for prediction."
            )
        else:
            raise RuntimeError(
                "No models are loaded. Ensure weight folders are mounted at /app/models/."
            )

        tensor = tensor.to(self.device)
        with torch.no_grad():
            outputs = chosen(tensor)  # (1, 3)

        raw = outputs.squeeze(0).tolist()  # [pt_log, mt_log, tl_log]
        # Model predicts log-transformed angles; exponentiate to recover degrees
        pt_angle = round(max(0.0, math.exp(raw[0])), 1)
        mt_angle = round(max(0.0, math.exp(raw[1])), 1)
        tl_angle = round(max(0.0, math.exp(raw[2])), 1)

        # Classify severity by main thoracic angle
        if mt_angle < 10:
            severity = "normal"
        elif mt_angle < 25:
            severity = "mild"
        elif mt_angle < 40:
            severity = "moderate"
        else:
            severity = "severe"

        return {
            "pt_angle": pt_angle,
            "mt_angle": mt_angle,
            "tl_angle": tl_angle,
            "severity": severity,
            "model_used": model_used,
            "routing_reason": routing_reason,
        }
