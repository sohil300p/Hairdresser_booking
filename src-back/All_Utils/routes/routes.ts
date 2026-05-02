import { Router } from 'express';
import multer from 'multer';
import { healthCheck } from '../Helth/healthController';
import { getSystemMetricsController } from '../../Admin_Side/Monitoring/monitoring.controller';
import { authenticateToken } from '../../User_Side/auth/auth.middleware';
import { authenticateAdmin } from '../../Admin_Side/Admin/admin-auth.middleware';
import { sendOtpController, verifyOtpController } from '../../All_Notifications/OTP/otp.controller';
import { refreshTokenController, verifyTokenController, logoutController } from '../../User_Side/auth/auth.controller';
import { loginWithPasswordController } from '../../User_Side/auth/login.controller';
import { getProfileController } from '../../User_Side/Profile_User/Get_Edit_profile/profile.controller';
import { editProfileController } from '../../User_Side/Profile_User/Get_Edit_profile/editprofile.controller';
import { getPaymentHistoryController } from '../../User_Side/Profile_User/Payment_Hisotry/payment-history.controller';
import { searchController } from '../../User_Side/Home_Page/Searching/search.controller';
import { getBarbershopOverviewController } from '../../User_Side/Home_Page/BarbershopOverview/barbershop-overview.controller';
import { getBarbershopServicesController } from '../../User_Side/Home_Page/BarbershopServices/barbershop-services.controller';
import { getBarbershopDetailsController } from '../../User_Side/Home_Page/BarbershopDetails/barbershop-details.controller';
import { getBarbershopStaffController } from '../../User_Side/Home_Page/BarbershopStaff/barbershop-staff.controller';
import {
  getWalletBalanceController,
  depositController,
  withdrawController,
  transferController,
  getTransactionHistoryController,
  lockFundsController,
} from '../../User_Side/Profile_User/Wallet/Transaction/transaction.controller';
import {
  getAvailablePackagesController,
  purchasePackageController,
  getUserPackagesController,
} from '../../User_Side/Profile_User/Wallet/Package/package.controller';
import {
  validateCouponController,
  getAvailableCouponsController,
} from '../../User_Side/Profile_User/Coupon/coupon.controller';
import {
  getRevenueShareConfigController,
  calculateRevenueShareController,
} from '../../User_Side/Profile_User/Wallet/RevenueShare/revenue-share.controller';
import {
  requestPaymentController,
  verifyPaymentCallbackController,
  verifyPaymentController,
} from '../../User_Side/PaymentGateway/payment-gateway.controller';
import {
  checkAvailabilityController,
  getBookingStartDateController,
  createAppointmentController,
  getAppointmentController,
  getAppointmentByPublicRefController,
  listAppointmentsController,
  updateAppointmentStatusController,
  cancelAppointmentController,
  rescheduleAppointmentController,
} from '../../User_Side/Appointment/appointment.controller';
import { getMyReservationsController, cancelMyReservationController } from '../../User_Side/My_Reservations/my-reservations.controller';
import { getBarberProfileController, createBarberProfileController } from '../../Barber_Side/Profile_barber/Get_Edit_Profile/profile.controller';
import { editBarberProfileController } from '../../Barber_Side/Profile_barber/Get_Edit_Profile/editprofile.controller';
import { logoutBarberController } from '../../Barber_Side/Profile_barber/Get_Edit_Profile/logout.controller';
import { getBarberFinancialConfigController } from '../../Barber_Side/Profile_barber/Financial/financial.controller';
import { getServicesController, createServiceController, editServiceController } from '../../Barber_Side/Profile_barber/Get_Edit_Service/service.controller';
import { getWorkingHoursController, createWorkingHoursController, editWorkingHoursController } from '../../Barber_Side/Profile_barber/Get_Edit_workingHours/workinghour.controller';
import { getCouponsController, createCouponController, editCouponController, sendCouponSMSController } from '../../Barber_Side/Profile_barber/Get_Edit_coupon/coupon.controller';
import { getCommentsController } from '../../Barber_Side/Profile_barber/Get_commentsCustomer/comment.controller';
import {
  getBarberNotificationsController,
  markBarberNotificationReadController,
  markAllBarberNotificationsReadController,
} from '../../Barber_Side/Notifications/barber-notifications.controller';
import {
  getReservationRulesController,
  putReservationRulesController,
} from '../../Barber_Side/Profile_barber/ReservationRules/reservation-rules.controller';
import {
  getEffectiveReservationPolicyController,
  putBarberReservationPolicyController,
  putBarbershopReservationPolicyController,
  putServiceReservationPolicyController,
} from '../../Barber_Side/Profile_barber/ReservationPolicies/reservation-policies.controller';
import {
  getDefaultReservationPolicyController,
  putDefaultReservationPolicyController,
} from '../../Admin_Side/Admin/reservation-policies.controller';
import {
  getWalletBalanceController as getBarberWalletBalanceController,
  depositController as barberDepositController,
  withdrawController as barberWithdrawController,
  transferController as barberTransferController,
  getTransactionHistoryController as getBarberTransactionHistoryController,
  lockFundsController as barberLockFundsController,
} from '../../Barber_Side/Profile_barber/barber_wallet/Transaction/transaction.controller';
import { getPaymentHistoryController as getBarberPaymentHistoryController } from '../../Barber_Side/Profile_barber/barber_wallet/Payment_History/payment-history.controller';
import { getDashboardController } from '../../Barber_Side/Home_page/dashboard.controller';
import { getTodayAppointmentsController } from '../../Barber_Side/Home_page/today-appointments.controller';
import { getCustomersController } from '../../Barber_Side/Hairdresser_customers/customers.controller';
import { getAppointmentsController, updateAppointmentStatusController as updateBarberAppointmentStatusController } from '../../Barber_Side/Appointment_barber/appointment.controller';
import {
  createInvitationController,
  listInvitationsController,
  listMembersController,
  getMyPendingInvitationsController,
  acceptInvitationController,
} from '../../Barber_Side/Barbershop_seats/seats.controller';
import { 
  registerTokenController, 
  getUsersWithDevicesController, 
  adminSendNotificationController 
} from '../../All_Notifications/Notification/notification.controller';
import {
  getCustomerInAppNotificationsController,
  markAllCustomerInAppNotificationsReadController,
  markCustomerInAppNotificationReadController,
} from '../../All_Notifications/Notification/customer-inapp.controller';
import {
  getAllUsersController,
  getAllBarbersController,
  getAllAppointmentsController,
  resetUserOtpLimitController,
  getUserOtpStatusController,
  getAllAdminsController,
  getBarberAppointmentsController,
  getBarbershopServicesAdminController,
  clearBarberReservationsController,
  clearBarberFinancialController,
} from '../../Admin_Side/Admin/admin.controller';
import { adminLoginController } from '../../Admin_Side/Admin/admin-login.controller';
import {
  getWalletSummariesController,
  getFinancialMetricsController,
  getAdminTransactionsController,
} from '../../Admin_Side/Admin/financial/financial.controller';
import { setBarbershopCommissionController } from '../../Admin_Side/Admin/barbershop-commission.controller';
import {
  getDefaultImagesController,
  getDefaultImagesPublicController,
  updateDefaultImagesController,
} from '../../Admin_Side/Admin/settings/default-images.controller';
import { mapirReverseController, mapirSearchController } from '../../Mapir/mapir-proxy.controller';

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

