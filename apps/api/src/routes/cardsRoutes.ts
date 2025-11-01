import { Router, Request, Response } from 'express';
import { AlteredApiService } from '../services/alteredApiService';
import { CardAnalyzer } from '../services/cardAnalyzer';
import { CsvExporter, JsonExporter, TextExporter } from '../utils/exporters';

export function createCardsRouter(apiService: AlteredApiService): Router {
  const router = Router();
  const analyzer = new CardAnalyzer();

  router.get('/all', async (req: Request, res: Response) => {
    try {
      const locale = (req.query.locale as string) || 'fr-fr';
      const cards = await apiService.getAllCards(locale);
      res.json({ success: true, data: cards, count: cards.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/missing', async (req: Request, res: Response) => {
    try {
      const locale = (req.query.locale as string) || 'fr-fr';
      const cards = await apiService.getAllCards(locale);
      const missingCards = analyzer.analyzeMissingCards(cards);
      const statistics = analyzer.getStatistics(missingCards);

      res.json({
        success: true,
        data: missingCards,
        statistics,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/missing/export', async (req: Request, res: Response) => {
    try {
      const locale = (req.query.locale as string) || 'fr-fr';
      const format = (req.query.format as string) || 'json';

      console.log(`[/missing/export] Starting export request - locale: ${locale}, format: ${format}`);

      let cards;
      try {
        cards = await apiService.getAllCards(locale);
        console.log(`[/missing/export] Retrieved ${cards.length} cards`);
      } catch (fetchError: any) {
        console.error(`[/missing/export] Failed to fetch cards:`, fetchError);
        return res.status(500).json({
          success: false,
          error: `Failed to fetch cards: ${fetchError.message}`,
          details: fetchError.response?.data
        });
      }

      const missingCards = analyzer.analyzeMissingCards(cards);
      console.log(`[/missing/export] Found ${missingCards.length} missing cards`);

      let content: string;
      let contentType: string;
      let filename: string;

      try {
        switch (format.toLowerCase()) {
          case 'csv':
            content = CsvExporter.export(missingCards);
            contentType = 'text/csv';
            filename = 'missing_cards.csv';
            break;
          case 'txt':
            content = TextExporter.export(missingCards);
            contentType = 'text/plain';
            filename = 'missing_cards.txt';
            break;
          case 'json':
          default:
            content = JsonExporter.export(missingCards);
            contentType = 'application/json';
            filename = 'missing_cards.json';
            break;
        }
      } catch (exportError: any) {
        console.error(`[/missing/export] Failed to export:`, exportError);
        return res.status(500).json({
          success: false,
          error: `Failed to export: ${exportError.message}`
        });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
      console.log(`[/missing/export] Export completed successfully`);
    } catch (error: any) {
      console.error(`[/missing/export] Unexpected error:`, error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
      }
    }
  });

  router.get('/filters', async (req: Request, res: Response) => {
    try {
      const locale = (req.query.locale as string) || 'fr-fr';
      const filterData = await apiService.getFilterData(locale);
      res.json({ success: true, data: filterData });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/cache/clear', async (req: Request, res: Response) => {
    try {
      const { endpoint, locale } = req.body;
      apiService.clearCache(endpoint, locale);
      res.json({ success: true, message: 'Cache cleared successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.get('/debug/raw', async (req: Request, res: Response) => {
    try {
      const locale = (req.query.locale as string) || 'fr-fr';
      const result = await apiService.getCards({
        collection: true,
        itemsPerPage: 5,
        page: 1,
        locale,
      });
      res.json({ success: true, rawResponse: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
  });

  return router;
}