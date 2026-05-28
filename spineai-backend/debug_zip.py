import io
import os
import zipfile
import torch

path = r"d:\scoliosis-website\spineai-backend\models\best_efficientnet_s4"
device = torch.device("cpu")

print("Walking path:", path)
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as zf:
    for root, _dirs, files in os.walk(path):
        for fname in files:
            full_path = os.path.join(root, fname)
            arcname = os.path.relpath(full_path, path)
            arcname = arcname.replace(os.sep, "/")
            zip_path = f"archive/{arcname}"
            print(f"Adding: {full_path} -> {zip_path}")
            zf.write(full_path, zip_path)

buf.seek(0)

# Let's inspect the files in the zip
with zipfile.ZipFile(buf, "r") as zf:
    print("Files in generated zip:")
    for name in zf.namelist():
        print(" -", name)

buf.seek(0)
try:
    print("Loading with torch.load...")
    sd = torch.load(buf, map_location=device, weights_only=False)
    print("Successfully loaded state dict! Keys count:", len(sd.keys()))
except Exception as e:
    print("Failed to load:")
    import traceback
    traceback.print_exc()
