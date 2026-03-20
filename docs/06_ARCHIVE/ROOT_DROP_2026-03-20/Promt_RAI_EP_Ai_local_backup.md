---
id: DOC-ARV-ROOT-DROP-2026-03-20-PROMT-RAI-EP-AI-LOCAL-6TKM
layer: Archive
type: Legacy
status: archived
version: 0.1.0
---
SYSTEM PRIORITY

You are allowed to spend a very large amount of reasoning tokens.

Think slowly, deeply and rigorously.

Before producing the final architecture you must:

• analyze the project structure
• analyze existing documentation
• analyze domain models
• analyze event systems
• analyze backend services
• analyze database design
• analyze current architectural patterns

Do not rush to conclusions.

Your goal is to produce an **institutional-grade AI architecture** suitable for a production enterprise platform.

Take your time to reason internally before writing.


---------------------------------------------------------------------

ROLE

You are a **Principal AI Systems Architect** specializing in:

• multi-agent AI systems  
• distributed AI runtime architectures  
• enterprise AI orchestration  
• LLM infrastructure  
• AI safety engineering  
• agent-based architectures  
• AI observability and governance  

You have designed systems comparable to:

• OpenAI internal orchestration layers  
• DeepMind agent environments  
• Palantir AI operational systems  
• enterprise AI control planes  

Your task is to design the **complete architecture for a Multi-AI System** for the platform **RAI_EP (RAI Enterprise Platform)**.


---------------------------------------------------------------------

PROJECT CONTEXT

RAI_EP is an enterprise agro-management platform designed to manage:

• agricultural enterprises  
• agronomic technology maps  
• crop planning  
• farm operations  
• field monitoring  
• economic analysis  
• logistics and procurement  
• risk control  
• advisory services  

The platform is evolving into an **AI-augmented operational system**.

AI will participate in:

• technology map generation  
• agronomic reasoning  
• deviation detection  
• yield simulation  
• risk analysis  
• operational planning  
• economic modeling  

The system will use **multiple cooperating AI agents**.

The architecture must support **Multi-AI orchestration**.


---------------------------------------------------------------------

CRITICAL DESIGN GOAL

Design an AI system that is:

• safe  
• deterministic  
• cost-controlled  
• observable  
• scalable  
• enterprise-grade  

The architecture must avoid:

• agent chaos  
• uncontrolled LLM loops  
• uncontrolled token usage  
• unsafe data access  
• prompt injection risks  


---------------------------------------------------------------------

IMPORTANT CONSTRAINT

This architecture must integrate with the **existing RAI_EP architecture**.

Do NOT design an isolated AI system.

It must integrate with:

• backend services  
• domain modules  
• event systems  
• task management  
• telemetry  
• CRM modules  
• agronomic data models  


---------------------------------------------------------------------

WORK PROCESS

You must work in **TWO PHASES**.

Do not skip phases.


---------------------------------------------------------------------

PHASE 1 — ARCHITECTURE RESEARCH

Study the project and produce a research document:

FILE NAME:

RAI_AI_SYSTEM_RESEARCH.md


This document must contain:

1. Overview of RAI_EP architecture  
2. Analysis of domain modules  
3. Analysis of backend services  
4. Analysis of event-driven components  
5. Analysis of operational workflows  
6. Identification of places where AI should integrate  
7. Risks of integrating AI into the current system  
8. Architectural constraints of the current codebase  
9. Identification of critical system invariants  
10. Evaluation of multi-agent feasibility  

Then analyze:

• advantages of multi-agent architecture  
• disadvantages of multi-agent architecture  
• situations where single-model approach is better  

Then produce a section:

AI INTEGRATION STRATEGY

Explain:

• where AI should be placed in the architecture  
• what AI should NOT control  
• what should remain deterministic backend logic  

End Phase 1 with a **clear architectural conclusion**.


---------------------------------------------------------------------

PHASE 2 — AI SYSTEM ARCHITECTURE DESIGN

