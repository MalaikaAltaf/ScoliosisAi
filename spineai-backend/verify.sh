#!/usr/bin/env bash
# verify.sh — Pre-flight checks and deployment script for SpineAI
# Run from inside the spineai-backend/ directory:
#   cd spineai-backend && bash verify.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        SpineAI Pre-flight Checks         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. Check model weight folders ─────────────────────────────────
echo "▶ Checking model weight folders …"

if [ -e "./models/best_efficientnet_s4" ]; then
    echo -e "  ${GREEN}✓${NC} ./models/best_efficientnet_s4 found"
else
    echo -e "  ${RED}✗ ERROR: Missing model folder or file: ./models/best_efficientnet_s4${NC}"
    echo "    → Copy the Kaggle-extracted folder or .pth here before deploying."
    ERRORS=$((ERRORS + 1))
fi

if [ -e "./models/best_efficientnet_se_s4" ]; then
    echo -e "  ${GREEN}✓${NC} ./models/best_efficientnet_se_s4 found"
else
    echo -e "  ${RED}✗ ERROR: Missing model folder or file: ./models/best_efficientnet_se_s4${NC}"
    echo "    → Copy the Kaggle-extracted folder or .pth here before deploying."
    ERRORS=$((ERRORS + 1))
fi

# ── 2. Check frontend folder ───────────────────────────────────────
echo ""
echo "▶ Checking frontend files …"

if [ -d "../" ] && [ -f "../index.html" ]; then
    echo -e "  ${GREEN}✓${NC} Frontend index.html found at ../"
else
    echo -e "  ${YELLOW}⚠ WARNING: ../index.html not found${NC}"
    echo "    → Nginx frontend container may serve an empty page."
fi

# ── Abort if critical errors ───────────────────────────────────────
if [ "$ERRORS" -gt 0 ]; then
    echo ""
    echo -e "${RED}✗ $ERRORS critical error(s) found. Fix them before deploying.${NC}"
    exit 1
fi

# ── 3. Build Docker images ─────────────────────────────────────────
echo ""
echo "▶ Building Docker images (no cache) …"
docker-compose build --no-cache

# ── 4. Start services ──────────────────────────────────────────────
echo ""
echo "▶ Starting services …"
docker-compose up -d

# ── 5. Wait for model loading then health check ────────────────────
echo ""
echo "▶ Waiting 30s for models to load on CPU …"
sleep 30

echo ""
echo "▶ Health check → http://localhost:8000/health"
HEALTH_RESPONSE=$(curl -s --max-time 10 http://localhost:8000/health || echo '{"error":"unreachable"}')
echo "$HEALTH_RESPONSE" | python3 -m json.tool

# Parse status field
STATUS=$(echo "$HEALTH_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "unknown")

echo ""
if [ "$STATUS" = "ok" ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓  SpineAI is running at http://localhost ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
else
    echo -e "${YELLOW}⚠ Health status: '$STATUS' — models may still be loading.${NC}"
    echo "  Wait another 30s and try: curl http://localhost:8000/health"
fi

# ── 6. Show recent backend logs ────────────────────────────────────
echo ""
echo "▶ Recent backend logs (last 20 lines):"
echo "──────────────────────────────────────"
docker-compose logs --tail=20 backend
