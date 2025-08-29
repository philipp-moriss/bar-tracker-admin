import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/core/components/ui/card";
import { Input } from "@/core/components/ui/inputs/input";
import { Checkbox } from "@/core/components/ui/inputs/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/core/components/ui/form";
import { useAuthStore } from "@/core/stores/authStore";
import { LanguageSwitcher } from "@/core/feauture/language/LanguageSwitcher";

// Схема валидации для формы регистрации
const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, "validation.firstName.min")
    .min(2, "validation.firstName.min")
    .max(50, "validation.firstName.max"),
  lastName: z
    .string()
    .min(1, "validation.lastName.min")
    .min(2, "validation.lastName.min")
    .max(50, "validation.lastName.max"),
  email: z
    .string()
    .min(1, "validation.required")
    .email("validation.email"),
  phone: z
    .string()
    .min(1, "validation.required")
    .regex(/^\+?[\d\s\-()]+$/, "validation.phone"),
  password: z
    .string()
    .min(1, "validation.required")
    .min(6, "validation.password.min")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "validation.password.complex"),
  confirmPassword: z
    .string()
    .min(1, "validation.required"),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, "validation.required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "validation.password.match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      // Здесь будет API вызов для регистрации
      const _registerData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      };

      // Имитация API вызова
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // В реальном приложении здесь будет вызов API
      // const response = await registerApi(registerData)

      // Имитация успешного ответа
      const mockResponse = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        email: data.email,
        userId: 1,
        firstName: data.firstName,
        lastName: data.lastName,
      };

      setUser(mockResponse);

      // Перенаправление на главную страницу
      window.location.href = "/admin";
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      form.setError("root", {
        type: "manual",
        message: "Ошибка при создании аккаунта. Попробуйте еще раз.",
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

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-barTrekker-lightGrey to-white p-4">
      <div className="w-full flex justify-end">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-lg flex-1 flex items-center justify-center">
        <Card className="shadow-xl border-0 bg-white w-full">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-barTrekker-darkGrey">
              {t("auth.register.title")}
            </CardTitle>
            <p className="text-barTrekker-darkGrey/70 mt-2">
              {t("auth.register.description")}
            </p>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                          {t("common.firstName")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-5 w-5" />
                            <Input
                              {...field}
                              type="text"
                              placeholder={t("auth.register.firstName.placeholder")}
                              className="pl-12 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                              autoComplete="given-name"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                          {t("common.lastName")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-5 w-5" />
                            <Input
                              {...field}
                              type="text"
                              placeholder={t("auth.register.lastName.placeholder")}
                              className="pl-12 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                              autoComplete="family-name"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                        {t("common.email")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-5 w-5" />
                          <Input
                            {...field}
                            type="email"
                            placeholder={t("auth.register.email.placeholder")}
                            className="pl-12 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-barTrekker-darkGrey">
                        {t("common.phone")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-5 w-5" />
                          <Input
                            {...field}
                            type="tel"
                            placeholder={t("auth.register.phone.placeholder")}
                            className="pl-12 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                            autoComplete="tel"
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
                        {t("common.password")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-5 w-5" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder={t("auth.register.password.placeholder")}
                            className="pl-12 pr-12 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                            autoComplete="new-password"
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
                        {t("common.confirmPassword")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-barTrekker-darkGrey/50 h-5 w-5" />
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder={t("auth.register.confirmPassword.placeholder")}
                            className="pl-12 pr-12 bg-barTrekker-lightGrey border-barTrekker-lightGrey focus:border-barTrekker-orange focus:ring-barTrekker-orange"
                            autoComplete="new-password"
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

                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-barTrekker-darkGrey/80">
                          {t("auth.register.terms")} и {t("auth.register.privacy")}
                        </FormLabel>
                        <FormMessage />
                      </div>
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
                      Регистрация...
                    </div>
                  ) : (
                    t("auth.register.button")
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-barTrekker-darkGrey/70">
                {t("auth.register.hasAccount")}{" "}
                <a
                  href="/login"
                  className="text-barTrekker-orange hover:text-barTrekker-orange/80 font-medium transition-colors"
                >
                  {t("auth.register.loginLink")}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
