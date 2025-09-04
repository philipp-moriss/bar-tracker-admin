import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { useAuthStore } from '@/core/stores/authStore';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  onMenuToggle: () => void;
  title?: string;
  subtitle?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  onMenuToggle, 
  title = "Admin Panel",
  subtitle 
}) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-barTrekker-lightGrey">
      <div className="flex items-center justify-between px-4 py-4">
        {/* Left side - Menu and Title */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div>
            <h1 className="text-xl font-semibold text-barTrekker-darkGrey">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-barTrekker-darkGrey/70">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Notifications and User */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 hover:bg-barTrekker-lightGrey rounded-lg p-2 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-barTrekker-darkGrey">
                  {user?.name}
                </p>
                <p className="text-xs text-barTrekker-darkGrey/70">
                  Administrator
                </p>
              </div>
              <div className="w-8 h-8 bg-barTrekker-orange rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <ChevronDown className={`h-4 w-4 text-barTrekker-darkGrey transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-barTrekker-lightGrey py-2 z-50">
                <div className="px-4 py-2 border-b border-barTrekker-lightGrey">
                  <p className="text-sm font-medium text-barTrekker-darkGrey">{user?.name}</p>
                  <p className="text-xs text-barTrekker-darkGrey/70">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};