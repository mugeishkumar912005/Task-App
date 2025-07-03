import { Hono } from "hono";
import { db } from "../../db";
import { commentsTable } from "../../db/schema";
import { verifyToken } from "../../middleware/auth-middleware";
import { eq } from "drizzle-orm/sql/expressions/conditions";
const commentsGroup = new Hono();
commentsGroup.post("/addComment",verifyToken, async (c) => {
    try {
        const { taskId,userId,content} = await c.req.json();
        if (!taskId || !userId || !content) {
            return c.json({ Msg: "All fields are required" }, 400);
        }
        const [comments] =await db.insert(commentsTable).values({
            taskId,
            userId,
            content
        })
        .returning();
    } catch (error) {
        return c.json({ Msg: "Error adding comment" }, 500);
    }
})
commentsGroup.delete("/delete/:commentId", verifyToken, async (c) => {
    try {
        const {commentId} = c.req.param();
        if (!commentId) {
            return c.json({ Msg: "Comment ID is required" }, 400);
        }
        const comment = await db.query.commentsTable.findFirst({
            where: eq(commentsTable.commentId, commentId)
        });
        if (!comment) {
            return c.json({ Msg: "Comment not found" }, 404);
        }
        await db.delete(commentsTable).where(eq(commentsTable.commentId, commentId));
        return c.json({ Msg: "Comment deleted successfully" }, 200);
    } catch (error) {
        return c.json({ Msg: "Error deleting comment" }, 500);
    }
})
commentsGroup.patch("/update/:commentId", verifyToken, async (c) => {
    try {
        const { commentId } = c.req.param();
        const { content } = await c.req.json();
        if (!commentId || !content) {
            return c.json({ Msg: "Comment ID and content are required" }, 400);
        }
        const comment = await db.query.commentsTable.findFirst({
            where: eq(commentsTable.commentId, commentId)
        });
        if (!comment) {
            return c.json({ Msg: "Comment not found" }, 404);
        }
        const updatedComment = await db.update(commentsTable).set({ content }).where(eq(commentsTable.commentId, commentId)).returning();
        return c.json({ Msg: "Comment updated successfully", Comment: updatedComment }, 200);   
    } catch (error) {
        return c.json({ Msg: "Error updating comment" }, 500);
    }
})