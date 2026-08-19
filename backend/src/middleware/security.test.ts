import { afterEach, describe, expect, it } from 'vitest';
import request from './http.js';
import { createApp } from '../app.js';
import { seedDemoWorld } from '../test/harness.js';

const originalAdmin = process.env.ADMIN_TOKEN;
const originalDemo = process.env.ALLOW_DEMO_MODE;
const originalNode = process.env.NODE_ENV;

afterEach(() => {
  process.env.ADMIN_TOKEN = originalAdmin;
  process.env.ALLOW_DEMO_MODE = originalDemo;
  process.env.NODE_ENV = originalNode;
});

describe('HTTP security', () => {
  it('rejects unauthorized admin writes', async () => {
    process.env.ADMIN_TOKEN = 'secret-admin';
    process.env.ALLOW_DEMO_MODE = 'true';
    const world = seedDemoWorld();
    const app = createApp(world.providers);
    const trial = world.providers.trials.list().find((item) => item.status === 'BOOKED')!;
    const response = await request(app, 'PATCH', `/api/admin/trials/${trial.id}`, {
      body: { status: 'ATTENDED' },
    });
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('ADMIN_UNAUTHORIZED');
  });

  it('allows admin writes with the configured token', async () => {
    process.env.ADMIN_TOKEN = 'secret-admin';
    const world = seedDemoWorld();
    const app = createApp(world.providers);
    const trial = world.providers.trials.list().find((item) => item.status === 'BOOKED')!;
    const response = await request(app, 'PATCH', `/api/admin/trials/${trial.id}`, {
      headers: { 'x-admin-token': 'secret-admin' },
      body: { status: 'ATTENDED', teacherComment: 'Была на занятии' },
    });
    expect(response.status).toBe(200);
    expect(world.providers.trials.getById(trial.id)?.status).toBe('ATTENDED');
  });

  it('does not allow /api/demo-admin to mutate', async () => {
    process.env.ALLOW_DEMO_MODE = 'true';
    process.env.FEATURE_DEMO_ADMIN_PREVIEW = 'true';
    const world = seedDemoWorld();
    const app = createApp(world.providers);
    const trial = world.providers.trials.list().find((item) => item.status === 'BOOKED')!;
    const response = await request(app, 'PATCH', `/api/demo-admin/trials/${trial.id}`, {
      body: { status: 'ATTENDED' },
    });
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('DEMO_ADMIN_READONLY');
    expect(world.providers.trials.getById(trial.id)?.status).toBe('BOOKED');
  });
});
