# ML-Training Makefile
# Cross-platform where possible. Assumes Python is on PATH.
# Usage examples:
#   make install
#   make train CONFIG=ml-training/config.yaml DATA_DIR=./data RUNS_DIR=./runs MODEL_VERSION=1.0.0
#   make export CONFIG=ml-training/config.yaml MODEL_VERSION=1.0.0
#   make infer IMAGE=/path/to/image.tif OUT=out.geojson TILE_SIZE=512 OVERLAP=64 THRESHOLD=0.5 MODEL=ml-training/models/unet/1.0.0/model.onnx
#   make test
#   make lint
#   make format
#   make clean

PY ?= python

# Defaults (can be overridden)
CONFIG ?= ml-training/config.yaml
DATA_DIR ?= ./data
RUNS_DIR ?= ./runs
MODEL_VERSION ?= 1.0.0

# Inference defaults
IMAGE ?=
OUT ?=
MODEL ?= ml-training/models/unet/$(MODEL_VERSION)/model.onnx
TILE_SIZE ?= 512
OVERLAP ?= 64
THRESHOLD ?= 0.5

.PHONY: help
help:
	@echo "Targets:"
	@echo "  install      - Install Python dependencies"
	@echo "  train        - Train the U-Net baseline"
	@echo "  export       - Export SavedModel and ONNX, update registry"
	@echo "  infer        - Offline inference over large image to GeoJSON"
	@echo "  yield-train  - Train the Random Forest yield model"
	@echo "  yield-export - Export RF to Joblib + ONNX and update registry"
	@echo "  yield-infer  - Offline RF inference for feature CSV/JSON using ONNXRuntime"
	@echo "  disaster-run     - Run disaster analysis on indices.csv and write summaries/GeoJSON"
	@echo "  disaster-export  - Package disaster outputs and update registry"
	@echo "  test         - Run pytest with coverage"
	@echo "  lint         - Run ruff and black (installs if missing)"
	@echo "  format       - Auto-format using black"
	@echo "  clean        - Remove caches and temporary files"
	@echo ""
	@echo "Common variables (override as needed):"
	@echo "  CONFIG=$(CONFIG)"
	@echo "  DATA_DIR=$(DATA_DIR)"
	@echo "  RUNS_DIR=$(RUNS_DIR)"
	@echo "  MODEL_VERSION=$(MODEL_VERSION)"
	@echo "  IMAGE=$(IMAGE)"
	@echo "  INPUT=$(INPUT)"
	@echo "  OUT=$(OUT)"
	@echo "  MODEL=$(MODEL)"
	@echo "  TILE_SIZE=$(TILE_SIZE)"
	@echo "  OVERLAP=$(OVERLAP)"
	@echo "  THRESHOLD=$(THRESHOLD)"

.PHONY: install
install:
	$(PY) -m pip install -U pip
	$(PY) -m pip install -r ml-training/requirements.txt

.PHONY: train
train:
	@echo "Starting training with CONFIG=$(CONFIG) DATA_DIR=$(DATA_DIR) RUNS_DIR=$(RUNS_DIR) MODEL_VERSION=$(MODEL_VERSION)"
	@export DATA_DIR=$(DATA_DIR) && export RUNS_DIR=$(RUNS_DIR) && export MODEL_VERSION=$(MODEL_VERSION) && $(PY) ml-training/train_unet.py --config $(CONFIG)

.PHONY: export
export:
	@echo "Exporting model version $(MODEL_VERSION) using $(CONFIG)"
	@export MODEL_VERSION=$(MODEL_VERSION) && $(PY) ml-training/export.py --config $(CONFIG) --version $(MODEL_VERSION)

.PHONY: yield-train
yield-train:
	@echo "Starting RF yield training with CONFIG=$(CONFIG) DATA_DIR=$(DATA_DIR) RUNS_DIR=$(RUNS_DIR)"
	@export DATA_DIR=$(DATA_DIR) && export RUNS_DIR=$(RUNS_DIR) && $(PY) ml-training/yield/train_rf.py --config $(CONFIG)