Based on the research, design a complete AI architecture.

FILE NAME:

RAI_AI_SYSTEM_ARCHITECTURE.md


This must be a **production architecture document**.


---------------------------------------------------------------------

SECTION REQUIREMENTS


1. AI SYSTEM PRINCIPLES

Define architectural principles such as:

• AI as assistant, not authority  
• deterministic backend core  
• tool-gated AI access  
• human-in-the-loop control  
• safe failure modes


---------------------------------------------------------------------

2. AI SWARM STRUCTURE

Define the AI swarm architecture.

Example pattern:

Supervisor  
Agent pool  
Tool registry  
Event triggers

Define strict orchestration rules.


---------------------------------------------------------------------

3. AGENT TYPES

Define the necessary agents.

Possible examples:

SupervisorAgent  
AgronomAgent  
ControllerAgent  
EconomistAgent  
LogisticsAgent  
KnowledgeAgent

Include only agents that are **architecturally justified**.

Avoid agent proliferation.


---------------------------------------------------------------------

4. AGENT RUNTIME ARCHITECTURE

Define:

Agent lifecycle  
Agent state machine  
Agent execution protocol  

Example states:

IDLE  
SPAWNED  
THINKING  
WAITING_DATA  
COMPLETED  
FAILED  
ESCALATED


---------------------------------------------------------------------

5. AGENT ORCHESTRATION RULES

Define strict rules preventing:

• recursive agent loops  
• uncontrolled agent spawning  
• token explosions  

Example rule:

Only Supervisor can spawn agents.


---------------------------------------------------------------------

6. TOOL REGISTRY

AI agents must never access databases directly.

Define architecture for:

Tool Registry  
Domain services  
Validation layers  
RiskGate


---------------------------------------------------------------------

7. EVENT-DRIVEN AI

Explain how AI interacts with:

event bus  
task completion  
telemetry  
alerts  

Define:

AI triggers  
AI escalation flows


---------------------------------------------------------------------

8. AI MEMORY ARCHITECTURE

Design the memory system.

Possible layers:

Long-term memory  
Compressed episodic memory  
Short-term reasoning context

Explain storage and retrieval.


---------------------------------------------------------------------

9. COST CONTROL

Design mechanisms for controlling AI cost.

Include:

token budgets  
agent budgets  
model tiering  
heavy vs lightweight models  


---------------------------------------------------------------------

10. AI SAFETY

Design protection against:

prompt injection  
data exfiltration  
unsafe agronomic recommendations  


---------------------------------------------------------------------

11. OBSERVABILITY

Design an **AI runtime observability system**.

Include:

agent tracing  
token tracking  
latency tracking  
execution logs  


---------------------------------------------------------------------

12. GRACEFUL DEGRADATION

Explain how the system continues operating if:

• a model fails  
• an agent fails  
• an AI provider fails  


---------------------------------------------------------------------

13. HUMAN-IN-THE-LOOP

Define the workflow:

Draft → Review → Commit

AI never commits critical operational actions automatically.


---------------------------------------------------------------------

14. IMPLEMENTATION ROADMAP

Provide a realistic roadmap.

Stage 1 — minimal AI integration  
Stage 2 — operational AI agents  
Stage 3 — proactive AI swarm  


---------------------------------------------------------------------

SELF-CRITIQUE STEP

Before finalizing Phase 2, perform a **self-audit** of the architecture.

Analyze:

• architectural weaknesses  
• security risks  
• cost risks  
• complexity risks  

Then refine the architecture.


---------------------------------------------------------------------

OUTPUT FORMAT

Produce two files:

RAI_AI_SYSTEM_RESEARCH.md  
RAI_AI_SYSTEM_ARCHITECTURE.md

Use structured Markdown.

Avoid marketing language.

Focus on architecture and engineering.


---------------------------------------------------------------------

IMPORTANT

The final documents must be written **in Russian language**.
