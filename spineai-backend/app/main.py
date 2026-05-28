"""
app/main.py — FastAPI entry point for SpineAI.

Loads ConditionalRouter once at startup via lifespan, exposes two endpoints:
  GET  /health  — liveness + model status
  POST /predict — X-ray image → Cobb angles + severity
"""

import io
import time
import torch

from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from .router import ConditionalRouter
from .preprocess import preprocess_image
from .schemas import PredictionResponse, HealthResponse


# ── Module-level router instance (populated at startup) ────────────
router_instance: ConditionalRouter | None = None


# ── Lifespan ───────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global router_instance
    device = torch.device("cpu")          # CPU only — no CUDA needed
    router_instance = ConditionalRouter(device)
    print(f"[SpineAI] Models loaded on {device}")
    print(f"[SpineAI] Models: {router_instance.models_loaded}")
    yield
    # No explicit cleanup required for CPU-only inference


# ── App ────────────────────────────────────────────────────────────
app = FastAPI(title="SpineAI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── File validation helper ─────────────────────────────────────────
async def validate_image_file(file: UploadFile) -> bytes:
    """Validate upload and return raw bytes.

    Checks:
    - Content-Type is JPEG or PNG
    - File size ≤ 10 MB
    - Minimum dimension ≥ 100 px (rejects tiny/corrupt images)

    Returns
    -------
    bytes
        Raw image bytes (already read from the upload stream).
    """
    if file.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid file type '{file.content_type}'. "
                "Only image/jpeg and image/png are accepted."
            ),
        )

    image_bytes = await file.read()

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 10 MB limit.",
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    try:
        img = Image.open(io.BytesIO(image_bytes))
        w, h = img.size
        if min(w, h) < 100:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Image is too small ({w}×{h} px). "
                    "Minimum dimension is 100 px."
                ),
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not open image: {exc}",
        ) from exc

    return image_bytes


# ── Endpoints ──────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Return service health and loaded model names."""
    if router_instance is None:
        return HealthResponse(status="loading", models_loaded=list())
    return HealthResponse(
        status="ok",
        models_loaded=router_instance.models_loaded,
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(..., description="Spinal X-ray image (JPEG or PNG)"),
) -> PredictionResponse:
    """Accept an X-ray image and return Cobb angle predictions."""
    # Validate upload
    image_bytes = await validate_image_file(file)

    # Preprocess
    try:
        tensor = preprocess_image(image_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Image preprocessing failed: {exc}",
        ) from exc

    # Inference
    start_time = time.time()
    try:
        result = router_instance.predict(tensor)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    processing_ms = int((time.time() - start_time) * 1000)

    return PredictionResponse(**result, processing_ms=processing_ms)  
