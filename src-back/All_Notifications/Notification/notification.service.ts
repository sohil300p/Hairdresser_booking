import prisma from '../../All_Utils/config/prisma';
import { getMessaging } from './firebase';
import { SendNotificationRequest, SendMulticastRequest } from './notification.type';

/**
 * Register or update FCM Token for a user
 */
export async function registerDeviceToken(
  userId: number,
  userType: 'customer' | 'barber',
  token: string,
  platform: string = 'web'
) {
  try {
    // Check if token exists (userDevice model - use type assertion if not in schema)
    const existingDevice = await (prisma as any).userDevice.findFirst({
      where: {
        userType,
        userId,
        fcmToken: token,
      },
    });

    if (existingDevice) {
      // Update last used
      await (prisma as any).userDevice.update({
        where: { id: existingDevice.id },
        data: {
          lastUsed: BigInt(Date.now()),
          platform,
        },
      });
    } else {
      // Create new
      await (prisma as any).userDevice.create({
        data: {
          userType,
          userId,
          fcmToken: token,
          platform,
          lastUsed: BigInt(Date.now()),
          created: BigInt(Date.now()),
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error registering device token:', error);
    return { success: false, error };
  }
}

/**
 * Send Notification to a specific user.
 * blockChannels: when set, those channels are skipped (e.g. blockEmail/blockSms = only send push).
 */
export async function sendNotificationToUser(req: SendNotificationRequest) {
  const blockPush = req.blockChannels?.includes('push');
  if (blockPush) {
    return { success: false, message: 'Push is blocked; no other channel implemented' };
  }

  const messaging = getMessaging();
  if (!messaging) return { success: false, message: 'Firebase not initialized' };

  try {
    // Get user tokens
    const devices = await (prisma as any).userDevice?.findMany?.({
      where: {
        userType: req.userType,
        userId: req.userId,
      },
    });

    if (!devices.length) {
      return { success: false, message: 'No devices found for user' };
    }

    const tokens = devices.map((d: { fcmToken: string }) => d.fcmToken);

    // Send multicast
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: req.title,
        body: req.body,
      },
      data: req.data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            contentAvailable: true,
          },
        },
      },
    });

    // Handle invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      
      // Optional: Remove invalid tokens
      if (failedTokens.length > 0) {
        await (prisma as any).userDevice.deleteMany({
          where: {
            fcmToken: { in: failedTokens },
          },
        });
      }
    }

    // Log notification
    await prisma.notification.create({
      data: {
        userType: req.userType,
        userId: req.userId,
        channel: 'push',
        payload: { title: req.title, body: req.body, data: req.data } as any,
        status: 'sent',
        created: BigInt(Date.now()),
        sentAt: BigInt(Date.now()),
      },
    });

    return { success: true, sentCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error };
  }
}

/**
 * Send Notification to multiple tokens directly
 */
export async function sendMulticastNotification(req: SendMulticastRequest) {
  const messaging = getMessaging();
  if (!messaging) return { success: false, message: 'Firebase not initialized' };

  try {
    const response = await messaging.sendEachForMulticast({
      tokens: req.tokens,
      notification: {
        title: req.title,
        body: req.body,
      },
      data: req.data,
    });

    return { success: true, sentCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    console.error('Error sending multicast:', error);
    return { success: false, error };
  }
}

/**
 * Get users with registered devices
 */
export async function getUsersWithDevices() {
  try {
    const devices = await (prisma as any).userDevice.findMany({
      select: {
        userId: true,
        userType: true,
        platform: true,
        lastUsed: true,
      },
      orderBy: {
        lastUsed: 'desc',
      },
    });

    // Get unique user combinations
    const uniqueUsers = new Map<string, { userId: number; userType: string; platform: string; lastUsed: bigint }>();
    
    for (const device of devices) {
      const key = `${device.userType}-${device.userId}`;
      if (!uniqueUsers.has(key)) {
        uniqueUsers.set(key, device);
      } else {
        const existing = uniqueUsers.get(key)!;
        // Keep the most recent device
        if (device.lastUsed > existing.lastUsed) {
          uniqueUsers.set(key, device);
        }
      }
    }

    // Fetch user details
    const usersWithDevices = await Promise.all(
      Array.from(uniqueUsers.values()).map(async (device) => {
        let name = 'Unknown';
        let phone = '';

        if (device.userType === 'customer') {
          const customer = await prisma.customer.findUnique({
            where: { id: device.userId },
            select: { fullName: true, phone: true },
          });
          if (customer) {
            name = customer.fullName || 'Customer';
            phone = customer.phone;
          }
        } else if (device.userType === 'barber') {
          const barber = await prisma.barber.findUnique({
            where: { id: device.userId },
            select: {
              fullName: true,
              phone: true,
              customer: { select: { fullName: true, phone: true } },
            },
          });
          if (barber) {
            name = barber.fullName ?? barber.customer?.fullName ?? 'Barber';
            phone = barber.phone ?? barber.customer?.phone ?? '';
          }
        }

        return {
          userId: device.userId,
          userType: device.userType as 'customer' | 'barber',
          name,
          phone,
          platform: device.platform || 'web',
          lastActive: device.lastUsed ? new Date(Number(device.lastUsed)).toISOString() : null,
        };
      })
    );

    return { success: true, users: usersWithDevices };
  } catch (error) {
    console.error('Error getting users with devices:', error);
    return { success: false, error };
  }
}
