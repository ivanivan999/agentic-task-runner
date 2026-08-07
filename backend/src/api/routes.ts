import { Router } from "express";
import type { AgentController } from "../agent/agentController.js";
import type { ToolRegistry } from "../agent/toolRegistry.js";
import type { TaskRepository } from "../storage/taskRepository.interface.js";

export const createRouter = (agent: AgentController, repository: TaskRepository, registry: ToolRegistry): Router => {
  const router = Router();
  router.post("/tasks", async (req, res, next) => {
    try {
      const input = req.body?.input;
      if (typeof input !== "string" || !input.trim()) return res.status(400).json({ error: "'input' must be a non-empty string." });
      return res.status(201).json(await agent.run(input));
    } catch (error) { return next(error); }
  });
  router.get("/tasks", async (_req, res, next) => { try { res.json(await repository.getAll()); } catch (error) { next(error); } });
  router.get("/tasks/:id", async (req, res, next) => {
    try { const task = await repository.getById(req.params.id); return task ? res.json(task) : res.status(404).json({ error: "Task not found." }); } catch (error) { return next(error); }
  });
  router.get("/tools", (_req, res) => res.json(registry.getAll().map(({ name, description }) => ({ name, description }))));
  return router;
};
