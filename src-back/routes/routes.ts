import { Router } from 'express';
import multer from 'multer';
import { healthCheck } from '../Helth/healthController';
import { sendOtpController, verifyOtpController } from '../OTP/otp.controller';
import { refreshTokenController, verifyTokenController, logoutController } from '../auth/auth.controller';
import { loginWithPasswordController } from '../auth/login.controller';
import { authenticateToken } from '../auth/auth.middleware';
import { getProfileController } from '../Profile_User/Get_Edit_profile/profile.controller';
import { editProfileController } from '../Profile_User/Get_Edit_profile/editprofile.controller';
import { getPaymentHistoryController } from '../Profile_User/Payment_Hisotry/payment-history.controller';
import { searchController } from '../Home_Page/Searching/search.controller';
import { getBarbershopOverviewController } from '../Home_Page/BarbershopOverview/barbershop-overview.controller';
import { getBarbershopServicesController } from '../Home_Page/BarbershopServices/barbershop-services.controller';
import { getBarbershopDetailsController } from '../Home_Page/BarbershopDetails/barbershop-details.controller';
import { getBarbershopStaffController } from '../Home_Page/BarbershopStaff/barbershop-staff.controller';
import {
  getWalletBalanceController,
  depositController,
  withdrawController,
  transferController,
  getTransactionHistoryController,
  lockFundsController,
} from '../Profile_User/Wallet/Transaction/transaction.controller';
import {
  getAvailablePackagesController,
  purchasePackageController,
  getUserPackagesController,
} from '../Profile_User/Wallet/Package/package.controller';
import {
  validateCouponController,
  getAvailableCouponsController,
} from '../Profile_User/Coupon/coupon.controller';
import {
  getRevenueShareConfigController,
  calculateRevenueShareController,
} from '../Profile_User/Wallet/RevenueShare/revenue-share.controller';
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
import { getMyReservationsController, cancelMyReservationController } from '../My_Reservations/my-reservations.controller';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

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

// Search Routes
router.get('/search', searchController);

// Barbershop Routes
router.get('/barbershop/:id/overview', getBarbershopOverviewController);
router.get('/barbershop/:id/services', getBarbershopServicesController);
router.get('/barbershop/:id/details', getBarbershopDetailsController);
router.get('/barbershop/:id/staff', getBarbershopStaffController);

// Profile Routes (Protected)
router.get('/profile', authenticateToken, getProfileController);
router.put('/profile', authenticateToken, upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 }
]), editProfileController);

// Payment History Routes (Protected)
router.get('/payment-history', authenticateToken, getPaymentHistoryController);


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

// My Reservations Routes (Protected)
router.get('/my-reservations', authenticateToken, getMyReservationsController);
router.post('/my-reservations/:id/cancel', authenticateToken, cancelMyReservationController);

export default router;
