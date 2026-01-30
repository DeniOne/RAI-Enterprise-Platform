# RAI Project (MatrixGin Extension)

> [!CAUTION]
> **ARCHITECTURE LEVEL: DOMAIN OVERLAY**

This project is an extension of MatrixGin (Business OS) for Agri-Business (Rapeseed Consulting).

## 1. Core Principles
- **MG Core is Immutable**: We do not touch `mg-core`. It is a read-only kernel.
- **RAI is Domain Overlay**: All business logic specific to Agri resides in `domain-rai`.
- **Telegram is Interface**: The bot is a dumb terminal; logic is in domain.
- **AI is Advisory**: AI suggests; Human decides.
- **Human is Final Decision Maker**: All critical actions require human confirmation.

## 2. Directory Structure
- `mg-core/`: The frozen MatrixGin kernel (Backend + DB).
- `adapters/`: The bridge between RAI and MG Core.
- `domain-rai/`: The heart of the Agri-logic.
- `telegram/`: The conversational interface.
- `docs/`: Documentation (including MG Canon).

## 3. How to Start
1. Copy `.env.example` to `.env`
2. Run `docker-compose up`
