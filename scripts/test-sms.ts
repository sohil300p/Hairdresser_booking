import dotenv from 'dotenv';
import { sendOTPSMS } from '../src-back/User_Side/SMS/melipayamak.service';

// Load environment variables
dotenv.config();

async function testSMSService() {
  console.log('🔧 Testing MeliPayamak SMS Service...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('MELIPAYAMAK_USERNAME:', process.env.MELIPAYAMAK_USERNAME ? '✅ Set' : '❌ Missing');
  console.log('MELIPAYAMAK_PASSWORD:', process.env.MELIPAYAMAK_PASSWORD ? '✅ Set' : '❌ Missing');
  console.log('MELIPAYAMAK_FROM:', process.env.MELIPAYAMAK_FROM ? '✅ Set' : '❌ Missing');
  console.log('MELIPAYAMAK_AUTH_PATTERN_ID:', process.env.MELIPAYAMAK_AUTH_PATTERN_ID ? '✅ Set' : '❌ Missing');
  console.log('');
  
  // Test phone number from env
  const testPhone = process.env.PHONE_NUMBER_TEST || '09172233241';
  const testOTP = '1234';
  
  console.log(`📱 Testing SMS to: ${testPhone}`);
  console.log(`🔢 Test OTP: ${testOTP}\n`);
  
  try {
    const result = await sendOTPSMS(testPhone, testOTP, 300);
    
    console.log('📤 SMS Result:');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    console.log('Message ID:', result.messageId || 'N/A');
    console.log('Status Code:', result.statusCode || 'N/A');
    
    if (result.success) {
      console.log('\n✅ SMS sent successfully!');
    } else {
      console.log('\n❌ SMS failed!');
      console.log('Possible causes:');
      console.log('1. Invalid credentials (username/password)');
      console.log('2. Insufficient credit in MeliPayamak account');
      console.log('3. Invalid sender number (FROM field)');
      console.log('4. Invalid pattern ID');
      console.log('5. Network connectivity issues');
    }
    
  } catch (error) {
    console.error('💥 Error testing SMS:', error);
  }
}

// Run the test
testSMSService().catch(console.error);
