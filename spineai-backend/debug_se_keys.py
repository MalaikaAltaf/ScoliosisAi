"""Debug script: compare SE checkpoint keys vs model architecture keys."""
import io, os, zipfile, torch, sys
sys.path.insert(0, os.path.dirname(__file__))
from app.models import build_model

# 1. Load SE state_dict from Kaggle folder
path = r"d:\scoliosis-website\spineai-backend\models\best_efficientnet_se_s4"
device = torch.device("cpu")

buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as zf:
    for root, _dirs, files in os.walk(path):
        for fname in files:
            full_path = os.path.join(root, fname)
            arcname = os.path.relpath(full_path, path).replace(os.sep, "/")
            zf.write(full_path, f"archive/{arcname}")
buf.seek(0)
sd = torch.load(buf, map_location=device, weights_only=False)

# 2. Build model and get expected keys
model = build_model("efficientnet_se")
model_keys = set(model.state_dict().keys())
sd_keys = set(sd.keys())

# 3. Compare
missing_in_sd = model_keys - sd_keys   # model expects but checkpoint lacks
unexpected_in_sd = sd_keys - model_keys  # checkpoint has but model doesn't expect

print(f"Model expects {len(model_keys)} keys")
print(f"Checkpoint has {len(sd_keys)} keys")
print()

if missing_in_sd:
    print(f"--- MISSING from checkpoint ({len(missing_in_sd)}) ---")
    for k in sorted(missing_in_sd):
        print(f"  {k}")
else:
    print("No missing keys!")

print()
if unexpected_in_sd:
    print(f"--- UNEXPECTED in checkpoint ({len(unexpected_in_sd)}) ---")
    for k in sorted(unexpected_in_sd):
        print(f"  {k}")
else:
    print("No unexpected keys!")

# 4. Show SE-related keys from both sides
print("\n--- SE-related keys in CHECKPOINT ---")
for k in sorted(sd_keys):
    if "se" in k.lower() or "excitation" in k.lower() or "squeeze" in k.lower():
        print(f"  {k}")

print("\n--- SE-related keys in MODEL ---")
for k in sorted(model_keys):
    if "se" in k.lower() or "excitation" in k.lower() or "squeeze" in k.lower():
        print(f"  {k}")
