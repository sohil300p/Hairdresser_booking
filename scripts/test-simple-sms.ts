import dotenv from 'dotenv';
import { sendSimpleSMS } from '../src-back/User_Side/SMS/melipayamak.service';

// Load environment variables
dotenv.config();

async function testSimpleSMS() {
  console.log('🔧 Testing Simple SMS (No Pattern)...\n');
  
  const testPhone = process.env.PHONE_NUMBER_TEST || '09172233241';
  const testMessage = 'تست پیامک - کد تایید: 1234';
  
  console.log(`📱 Sending to: ${testPhone}`);
  console.log(`💬 Message: ${testMessage}\n`);
  
  try {
    const result = await sendSimpleSMS({
      to: testPhone,
      message: testMessage
    });
    
    console.log('📤 Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Simple SMS sent successfully!');
      console.log('This means your credentials are working.');
      console.log('The issue is likely with the pattern SMS configuration.');
    } else {
      console.log('\n❌ Simple SMS failed!');
      console.log('This indicates a problem with your MeliPayamak account:');
      console.log('- Check username/password');
      console.log('- Check account credit');
      console.log('- Check sender number authorization');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testSimpleSMS().catch(console.error);
