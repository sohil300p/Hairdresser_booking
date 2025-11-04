import { Request, Response } from 'express';
import multer from 'multer';
import {
  uploadFileService,
  downloadFileService,
  getFileMetadataService,
  deleteFileService,
  listFilesService,
} from './files.service';

// Configure multer for memory storage (files will be stored in memory as Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types (you can add validation here)
    cb(null, true);
  },
});

/**
 * Upload file controller
 * POST /api/files/upload
 */
export async function uploadFileController(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    const folder = req.body.folder || req.query.folder as string | undefined;
    const result = await uploadFileService(req.file, folder);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Error in uploadFileController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Download file controller
 * GET /api/files/download/:fileName
 */
export async function downloadFileController(req: Request, res: Response): Promise<void> {
  try {
    const { fileName } = req.params;
    const folder = req.query.folder as string | undefined;

    if (!fileName) {
      res.status(400).json({
        success: false,
        message: 'File name is required',
      });
      return;
    }

    const fileBuffer = await downloadFileService(fileName, folder);

    if (!fileBuffer) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    res.send(fileBuffer);
  } catch (error) {
    console.error('Error in downloadFileController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Get file metadata controller
 * GET /api/files/metadata/:fileName
 */
export async function getFileMetadataController(req: Request, res: Response): Promise<void> {
  try {
    const { fileName } = req.params;
    const folder = req.query.folder as string | undefined;

    if (!fileName) {
      res.status(400).json({
        success: false,
        message: 'File name is required',
      });
      return;
    }

    const result = await getFileMetadataService(fileName, folder);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in getFileMetadataController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Delete file controller
 * DELETE /api/files/:fileName
 */
export async function deleteFileController(req: Request, res: Response): Promise<void> {
  try {
    const { fileName } = req.params;
    const folder = req.query.folder as string | undefined;

    if (!fileName) {
      res.status(400).json({
        success: false,
        message: 'File name is required',
      });
      return;
    }

    const result = await deleteFileService(fileName, folder);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in deleteFileController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * List files controller
 * GET /api/files/list
 */
export async function listFilesController(req: Request, res: Response): Promise<void> {
  try {
    const folder = req.query.folder as string | undefined;
    const result = await listFilesService(folder);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in listFilesController:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

// Export multer middleware for use in routes
export { upload };

