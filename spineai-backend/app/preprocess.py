"""
Image preprocessing pipeline for spinal X-ray images.

Applies albumentations transforms to normalize and resize input images
before they are fed into the EfficientNet-B0 models.
"""

import numpy as np
import albumentations as A
from albumentations.pytorch import ToTensorV2
from PIL import Image
import io


# Standard ImageNet normalization values
IMAGENET_MEAN = (0.485, 0.456, 0.406)
IMAGENET_STD = (0.229, 0.224, 0.225)

# Input size expected by EfficientNet-B0
INPUT_SIZE = 224


def get_val_transforms() -> A.Compose:
    """Return the validation/inference augmentation pipeline.

    Matches the transforms used during model training:
    1. Resize to INPUT_SIZE x INPUT_SIZE
    2. Normalize with ImageNet statistics
    3. Convert to PyTorch tensor (C, H, W) float32
    """
    return A.Compose([
        A.Resize(INPUT_SIZE, INPUT_SIZE),
        A.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ToTensorV2(),
    ])


def preprocess_image(image_bytes: bytes):
    """Convert raw upload bytes into a preprocessed tensor.

    Parameters
    ----------
    image_bytes : bytes
        Raw bytes of the uploaded JPEG/PNG image.

    Returns
    -------
    torch.Tensor
        Shape (1, 3, INPUT_SIZE, INPUT_SIZE), float32, ready for model input.
    """
    # Open image and ensure RGB (X-rays may be grayscale)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_np = np.array(image)

    # Apply augmentation pipeline
    transforms = get_val_transforms()
    augmented = transforms(image=image_np)
    tensor = augmented["image"]  # shape: (3, H, W)

    # Add batch dimension → (1, 3, H, W)
    return tensor.unsqueeze(0)
