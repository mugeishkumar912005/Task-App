import { Hono } from "hono";
import { db } from "../../db/index";
import {
  usersTable,
  workSpaceTable,
  workSpaceMembersTable,
  taskTable
} from "../../db/schema";
import { eq, inArray } from "drizzle-orm";
import { verifyToken } from "../../middleware/auth-middleware";

const workspaceGroup = new Hono();
workspaceGroup.post("/create", verifyToken, async (c) => {
  const { name } = await c.req.json();
  const email = c.get("jwtPayload")?.email;
  if (!email) return c.json({ Msg: "Unauthorized" }, 401);

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.email, email),
  });
  if (!user) return c.json({ Msg: "User not found" }, 404);

  const [workspace] = await db.insert(workSpaceTable).values({
    name,
    createdBy: user.id,
  }).returning();

  await db.insert(workSpaceMembersTable).values({
    workspaceId: workspace.id,
    userId: user.id,
  });

  return c.json({ Msg: "Workspace created", Workspace: workspace });
});

//Admin need to be verified using created by id and verfy token id 
workspaceGroup.post("addMember/:workspaceId/members", verifyToken, async (c) => {
  const { userId } = await c.req.json();
  const { workspaceId } = c.req.param();

  const adminId = c.get("jwtPayload")?.id;

  const workspaceCreatorId = await db.query.workSpaceTable.findFirst({
    where: eq(workSpaceTable.id,workspaceId)
  })

  if(adminId != workspaceCreatorId?.createdBy) {
    return c.json({ Msg: "You are not authorized to add members" }, 403);
  }
  await db.insert(workSpaceMembersTable).values({ workspaceId, userId });
  return c.json({ Msg: "Member added" });
});

workspaceGroup.delete("delete/:workspaceId", verifyToken, async (c) => {
  const { workspaceId } = c.req.param();
  const adminId = c.get("jwtPayload")?.id;

  const workspaceCreatorId = await db.query.workSpaceTable.findFirst({
    where: eq(workSpaceTable.id,workspaceId)
  })
  if(adminId != workspaceCreatorId?.createdBy) {
    return c.json({ Msg: "You are not authorized to delete this workspace" }, 403);
  }
  await db.delete(workSpaceTable).where(eq(workSpaceTable.id, workspaceId));
  return c.json({ Msg: "Workspace deleted" });
});

workspaceGroup.get("/my", verifyToken, async (c) => {
  const userId = c.get("jwtPayload")?.id;

  if (!userId) return c.json({ Msg: "Unauthorized" }, 401);

  const workSpaces = await db.query.workSpaceMembersTable.findMany({
    where: eq(workSpaceMembersTable.userId, userId),
    with: {
      workspace: true,
    },
  });

  return c.json({ Msg: "Workspaces fetched", workSpaces });
});
export default workspaceGroup;
