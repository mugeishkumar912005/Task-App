import { Hono } from 'hono';
import { verify } from 'hono/jwt';

import type {Context,Next}  from 'hono'


const JWT_SECRET = process.env.SECRET_KEY || '';

const verifyToken = async (c:Context,next:Next) => {
  const token = c.req.header('Authorization')?.split(' ')[1];

  console.log(token);

  if (!token) {
    return c.json({ Msg: 'Token not found, unauthorized user' }, 401);
  }

  try {
    const decoded = await verify(token, JWT_SECRET);

    console.log(decoded);
    c.set("jwtPayload",decoded);
    console.log(decoded);
    await next(); 
  } catch (error) {
    return c.json({ Msg: 'Invalid or expired token' }, 401);
  }
};

export {verifyToken};