.PHONY: yield-export
yield-export:
	@echo "Exporting RF yield model version $(MODEL_VERSION) using $(CONFIG)"
	@export MODEL_VERSION=$(MODEL_VERSION) && $(PY) ml-training/yield/export_rf.py --config $(CONFIG) --version $(MODEL_VERSION)

.PHONY: yield-infer
yield-infer:
	@if [ -z "$(INPUT)" ] || [ -z "$(OUT)" ]; then \
		echo "Usage: make yield-infer INPUT=/path/to/features.csv OUT=/path/to/preds.json [MODEL=ml-training/models/yield_rf/$(MODEL_VERSION)/model.onnx]"; \
		exit 2; \
	fi
	$(PY) ml-training/yield/infer_rf.py --model ml-training/models/yield_rf/$(MODEL_VERSION)/model.onnx --input "$(INPUT)" --out "$(OUT)"

.PHONY: infer
infer:
	@if [ -z "$(IMAGE)" ] || [ -z "$(OUT)" ]; then \
		echo "Usage: make infer IMAGE=/path/to/image.tif OUT=/path/to/out.geojson [MODEL=$(MODEL)] [TILE_SIZE=$(TILE_SIZE)] [OVERLAP=$(OVERLAP)] [THRESHOLD=$(THRESHOLD)]"; \
		exit 2; \
	fi
	$(PY) ml-training/infer.py --image "$(IMAGE)" --out "$(OUT)" --tile-size $(TILE_SIZE) --overlap $(OVERLAP) --threshold $(THRESHOLD) --model "$(MODEL)"

.PHONY: test
test:
	$(PY) -m pytest -q ml-training/tests --cov=ml-training --cov-report=term-missing --cov-report=xml:ml-training/coverage.xml --cov-fail-under=80

.PHONY: lint
lint:
	@echo "Installing lint tools (ruff, black) if missing..."
	@$(PY) -c "import importlib,sys; \
tools=['ruff','black']; \
missing=[t for t in tools if importlib.util.find_spec(t) is None]; \
sys.exit(1) if missing else sys.exit(0)" || ($(PY) -m pip install -q ruff black)
	ruff check ml-training
	black --check ml-training

.PHONY: format
format:
	@$(PY) -c "import importlib,sys; import importlib.util as u; sys.exit(0) if u.find_spec('black') else sys.exit(1)" || ($(PY) -m pip install -q black)
	black ml-training

.PHONY: clean
clean:
	@echo "Cleaning caches and temporary files..."
	@$(PY) - <<'PY'
import shutil, os, glob
paths = ['.pytest_cache', 'htmlcov']
for p in paths:
    shutil.rmtree(p, ignore_errors=True)
for p in glob.glob('**/__pycache__', recursive=True):
    shutil.rmtree(p, ignore_errors=True)
for p in glob.glob('**/*.pyc', recursive=True):
    try:
        os.remove(p)
    except OSError:
        pass
PY

# ==== Disaster Analysis (Sprint 3) ====
.PHONY: disaster-run
disaster-run:
	@if [ -z "$(INDICES)" ] || [ -z "$(DATE)" ] || [ -z "$(EVENT)" ]; then \
		echo "Usage: make disaster-run INDICES=/path/to/indices.csv DATE=YYYY-MM-DD EVENT=flood|drought|stress [CONFIG=$(CONFIG)]"; \
		exit 2; \
	fi
	$(PY) ml-training/disaster/run_analysis.py --indices "$(INDICES)" --event-date "$(DATE)" --event "$(EVENT)" --out-dir ./out --config $(CONFIG) --write-geojson

.PHONY: disaster-export
disaster-export:
	@echo "Exporting disaster analysis artifacts version $(MODEL_VERSION) using $(CONFIG)"
	@export MODEL_VERSION=$(MODEL_VERSION) && $(PY) ml-training/disaster/export.py --out-dir ./out --config $(CONFIG) --version $(MODEL_VERSION)