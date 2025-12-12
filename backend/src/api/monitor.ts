import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { MonitoredDomainsService } from '../services/monitored_domains';

const app = new OpenAPIHono();
const service = new MonitoredDomainsService();

// Schemas
const MonitoredDomainSchema = z.object({
  id: z.string(),
  domain: z.string(),
  is_active: z.boolean(),
  last_scanned_at: z.string().nullable(),
  scan_interval_minutes: z.number(),
});

const AddMonitorRequest = z.object({
  domain: z.string().min(1),
});

// Routes
const listRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.array(MonitoredDomainSchema),
        },
      },
      description: 'List monitored domains',
    },
  },
});

const addRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AddMonitorRequest,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: MonitoredDomainSchema,
        },
      },
      description: 'Added domain',
    },
  },
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/',
  request: {
    query: z.object({ domain: z.string() }),
  },
  responses: {
    200: { description: 'Deleted' },
  },
});

app.openapi(listRoute, async (c) => {
  const list = await service.listDomains();
  return c.json(list as any); // Cast to any to avoid strict type mismatch with nullable vs optional
});

app.openapi(addRoute, async (c) => {
  const { domain } = c.req.valid('json');
  const res = await service.addDomain(domain);
  return c.json(res as any);
});

app.openapi(deleteRoute, async (c) => {
  const { domain } = c.req.valid('query');
  await service.removeDomain(domain);
  return c.json({ success: true });
});

export default app;
