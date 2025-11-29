import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Lock, Smartphone, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.sendOtp({ phone });
      if (res.success) {
        setOtpSent(true);
        setTimer(res.expiresIn || 120);
      } else {
        setError(res.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.verifyOtp({ phone, otp });
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.loginWithPassword({ phone, password });
      if (res.success && res.token && res.user) {
        login(res.token, res.user);
        navigate(from, { replace: true });
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Access</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Button 
              variant={authMethod === 'password' ? 'default' : 'outline'} 
              className="flex-1"
              onClick={() => setAuthMethod('password')}
            >
              <Lock className="mr-2 h-4 w-4" />
              Password
            </Button>
            <Button 
              variant={authMethod === 'otp' ? 'default' : 'outline'} 
              className="flex-1"
              onClick={() => setAuthMethod('otp')}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              OTP / SMS
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4 text-center">
              {error}
            </div>
          )}

          {authMethod === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="09123456789" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-phone">Phone Number</Label>
                    <Input 
                      id="otp-phone" 
                      placeholder="09123456789" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp-code">Enter Code</Label>
                    <Input 
                      id="otp-code" 
                      placeholder="1234" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="text-center text-lg tracking-widest"
                      maxLength={4}
                      required
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Sent to {phone}
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Login'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => setOtpSent(false)}
                  >
                    Change Phone Number
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center border-t p-4">
          <p className="text-xs text-muted-foreground">
            Secured by BarberApp Infrastructure
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

