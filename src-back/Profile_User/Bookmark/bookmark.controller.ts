import { Response } from 'express';
import { AuthRequest } from '../../../auth/auth.middleware';
import {
  addBookmarkService,
  removeBookmarkService,
  getBookmarksService,
} from './bookmark.service';
import {
  AddBookmarkRequest,
  RemoveBookmarkRequest,
} from './bookmark.type';

/**
 * Add Bookmark Controller
 * POST /api/bookmarks
 */
export async function addBookmarkController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const data: AddBookmarkRequest = req.body;

    if (!data.barbershopId) {
      res.status(400).json({
        success: false,
        message: 'شناسه آرایشگاه الزامی است',
      });
      return;
    }

    const result = await addBookmarkService(data, req.user.id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in addBookmarkController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Remove Bookmark Controller
 * DELETE /api/bookmarks/:barbershopId
 */
export async function removeBookmarkController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const barbershopId = parseInt(req.params.barbershopId, 10);

    if (isNaN(barbershopId)) {
      res.status(400).json({
        success: false,
        message: 'شناسه آرایشگاه نامعتبر است',
      });
      return;
    }

    const data: RemoveBookmarkRequest = { barbershopId };
    const result = await removeBookmarkService(data, req.user.id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in removeBookmarkController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Get Bookmarks Controller
 * GET /api/bookmarks
 */
export async function getBookmarksController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await getBookmarksService(req.user.id, page, limit);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in getBookmarksController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

