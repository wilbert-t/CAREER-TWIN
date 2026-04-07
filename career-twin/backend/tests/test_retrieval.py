from unittest.mock import patch
from app.services.retrieval import retrieve_roles, retrieve_projects, retrieve_trajectories


def test_retrieve_roles_returns_str_when_client_unavailable():
    """If ChromaDB is unavailable, return empty string (no crash)."""
    with patch("app.services.retrieval._get_client", return_value=None):
        result = retrieve_roles("Python developer with machine learning experience")
    assert isinstance(result, str)


def test_retrieve_projects_returns_str_when_client_unavailable():
    with patch("app.services.retrieval._get_client", return_value=None):
        result = retrieve_projects("Software Engineer")
    assert isinstance(result, str)


def test_retrieve_trajectories_returns_str_when_client_unavailable():
    with patch("app.services.retrieval._get_client", return_value=None):
        result = retrieve_trajectories("junior engineer")
    assert isinstance(result, str)


def test_retrieve_roles_returns_str_when_embedding_fn_unavailable():
    """Even with a client, if embeddings fail we return empty string."""
    import chromadb
    client = chromadb.Client()  # in-memory, no persistence
    with patch("app.services.retrieval._get_client", return_value=client), \
         patch("app.services.retrieval._embedding_fn", return_value=None):
        result = retrieve_roles("data analyst")
    assert isinstance(result, str)
