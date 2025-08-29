import { LoginPage } from "@/pages/customer/login";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Hello</div>,
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
        path: "register",
        element: <LoginPage />,
      },
    ],
  },
]);
