import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import * as z from "zod/v4";
import { loadAzureLabConfig } from "../azure/config.js";
import { AzureEmbeddingClient } from "../azure/embeddingClient.js";
import { AzureLessonSearchClient } from "../azure/searchClient.js";
import { createIngestionRequested } from "../kafka/events.js";
import { LessonEventPublisher } from "../kafka/lessonPublisher.js";
import { JobStatusStore } from "./jobStatusStore.js";
import { IngestionStatusMonitor } from "./statusMonitor.js";

const config = loadAzureLabConfig();
const embeddings = new AzureEmbeddingClient(config);
const search = new AzureLessonSearchClient(config);
const publisher = new LessonEventPublisher();
const statuses = new JobStatusStore();
const monitor = new IngestionStatusMonitor(statuses);

const jsonText = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

const createServer = () => {
  const server = new McpServer({ name: "french-study-lab", version: "1.0.0" });

  server.registerTool("ingest_lesson", {
    description: "Queue one Assimil French lesson for vector indexing.",
    inputSchema: { lesson: z.number().int().min(1).max(100) },
  }, async ({ lesson }) => {
    const event = createIngestionRequested(lesson);
    statuses.apply(event);
    await publisher.publish(event);
    return jsonText({ jobId: event.jobId, lesson, status: "requested" });
  });

  server.registerTool("get_ingestion_status", {
    description: "Check an ingestion job observed by this MCP server instance.",
    inputSchema: { jobId: z.string().min(1) },
  }, async ({ jobId }) => jsonText(statuses.get(jobId) ?? {
    jobId,
    status: "unknown",
    note: "Statuses are kept in memory for this disposable lab.",
  }));

  server.registerTool("search_lessons", {
    description: "Hybrid keyword and vector search over indexed French lesson text.",
    inputSchema: {
      query: z.string().min(1),
      lesson: z.number().int().min(1).max(100).optional(),
      top: z.number().int().min(1).max(10).default(5),
    },
  }, async ({ query, lesson, top }) => {
    const [vector] = await embeddings.embed([query]);
    if (!vector) throw new Error("The embedding service returned no vector.");
    return jsonText({ query, lesson: lesson ?? null, results: await search.hybridSearch(query, vector, lesson, top) });
  });

  return server;
};

const app = createMcpExpressApp();
app.get("/health", (_req, res) => res.json({ ok: true, service: "french-study-mcp" }));
app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => { void transport.close(); void server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request failed", error);
    if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
  }
});
app.get("/mcp", (_req, res) => res.status(405).json({ error: "Use POST /mcp." }));
app.delete("/mcp", (_req, res) => res.status(405).json({ error: "Stateless MCP has no session to delete." }));

const port = Number(process.env.MCP_PORT ?? 3001);
await monitor.start();
const httpServer = app.listen(port, () => console.log(`French study MCP listening on http://localhost:${port}/mcp`));

let stopping = false;
const shutdown = async () => {
  if (stopping) return;
  stopping = true;
  httpServer.close();
  await monitor.stop();
  await publisher.disconnect();
};
process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
