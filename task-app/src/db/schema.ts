import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { customAlphabet } from "nanoid";
const nanoid = (length: number = 6) =>
  customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", length)();

export const usersTable = pgTable("users", {
  id: text("id").$defaultFn(() => nanoid()).primaryKey(), 
  name: text("name").notNull(),                           
  email: text("email").notNull().unique(),               
  password: text("password").notNull(),                 
  createdAt: timestamp("created_at").defaultNow(),       
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
export const workSpaceTable = pgTable("workspaces", {
  id: text("id").$defaultFn(() => nanoid()).primaryKey(), 
  name: text("name").notNull(),                           
  createdBy: text("created_by").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),       
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()), 
});
export const workSpaceMembersTable = pgTable("workspace_members", {
  workspaceId: text("workspace_id").notNull().references(() => workSpaceTable.id, { onDelete: "cascade" }), 
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),        
  joinedAt: timestamp("joined_at").defaultNow(),                           
}, (table) => ({
  pk: primaryKey({ columns: [table.workspaceId, table.userId] })          
}));

export const taskTable = pgTable("task", {
  id: text("id").$defaultFn(() => nanoid()).primaryKey(),
  workspaceId: text("workspace_id").notNull().references(() => workSpaceTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),                            
  description: text("description").notNull(),              
  userId: text("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  status: text("status").default("pending"),          
  createdAt: timestamp("created_at").defaultNow(),           
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
export const tagTable = pgTable("tags", {
  id: text("id").$defaultFn(() => nanoid()).primaryKey(),
  name: text("name").notNull().unique(),                
});
export const taskTagTable = pgTable("task_tags", {
  taskId: text("task_id").notNull().references(() => taskTable.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tagTable.id, { onDelete: "cascade" }),  
});
export const userRelations = relations(usersTable, ({ many }) => ({
  task: many(taskTable),
  workspaces: many(workSpaceMembersTable),
}));




export const commentsTable = pgTable("comments",{
  commentId: text("id").$defaultFn(()=> nanoid(6)).primaryKey(),
  taskId: text("task_id").notNull().references(() => taskTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
})
export const taskRelations = relations(taskTable, ({ one,many }) => ({
  user: one(usersTable, {
    fields: [taskTable.userId],
    references: [usersTable.id],
  }),
  tags: many(taskTagTable),
  comments: many(commentsTable),
}));
export const commentsRelations = relations(commentsTable , ({one}) =>({
  task:one(taskTable, {
    fields: [commentsTable.taskId],
    references: [taskTable.id],
  }),
  user: one(usersTable, {
    fields: [commentsTable.userId],
    references: [usersTable.id],
  }),
}))
export const tagRelations = relations(tagTable, ({ many }) => ({
  tasks: many(taskTagTable),
}));

export const taskTagRelations = relations(taskTagTable, ({ one }) => ({
  task: one(taskTable, {
    fields: [taskTagTable.taskId],
    references: [taskTable.id],
  }),
  tag: one(tagTable, {
    fields: [taskTagTable.tagId],
    references: [tagTable.id],
  }),
}));

export const workSpaceRelations = relations(workSpaceTable, ({ many }) => ({
  members: many(workSpaceMembersTable),
  tasks: many(taskTable),
}));
