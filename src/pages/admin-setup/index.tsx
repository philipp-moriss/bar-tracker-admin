import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Mail, Lock, User, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/core/components/ui/card";
import { Input } from "@/core/components/ui/inputs/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/components/ui/form";
import { LanguageSwitcher } from "@/core/feauture/language/LanguageSwitcher";
import { authService } from "@/core/services/authService";
import { useAuthStore } from "@/core/stores/authStore";

// Admin setup validation schema
const adminSetupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must contain at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must contain at least 6 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase letter, lowercase letter and number"),
  confirmPassword: z
    .string()
    .min(1, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AdminSetupFormData = z.infer<typeof adminSetupSchema>;

export const AdminSetupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  const form = useForm<AdminSetupFormData>({
    resolver: zodResolver(adminSetupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    // Check if admin already exists
    const checkAdmin = async () => {
      const exists = await authService.checkAdminExists();
      setAdminExists(exists);
    };
    checkAdmin();
  }, []);

  const onSubmit = async (data: AdminSetupFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.createAdmin();

      if (response.success) {
        // After creating admin, automatically log in
        const loginResponse = await authService.login({
          email: data.email,
          password: data.password,
        });

        if (loginResponse.success && loginResponse.user) {
          login(loginResponse.user);
          navigate("/admin");
        }
      } else {
        form.setError("root", {
          type: "manual",
          message: response.message,
        });
      }
    } catch (error) {
      console.error("Admin creation error:", error);
      form.setError("root", {
        type: "manual",
        message: "Error creating administrator",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // If admin already exists, show message
  if (adminExists === true) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-barTrekker-lightGrey to-white p-4">
        <div className="w-full flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md flex-1 flex items-center justify-center">
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="text-center pb-6">
              <Shield className="mx-auto h-12 w-12 text-barTrekker-orange mb-4" />
              <CardTitle className="text-2xl font-bold text-barTrekker-darkGrey">
                Administrator Already Created
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-barTrekker-darkGrey/70 mb-6">
                System administrator already exists. Go to the login page.
              </p>
              <Button
                onClick={() => navigate("/admin/login")}
                className="w-full h-12 text-base font-medium bg-barTrekker-orange hover:bg-barTrekker-orange/90 text-white"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-barTrekker-lightGrey to-white p-4">
      <div className="w-full flex justify-end">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-lg flex-1 flex items-center justify-center">
        <Card className="shadow-xl border-0 bg-white w-full">
          <CardHeader className="text-center pb-6">
            <Shield className="mx-auto h-12 w-12 text-barTrekker-orange mb-4" />
            <CardTitle className="text-2xl font-bold text-barTrekker-darkGrey">
              Administrator Setup
            </CardTitle>
            <p className="text-barTrekker-darkGrey/70 mt-2">
              Create the first and only system administrator
            </p>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                        Administrator Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-5 w-5" />
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter administrator name"
                            className="pl-12 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-5 w-5" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="admin@bartrekker.com"
                            className="pl-12 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-5 w-5" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Введите пароль"
                            className="pl-12 pr-12 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 hover:text-barTrekker-orange transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-5 w-5" />
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Подтвердите пароль"
                            className="pl-12 pr-12 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                          />
                          <button
                            type="button"
                            onClick={toggleConfirmPasswordVisibility}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 hover:text-barTrekker-orange transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                    {form.formState.errors.root.message}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium bg-barTrekker-orange hover:bg-barTrekker-orange/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Administrator...
                    </div>
                  ) : (
                    "Create Administrator"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-barTrekker-darkGrey/70">
                This operation is performed only once during the first system startup
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
