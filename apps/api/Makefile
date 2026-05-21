.PHONY: install dev start start-prod test migrate push seed setup

install:
	pip install -r requirements.txt

dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 5051

start:
	uvicorn app.main:app --host 0.0.0.0 --port $${PORT:-5000}

start-prod:
	python -m app.cli migrate && python -m app.cli seed && uvicorn app.main:app --host 0.0.0.0 --port $${PORT:-5000}

test:
	pytest -q

migrate:
	python -m app.cli migrate

push:
	python -m app.cli migrate

seed:
	python -m app.cli seed

setup:
	python -m app.cli setup
