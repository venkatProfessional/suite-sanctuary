import React from 'react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your test case management preferences
        </p>
      </div>
      
      <div className="bg-card border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Settings feature coming soon...</p>
      </div>
    </div>
  );
};

export default Settings;