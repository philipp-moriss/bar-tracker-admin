import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

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
import { useAuthStore } from "@/core/stores/authStore";
import { AdminLoginDto } from "@/core/types/auth";
import { LanguageSwitcher } from "@/core/feauture/language/LanguageSwitcher";

// Схема валидации для формы логина
const loginSchema = z.object({
  email: z.string().min(1, "Email обязателен").email("Неверный формат email"),
  password: z
    .string()
    .min(1, "Пароль обязателен")
    .min(6, "Пароль должен содержать минимум 6 символов"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Здесь будет API вызов для логина
      const _loginData: AdminLoginDto = {
        email: data.email,
        password: data.password,
      };

      // Имитация API вызова
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // В реальном приложении здесь будет вызов API
      // const response = await loginApi(loginData)

      // Имитация успешного ответа
      const mockResponse = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        email: data.email,
        userId: 1,
      };

      setUser(mockResponse);

      // Перенаправление на главную страницу
      window.location.href = "/admin";
    } catch (error) {
      console.error("Ошибка входа:", error);
      form.setError("root", {
        type: "manual",
        message: "Неверный email или пароль",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full flex justify-end">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md flex-1 flex items-center justify-center">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {t("admin.login.title")}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Войдите в свою учетную запись администратора
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <Input
                            {...field}
                            type="email"
                            placeholder={t("auth.login.email.placeholder")}
                            className="pl-12"
                            autoComplete="email"
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
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Пароль
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder={t("auth.login.password.placeholder")}
                            className="pl-12 pr-12"
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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

                {form.formState.errors.root && (
                  <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                    {form.formState.errors.root.message}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Вход...
                    </div>
                  ) : (
                    t("auth.login.button")
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t("auth.login.noAccount")}{" "}
                <a
                  href="/register"
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  {t("auth.login.registerLink")}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
