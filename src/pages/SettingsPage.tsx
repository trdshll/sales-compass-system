
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // User profile settings
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileDirty, setProfileDirty] = useState(false);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(() => {
    const saved = localStorage.getItem('emailNotifications');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [pushNotifications, setPushNotifications] = useState(() => {
    const saved = localStorage.getItem('pushNotifications');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [salesAlerts, setSalesAlerts] = useState(() => {
    const saved = localStorage.getItem('salesAlerts');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [notificationsDirty, setNotificationsDirty] = useState(false);

  // Appearance settings
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'system';
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved || 'medium';
  });
  const [appearanceDirty, setAppearanceDirty] = useState(false);

  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    const saved = localStorage.getItem('twoFactorEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [sessionTimeout, setSessionTimeout] = useState(() => {
    const saved = localStorage.getItem('sessionTimeout');
    return saved || '30';
  });
  const [securityDirty, setSecurityDirty] = useState(false);

  // Update localStorage when settings change
  useEffect(() => {
    if (notificationsDirty) {
      localStorage.setItem('emailNotifications', JSON.stringify(emailNotifications));
      localStorage.setItem('pushNotifications', JSON.stringify(pushNotifications));
      localStorage.setItem('salesAlerts', JSON.stringify(salesAlerts));
    }
  }, [emailNotifications, pushNotifications, salesAlerts, notificationsDirty]);

  useEffect(() => {
    if (appearanceDirty) {
      localStorage.setItem('theme', theme);
      localStorage.setItem('fontSize', fontSize);
      
      // Apply theme immediately
      document.documentElement.classList.remove('light', 'dark');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.add('light');
        }
      }
      
      // Apply font size
      document.documentElement.style.fontSize = 
        fontSize === 'small' ? '14px' : 
        fontSize === 'large' ? '18px' : '16px';
    }
  }, [theme, fontSize, appearanceDirty]);

  useEffect(() => {
    if (securityDirty) {
      localStorage.setItem('twoFactorEnabled', JSON.stringify(twoFactorEnabled));
      localStorage.setItem('sessionTimeout', sessionTimeout);
    }
  }, [twoFactorEnabled, sessionTimeout, securityDirty]);

  const handleSaveProfile = () => {
    // Here we would typically call an API to update the user profile
    // Since we don't have that functionality, we'll just show a success toast
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    });
    setProfileDirty(false);
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification preferences saved",
      description: "Your notification settings have been updated.",
    });
    setNotificationsDirty(false);
  };

  const handleSaveAppearance = () => {
    toast({
      title: "Appearance settings saved",
      description: "Your appearance preferences have been updated.",
    });
    setAppearanceDirty(false);
  };

  const handleSaveSecurity = () => {
    toast({
      title: "Security settings saved",
      description: "Your security preferences have been updated.",
    });
    setSecurityDirty(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences.</p>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account details. This information will be displayed publicly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => {
                        setName(e.target.value);
                        setProfileDirty(true);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setProfileDirty(true);
                      }}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={!profileDirty}
                  >
                    Save changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Configure how you receive notifications and alerts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch 
                      checked={emailNotifications} 
                      onCheckedChange={(checked) => {
                        setEmailNotifications(checked);
                        setNotificationsDirty(true);
                      }} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive alerts on your device</p>
                    </div>
                    <Switch 
                      checked={pushNotifications} 
                      onCheckedChange={(checked) => {
                        setPushNotifications(checked);
                        setNotificationsDirty(true);
                      }} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sales Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified about new sales</p>
                    </div>
                    <Switch 
                      checked={salesAlerts} 
                      onCheckedChange={(checked) => {
                        setSalesAlerts(checked);
                        setNotificationsDirty(true);
                      }} 
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveNotifications} 
                    disabled={!notificationsDirty}
                  >
                    Save preferences
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Manage your account security preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Switch 
                      checked={twoFactorEnabled} 
                      onCheckedChange={(checked) => {
                        setTwoFactorEnabled(checked);
                        setSecurityDirty(true);
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Session Timeout (minutes)</Label>
                    <Input 
                      id="timeout" 
                      type="number" 
                      min="5" 
                      max="120" 
                      value={sessionTimeout} 
                      onChange={(e) => {
                        setSessionTimeout(e.target.value);
                        setSecurityDirty(true);
                      }} 
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveSecurity} 
                    disabled={!securityDirty}
                  >
                    Save security settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>
                    Customize how the application looks and feels.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <select 
                      id="theme" 
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={theme}
                      onChange={(e) => {
                        setTheme(e.target.value);
                        setAppearanceDirty(true);
                      }}
                    >
                      <option value="system">System Preference</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="font-size">Font Size</Label>
                    <select 
                      id="font-size" 
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={fontSize}
                      onChange={(e) => {
                        setFontSize(e.target.value);
                        setAppearanceDirty(true);
                      }}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleSaveAppearance} 
                    disabled={!appearanceDirty}
                  >
                    Save appearance settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
