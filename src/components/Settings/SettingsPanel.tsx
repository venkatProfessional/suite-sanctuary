import React, { useState } from 'react';
import { Download, Upload, Trash2, Moon, Sun, Globe, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { dataService } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';

interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'es';
  autoSave: boolean;
  notifications: boolean;
  exportFormat: 'xlsx' | 'csv' | 'json';
  itemsPerPage: number;
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    language: 'en',
    autoSave: true,
    notifications: true,
    exportFormat: 'xlsx',
    itemsPerPage: 10,
  });
  const { toast } = useToast();

  const handleExportData = () => {
    try {
      const data = dataService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tcmt-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Data exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        const success = dataService.importData(jsonData);
        
        if (success) {
          toast({
            title: 'Success',
            description: 'Data imported successfully',
          });
          // Reload the page to reflect imported data
          window.location.reload();
        } else {
          throw new Error('Invalid data format');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to import data. Please check the file format.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    try {
      dataService.clearAllData();
      toast({
        title: 'Success',
        description: 'All data cleared successfully',
      });
      // Reload the page to reflect cleared data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear data',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSettings = () => {
    // In a real app, this would save settings to localStorage or backend
    localStorage.setItem('tcmt-settings', JSON.stringify(settings));
    toast({
      title: 'Success',
      description: 'Settings saved successfully',
    });
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your test case management preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sun className="h-5 w-5" />
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('theme', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="language">Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value: 'en' | 'es') => updateSetting('language', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autosave">Auto-save</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically save changes as you type
                </p>
              </div>
              <Switch
                id="autosave"
                checked={settings.autoSave}
                onCheckedChange={(checked) => updateSetting('autoSave', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications for important events
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting('notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="export-format">Default Export Format</Label>
              <Select
                value={settings.exportFormat}
                onValueChange={(value: 'xlsx' | 'csv' | 'json') => updateSetting('exportFormat', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="json">JSON (.json)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="items-per-page">Items per page</Label>
              <Select
                value={settings.itemsPerPage.toString()}
                onValueChange={(value) => updateSetting('itemsPerPage', parseInt(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label>Export Data</Label>
              <p className="text-sm text-muted-foreground">
                Download all your data as a backup file
              </p>
              <Button onClick={handleExportData} variant="outline" className="w-fit">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            <Separator />

            <div className="flex flex-col space-y-2">
              <Label>Import Data</Label>
              <p className="text-sm text-muted-foreground">
                Restore data from a backup file
              </p>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="w-fit"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col space-y-2">
              <Label className="text-destructive">Danger Zone</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete all data. This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-fit">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all
                      test cases, test runs, and related data from your browser's
                      local storage.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearData}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}