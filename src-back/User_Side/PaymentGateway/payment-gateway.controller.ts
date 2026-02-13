import { Request, Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { requestPayment, verifyPayment } from './zarrinpal.service';
import { ZarrinPalPaymentRequest, ZarrinPalVerifyRequest } from './payment-gateway.type';
import prisma from '../../All_Utils/config/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { calculateWalletBalance } from '../Profile_User/Wallet/Transaction/transaction.service';

/**
 * Request Payment Controller
 * POST /api/payment/request
 */
export async function requestPaymentController(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'احراز هویت الزامی است',
      });
      return;
    }

    const { amount, description, callbackUrl, externalTransactionId } = req.body;

    if (!amount || !description || !callbackUrl) {
      res.status(400).json({
        success: false,
        message: 'مبلغ، توضیحات و آدرس بازگشت الزامی است',
      });
      return;
    }

    // Verify external transaction exists and is pending
    if (externalTransactionId) {
      const externalTx = await prisma.externalTransaction.findUnique({
        where: { id: externalTransactionId },
      });

      if (!externalTx || externalTx.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'تراکنش یافت نشد یا قبلاً پردازش شده است',
        });
        return;
      }
    }

    // Get customer/barber info for payment
    const customer = await prisma.customer.findUnique({
      where: { id: req.user.id },
      select: { phone: true, email: true },
    });

    const paymentRequest: ZarrinPalPaymentRequest = {
      amount: Math.round(amount), // Ensure integer (Rial)
      description,
      callbackUrl,
      mobile: customer?.phone || undefined,
      email: customer?.email || undefined,
      metadata: {
        userId: req.user.id,
        userType: req.user.userType,
        externalTransactionId: externalTransactionId || null,
      },
    };

    const result = await requestPayment(paymentRequest);

    if (result.success && result.authority && externalTransactionId) {
      // Update external transaction with authority
      await prisma.externalTransaction.update({
        where: { id: externalTransactionId },
        data: {
          reference: result.authority,
          metadata: {
            ...((await prisma.externalTransaction.findUnique({ where: { id: externalTransactionId } }))?.metadata as any || {}),
            authority: result.authority,
            paymentUrl: result.paymentUrl,
          },
          updated: BigInt(Date.now()),
        },
      });
    }

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in requestPaymentController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

/**
 * Verify Payment Callback Controller
 * GET /api/payment/verify
 */
