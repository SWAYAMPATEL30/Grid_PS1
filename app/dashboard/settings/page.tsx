'use client';

import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Eye, EyeOff, Save } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const { user } = useUser();
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const mockApiKey = 'pk_test_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mockApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Settings</h1>
        <p className="mt-2 text-slate-400">Manage your account and system configuration</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-6">Profile Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                <Input
                  value={user?.name || ''}
                  disabled
                  className="bg-slate-800 text-slate-100 border-slate-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-800 text-slate-100 border-slate-700"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <Input
                  value={user?.role || ''}
                  disabled
                  className="bg-slate-800 text-slate-100 border-slate-700 capitalize"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Zone</label>
                <Input
                  value={user?.zone || ''}
                  disabled
                  className="bg-slate-800 text-slate-100 border-slate-700"
                />
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700 gap-2 mt-4">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-6">API Keys</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Primary API Key</label>
                <div className="flex gap-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={mockApiKey}
                    disabled
                    className="bg-slate-800 text-slate-100 border-slate-700 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    {copied ? '✓' : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Created: January 15, 2024</p>
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700 gap-2 mt-4">
                Generate New Key
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-6">Connected Integrations</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <p className="font-medium text-slate-100">Slack</p>
                  <p className="text-sm text-slate-400">Alert notifications</p>
                </div>
                <span className="px-3 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400">Connected</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <p className="font-medium text-slate-100">Google Analytics</p>
                  <p className="text-sm text-slate-400">Usage tracking</p>
                </div>
                <span className="px-3 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400">Connected</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <p className="font-medium text-slate-100">AWS S3</p>
                  <p className="text-sm text-slate-400">Evidence storage</p>
                </div>
                <span className="px-3 py-1 rounded text-xs font-medium bg-gray-700 text-gray-400">Not Connected</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-6">Notification Preferences</h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium text-slate-100">High Severity Violations</p>
                  <p className="text-xs text-slate-400">Get notified of critical violations</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium text-slate-100">Daily Summary</p>
                  <p className="text-xs text-slate-400">Receive daily analytics summary</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <div>
                  <p className="text-sm font-medium text-slate-100">Appeal Updates</p>
                  <p className="text-xs text-slate-400">Get notified of appeal status changes</p>
                </div>
              </label>

              <Button className="bg-blue-600 hover:bg-blue-700 gap-2 mt-4">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
