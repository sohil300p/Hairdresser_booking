import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Scissors, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu,
  Bell,
  Shield
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/notifications', label: 'Push Notifications', icon: Bell },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/barbers', label: 'Barbers', icon: Scissors },
    { href: '/appointments', label: 'Appointments', icon: Calendar },
    { href: '/staff', label: 'Staff & Admins', icon: Shield },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col bg-white dark:bg-gray-800 border-r md:flex">
        <div className="flex h-16 items-center justify-center border-b px-6">
          <Scissors className="mr-2 h-6 w-6 text-primary" />
          <span className="text-lg font-bold">BarberAdmin</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {user?.phone?.substring(user.phone.length - 2) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium">{user?.fullName || 'Admin User'}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.phone}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-800 md:hidden">
          <div className="flex items-center">
            <Scissors className="mr-2 h-6 w-6 text-primary" />
            <span className="text-lg font-bold">BarberAdmin</span>
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

