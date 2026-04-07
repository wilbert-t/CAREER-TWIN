from unittest.mock import patch, MagicMock
from app.services.retrieval import retrieve_roles, retrieve_projects, retrieve_trajectories


def test_retrieve_roles_returns_empty_when_client_unavailable():
    """If ChromaDB is unavailable, return empty string (no crash)."""
    with patch("app.services.retrieval._get_client", return_value=None):
        result = retrieve_roles("Python developer with machine learning experience")
    assert result == ""


def test_retrieve_projects_returns_empty_when_client_unavailable():
    with patch("app.services.retrieval._get_client", return_value=None):
        result = retrieve_projects("Software Engineer")
    assert result == ""


def test_retrieve_trajectories_returns_empty_when_client_unavailable():
    with patch("app.services.retrieval._get_client", return_value=None):
        result = retrieve_trajectories("junior engineer")
    assert result == ""


def test_retrieve_roles_returns_empty_when_embedding_fn_unavailable():
    """Even with a client, if embeddings fail we return empty string."""
    mock_client = MagicMock()
    with patch("app.services.retrieval._get_client", return_value=mock_client), \
         patch("app.services.retrieval._embedding_fn", return_value=None):
        result = retrieve_roles("data analyst")
    assert result == ""


def test_retrieve_projects_returns_empty_when_embedding_fn_unavailable():
    """Even with a client, if embeddings fail we return empty string."""
    mock_client = MagicMock()
    with patch("app.services.retrieval._get_client", return_value=mock_client), \
         patch("app.services.retrieval._embedding_fn", return_value=None):
        result = retrieve_projects("Software Engineer")
    assert result == ""


def test_retrieve_trajectories_returns_empty_when_embedding_fn_unavailable():
    """Even with a client, if embeddings fail we return empty string."""
    mock_client = MagicMock()
    with patch("app.services.retrieval._get_client", return_value=mock_client), \
         patch("app.services.retrieval._embedding_fn", return_value=None):
        result = retrieve_trajectories("junior engineer")
    assert result == ""
