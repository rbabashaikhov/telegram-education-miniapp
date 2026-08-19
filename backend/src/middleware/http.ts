import type { Express } from 'express';
import http from 'node:http';

export default function request(
  app: Express,
  method: string,
  path: string,
  options?: { headers?: Record<string, string>; body?: unknown },
): Promise<{
  status: number;
  body: { error?: { code?: string; message?: string } | string; code?: string; data?: unknown };
}> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('No address'));
        return;
      }
      const payload = options?.body ? JSON.stringify(options.body) : undefined;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: address.port,
          path,
          method,
          headers: {
            'content-type': 'application/json',
            ...(payload ? { 'content-length': Buffer.byteLength(payload) } : {}),
            ...options?.headers,
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk as Buffer));
          res.on('end', () => {
            server.close();
            const raw = Buffer.concat(chunks).toString('utf8');
            let body: Record<string, unknown> = {};
            try {
              body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
            } catch {
              body = { error: raw };
            }
            const nested = body.error;
            const code =
              nested && typeof nested === 'object' && 'code' in nested
                ? String((nested as { code: string }).code)
                : typeof body.code === 'string'
                  ? body.code
                  : undefined;
            resolve({ status: res.statusCode || 0, body: { ...body, code } as never });
          });
        },
      );
      req.on('error', (error) => {
        server.close();
        reject(error);
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}
