import { Hono } from "hono";
import { sign } from "hono/jwt";
import { db } from "../../db";
import { usersTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs"
import { verifyToken } from "../../middleware/auth-middleware";


const usersGroup = new Hono();

usersGroup.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ Msg: "All fields are required" }, 400);
    }

    const existingUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email)
    });

    if (!existingUser) {
      return c.json({ Msg: "User is not Registered" }, 404);
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return c.json({ Msg: "Incorrect password" }, 401);
    }

    const jwtSecret = process.env.SECRET_KEY || '';
    const token = await sign({id:existingUser.id,email:existingUser.email, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) }, jwtSecret) 

    return c.json({
      Msg: "Login Successful!",
      Token: token
    });

  } catch (error) {
    return c.json({ Msg: "Server Error", Error: String(error) }, 500);
  }
});
usersGroup.post('/register', async (c) => {
  try {
    const { name, email, password } = await c.req.json();

    console.log(name , email ,password)

    if (!name || !email || !password) {
      return c.json({ Msg: "All fields are required" }, 400);
    }

    const existingUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email)
    });

    if (existingUser) {
      return c.json({ Msg: "User already exists" }, 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.insert(usersTable).values({
      name:name,
      email:email,
      password: hashedPassword
    });

    return c.json({ Msg: "User registered successfully!" }, 201);
  } catch (error) {
    return c.json({ Msg: "Server Error", Error: String(error) }, 500);
  }
});
usersGroup.delete('/delete',verifyToken,async(c)=>{
    try{
        const email = c.get("jwtPayload")?.email;

        if(!email){
            return c.json({Msg:"Email is required"},400);
        }

        const existingUser = await db.query.usersTable.findFirst({
            where: eq(usersTable.email, email)
        });
        if(!existingUser){
            return c.json({Msg:"User not found"},404);
        }
        await db.delete(usersTable).where(eq(usersTable.email, email));
        return c.json({Msg:"User deleted successfully"},200);
    } catch (error) {
        return c.json({Msg:"Server Error",Error:String(error)},500);
    }
})
export default usersGroup;
