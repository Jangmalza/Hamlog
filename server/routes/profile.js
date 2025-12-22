import express from 'express';

export const createProfileRouter = ({ readProfile, writeProfile, mergeProfile }) => {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    try {
      const profile = await readProfile();
      res.json({ profile });
    } catch (error) {
      console.error('Failed to fetch profile', error);
      res.status(500).json({ message: '프로필을 불러오지 못했습니다.' });
    }
  });

  router.put('/', async (req, res) => {
    try {
      const profile = await readProfile();
      const next = mergeProfile(profile, req.body ?? {});
      const saved = await writeProfile(next);
      res.json({ profile: saved });
    } catch (error) {
      console.error('Failed to update profile', error);
      res.status(500).json({ message: '프로필 저장에 실패했습니다.' });
    }
  });

  return router;
};