// Map.ir proxy (reverse geocode + search) – no auth, uses server MAPIR_API_KEY (register early to avoid conflicts)
router.get('/mapir/reverse', mapirReverseController);
router.get('/mapir/search', mapirSearchController);
router.post('/mapir/search', mapirSearchController);

// Admin Monitoring Routes (requires authentication)
router.get('/admin/monitoring/metrics', authenticateAdmin, getSystemMetricsController);

// Admin Authentication Routes
router.post('/admin/login', adminLoginController);

// Authentication Routes
router.post('/auth/login/password', loginWithPasswordController);
router.post('/auth/login/otp', verifyOtpController);
router.post('/auth/refresh-token', refreshTokenController);
router.post('/auth/verify-token', verifyTokenController);
router.post('/auth/logout', logoutController);

// OTP Routes (legacy - kept for backward compatibility)
router.post('/otp/send', sendOtpController);
router.post('/otp/verify', verifyOtpController);

// Notification Routes
router.post('/notifications/register-token', authenticateToken, registerTokenController);
router.get('/notifications/in-app', authenticateToken, getCustomerInAppNotificationsController);
router.patch('/notifications/in-app/read-all', authenticateToken, markAllCustomerInAppNotificationsReadController);
router.patch('/notifications/in-app/:id/read', authenticateToken, markCustomerInAppNotificationReadController);

