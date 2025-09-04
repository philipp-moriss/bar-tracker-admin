import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  QrCode, 
  Users, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  Bug
} from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { cn } from '@/core/lib/utils';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: Home,
    description: 'Overview and quick actions'
  },
  {
    name: 'Events',
    href: '/admin/events',
    icon: Calendar,
    description: 'Manage events and tours'
  },
  {
    name: 'Tickets',
    href: '/admin/tickets',
    icon: QrCode,
    description: 'View and manage tickets'
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'User management'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Reports and statistics'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System configuration'
  },
  {
    name: 'Debug',
    href: '/admin/debug',
    icon: Bug,
    description: 'Firebase diagnostics'
  }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (href: string) => {
    navigate(href);
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-barTrekker-lightGrey">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-barTrekker-orange rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BT</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-barTrekker-darkGrey">BarTrekker</h1>
              <p className="text-xs text-barTrekker-darkGrey/70">Admin Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>



        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <li key={item.name}>
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors",
                      isActive
                        ? "bg-barTrekker-orange text-white"
                        : "text-barTrekker-darkGrey hover:bg-barTrekker-lightGrey"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className={cn(
                        "text-xs",
                        isActive ? "text-white/80" : "text-barTrekker-darkGrey/70"
                      )}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>


      </div>
    </>
  );
};
