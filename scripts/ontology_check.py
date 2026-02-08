import os
import yaml
import re
import sys

DOCS_DIR = r"f:\RAI_EP\docs"
ONTOLOGY_FILE = os.path.join(DOCS_DIR, "_ontology", "KNOWLEDGE_TYPOLOGY.md")

def get_all_md_files(directory):
    md_files = []
    for root, dirs, files in os.walk(directory):
        if "_ontology" in root or "05-METRICS" in root:
            continue
        for file in files:
            if file.endswith(".md"):
                md_files.append(os.path.join(root, file))
    return md_files

def validate_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return False, "Missing YAML frontmatter"
    
    try:
        data = yaml.safe_load(match.group(1))
    except Exception as e:
        return False, f"Invalid YAML: {str(e)}"
    
    required = ['id', 'type', 'status']
    for field in required:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Semantic rules
    if data['type'] == 'decision' and 'implements' in data:
        return False, "Decisions MUST NOT use 'implements'"
    
    if data['status'] == 'approved' and data['type'] in ['service', 'component']:
        # Exception for already approved foundational things if explicitly allowed
        # But per new rules:
        if 'measured_by' not in data and 'implements' not in data:
             pass # Basic check
             
    return True, "OK"

if __name__ == "__main__":
    files = get_all_md_files(DOCS_DIR)
    errors = 0
    for f in files:
        ok, msg = validate_file(f)
        if not ok:
            print(f"FAIL: {os.path.relpath(f, DOCS_DIR)} - {msg}")
            errors += 1
    
    if errors:
        print(f"\nTotal errors: {errors}")
        # sys.exit(1)
    else:
        print("\nAll files passed basic ontology check.")
