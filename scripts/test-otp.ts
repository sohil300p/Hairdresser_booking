import dotenv from 'dotenv';
import { sendOtpService } from '../src-back/User_Side/OTP/otp.service';

dotenv.config();

async function testOTP() {
  const phoneNumber = process.env.PHONE_NUMBER_TEST || '09172233241';
  
  console.log(`📱 Testing OTP send to: ${phoneNumber}`);
  console.log('⏳ Sending OTP...\n');

  try {
    const result = await sendOtpService({ phone: phoneNumber });
    
    if (result.success) {
      console.log('✅ OTP sent successfully!');
      console.log(`📝 Message: ${result.message}`);
      console.log(`⏰ Expires in: ${result.expiresIn} seconds`);
      console.log(`🔄 Remaining attempts: ${result.remainingAttempts}`);
    } else {
      console.error('❌ Failed to send OTP');
      console.error(`📝 Error: ${result.message}`);
      if (result.remainingAttempts !== undefined) {
        console.error(`🔄 Remaining attempts: ${result.remainingAttempts}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testOTP();

