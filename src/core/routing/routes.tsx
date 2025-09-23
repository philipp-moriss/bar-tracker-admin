import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { AdminSetupPage } from "@/pages/admin-setup";
import { AdminEventsPage } from "@/pages/admin-events";
import { CreateEventPage } from "@/pages/admin-events/create";
import { AdminTicketsPage } from "@/pages/admin-tickets";
import { TicketDetailsPage } from "@/pages/admin-tickets/details";
import { AdminUsersPage } from "@/pages/admin-users";
import { UserProfilePage } from "@/pages/admin-users/profile";
import CreateUserPage from "@/pages/admin-users/create";
import { AdminBarsPage } from "@/pages/admin-bars";
import { CreateBarPage } from "@/pages/admin-bars/create";
import { EditBarPage } from "@/pages/admin-bars/edit/[id]";
import { AdminAnalyticsPage } from "@/pages/admin-analytics";
import AdminDebugPage from "@/pages/admin-debug";
import { ProtectedRoute } from "@/core/routing/ProtectedRoute";
import { createBrowserRouter } from "react-router-dom";
import NotificationsPage from "@/pages/notifications";
import { AdminSettingsPage } from "@/pages/admin-settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "admin",
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "setup",
        element: <AdminSetupPage />,
      },
      {
        path: "",
        element: (
          <ProtectedRoute>
            <AdminEventsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "events",
        element: (
          <ProtectedRoute>
            <AdminEventsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "events/create",
        element: (
          <ProtectedRoute>
            <CreateEventPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "tickets",
        element: (
          <ProtectedRoute>
            <AdminTicketsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "tickets/:id",
        element: (
          <ProtectedRoute>
            <TicketDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute>
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "users/create",
        element: (
          <ProtectedRoute>
            <CreateUserPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "users/:id",
        element: (
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "bars",
        element: (
          <ProtectedRoute>
            <AdminBarsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "bars/create",
        element: (
          <ProtectedRoute>
            <CreateBarPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "bars/edit/:id",
        element: (
          <ProtectedRoute>
            <EditBarPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "analytics",
        element: (
          <ProtectedRoute>
            <AdminAnalyticsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <AdminSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "debug",
        element: (
          <ProtectedRoute>
            <AdminDebugPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "notifications",
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
