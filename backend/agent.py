
import os
import httpx
from dotenv import load_dotenv

load_dotenv(".env")

OLLAMA_URL = os.getenv(
    "OLLAMA_BASE_URL",
    "http://127.0.0.1:11434"
)

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "llama3.2:3b"
)

SYSTEM_PROMPT = """
You are ITOps AI, an intelligent IT support assistant.

You specialise in:
- SharePoint Online
- Microsoft 365
- Microsoft Teams
- Microsoft Entra ID
- ServiceNow incident management
- General IT troubleshooting

When analysing an incident:
1. Summarise the issue.
2. Identify possible root causes.
3. Provide step-by-step troubleshooting instructions.
4. Suggest when escalation is required.
5. Draft a professional ServiceNow ticket update.

Do not claim that you have performed actions
or resolved incidents.
Never ask for passwords or MFA codes.
"""


async def analyse_incident(description: str) -> str:
    async with httpx.AsyncClient(timeout=180.0) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT
                    },
                    {
                        "role": "user",
                        "content": description
                    }
                ],
                "stream": False
            }
        )

        response.raise_for_status()

        data = response.json()
        return data["message"]["content"]
