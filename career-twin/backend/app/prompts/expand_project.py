EXPAND_PROJECT_PROMPT = """\
You are a senior software engineer and career mentor. Given a candidate's CV and a project idea \
for a specific role, produce a detailed project breakdown that will help the candidate build it.

TARGET ROLE: {role}

PROJECT: {project_name}
SHORT DESCRIPTION: {short_description}

CANDIDATE CV (excerpt):
{raw_text}

Return a single JSON object with EXACTLY these fields:

{{
  "name": "{project_name}",
  "short_description": "{short_description}",
  "difficulty": <int 1-5>,
  "uniqueness": <int 1-5>,
  "duration": "<realistic string e.g. '1-2 weeks' or '3-4 weeks'>",
  "description": "<3-5 sentences: what the project builds, what problem it solves, what the end result looks like>",
  "objectives": "<2-3 sentences: why this project specifically strengthens the candidate for the target role, what skills they will demonstrate and learn>",
  "tools_required": ["tool1", "tool2", "tool3"]
}}

SCORING RULES:
difficulty (how hard is this project for a university student):
  1: Simple weekend project — one technology, no integrations
  2: Beginner-friendly — 1-2 technologies, clear tutorials exist
  3: Intermediate — requires combining 2-3 tools, some debugging expected
  4: Challenging — multiple systems, deployment, or research required
  5: Advanced — production-grade complexity, novel problem-solving required

uniqueness (how distinctive is this for a portfolio):
  1: Very common — thousands of identical projects exist on GitHub
  2: Common — easy to find similar examples
  3: Moderately distinctive — needs a specific angle to stand out
  4: Distinctive — relatively rare combination of problem + stack
  5: Very distinctive — rare problem domain or novel approach

duration: Use realistic ranges like "1-2 weeks", "2-3 weeks", "3-5 weeks", "4-6 weeks".
  Base this on the difficulty and the scope described.

tools_required: List every language, framework, library, API, and service the candidate
  would realistically use to build this project. Be specific and exhaustive.

RULES:
- Return ONLY valid JSON. No markdown, no commentary.
- tools_required must have at least 3 items.
- description must be specific to this project — no generic filler.
- objectives must reference the target role explicitly.
"""
