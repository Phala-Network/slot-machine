FROM python:3-slim AS builder

RUN pip install -U pip setuptools wheel pdm
ENV PDM_CHECK_UPDATE=false

WORKDIR /app

# RUN useradd -m appuser

ENV PDM_USE_VENV=true
ENV PDM_VENV_IN_PROJECT=1

COPY pyproject.toml pdm.lock ./

RUN pdm install --prod --check -G deploy --no-editable && \
    rm -rf .venv/lib/python3.10/site-packages/asyncio*

COPY main.py ./

FROM python:3-slim

WORKDIR /app

# RUN useradd -m appuser

COPY --from=builder /app /app
COPY --from=builder /root/.local /root/.local

ENV VIRTUAL_ENV=/app/.venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
ENV PYTHONPATH="$VIRTUAL_ENV/lib/python3.10/site-packages"

# USER appuser

EXPOSE 8000

CMD ["/app/.venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

