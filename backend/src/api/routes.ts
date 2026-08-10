import { randomUUID } from "node:crypto";
import { Router } from "express";
import type { AgentController } from "../agent/agentController.js";
import type { ToolRegistry } from "../agent/toolRegistry.js";
import type { TaskRepository } from "../storage/taskRepository.interface.js";
import type { ExecutionStep, TaskRecord } from "../types/task.js";

type Role = "user" | "admin";
interface PendingTask { input: string; ownerId: string; }
const roleOf = (headers: Record<string, unknown>): Role => headers["x-role"] === "admin" ? "admin" : "user";
const ownerOf = (headers: Record<string, unknown>) => typeof headers["x-client-id"] === "string" && headers["x-client-id"].trim() ? headers["x-client-id"] : "local-user";

export const createRouter = (agent: AgentController, repository: TaskRepository, registry: ToolRegistry): Router => {
  const router = Router();
  const pending = new Map<string, PendingTask>();
  router.post("/tasks", (req, res) => {
    const input = req.body?.input;
    if (typeof input !== "string" || !input.trim()) return res.status(400).json({ error: "'input' must be a non-empty string." });
    const id = `task_${randomUUID()}`;
    pending.set(id, { input: input.trim(), ownerId: ownerOf(req.headers) });
    return res.status(202).json({ id, status: "pending" });
  });
  router.get("/tasks/:id/stream", async (req, res, next) => {
    const job = pending.get(req.params.id);
    if (!job) return res.status(404).json({ error: "Pending task not found. Start a task before opening its stream." });
    const streamRole: Role = req.query.role === "admin" ? "admin" : roleOf(req.headers);
    const streamOwner = typeof req.query.clientId === "string" ? req.query.clientId : ownerOf(req.headers);
    if (streamRole !== "admin" && job.ownerId !== streamOwner) return res.status(403).json({ error: "This task belongs to another user." });
    res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.flushHeaders();
    const emit = (event: "step" | "done", body: ExecutionStep | TaskRecord) => res.write(`${event === "done" ? "event: done\n" : ""}data: ${JSON.stringify(body)}\n\n`);
    try {
      const task = await agent.run(job.input, { id: req.params.id, ownerId: job.ownerId, onStep: step => emit("step", step), stepDelayMs: 250 });
      pending.delete(req.params.id); emit("done", task); return res.end();
    } catch (error) { return next(error); }
  });
  router.get("/tasks", async (req, res, next) => {
    try {
      const tasks = await repository.getAll();
      return res.json(roleOf(req.headers) === "admin" && req.query.scope === "all" ? tasks : tasks.filter(task => task.ownerId === ownerOf(req.headers)));
    } catch (error) { return next(error); }
  });
  router.get("/tasks/:id", async (req, res, next) => {
    try {
      const task = await repository.getById(req.params.id);
      if (!task) return res.status(404).json({ error: "Task not found." });
      if (roleOf(req.headers) !== "admin" && task.ownerId !== ownerOf(req.headers)) return res.status(403).json({ error: "This task belongs to another user." });
      return res.json(task);
    } catch (error) { return next(error); }
  });
  router.delete("/tasks/:id", async (req, res, next) => {
    if (roleOf(req.headers) !== "admin") return res.status(403).json({ error: "Admin role required." });
    try { return (await repository.delete(req.params.id)) ? res.status(204).end() : res.status(404).json({ error: "Task not found." }); } catch (error) { return next(error); }
  });
  router.get("/tools", (_req, res) => res.json(registry.getAll().map(({ name, description }) => ({ name, description, flakyMode: name === "WeatherMockTool" }))));
  return router;
};
