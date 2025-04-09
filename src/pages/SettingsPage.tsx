
import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Bell, Shield, Palette, Save, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';

const SettingsPage = () => {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Enhanced settings state with dirty flags to track changes
  const [settings, setSettings] = useState({
    account: {
      name: user?.name || '',
      email: user?.email || '',
      bio: "I'm a sales professional focused on building great customer relationships.",
      dirty: false
    },
    notifications: {
      emailNotifications: true,
      salesAlerts: true,
      marketingEmails: false,
      monthlyReports: true,
      dirty: false
    },
    security: {
      twoFactorAuth: false,
      passwordLastChanged: '2 months ago',
      dirty: false
    },
    appearance: {
      theme: 'light',
      dirty: false
    }
  });

  // Update settings when user data changes
  useEffect(() => {
    if (user) {
      setSettings(prevSettings => ({
        ...prevSettings,
        account: {
          ...prevSettings.account,
          name: user.name || prevSettings.account.name,
          email: user.email || prevSettings.account.email
        }
      }));
    }
  }, [user]);

  const handleInputChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
        dirty: true
      }
    });
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm({
      ...passwordForm,
      [field]: value
    });
    
    // Mark security as dirty
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        dirty: true
      }
    });
  };

  // Apply theme changes immediately
  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'system');
    root.classList.add(settings.appearance.theme);
    
    // Store theme preference in localStorage for persistence
    if (settings.appearance.dirty) {
      localStorage.setItem('theme', settings.appearance.theme);
    }
  }, [settings.appearance.theme]);

  const handleSave = async (section) => {
    setIsSaving(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      switch (section) {
        case 'account':
          // Update user profile in Auth context
          if (updateUserProfile) {
            await updateUserProfile({
              name: settings.account.name,
              bio: settings.account.bio
            });
          }
          
          // Reset dirty flag
          setSettings({
            ...settings,
            account: {
              ...settings.account,
              dirty: false
            }
          });
          break;
          
        case 'notification':
          // Save notification preferences (in real app, would call API)
          localStorage.setItem('notificationPreferences', JSON.stringify({
            emailNotifications: settings.notifications.emailNotifications,
            salesAlerts: settings.notifications.salesAlerts,
            marketingEmails: settings.notifications.marketingEmails,
            monthlyReports: settings.notifications.monthlyReports
          }));
          
          // Reset dirty flag
          setSettings({
            ...settings,
            notifications: {
              ...settings.notifications,
              dirty: false
            }
          });
          break;
          
        case 'security':
          // Password validation
          if (section === 'security' && passwordForm.newPassword) {
            if (passwordForm.newPassword !== passwordForm.confirmPassword) {
              toast.error("New passwords don't match");
              setIsSaving(false);
              return;
            }
            
            if (passwordForm.newPassword.length < 8) {
              toast.error("Password must be at least 8 characters");
              setIsSaving(false);
              return;
            }
            
            // Would handle password change via API here
            setPasswordForm({
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            });
          }
          
          // Save 2FA preferences
          localStorage.setItem('securityPreferences', JSON.stringify({
            twoFactorAuth: settings.security.twoFactorAuth
          }));
          
          // Reset dirty flag
          setSettings({
            ...settings,
            security: {
              ...settings.security,
              passwordLastChanged: 'just now',
              dirty: false
            }
          });
          break;
          
        case 'appearance':
          // Theme changes are already applied in the useEffect
          // Reset dirty flag
          setSettings({
            ...settings,
            appearance: {
              ...settings.appearance,
              dirty: false
            }
          });
          break;
      }
      
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully`);
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      toast.error(`Failed to save ${section} settings`);
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved preferences on initial load
  useEffect(() => {
    // Load notification preferences
    const savedNotifications = localStorage.getItem('notificationPreferences');
    if (savedNotifications) {
      const parsedNotifications = JSON.parse(savedNotifications);
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          ...parsedNotifications,
          dirty: false
        }
      }));
    }
    
    // Load security preferences
    const savedSecurity = localStorage.getItem('securityPreferences');
    if (savedSecurity) {
      const parsedSecurity = JSON.parse(savedSecurity);
      setSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          ...parsedSecurity,
          dirty: false
        }
      }));
    }
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setSettings(prev => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          theme: savedTheme,
          dirty: false
        }
      }));
    }
  }, []);

  return (
    <DashboardLayout>
      <ScrollArea className="h-full">
        <div className="space-y-6 p-4 pb-16">
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
                        disabled  // Email usually requires special verification flow
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Contact support to change your email address</p>
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

                  <Collapsible className="w-full">
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="text-sm mt-2">
                        Advanced Settings
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="downloadData" />
                          <Label htmlFor="downloadData">Request data export</Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">
                          We'll email you a link to download all your data within 24 hours
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    {settings.account.dirty ? "Unsaved changes" : "No changes to save"}
                  </p>
                  <Button 
                    onClick={() => handleSave('account')}
                    className="gap-2"
                    disabled={!settings.account.dirty || isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
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
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    {settings.notifications.dirty ? "Unsaved changes" : "No changes to save"}
                  </p>
                  <Button 
                    onClick={() => handleSave('notification')}
                    className="gap-2"
                    disabled={!settings.notifications.dirty || isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
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
                        <Input 
                          id="current-password" 
                          type="password" 
                          value={passwordForm.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                          id="new-password" 
                          type="password" 
                          value={passwordForm.newPassword}
                          onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password" 
                          value={passwordForm.confirmPassword}
                          onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        />
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
                    
                    {settings.security.twoFactorAuth && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-md">
                        <p className="text-sm">
                          Two-factor authentication is enabled. You'll receive a verification code via email when signing in from a new device.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    {settings.security.dirty ? "Unsaved changes" : "No changes to save"}
                  </p>
                  <Button 
                    onClick={() => handleSave('security')}
                    className="gap-2"
                    disabled={
                      (!settings.security.dirty && 
                      !passwordForm.currentPassword && 
                      !passwordForm.newPassword) || 
                      isSaving
                    }
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
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
                          className={`border-2 rounded-md p-4 flex items-center justify-center cursor-pointer transition-all ${
                            settings.appearance.theme === 'light' 
                              ? 'border-primary bg-primary/10 shadow-md' 
                              : 'border-muted hover:border-muted-foreground/50'
                          }`}
                          onClick={() => handleInputChange('appearance', 'theme', 'light')}
                        >
                          <div className="text-center">
                            <div className="h-10 w-10 rounded-full bg-white border mx-auto mb-2 shadow-inner"></div>
                            <span className="text-sm font-medium">Light</span>
                          </div>
                        </div>
                        <div
                          className={`border-2 rounded-md p-4 flex items-center justify-center cursor-pointer transition-all ${
                            settings.appearance.theme === 'dark' 
                              ? 'border-primary bg-primary/10 shadow-md' 
                              : 'border-muted hover:border-muted-foreground/50'
                          }`}
                          onClick={() => handleInputChange('appearance', 'theme', 'dark')}
                        >
                          <div className="text-center">
                            <div className="h-10 w-10 rounded-full bg-gray-900 border mx-auto mb-2 shadow-inner"></div>
                            <span className="text-sm font-medium">Dark</span>
                          </div>
                        </div>
                        <div
                          className={`border-2 rounded-md p-4 flex items-center justify-center cursor-pointer transition-all ${
                            settings.appearance.theme === 'system' 
                              ? 'border-primary bg-primary/10 shadow-md' 
                              : 'border-muted hover:border-muted-foreground/50'
                          }`}
                          onClick={() => handleInputChange('appearance', 'theme', 'system')}
                        >
                          <div className="text-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-white to-gray-900 border mx-auto mb-2 shadow-inner"></div>
                            <span className="text-sm font-medium">System</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 space-y-4">
                      <h3 className="text-lg font-medium">Accessibility</h3>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Reduced Motion</Label>
                          <p className="text-sm text-muted-foreground">
                            Limit the amount of animations in the interface
                          </p>
                        </div>
                        <Switch 
                          onCheckedChange={(checked) => 
                            handleInputChange('appearance', 'reducedMotion', checked)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-muted-foreground">
                    {settings.appearance.dirty ? "Theme applied automatically" : "No changes made"}
                  </p>
                  <Button 
                    onClick={() => handleSave('appearance')}
                    className="gap-2"
                    disabled={!settings.appearance.dirty || isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
                    Save Appearance Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </DashboardLayout>
  );
};

export default SettingsPage;
