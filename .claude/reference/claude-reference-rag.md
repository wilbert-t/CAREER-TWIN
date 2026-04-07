# Parallel Futures - RAG Reference

## Goal
Use RAG only to improve the quality and grounding of career paths, required skills, project recommendations, and trajectories. Do not turn RAG into a separate agent system. [file:1]

---

## Knowledge base files
Store as JSON or JSONL only:
- `roles_tech.jsonl`
- `roles_business.jsonl`
- `skills_map.jsonl`
- `project_ideas.jsonl`
- `career_trajectories.jsonl`

This follows the planned knowledge base: business roles, tech roles, skill maps, sample project ideas, and career trajectories. [file:1]

---

## Retrieval targets

### For path generation
Retrieve:
- Relevant roles
- Required skills
- Differentiator skills
- Common student gaps
- Career trajectory patterns

### For project generation
Retrieve:
- Matching project examples
- Pain point category
- Technical depth
- Uniqueness level
- Build duration estimate
- Path relevance

---

## Embeddings
- Use Sentence Transformers
- Keep embedding pipeline simple and local
- Use ChromaDB as local vector store [file:1]

---

## Retrieval strategy
1. Analyze profile first.
2. Map profile to likely domains.
3. Retrieve top relevant roles from tech and business role sets.
4. Retrieve relevant project patterns for each selected path.
5. Feed only top context slices into the prompt.
6. Keep context compact and structured.

---

## Chunking guidance
Prefer semantic records over arbitrary long chunks.
Good chunks:
- One role profile
- One project template
- One trajectory record
- One skill map record

Avoid giant mixed chunks that contain many roles or unrelated project ideas.

---

## Prompt context format
Pass retrieval context in labeled sections:
- `ROLE_CONTEXT`
- `SKILL_CONTEXT`
- `PROJECT_CONTEXT`
- `TRAJECTORY_CONTEXT`

This makes prompts easier to debug and keeps outputs more deterministic.

---

## Fallback rule
If retrieval is weak or empty:
- Return fewer but stronger results
- Do not hallucinate detailed niche requirements
- Use general path recommendations grounded in the analyzed profile

---

## Anti-bloat rule
For the MVP:
- No multi-hop retrieval
- No knowledge graph
- No heavy re-ranking stack
- No agentic retrieval loop
- No overbuilt memory layer

Keep the RAG believable, fast, and easy to demo. [file:1]
