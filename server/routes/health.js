import express from 'express';

export const createHealthRouter = () => {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
};
