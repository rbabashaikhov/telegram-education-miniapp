import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { demoAdminPreviewMiddleware } from '../middleware/adminAuth.js';
import type { Providers } from '../providers/types.js';
import { createDemoAdminRouter as createInner } from './admin.js';

export function createDemoAdminRouter(providers: Providers): Router {
  const router = createRouter();
  router.use(demoAdminPreviewMiddleware);
  router.use(createInner(providers));
  return router;
}
