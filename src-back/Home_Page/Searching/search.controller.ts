import { Request, Response } from 'express';
import { searchService } from './search.service';
import { SearchRequest } from './search.type';

export async function searchController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const params: SearchRequest = {
      query: req.query.query as string,
      lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
      radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    };

    if (!params.query) {
      res.status(400).json({
        success: false,
        message: 'عبارت جستجو الزامی است',
      });
      return;
    }

    const result = await searchService(params);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in searchController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