export async function verifyPaymentCallbackController(req: Request, res: Response): Promise<void> {
  try {
    const { Authority, Status, appointmentId } = req.query;

    if (!Authority) {
      res.status(400).send('Authority parameter is required');
      return;
    }

    // Find external transaction by authority
    const externalTx = await prisma.externalTransaction.findFirst({
      where: {
        reference: Authority as string,
        status: 'pending',
      },
    });

    if (!externalTx) {
      res.status(400).send('Transaction not found');
      return;
    }

    // If Status is not OK, mark as failed
    if (Status !== 'OK') {
      await prisma.externalTransaction.update({
        where: { id: externalTx.id },
        data: {
          status: 'failed',
          updated: BigInt(Date.now()),
        },
      });

      // If this is an appointment payment, update appointment status
      if (externalTx.relatedAppointmentId) {
        await prisma.appointment.update({
          where: { id: externalTx.relatedAppointmentId },
          data: {
            status: 'cancelled',
            updated: BigInt(Date.now()),
          },
        });
      }

      // Redirect to frontend failure page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const redirectUrl = appointmentId
        ? `${frontendUrl}/payment/failed?authority=${Authority}&appointmentId=${appointmentId}`
        : `${frontendUrl}/payment/failed?authority=${Authority}`;
      res.redirect(redirectUrl);
      return;
    }

    // Verify payment with ZarrinPal
    const verifyRequest: ZarrinPalVerifyRequest = {
      authority: Authority as string,
      amount: Number(externalTx.amount),
    };

    const verifyResult = await verifyPayment(verifyRequest);

    if (verifyResult.success && verifyResult.refId) {
      // Update external transaction
      await prisma.externalTransaction.update({
        where: { id: externalTx.id },
        data: {
          status: 'success',
          reference: verifyResult.refId,
          metadata: {
            ...((externalTx.metadata as any) || {}),
            refId: verifyResult.refId,
            cardHash: verifyResult.cardHash,
            cardPan: verifyResult.cardPan,
            verifiedAt: Date.now(),
          },
          updated: BigInt(Date.now()),
        },
      });

      // Process internal transaction if it exists
      const internalTx = await prisma.internalTransaction.findFirst({
        where: {
          parentExternalTransactionId: externalTx.id,
        },
        include: {
          toWallet: true,
        },
      });

      if (internalTx && internalTx.toWallet) {
        // Update wallet balance
        const newBalance = await calculateWalletBalance(internalTx.toWallet.id);
        await prisma.wallet.update({
          where: { id: internalTx.toWallet.id },
          data: {
            balance: newBalance,
            updated: BigInt(Date.now()),
          },
        });

        // Update owner's cached balance
        if (internalTx.toWallet.ownerType === 'customer') {
          await prisma.customer.update({
            where: { id: internalTx.toWallet.ownerId },
            data: {
              wallet_balance: newBalance,
              updated: BigInt(Date.now()),
            },
          });
        } else if (internalTx.toWallet.ownerType === 'barber') {
          await prisma.barber.update({
            where: { id: internalTx.toWallet.ownerId },
            data: {
              walletBalance: newBalance,
              updated: BigInt(Date.now()),
            },
          });
        }
      }

      // If this is an appointment payment, update appointment status
      if (externalTx.relatedAppointmentId) {
        await prisma.appointment.update({
          where: { id: externalTx.relatedAppointmentId },
          data: {
            status: 'paid',
            paidAmount: externalTx.amount,
            updated: BigInt(Date.now()),
          },
        });

        // Create appointment log
        await prisma.appointmentLog.create({
          data: {
            appointmentId: externalTx.relatedAppointmentId,
            status: 'paid',
            changedByType: 'system',
            note: 'Payment verified via ZarrinPal',
            changedAt: BigInt(Date.now()),
          },
        });
      }

      // Redirect to frontend success page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const redirectUrl = appointmentId || externalTx.relatedAppointmentId
        ? `${frontendUrl}/payment/success?refId=${verifyResult.refId}&authority=${Authority}&appointmentId=${appointmentId || externalTx.relatedAppointmentId}`
        : `${frontendUrl}/payment/success?refId=${verifyResult.refId}&authority=${Authority}`;
      res.redirect(redirectUrl);
      return;
    } else {
      // Payment verification failed
      await prisma.externalTransaction.update({
        where: { id: externalTx.id },
        data: {
          status: 'failed',
          metadata: {
            ...((externalTx.metadata as any) || {}),
            verifyError: verifyResult.message,
            verifyStatus: verifyResult.status,
          },
          updated: BigInt(Date.now()),
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      res.redirect(`${frontendUrl}/payment/failed?authority=${Authority}&error=${encodeURIComponent(verifyResult.message)}`);
      return;
    }
  } catch (error) {
    console.error('Error in verifyPaymentCallbackController:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/payment/error`);
  }
}

/**
 * Verify Payment API Controller (for manual verification)
 * POST /api/payment/verify
 */
export async function verifyPaymentController(req: Request, res: Response): Promise<void> {
  try {
    const { authority, amount } = req.body;

    if (!authority || !amount) {
      res.status(400).json({
        success: false,
        message: 'Authority و Amount الزامی است',
      });
      return;
    }

    const verifyRequest: ZarrinPalVerifyRequest = {
      authority,
      amount,
    };

    const result = await verifyPayment(verifyRequest);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in verifyPaymentController:', error);
    res.status(500).json({
      success: false,
      message: 'خطای داخلی سرور',
    });
  }
}

