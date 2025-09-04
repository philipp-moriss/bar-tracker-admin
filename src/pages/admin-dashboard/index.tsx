import React, { useEffect } from "react";
import { useAuthStore } from "@/core/stores/authStore";
import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/core/components/ui/card";
import { Shield, LogOut, User, Calendar, QrCode, Users, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnalyticsService } from "@/core/services/analyticsService";
import { AdminLayout } from "@/core/components/layout/AdminLayout";

export const AdminDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  // Log admin dashboard visit
  useEffect(() => {
    AnalyticsService.logPageView('Admin Dashboard')
  }, []);

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome to BarTrekker Admin Panel">
      <div className="max-w-6xl mx-auto">


        {/* Welcome Card */}
        <Card className="mb-8 shadow-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-6 w-6 text-barTrekker-orange" />
              <span>Welcome, {user?.name}!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-barTrekker-darkGrey/70">
              You have successfully logged into the BarTrekker admin panel.
            </p>
            <div className="mt-4 p-4 bg-barTrekker-lightGrey rounded-lg">
              <p className="text-sm text-barTrekker-darkGrey">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="text-sm text-barTrekker-darkGrey">
                <strong>ID:</strong> {user?.id}
              </p>
              <p className="text-sm text-barTrekker-darkGrey">
                <strong>Role:</strong> Administrator
              </p>
            </div>
          </CardContent>
        </Card>

                          {/* Quick Actions */}
                  <Card className="shadow-xl border-0 bg-white mb-8">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button
                          onClick={() => navigate("/admin/events")}
                          className="flex flex-col items-center space-y-2 h-24 bg-barTrekker-orange hover:bg-barTrekker-orange/90"
                        >
                          <Calendar className="h-6 w-6" />
                          <span>Manage Events</span>
                        </Button>
                        <Button
                          onClick={() => navigate("/admin/tickets")}
                          className="flex flex-col items-center space-y-2 h-24 bg-blue-600 hover:bg-blue-700"
                        >
                          <QrCode className="h-6 w-6" />
                          <span>Manage Tickets</span>
                        </Button>
                        <Button
                          onClick={() => navigate("/admin/users")}
                          className="flex flex-col items-center space-y-2 h-24 bg-green-600 hover:bg-green-700"
                        >
                          <Users className="h-6 w-6" />
                          <span>Manage Users</span>
                        </Button>
                        <Button
                          onClick={() => navigate("/admin/analytics")}
                          className="flex flex-col items-center space-y-2 h-24 bg-purple-600 hover:bg-purple-700"
                        >
                          <BarChart3 className="h-6 w-6" />
                          <span>Analytics</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Info */}
                  <Card className="shadow-xl border-0 bg-white">
                    <CardHeader>
                      <CardTitle>System Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h3 className="font-semibold text-green-800 mb-2">
                            System Status
                          </h3>
                          <p className="text-green-600">System is running normally</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h3 className="font-semibold text-blue-800 mb-2">
                            Authentication Mode
                          </h3>
                          <p className="text-blue-600">Single Administrator</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
      </div>
    </AdminLayout>
  );
};
