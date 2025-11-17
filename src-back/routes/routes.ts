import { Router } from 'express';
import { healthCheck } from '../Helth/healthController';
import { sendOtpController, verifyOtpController } from '../OTP/otp.controller';
import { refreshTokenController, verifyTokenController, logoutController } from '../auth/auth.controller';
import { loginWithPasswordController } from '../auth/login.controller';
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
import {
  getWalletBalanceController,
  depositController,
  withdrawController,
  transferController,
  getTransactionHistoryController,
  lockFundsController,
} from '../Transaction/transaction.controller';
import {
  getAvailablePackagesController,
  purchasePackageController,
  getUserPackagesController,
} from '../Package/package.controller';
import {
  validateCouponController,
  getAvailableCouponsController,
} from '../Coupon/coupon.controller';
import {
  getRevenueShareConfigController,
  calculateRevenueShareController,
} from '../RevenueShare/revenue-share.controller';
import {
  requestPaymentController,
  verifyPaymentCallbackController,
  verifyPaymentController,
} from '../PaymentGateway/payment-gateway.controller';
import {
  checkAvailabilityController,
  createAppointmentController,
  getAppointmentController,
  listAppointmentsController,
  updateAppointmentStatusController,
  cancelAppointmentController,
  rescheduleAppointmentController,
} from '../Appointment/appointment.controller';

const router = Router();

// Health Check Route
router.get('/health', healthCheck);

// Authentication Routes
router.post('/auth/login/password', loginWithPasswordController);
router.post('/auth/login/otp', verifyOtpController);
router.post('/auth/refresh-token', refreshTokenController);
router.post('/auth/verify-token', verifyTokenController);
router.post('/auth/logout', logoutController);

// OTP Routes (legacy - kept for backward compatibility)
router.post('/otp/send', sendOtpController);
router.post('/otp/verify', verifyOtpController);

// Home page
router.get('/Hairdresser', getBarbersController);
router.get('/Hairdresser/:id', getBarberByIdController);

// Profile Routes (Protected)
router.get('/profile', authenticateToken, getProfileController);
router.put('/profile', authenticateToken, upload.single('profileImage'), editProfileController);

// Transaction & Wallet Routes (Protected)
router.get('/transactions/wallet/balance', authenticateToken, getWalletBalanceController);
router.post('/transactions/deposit', authenticateToken, depositController);
router.post('/transactions/withdraw', authenticateToken, withdrawController);
router.post('/transactions/transfer', authenticateToken, transferController);
router.get('/transactions/history', authenticateToken, getTransactionHistoryController);
router.post('/transactions/lock', authenticateToken, lockFundsController);

// Package Routes
router.get('/packages', getAvailablePackagesController);
router.post('/packages/purchase', authenticateToken, purchasePackageController);
router.get('/packages/my-packages', authenticateToken, getUserPackagesController);

// Coupon Routes
router.post('/coupons/validate', authenticateToken, validateCouponController);
router.get('/coupons/available', getAvailableCouponsController);

// Revenue Share Routes
router.get('/revenue-share/config', getRevenueShareConfigController);
router.post('/revenue-share/calculate', calculateRevenueShareController);

// Payment Gateway Routes
router.post('/payment/request', authenticateToken, requestPaymentController);
router.get('/payment/verify', verifyPaymentCallbackController); // Callback from ZarrinPal
router.post('/payment/verify', verifyPaymentController); // Manual verification API

// Appointment Routes (Protected)
router.get('/appointments/availability', checkAvailabilityController); // Public - no auth needed
router.post('/appointments', authenticateToken, createAppointmentController);
router.get('/appointments', authenticateToken, listAppointmentsController);
router.get('/appointments/:id', authenticateToken, getAppointmentController);
router.put('/appointments/:id/status', authenticateToken, updateAppointmentStatusController);
router.post('/appointments/:id/cancel', authenticateToken, cancelAppointmentController);
router.post('/appointments/:id/reschedule', authenticateToken, rescheduleAppointmentController);

// File Routes
router.post('/files/upload', upload.single('file'), uploadFileController);
router.get('/files/download/:fileName', downloadFileController);
router.get('/files/metadata/:fileName', getFileMetadataController);
router.delete('/files/:fileName', deleteFileController);
router.get('/files/list', listFilesController);

export default router;