// Admin Notification Routes
router.get('/admin/notifications/users', authenticateAdmin, getUsersWithDevicesController);
router.post('/admin/notifications/send', authenticateAdmin, adminSendNotificationController);

// Admin Management Routes
router.get('/admin/users', authenticateAdmin, getAllUsersController);
router.get('/admin/barbers', authenticateAdmin, getAllBarbersController);
router.put('/admin/barbershops/:id/commission', authenticateAdmin, setBarbershopCommissionController);
router.get('/admin/appointments', authenticateAdmin, getAllAppointmentsController);
router.get('/admin/staff', authenticateAdmin, getAllAdminsController);
router.get('/admin/barbers/:barberId/appointments', authenticateAdmin, getBarberAppointmentsController);
router.get('/admin/barbershops/:barbershopId/services', authenticateAdmin, getBarbershopServicesAdminController);
router.post('/admin/barbers/:barberId/clear-reservations', authenticateAdmin, clearBarberReservationsController);
router.post('/admin/barbers/:barberId/clear-financial', authenticateAdmin, clearBarberFinancialController);

// Admin OTP Management Routes
router.post('/admin/users/:phone/reset-otp', authenticateAdmin, resetUserOtpLimitController);
router.get('/admin/users/:phone/otp-status', authenticateAdmin, getUserOtpStatusController);

// Admin Financial Routes
router.get('/admin/financial/wallets', authenticateAdmin, getWalletSummariesController);
router.get('/admin/financial/transactions', authenticateAdmin, getAdminTransactionsController);
router.get('/admin/financial/metrics', authenticateAdmin, getFinancialMetricsController);

// Admin Reservation Policy Defaults
router.get('/admin/reservation-policies/default', authenticateAdmin, getDefaultReservationPolicyController);
router.put('/admin/reservation-policies/default', authenticateAdmin, putDefaultReservationPolicyController);

// Admin Default Images (barber profile + header) - accepts URL or file upload
router.get('/admin/settings/default-images', authenticateAdmin, getDefaultImagesController);
router.put('/admin/settings/default-images', authenticateAdmin, upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'headerImage', maxCount: 1 },
]), updateDefaultImagesController);

// Public default images (for barber app + user app fallbacks)
router.get('/settings/default-images', getDefaultImagesPublicController);

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

// Barber Profile Routes (Protected - Barber only)
router.get('/barber/profile', authenticateToken, getBarberProfileController);
router.post('/barber/profile', authenticateToken, upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 }
]), createBarberProfileController);
router.put('/barber/profile', authenticateToken, upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 }
]), editBarberProfileController);
router.post('/barber/logout', authenticateToken, logoutBarberController);
router.get('/barber/financial-config', authenticateToken, getBarberFinancialConfigController);

// Barber Services Routes (Protected - Barber only)
router.get('/barber/services', authenticateToken, getServicesController);
router.post('/barber/services', authenticateToken, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'sampleImages', maxCount: 10 }
]), createServiceController);
router.put('/barber/services/:id', authenticateToken, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'sampleImages', maxCount: 10 }
]), editServiceController);

// Barber Working Hours Routes (Protected - Barber only)
router.get('/barber/working-hours', authenticateToken, getWorkingHoursController);
router.post('/barber/working-hours', authenticateToken, createWorkingHoursController);
router.put('/barber/working-hours', authenticateToken, editWorkingHoursController);

