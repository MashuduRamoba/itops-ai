
import logging
import os
import httpx

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

from agent import analyse_incident
from database import (
    init_db,
    create_incident,
    get_incidents,
    get_incident,
    update_incident,
    save_ai_analysis,
)


# --------------------------------------------------
# Logging
# --------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("itops-ai")


# --------------------------------------------------
# AI configuration
# --------------------------------------------------

def get_ai_provider() -> str:
    return os.getenv("AI_PROVIDER", "ollama").strip().lower()


def get_ai_model() -> str:
    provider = get_ai_provider()

    if provider == "groq":
        return os.getenv(
            "GROQ_MODEL",
            "openai/gpt-oss-20b"
        )

    if provider == "ollama":
        return os.getenv(
            "OLLAMA_MODEL",
            "llama3.2:3b"
        )

    return "unknown"


# --------------------------------------------------
# Database initialization
# --------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    logger.info(
        "ITOps AI starting with provider: %s",
        get_ai_provider()
    )

    yield


# --------------------------------------------------
# FastAPI application
# --------------------------------------------------

app = FastAPI(
    title="ITOps AI API",
    description="AI-powered IT incident management",
    version="1.2.0",
    lifespan=lifespan,
)


# --------------------------------------------------
# CORS configuration
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://itops-ai.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# --------------------------------------------------
# Request models
# --------------------------------------------------

class IncidentRequest(BaseModel):
    description: str = Field(
        min_length=10,
        max_length=10000,
    )


class CreateIncidentRequest(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=200,
    )

    description: str = Field(
        min_length=10,
        max_length=10000,
    )

    category: str = Field(
        default="General IT",
        max_length=100,
    )

    priority: Literal[
        "Low",
        "Medium",
        "High",
        "Critical"
    ] = "Medium"


class UpdateIncidentRequest(BaseModel):
    status: Literal[
        "Open",
        "In Progress",
        "Resolved",
        "Closed"
    ]

    priority: Literal[
        "Low",
        "Medium",
        "High",
        "Critical"
    ]


# --------------------------------------------------
# Health endpoint
# --------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ITOps AI",
        "provider": get_ai_provider(),
        "model": get_ai_model(),
        "database": "sqlite",
    }


# --------------------------------------------------
# Incident management
# --------------------------------------------------

@app.get("/api/incidents")
def list_incidents():
    return {
        "incidents": get_incidents()
    }


@app.post("/api/incidents", status_code=201)
def add_incident(request: CreateIncidentRequest):
    incident_id = create_incident(
        title=request.title,
        description=request.description,
        category=request.category,
        priority=request.priority,
    )

    return get_incident(incident_id)


@app.get("/api/incidents/{incident_id}")
def read_incident(incident_id: int):
    incident = get_incident(incident_id)

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found.",
        )

    return incident


@app.patch("/api/incidents/{incident_id}")
def edit_incident(
    incident_id: int,
    request: UpdateIncidentRequest,
):
    updated = update_incident(
        incident_id,
        request.status,
        request.priority,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Incident not found.",
        )

    return get_incident(incident_id)


# --------------------------------------------------
# AI analysis error handling
# --------------------------------------------------

async def run_ai_analysis(description: str) -> str:
    provider = get_ai_provider()

    try:
        answer = await analyse_incident(description)

        if not answer:
            logger.error(
                "AI provider %s returned an empty response",
                provider
            )

            raise HTTPException(
                status_code=502,
                detail="AI provider returned an empty response.",
            )

        return answer

    except httpx.ConnectError:
        logger.exception(
            "Cannot connect to AI provider: %s",
            provider
        )

        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to AI provider: {provider}.",
        )

    except httpx.TimeoutException:
        logger.exception(
            "AI provider request timed out: %s",
            provider
        )

        raise HTTPException(
            status_code=504,
            detail=f"AI provider {provider} took too long to respond.",
        )

    except httpx.HTTPStatusError as exc:
        logger.error(
            "AI provider %s returned HTTP %s: %s",
            provider,
            exc.response.status_code,
            exc.response.text[:500],
        )

        raise HTTPException(
            status_code=502,
            detail=(
                f"AI provider {provider} returned HTTP "
                f"{exc.response.status_code}."
            ),
        )

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "AI analysis failed using provider: %s",
            provider
        )

        raise HTTPException(
            status_code=500,
            detail="AI analysis failed.",
        )


# --------------------------------------------------
# Analyse a new incident
# --------------------------------------------------

@app.post("/api/analyse")
async def analyse(request: IncidentRequest):
    answer = await run_ai_analysis(
        request.description
    )

    return {
        "status": "success",
        "answer": answer,
    }


# --------------------------------------------------
# Analyse a saved incident
# --------------------------------------------------

@app.post("/api/incidents/{incident_id}/analyse")
async def analyse_saved_incident(incident_id: int):
    incident = get_incident(incident_id)

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found.",
        )

    answer = await run_ai_analysis(
        incident["description"]
    )

    save_ai_analysis(
        incident_id,
        answer,
    )

    return {
        "status": "success",
        "incident_id": incident_id,
        "answer": answer,
    }
