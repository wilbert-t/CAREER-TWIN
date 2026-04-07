import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# knowledge_base/ is three levels above backend/app/services/
# Structure: CAREER-TWIN/career-twin/knowledge_base/
#            CAREER-TWIN/career-twin/backend/app/services/retrieval.py
# So parents[3] from retrieval.py goes: services -> app -> backend -> career-twin
# Then we need career-twin/knowledge_base
KB_PATH = Path(__file__).resolve().parents[3] / "knowledge_base"
# ChromaDB persists inside backend/chroma_db/
CHROMA_PATH = Path(__file__).resolve().parents[2] / "chroma_db"

# Note: skills_map.jsonl exists in the knowledge base but is intentionally not indexed here.
# It is reserved for a future skill-matching feature. The three indexed collections
# (roles_tech, roles_business, project_ideas, career_trajectories) cover current prompt needs.


def _get_client():
    """Return a persistent ChromaDB client. Returns None if unavailable."""
    try:
        import chromadb
        return chromadb.PersistentClient(path=str(CHROMA_PATH))
    except Exception as e:
        logger.warning("ChromaDB unavailable: %s", e)
        return None


def _embedding_fn():
    """Return a ChromaDB-compatible sentence-transformer embedding function."""
    try:
        from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
        return SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    except Exception as e:
        logger.warning("Embedding function unavailable: %s", e)
        return None


def _ensure_indexed(client, ef, collection_name: str, jsonl_path: Path) -> Optional[object]:
    """Get or create a ChromaDB collection; index JSONL if empty."""
    try:
        coll = client.get_or_create_collection(name=collection_name, embedding_function=ef)
        if coll.count() > 0:
            return coll

        docs, ids, metas = [], [], []
        with open(jsonl_path) as f:
            for i, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue
                obj = json.loads(line)
                # Build a combined text representation from all string fields
                text_parts = [
                    obj.get("description", ""),
                    obj.get("pathway", ""),
                    obj.get("title", ""),
                    obj.get("from_role", ""),
                    obj.get("to_role", ""),
                    " ".join(str(s) for s in obj.get("skills", [])),
                ]
                text = " ".join(p for p in text_parts if p).strip()
                meta = {k: str(v) for k, v in obj.items() if isinstance(v, (str, int, float))}
                docs.append(text or collection_name)
                ids.append(f"{collection_name}_{i}")
                metas.append(meta)

        if docs:
            coll.add(documents=docs, ids=ids, metadatas=metas)
        return coll
    except Exception as e:
        logger.warning("Indexing failed for %s: %s", collection_name, e)
        return None


def retrieve_roles(profile_text: str) -> str:
    """
    Return top relevant roles as a context string for LLM prompts.
    Returns '' on any failure (ChromaDB unavailable, index missing, etc.).
    """
    client = _get_client()
    if not client:
        return ""
    ef = _embedding_fn()
    if not ef:
        return ""

    titles = []
    for filename, coll_name in [
        ("roles_tech.jsonl", "roles_tech"),
        ("roles_business.jsonl", "roles_business"),
    ]:
        path = KB_PATH / filename
        if not path.exists():
            continue
        coll = _ensure_indexed(client, ef, coll_name, path)
        if not coll:
            continue
        try:
            qr = coll.query(query_texts=[profile_text[:500]], n_results=2)
            for meta in qr["metadatas"][0]:
                t = meta.get("title", "")
                if t:
                    titles.append(t)
        except Exception as e:
            logger.warning("Query failed for %s: %s", coll_name, e)

    if not titles:
        return ""
    unique = list(dict.fromkeys(titles))  # deduplicate, preserve order
    return "Relevant roles from knowledge base: " + ", ".join(unique) + "."


def retrieve_projects(role_title: str) -> str:
    """
    Return top relevant project ideas as a context string.
    Returns '' on any failure.
    """
    client = _get_client()
    if not client:
        return ""
    ef = _embedding_fn()
    if not ef:
        return ""

    path = KB_PATH / "project_ideas.jsonl"
    if not path.exists():
        return ""

    coll = _ensure_indexed(client, ef, "project_ideas", path)
    if not coll:
        return ""

    try:
        qr = coll.query(query_texts=[role_title[:200]], n_results=3)
        titles = [m.get("title", "") for m in qr["metadatas"][0] if m.get("title")]
        if not titles:
            return ""
        return "Relevant project ideas from knowledge base: " + ", ".join(titles) + "."
    except Exception as e:
        logger.warning("Project retrieval failed: %s", e)
        return ""


def retrieve_trajectories(role_title: str) -> str:
    """
    Return relevant career trajectory context as a string.
    Returns '' on any failure.
    """
    client = _get_client()
    if not client:
        return ""
    ef = _embedding_fn()
    if not ef:
        return ""

    path = KB_PATH / "career_trajectories.jsonl"
    if not path.exists():
        return ""

    coll = _ensure_indexed(client, ef, "career_trajectories", path)
    if not coll:
        return ""

    try:
        qr = coll.query(query_texts=[role_title[:200]], n_results=2)
        pathways = []
        for m in qr["metadatas"][0]:
            fr = m.get("from_role", "")
            to = m.get("to_role", "")
            if fr and to:
                pathways.append(f"{fr} → {to}")
        if not pathways:
            return ""
        return "Relevant career pathways: " + ", ".join(pathways) + "."
    except Exception as e:
        logger.warning("Trajectory retrieval failed: %s", e)
        return ""
