import { Hono } from 'hono'
import usersGroup from './api/users'
import taskGroup from './api/tasks'
import workspaceGroup from './api/work-space'
const app = new Hono()
app.get('/', (c) => c.text('Hello Bun!'))
app.route('/api/users', usersGroup);
app.route('/api/tasks', taskGroup);
app.route('/api/workspace', workspaceGroup);
export default { 
  port: 6200, 
  fetch: app.fetch, 
} 