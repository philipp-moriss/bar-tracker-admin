import { LoginPage } from "@/pages/customer/login";
import { createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Hello</div>,
  },
  {
    path: "customer",
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },
  {
    path: "admin",
    element: <AdminLayout/>,
  },
]);
