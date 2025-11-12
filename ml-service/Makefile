# SkyCrop ML Service - Makefile

PYTHON ?= python3
PIP ?= pip
VENV ?= .venv
ACTIVATE = . $(VENV)/Scripts/activate || . $(VENV)/bin/activate

.PHONY: help venv install run lint format test cov clean

help:
	@echo "Targets:"
	@echo "  venv     - create local virtual environment"
	@echo "  install  - install dependencies into venv"
	@echo "  run      - run Flask dev server (uses .env if present)"
	@echo "  lint     - run ruff (lint only)"
	@echo "  format   - run black and ruff format"
	@echo "  test     - run pytest with coverage (threshold from pytest.ini / pyproject)"
	@echo "  cov      - show coverage report"
	@echo "  clean    - remove caches and build artifacts"

venv:
	$(PYTHON) -m venv $(VENV)

install: venv
	$(ACTIVATE); $(PIP) install --upgrade pip
	$(ACTIVATE); $(PIP) install -r requirements.txt

run:
	$(ACTIVATE); $(PYTHON) main.py

lint:
	$(ACTIVATE); ruff check app tests

format:
	$(ACTIVATE); black app tests
	$(ACTIVATE); ruff check --fix app tests

test:
	$(ACTIVATE); pytest -q

cov:
	$(ACTIVATE); pytest --cov=app --cov-report=term-missing

clean:
	@echo "Cleaning caches and build artifacts..."
	@rm -rf .pytest_cache .ruff_cache .coverage htmlcov
	@find . -type d -name "__pycache__" -exec rm -rf {} +