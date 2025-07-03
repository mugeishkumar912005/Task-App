import { Hono } from "hono";
import { db } from "../../db/index";
import { taskTable, workSpaceMembersTable } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../../middleware/auth-middleware";

const taskGroup = new Hono();
taskGroup.post("/add", verifyToken, async (c) => {
  const { title, description, status, workspaceId } = await c.req.json();
  const userId = c.get("jwtPayload")?.id;
  if (!title || !description || !status || !workspaceId)
    return c.json({ Msg: "All fields are required" }, 400);
    const isMember = await db.query.workSpaceMembersTable.findFirst({
    where: and(eq(workSpaceMembersTable.workspaceId, workspaceId),eq(workSpaceMembersTable.userId, userId)),
  });
  if (!isMember) return c.json({ Msg: "You are not a member of this workspace" }, 403);
  const [task] = await db.insert(taskTable).values({
    title,
    description,
    status,
    workspaceId,
    userId,
  }).returning();

  return c.json({ Msg: "Task added successfully", Task: task }, 201);
});
taskGroup.get("/find/workspace/:workspaceId", verifyToken, async (c) => {
  const { workspaceId } = c.req.param();
  const userId = c.get("jwtPayload")?.id;

  const isMember = await db.query.workSpaceMembersTable.findFirst({
    where: and(eq(workSpaceMembersTable.workspaceId, workspaceId),eq(workSpaceMembersTable.userId, userId)
    ),
  });
  if (!isMember) return c.json({ Msg: "You are not a member of this workspace" }, 403);

  const tasks = await db.query.taskTable.findMany({
    where: eq(taskTable.workspaceId, workspaceId),
    with: { comments: true }
  });

  return c.json({ Msg: "Tasks fetched", Tasks: tasks });
});
taskGroup.patch("/update/:taskId", verifyToken, async (c) => {
  const { taskId } = c.req.param();
  const { title, description, status } = await c.req.json();
  const userId = c.get("jwtPayload")?.id;

  const task = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, taskId),
  });

  if (!task) return c.json({ Msg: "Task not found" }, 404);
  if (task.userId !== userId) return c.json({ Msg: "You didn't create this task" }, 403);

  const updatedTask = {
    title: title || task.title,
    description: description || task.description,
    status: status || task.status,
  };

  await db.update(taskTable).set(updatedTask).where(eq(taskTable.id, taskId));
  return c.json({ Msg: "Task updated successfully" });
});
taskGroup.delete("/delete/:taskId", verifyToken, async (c) => {
  const { taskId } = c.req.param();
  const userId = c.get("jwtPayload")?.id;

  const task = await db.query.taskTable.findFirst({
    where: eq(taskTable.id, taskId),
  });

  if (!task) return c.json({ Msg: "Task not found" }, 404);
  if (task.userId !== userId) return c.json({ Msg: "You didn't create this task" }, 403);

  await db.delete(taskTable).where(eq(taskTable.id, taskId));
  return c.json({ Msg: "Task deleted successfully" });
});
export default taskGroup;
