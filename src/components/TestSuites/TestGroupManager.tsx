import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, FolderOpen } from 'lucide-react';
import { dataService } from '@/services/dataService';

interface TestGroupManagerProps {
  selectedGroups: string[];
  onGroupsChange: (groups: string[]) => void;
}

export const TestGroupManager: React.FC<TestGroupManagerProps> = ({
  selectedGroups,
  onGroupsChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newGroup, setNewGroup] = useState('');
  const [availableGroups, setAvailableGroups] = useState<string[]>(() => {
    // Get unique groups from existing test suites
    const testSuites = dataService.getTestSuites();
    const groups = new Set<string>();
    testSuites.forEach(suite => {
      suite.groups?.forEach(group => groups.add(group));
    });
    return Array.from(groups).sort();
  });

  const addNewGroup = () => {
    const group = newGroup.trim();
    if (group && !availableGroups.includes(group)) {
      const updatedGroups = [...availableGroups, group].sort();
      setAvailableGroups(updatedGroups);
      setNewGroup('');
      
      // Auto-select the new group
      if (!selectedGroups.includes(group)) {
        onGroupsChange([...selectedGroups, group]);
      }
    }
  };

  const toggleGroup = (group: string) => {
    if (selectedGroups.includes(group)) {
      onGroupsChange(selectedGroups.filter(g => g !== group));
    } else {
      onGroupsChange([...selectedGroups, group]);
    }
  };

  const removeGroup = (group: string) => {
    onGroupsChange(selectedGroups.filter(g => g !== group));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Groups</Label>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Manage Groups
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Test Suite Groups</DialogTitle>
              <DialogDescription>
                Create and assign groups to organize your test suites.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter group name..."
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewGroup()}
                />
                <Button onClick={addNewGroup} disabled={!newGroup.trim()}>
                  Add
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Groups</Label>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {availableGroups.map(group => (
                    <div key={group} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{group}</span>
                      </div>
                      <Button
                        variant={selectedGroups.includes(group) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleGroup(group)}
                      >
                        {selectedGroups.includes(group) ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  ))}
                  {availableGroups.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No groups created yet. Add your first group above.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {selectedGroups.map(group => (
          <Badge key={group} variant="secondary" className="text-sm">
            <FolderOpen className="w-3 h-3 mr-1" />
            {group}
            <button
              type="button"
              onClick={() => removeGroup(group)}
              className="ml-2 hover:bg-destructive hover:text-destructive-foreground rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {selectedGroups.length === 0 && (
          <p className="text-sm text-muted-foreground">No groups assigned</p>
        )}
      </div>
    </div>
  );
};