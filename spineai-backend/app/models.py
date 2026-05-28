"""
Model definitions and weight loading for SpineAI.

Provides two EfficientNet variants for Cobb angle regression:
  - efficientnet      : EfficientNet-B0 baseline screener
  - efficientnet_se   : EfficientNet-B0 + custom Squeeze-and-Excitation block

Handles Kaggle-extracted folder format where PyTorch weights are stored as
directories (data.pkl + data/ shards) instead of single .pth files.  The
load_pth() function re-zips these into an in-memory buffer before loading.
"""

import io
import os
import zipfile
import logging
from collections import OrderedDict

import torch
import torch.nn as nn
from torchvision import models as tv_models

logger = logging.getLogger(__name__)


# -------------------------------------------------------------------
# Squeeze-and-Excitation Block
# -------------------------------------------------------------------

class SEBlock(nn.Module):
    """Squeeze-and-Excitation channel attention block.

    Parameters
    ----------
    channels : int
        Number of input channels (default 1280 for EfficientNet-B0 features).
    reduction : int
        Channel reduction ratio for the bottleneck (default 16).
    """

    def __init__(self, channels: int = 1280, reduction: int = 16):
        super().__init__()
        self.squeeze = nn.AdaptiveAvgPool2d(1)
        self.excitation = nn.Sequential(
            nn.Linear(channels, channels // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(channels // reduction, channels, bias=False),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        b, c, _, _ = x.size()
        # Squeeze: (B, C, H, W) → (B, C, 1, 1) → (B, C)
        y = self.squeeze(x).view(b, c)
        # Excitation: (B, C) → (B, C) → (B, C, 1, 1)
        y = self.excitation(y).view(b, c, 1, 1)
        # Scale
        return x * y


# -------------------------------------------------------------------
# EfficientNet-SE Model
# -------------------------------------------------------------------

class EfficientNetSE(nn.Module):
    """EfficientNet-B0 backbone with a custom SE block and regression head.

    Architecture:
      features (B0) → SEBlock → AdaptiveAvgPool2d → flatten → classifier
    Outputs 3 values: PT, MT, TL Cobb angles.
    """

    def __init__(self):
        super().__init__()
        base = tv_models.efficientnet_b0(weights=None)
        self.features = base.features
        self.se_block = SEBlock(1280, 16)
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(1280, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(512, 3),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.se_block(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        x = self.classifier(x)
        return x


# -------------------------------------------------------------------
# Model builder
# -------------------------------------------------------------------

def build_model(name: str) -> nn.Module:
    """Construct an untrained model architecture by name.

    Parameters
    ----------
    name : str
        'efficientnet'    → EfficientNet-B0 with custom regression head
        'efficientnet_se' → EfficientNet-B0 + SE block

    Returns
    -------
    nn.Module
        Model with randomly initialised weights.
    """
    if name == "efficientnet":
        model = tv_models.efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features  # 1280
        model.classifier = nn.Sequential(
            nn.Dropout(0.4),
            nn.Linear(in_features, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(512, 3),
        )
        return model

    elif name == "efficientnet_se":
        return EfficientNetSE()

    else:
        raise ValueError(
            f"Unknown model name '{name}'. "
            "Choose from: 'efficientnet', 'efficientnet_se'."
        )


# -------------------------------------------------------------------
# Kaggle folder → BytesIO re-zip → torch.load
# -------------------------------------------------------------------

def load_pth(path: str, device: torch.device) -> OrderedDict:
    """Load a PyTorch state dict from a .pth file or a Kaggle-extracted folder.

    When Kaggle extracts a .pth upload, it produces a directory tree instead of
    a single file.  This function detects that case, re-packs the directory
    into an in-memory ZIP archive, and feeds it to torch.load().

    Parameters
    ----------
    path : str
        Path to a .pth file or a Kaggle-extracted weight folder.
    device : torch.device
        Device to map tensors to (e.g. torch.device('cpu')).

    Returns
    -------
    OrderedDict
        The loaded state dict.
    """
    if os.path.isdir(path):
        logger.info("Detected folder format for '%s' — re-zipping into BytesIO", path)

        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as zf:
            for root, _dirs, files in os.walk(path):
                for fname in files:
                    full_path = os.path.join(root, fname)
                    arcname = os.path.relpath(full_path, path)
                    # Normalize path separators to forward slashes for zip compatibility
                    arcname = arcname.replace(os.sep, "/")
                    # PyTorch expects all files in the zip archive to reside in a subdirectory
                    zf.write(full_path, f"archive/{arcname}")

        buf.seek(0)
        logger.info("Re-zipped '%s' (%d bytes) — loading with torch.load()", path, buf.getbuffer().nbytes)
        return torch.load(buf, map_location=device, weights_only=False)

    else:
        logger.info("Loading .pth file '%s' directly", path)
        return torch.load(path, map_location=device, weights_only=False)
