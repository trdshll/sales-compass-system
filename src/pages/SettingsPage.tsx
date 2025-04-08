
import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Bell, Shield, Palette, Save } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');

  const [settings, setSettings] = useState({
    account: {
      name: user?.name || '',
      email: user?.email || '',
      bio: "I'm a sales professional focused on building great customer relationships.",
    },
    notifications: {
      emailNotifications: true,
      salesAlerts: true,
      marketingEmails: false,
      monthlyReports: true,
    },
    security: {
      twoFactorAuth: false,
      passwordLastChanged: '2 months ago',
    },
    appearance: {
      theme: 'light',
    }
  });

  const handleInputChange = (section: string, field: string, value: any) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section as keyof typeof settings],
        [field]: value,
      }
    });
  };

  const handleSave = (section: string) => {
    toast({
      title: "Settings updated",
      description: `Your ${section} settings have been saved successfully.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User size={16} />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell size={16} />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield size={16} />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette size={16} />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your account details and profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={settings.account.name}
                      onChange={(e) => handleInputChange('account', 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={settings.account.email}
                      onChange={(e) => handleInputChange('account', 'email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    value={settings.account.bio}
                    onChange={(e) => handleInputChange('account', 'bio', e.target.value)}
                    placeholder="Tell us a bit about yourself"
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSave('account')}
                  className="gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive important updates via email
                    </p>
                  </div>
                  <Switch 
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      handleInputChange('notifications', 'emailNotifications', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Sales Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new sales and opportunities
                    </p>
                  </div>
                  <Switch 
                    checked={settings.notifications.salesAlerts}
                    onCheckedChange={(checked) => 
                      handleInputChange('notifications', 'salesAlerts', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive promotional materials and offers
                    </p>
                  </div>
                  <Switch 
                    checked={settings.notifications.marketingEmails}
                    onCheckedChange={(checked) => 
                      handleInputChange('notifications', 'marketingEmails', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Monthly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive monthly sales performance reports
                    </p>
                  </div>
                  <Switch 
                    checked={settings.notifications.monthlyReports}
                    onCheckedChange={(checked) => 
                      handleInputChange('notifications', 'monthlyReports', checked)
                    }
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSave('notification')}
                  className="gap-2"
                >
                  <Save size={16} />
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and account security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">
                      Last changed: {settings.security.passwordLastChanged}
                    </p>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Additional security by requiring a verification code
                      </p>
                    </div>
                    <Switch 
                      checked={settings.security.twoFactorAuth}
                      onCheckedChange={(checked) => 
                        handleInputChange('security', 'twoFactorAuth', checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSave('security')}
                  className="gap-2"
                >
                  <Save size={16} />
                  Save Security Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize how the application looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className={`border-2 rounded-md p-4 flex items-center justify-center cursor-pointer ${
                          settings.appearance.theme === 'light' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted'
                        }`}
                        onClick={() => handleInputChange('appearance', 'theme', 'light')}
                      >
                        <div className="text-center">
                          <div className="h-10 w-10 rounded-full bg-white border mx-auto mb-2"></div>
                          <span className="text-sm font-medium">Light</span>
                        </div>
                      </div>
                      <div
                        className={`border-2 rounded-md p-4 flex items-center justify-center cursor-pointer ${
                          settings.appearance.theme === 'dark' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted'
                        }`}
                        onClick={() => handleInputChange('appearance', 'theme', 'dark')}
                      >
                        <div className="text-center">
                          <div className="h-10 w-10 rounded-full bg-gray-900 border mx-auto mb-2"></div>
                          <span className="text-sm font-medium">Dark</span>
                        </div>
                      </div>
                      <div
                        className={`border-2 rounded-md p-4 flex items-center justify-center cursor-pointer ${
                          settings.appearance.theme === 'system' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-muted'
                        }`}
                        onClick={() => handleInputChange('appearance', 'theme', 'system')}
                      >
                        <div className="text-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-white to-gray-900 border mx-auto mb-2"></div>
                          <span className="text-sm font-medium">System</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSave('appearance')}
                  className="gap-2"
                >
                  <Save size={16} />
                  Save Appearance Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
