# Agentic Task Runner

A small full-stack task runner for coding challenge. A React UI sends plain-language tasks to an Express API. A deterministic agent scores registered tools, executes the best match, persists the result, and returns an inspectable execution trace.

## Run locally

Requires Node.js 20+.
```bash
npm install
npm start
```

Open [http://localhost:5173](http://localhost:5173). 
The API is available at `http://localhost:3001`; use `npm test` for backend unit tests and `npm run build` for type/build checks.


## Included capabilities

- `TextProcessorTool`: uppercase, lowercase, capitalize, reverse, and word count.
- `CalculatorTool`: safe simple two-operand arithmetic; it does not use `eval`.
- `WeatherMockTool`: deterministic mock city conditions with no external API dependency.
- Transparent trace, JSON-file history, loading/error states, and trace inspection from current results or history.

## Assumptions and trade-offs

The task runner is single-user and local. JSON persistence is behind a repository interface, so a database can replace it later. Tool selection is rule-based and confidence-scored to keep demo behavior transparent, deterministic, and offline. The app intentionally omits authentication, Docker, real weather calls, and LLM routing.

## Time spent



## With more time

I would add multi-tool chaining, a SQLite/Postgres repository, input grammar for richer calculations, frontend tests, authentication, deployment, and an optional Azure OpenAI classification mode that falls back to the deterministic router.
