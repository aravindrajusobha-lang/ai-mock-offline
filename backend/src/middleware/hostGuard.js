import { Request, Response, NextFunction } from 'express';

export function hostGuard(req, res, next) {
  const host = req.headers.host?.split(':')[0];
  const allowed = ['localhost', '127.0.0.1', '::1'];
  const config = req.app.get('config') || {};
  const allowLan = config.allowLan;
  if (allowed.includes(host) || allowLan) {
    return next();
  }
  res.status(421).json({ error: { code: 'INVALID_HOST', message: 'Host must be localhost or 127.0.0.1' } });
}
