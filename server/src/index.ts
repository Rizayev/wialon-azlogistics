import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { buildReport, getGroups, getUnits } from './report';
import { buildWorkbook } from './excel';
import {
  AuthError,
  authenticate,
  hasEnvToken,
  tokenStore,
  wialonHost,
} from './wialonClient';
import type { ReportRequest, ShowFilter } from './types';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT || 3000);

// Carry the per-request Wialon token (from the browser) in async context.
app.use('/api', (req, _res, next) => {
  const token =
    (req.header('x-wialon-token') || '').trim() ||
    (typeof req.body?.token === 'string' ? req.body.token.trim() : '');
  tokenStore.run(token, () => next());
});

function parseReq(body: any): ReportRequest {
  const unitIds = Array.isArray(body.unitIds) ? body.unitIds.map(Number).filter(Boolean) : [];
  return {
    unitIds,
    from: Number(body.from) || 0,
    to: Number(body.to) || 0,
    show: (body.show || 'all') as ShowFilter,
    minParking: Number(body.minParking) || 0,
    minMovement: Number(body.minMovement) || 0,
  };
}

function fail(res: express.Response, e: any) {
  if (e instanceof AuthError || e?.code === 'AUTH') {
    res.status(401).json({ error: e.message, code: 'AUTH' });
  } else {
    res.status(502).json({ error: e?.message || String(e) });
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Tells the client where to send the user for login and whether a server-side
// fallback token exists (so login is optional).
app.get('/api/config', (_req, res) => {
  res.json({ host: wialonHost(), requireAuth: !hasEnvToken() });
});

// Validate a token coming back from the Wialon login redirect.
app.post('/api/auth', async (req, res) => {
  const token = (req.body?.token || '').trim();
  try {
    const info = await authenticate(token);
    res.json({ ok: true, user: info?.user?.nm, host: wialonHost() });
  } catch (e) {
    fail(res, e);
  }
});

app.get('/api/units', async (_req, res) => {
  try {
    res.json({ units: await getUnits() });
  } catch (e) {
    fail(res, e);
  }
});

app.get('/api/groups', async (_req, res) => {
  try {
    res.json({ groups: await getGroups() });
  } catch (e) {
    fail(res, e);
  }
});

app.post('/api/report', async (req, res) => {
  const r = parseReq(req.body);
  if (!r.unitIds.length) return res.status(400).json({ error: 'no units selected' });
  if (!r.from || !r.to) return res.status(400).json({ error: 'invalid interval' });
  try {
    res.json({ reports: await buildReport(r) });
  } catch (e) {
    fail(res, e);
  }
});

app.post('/api/export', async (req, res) => {
  const r = parseReq(req.body);
  const combined = req.body.viewMode === 'combined';
  if (!r.unitIds.length) return res.status(400).json({ error: 'no units selected' });
  try {
    const reports = await buildReport(r);
    const buf = await buildWorkbook(reports, combined);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename="xronologiya.xlsx"');
    res.send(buf);
  } catch (e) {
    fail(res, e);
  }
});

// Serve the built client in production (single-container deploy).
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[wialon-az] listening on :${PORT}`);
});
