#!/bin/bash
# DOCS CONSOLIDATION SCRIPT (RAI_EP)
# Transition from Hyphens to Underscores (rename mode)

set -e

echo "🚀 Starting Documentation Topology Consolidation..."

# 1. Create Archive Legacy folder
mkdir -p docs/08_ARCHIVE/LEGACY

# 2. Main Layers Migration (Rename)
echo "📦 Migrating Main Layers..."
[ -d "docs/00-STRATEGY" ] && mv "docs/00-STRATEGY" "docs/00_STRATEGY"
[ -d "docs/01-ARCHITECTURE" ] && mv "docs/01-ARCHITECTURE" "docs/01_ARCHITECTURE"
[ -d "docs/02-DOMAINS" ] && mv "docs/02-DOMAINS" "docs/02_DOMAINS"
[ -d "docs/03-DESIGN" ] && mv "docs/03-DESIGN" "docs/03_PRODUCT"
[ -d "docs/04-ENGINEERING" ] && mv "docs/04-ENGINEERING" "docs/04_ENGINEERING"
[ -d "docs/05-PROCESSES" ] && mv "docs/05-PROCESSES" "docs/05_OPERATIONS"
[ -d "docs/05-METRICS" ] && mv "docs/05-METRICS" "docs/06_METRICS"
[ -d "docs/06-IMPLEMENTATION" ] && mv "docs/06-IMPLEMENTATION" "docs/07_EXECUTION"
[ -d "docs/07-RESEARCH_ARCHIVE" ] && mv "docs/07-RESEARCH_ARCHIVE" "docs/08_ARCHIVE"

# 3. Clean Root Pollution (Move to Legacy Archive)
echo "🧹 Cleaning Root Pollution..."
[ -d "docs/_ontology" ] && mv "docs/_ontology" "docs/08_ARCHIVE/LEGACY/_ontology"
[ -d "docs/CONSULTING" ] && mv "docs/CONSULTING" "docs/08_ARCHIVE/LEGACY/CONSULTING"
[ -d "docs/Описание Модулей" ] && mv "docs/Описание Модулей" "docs/08_ARCHIVE/LEGACY/Описание_Модулей"

# Move individual files to Archive/Legacy if they shouldn't be in root
[ -f "docs/PROJECT_MAP.md" ] && mv "docs/PROJECT_MAP.md" "docs/08_ARCHIVE/LEGACY/PROJECT_MAP_OLD.md"
[ -f "docs/README_OLD.md" ] && mv "docs/README_OLD.md" "docs/08_ARCHIVE/LEGACY/README_OLD.md"

echo "✅ Consolidation Complete!"
echo "Next: run node scripts/verify-invariants.cjs"
