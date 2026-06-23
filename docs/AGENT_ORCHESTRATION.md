> **[TIER ALIGNMENT: IRIS MAX COMMERCIAL LICENSE REQUIRED]**
> *This document covers core voice orchestration loops, tools, and execution pipelines protected under the $250 IRIS MAX License.*

# 🧠 Agent Orchestration

IRIS relies on **LangGraph** (protected) for complex state machine routing and agent logic.

## State Management
The agent loops through intent recognition, tool selection, and execution verification.

## Local Fallback
While Gemini 3.1 Live API is primary, IRIS can fall back to ultra-fast Groq APIs or local Hugging Face models for specific tasks.

*(Note: The exact graph structure is closed-source to protect the proprietary execution models).*

