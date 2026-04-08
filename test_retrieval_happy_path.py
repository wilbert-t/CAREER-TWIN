#!/usr/bin/env python
"""
Happy path test: verify retrieval functions work end-to-end with real JSONL files.
"""
import sys
sys.path.insert(0, '/Users/wilbert/Documents/GitHub/CAREER-TWIN/career-twin/backend')

from app.services.retrieval import retrieve_roles, retrieve_projects, retrieve_trajectories

# Test 1: retrieve_roles with profile text
profile = "Python developer with 5 years of machine learning experience"
roles_context = retrieve_roles(profile)
print("Test 1: retrieve_roles")
print(f"  Input: {profile[:50]}...")
print(f"  Output type: {type(roles_context)}")
print(f"  Output: {roles_context[:100]}..." if roles_context else "  Output: (empty)")
print()

# Test 2: retrieve_projects with role title
role = "Software Engineer"
projects_context = retrieve_projects(role)
print("Test 2: retrieve_projects")
print(f"  Input: {role}")
print(f"  Output type: {type(projects_context)}")
print(f"  Output: {projects_context[:100]}..." if projects_context else "  Output: (empty)")
print()

# Test 3: retrieve_trajectories with role title
trajectories_context = retrieve_trajectories(role)
print("Test 3: retrieve_trajectories")
print(f"  Input: {role}")
print(f"  Output type: {type(trajectories_context)}")
print(f"  Output: {trajectories_context[:100]}..." if trajectories_context else "  Output: (empty)")
print()

# Verify types
assert isinstance(roles_context, str), "roles_context should be str"
assert isinstance(projects_context, str), "projects_context should be str"
assert isinstance(trajectories_context, str), "trajectories_context should be str"

print("✓ All happy path tests passed (all return strings)")
