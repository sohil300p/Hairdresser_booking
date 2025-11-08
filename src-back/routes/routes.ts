import { Router } from 'express';
import { healthCheck } from '../Helth/healthController';
import { sendOtpController, verifyOtpController } from '../OTP/otp.controller';
import { refreshTokenController, verifyTokenController, logoutController } from '../auth/auth.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { getProfileController } from '../Profile/profile.controller';
import { editProfileController } from '../Profile/editprofile.controller';
import { getBarbersController, getBarberByIdController } from '../Hairdresser_list/Hairdresser.controller';
import {
  uploadFileController,
  downloadFileController,
  getFileMetadataController,
  deleteFileController,
  listFilesController,
  upload,
} from '../files_minIO/files.controller';

const router = Router();

// Health Check Route
router.get('/health', healthCheck);

// OTP Routes
router.post('/otp/send', sendOtpController);
router.post('/otp/verify', verifyOtpController);

// Home page
router.get('/Hairdresser', getBarbersController);
router.get('/Hairdresser/:id', getBarberByIdController);

// Profile Routes (Protected)
router.get('/profile', authenticateToken, getProfileController);
router.put('/profile', authenticateToken, upload.single('profileImage'), editProfileController);



// Authentication Routes
router.post('/auth/refresh-token', refreshTokenController);
router.post('/auth/verify-token', verifyTokenController);
router.post('/auth/logout', logoutController);

// File Routes
router.post('/files/upload', upload.single('file'), uploadFileController);
router.get('/files/download/:fileName', downloadFileController);
router.get('/files/metadata/:fileName', getFileMetadataController);
router.delete('/files/:fileName', deleteFileController);
router.get('/files/list', listFilesController);

export default router;
