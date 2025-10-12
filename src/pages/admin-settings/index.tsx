import { AdminLayout } from "@/core/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/inputs/input";
import { Textarea } from "@/core/components/ui/inputs/textarea";
import { Label } from "@/core/components/ui/label";
import {
  Settings,
  Mail,
  FileText,
  Save,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { db } from "@/modules/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

interface AppSettings {
  termsAndConditions: string;
  supportEmail: string;
  privacyPolicy?: string;
}

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<AppSettings>({
    termsAndConditions: "",
    supportEmail: "support@bartrekker.com",
    privacyPolicy: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from Firebase
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "appSettings", "config");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as AppSettings;
        setSettings(data);
      } else {
        // Set default Terms and Conditions if doesn't exist
        const defaultSettings: AppSettings = {
          termsAndConditions: getDefaultTermsAndConditions(),
          supportEmail: "support@bartrekker.com",
          privacyPolicy: "",
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, "appSettings", "config");
      await setDoc(docRef, settings);

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const getDefaultTermsAndConditions = () => {
    return `1. Acceptance of Terms

By accessing and using the BarTrekker application, you accept and agree to be bound by the terms and provision of this agreement.

2. Age Requirement

You must be at least 18 years old to use this application. By using the service, you represent and warrant that you are at least 18 years of age.

3. User Account

You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.

4. Privacy Policy

Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.

5. Prohibited Uses

You may not use the service for any unlawful purpose or to solicit others to perform or participate in any unlawful acts.

6. Intellectual Property

The service and its original content, features, and functionality are and will remain the exclusive property of BarTrekker and its licensors.

7. Termination

We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion.

8. Limitation of Liability

In no event shall BarTrekker, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.

9. Governing Law

These Terms shall be interpreted and governed by the laws of the jurisdiction in which BarTrekker operates.

10. Changes to Terms

We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-8 w-8" />
              App Settings
            </h1>
            <p className="text-gray-600">Configure app-wide settings and content</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadSettings}
              disabled={saving}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Support Email */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Support Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">
                  Email address for user support and inquiries
                </Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, supportEmail: e.target.value })
                  }
                  placeholder="support@bartrekker.com"
                />
                <p className="text-sm text-gray-500">
                  This email will be displayed in the app for user support
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Terms and Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="termsAndConditions">
                  Full text of Terms and Conditions
                </Label>
                <Textarea
                  id="termsAndConditions"
                  value={settings.termsAndConditions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      termsAndConditions: e.target.value,
                    })
                  }
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Enter terms and conditions..."
                />
                <p className="text-sm text-gray-500">
                  This text will be displayed in the mobile app's Terms and Conditions screen
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Policy (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Privacy Policy (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="privacyPolicy">
                  Full text of Privacy Policy
                </Label>
                <Textarea
                  id="privacyPolicy"
                  value={settings.privacyPolicy || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      privacyPolicy: e.target.value,
                    })
                  }
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="Enter privacy policy..."
                />
                <p className="text-sm text-gray-500">
                  Optional: Privacy policy for the app
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
