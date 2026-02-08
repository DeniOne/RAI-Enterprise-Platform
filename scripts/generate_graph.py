import os
import yaml
import re
import json

DOCS_DIR = r"f:\RAI_EP\docs"
OUTPUT_FILE = os.path.join(DOCS_DIR, "graph.json")

EDGE_TYPES = [
    "implements",
    "measured_by",
    "measures",
    "depends_on",
    "aligned_with"
]

def parse_md_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return None
    
    try:
        data = yaml.safe_load(match.group(1))
        # Add relative path for link back
        data['source_file'] = os.path.relpath(file_path, DOCS_DIR)
        return data
    except Exception:
        return None

def generate_graph():
    nodes = []
    links = []
    
    # First pass: Collect all nodes
    for root, dirs, files in os.walk(DOCS_DIR):
        for file in files:
            if file.endswith(".md") and not file.startswith("_"):
                file_path = os.path.join(root, file)
                node_data = parse_md_file(file_path)
                if node_data and 'id' in node_data:
                    nodes.append(node_data)
    
    # Second pass: Create links
    node_ids = {n['id'] for n in nodes}
    
    for node in nodes:
        source_id = node['id']
        for edge_type in EDGE_TYPES:
            if edge_type in node:
                targets = node[edge_type]
                if isinstance(targets, str):
                    targets = [targets]
                
                for target_id in targets:
                    # Semantic direction: Source -> Target
                    links.append({
                        "source": source_id,
                        "target": target_id,
                        "type": edge_type,
                        "source_kind": node.get('type'),
                        "exists_in_docs": target_id in node_ids
                    })

    graph = {
        "nodes": nodes,
        "links": links,
        "metadata": {
            "total_nodes": len(nodes),
            "total_links": len(links),
            "version": "1.0"
        }
    }
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)
    
    print(f"Graph generated: {len(nodes)} nodes, {len(links)} links.")

if __name__ == "__main__":
    generate_graph()
