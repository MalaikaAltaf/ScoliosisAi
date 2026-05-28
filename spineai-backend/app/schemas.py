"""
Pydantic schemas for SpineAI API request/response validation.
"""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Response schema for the /health endpoint."""
    status: str = Field(..., description="Service status: 'ok', 'loading', or 'unhealthy'")
    models_loaded: list[str] = Field(
        default_factory=list,
        description="Names of models successfully loaded (e.g. ['efficientnet_b0', 'efficientnet_se'])",
    )


class PredictionResponse(BaseModel):
    """Response schema for the /predict endpoint.

    Cobb angles for three spinal regions plus overall severity classification.
    The frontend expects exactly these field names (see dashboard.js line 272).
    """
    model_config = {"protected_namespaces": ()}
    
    pt_angle: float = Field(..., description="Proximal Thoracic Cobb angle in degrees")
    mt_angle: float = Field(..., description="Main Thoracic Cobb angle in degrees")
    tl_angle: float = Field(..., description="Thoracolumbar Cobb angle in degrees")
    severity: str = Field(
        ...,
        description="Overall severity: 'normal', 'mild', 'moderate', or 'severe'",
    )
    model_used: str = Field(..., description="Name of the model that produced the prediction")
    routing_reason: str = Field(
        ...,
        description="Human-readable explanation of why this model was chosen",
    )
    processing_ms: int = Field(..., description="Total inference time in milliseconds")
