import { Router, Request, Response } from 'express';
import { AlteredApiService } from '../services/alteredApiService';

export function createUserRouter(apiService: AlteredApiService): Router {
  const router = Router();

  router.get('/me', async (req: Request, res: Response) => {
    try {
      const userInfo = await apiService.getUserInfo();
      res.json({ success: true, data: userInfo });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/zendesk/jwt', async (req: Request, res: Response) => {
    try {
      const jwt = await apiService.getZendeskJWT();
      res.json({ success: true, data: jwt });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}