// Barber Coupons Routes (Protected - Barber only)
router.get('/barber/coupons', authenticateToken, getCouponsController);
router.post('/barber/coupons', authenticateToken, createCouponController);
router.put('/barber/coupons/:id', authenticateToken, editCouponController);
router.post('/barber/coupons/:id/send-sms', authenticateToken, sendCouponSMSController);

// Barber Comments Routes (Protected - Barber only)
router.get('/barber/comments', authenticateToken, getCommentsController);

// Barber Notifications (In-App, Redis-backed) (Protected - Barber only)
router.get('/barber/notifications', authenticateToken, getBarberNotificationsController);
router.patch('/barber/notifications/read-all', authenticateToken, markAllBarberNotificationsReadController);
router.patch('/barber/notifications/:id/read', authenticateToken, markBarberNotificationReadController);

// Barber Barbershop Seats / Invitations (Protected - Barber only)
router.post('/barber/barbershop/invitations', authenticateToken, createInvitationController);
router.get('/barber/barbershop/invitations', authenticateToken, listInvitationsController);
router.get('/barber/barbershop/members', authenticateToken, listMembersController);
router.get('/barber/invitations', authenticateToken, getMyPendingInvitationsController);
router.post('/barber/invitations/:token/accept', authenticateToken, acceptInvitationController);

// Barber Reservation Rules Routes (Protected - Barber only)
router.get('/barber/reservation-rules', authenticateToken, getReservationRulesController);
router.put('/barber/reservation-rules', authenticateToken, putReservationRulesController);

// Barber Reservation Policies (Overrides) (Protected - Barber only)
router.get('/barber/reservation-policies/effective', authenticateToken, getEffectiveReservationPolicyController);
router.put('/barber/reservation-policies/barbershop', authenticateToken, putBarbershopReservationPolicyController);
router.put('/barber/reservation-policies/service/:serviceId', authenticateToken, putServiceReservationPolicyController);
router.put('/barber/reservation-policies/barber/:barberId', authenticateToken, putBarberReservationPolicyController);

// Barber Wallet Routes (Protected - Barber only)
router.get('/barber/wallet/balance', authenticateToken, getBarberWalletBalanceController);
router.post('/barber/wallet/deposit', authenticateToken, barberDepositController);
router.post('/barber/wallet/withdraw', authenticateToken, barberWithdrawController);
router.post('/barber/wallet/transfer', authenticateToken, barberTransferController);
router.get('/barber/wallet/history', authenticateToken, getBarberTransactionHistoryController);
router.post('/barber/wallet/lock', authenticateToken, barberLockFundsController);
router.get('/barber/wallet/payment-history', authenticateToken, getBarberPaymentHistoryController);

// Barber Home Page Routes (Protected - Barber only)
router.get('/barber/home/dashboard', authenticateToken, getDashboardController);
router.get('/barber/home/today-appointments', authenticateToken, getTodayAppointmentsController);

// Barber Customers Routes (Protected - Barber only)
router.get('/barber/customers', authenticateToken, getCustomersController);

// Barber Appointments Routes (Protected - Barber only)
router.get('/barber/appointments', authenticateToken, getAppointmentsController);
router.put('/barber/appointments/:id/status', authenticateToken, updateBarberAppointmentStatusController);

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
router.get('/appointments/start-date', getBookingStartDateController); // Public - no auth needed
router.post('/appointments', authenticateToken, createAppointmentController);
router.get('/appointments', authenticateToken, listAppointmentsController);
router.get('/appointments/ref/:ref', getAppointmentByPublicRefController); // Public - no auth needed
router.get('/appointments/:id', authenticateToken, getAppointmentController);
router.put('/appointments/:id/status', authenticateToken, updateAppointmentStatusController);
router.post('/appointments/:id/cancel', authenticateToken, cancelAppointmentController);
router.post('/appointments/:id/reschedule', authenticateToken, rescheduleAppointmentController);

// My Reservations Routes (Protected)
router.get('/my-reservations', authenticateToken, getMyReservationsController);
router.post('/my-reservations/:id/cancel', authenticateToken, cancelMyReservationController);

export default router;
