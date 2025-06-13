import { useState, useEffect } from 'react';
import { TrackManager } from './track-manager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Music, Settings, Database, FileText, BarChart3 } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [siteConfig, setSiteConfig] = useState({
    siteName: 'Need For Groove',
    tagline: 'NYC • HOUSE • TECHNO',
    members: [
      {
        name: 'Alex Rodriguez',
        location: 'Brooklyn, NY',
        style: 'Deep House, Progressive',
        status: 'ACTIVE'
      },
      {
        name: 'Jordan Chen',
        location: 'Manhattan, NY',
        style: 'Techno, Minimal',
        status: 'ACTIVE'
      }
    ],
    upcomingEvents: [
      {
        venue: 'Brooklyn Warehouse',
        date: '2024-02-15',
        time: '23:00',
        status: 'CONFIRMED'
      }
    ]
  });

  return (
    <div className="terminal-content p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold terminal-command">$ sudo ./admin_panel.sh --authenticated</div>
        <Button onClick={onLogout} className="btn-terminal">
          Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-nfg-bg-secondary">
          <TabsTrigger value="overview" className="data-[state=active]:bg-nfg-cyan-primary data-[state=active]:text-black">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tracks" className="data-[state=active]:bg-nfg-cyan-primary data-[state=active]:text-black">
            <Music className="w-4 h-4 mr-2" />
            Tracks
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-nfg-cyan-primary data-[state=active]:text-black">
            <FileText className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-nfg-cyan-primary data-[state=active]:text-black">
            <User className="w-4 h-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-nfg-cyan-primary data-[state=active]:text-black">
            <Database className="w-4 h-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-nfg-cyan-primary data-[state=active]:text-black">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="content-card p-4">
              <div className="terminal-prompt mb-2">SYSTEM STATUS</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="terminal-text">Audio Engine:</span>
                  <span className="terminal-success">ONLINE</span>
                </div>
                <div className="flex justify-between">
                  <span className="terminal-text">CDJ Interface:</span>
                  <span className="terminal-success">READY</span>
                </div>
                <div className="flex justify-between">
                  <span className="terminal-text">Database:</span>
                  <span className="terminal-success">CONNECTED</span>
                </div>
              </div>
            </div>

            <div className="content-card p-4">
              <div className="terminal-prompt mb-2">QUICK STATS</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="terminal-text">Total Tracks:</span>
                  <span className="text-nfg-cyan-primary">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="terminal-text">Total Plays:</span>
                  <span className="text-nfg-cyan-primary">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="terminal-text">Storage Used:</span>
                  <span className="text-nfg-cyan-primary">0 MB</span>
                </div>
              </div>
            </div>

            <div className="content-card p-4">
              <div className="terminal-prompt mb-2">RECENT ACTIVITY</div>
              <div className="space-y-1 text-sm terminal-text">
                <div>• Admin panel accessed</div>
                <div>• System health check passed</div>
                <div>• CDJ interface initialized</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tracks">
          <TrackManager />
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <ContentManager siteConfig={siteConfig} setSiteConfig={setSiteConfig} />
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <MemberManager members={siteConfig.members} />
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <DatabaseManager />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SettingsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContentManager({ siteConfig, setSiteConfig }: any) {
  return (
    <div className="space-y-4">
      <div className="text-lg terminal-command">$ ./content_manager.sh</div>
      
      <div className="content-card p-4">
        <div className="terminal-prompt mb-3">SITE CONFIGURATION</div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm terminal-text mb-1">Site Name:</label>
            <input
              type="text"
              value={siteConfig.siteName}
              onChange={(e) => setSiteConfig({...siteConfig, siteName: e.target.value})}
              className="terminal-input w-full p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm terminal-text mb-1">Tagline:</label>
            <input
              type="text"
              value={siteConfig.tagline}
              onChange={(e) => setSiteConfig({...siteConfig, tagline: e.target.value})}
              className="terminal-input w-full p-2 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberManager({ members }: any) {
  return (
    <div className="space-y-4">
      <div className="text-lg terminal-command">$ ./member_manager.sh</div>
      
      <div className="content-card p-4">
        <div className="terminal-prompt mb-3">DJ MEMBERS</div>
        <div className="space-y-3">
          {members.map((member: any, index: number) => (
            <div key={index} className="border border-nfg-gray-border p-3 rounded">
              <div className="font-bold terminal-text">{member.name}</div>
              <div className="text-sm terminal-output">{member.location}</div>
              <div className="text-sm terminal-output">{member.style}</div>
              <div className={`text-sm ${member.status === 'ACTIVE' ? 'terminal-success' : 'terminal-error'}`}>
                Status: {member.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DatabaseManager() {
  return (
    <div className="space-y-4">
      <div className="text-lg terminal-command">$ ./database_manager.sh</div>
      
      <div className="content-card p-4">
        <div className="terminal-prompt mb-3">DATABASE STATUS</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="terminal-text">Connection:</span>
            <span className="terminal-success">ACTIVE</span>
          </div>
          <div className="flex justify-between">
            <span className="terminal-text">Tables:</span>
            <span className="text-nfg-cyan-primary">2</span>
          </div>
          <div className="flex justify-between">
            <span className="terminal-text">Storage:</span>
            <span className="text-nfg-cyan-primary">Supabase</span>
          </div>
        </div>
      </div>

      <div className="content-card p-4">
        <div className="terminal-prompt mb-3">AVAILABLE OPERATIONS</div>
        <div className="space-y-2">
          <Button className="btn-terminal w-full">Backup Database</Button>
          <Button className="btn-terminal w-full">Clear Cache</Button>
          <Button className="btn-terminal w-full">Run Maintenance</Button>
        </div>
      </div>
    </div>
  );
}

function SettingsManager() {
  const [settings, setSettings] = useState({
    scanlines: true,
    soundFX: true,
    autoSave: true,
    notifications: true
  });

  return (
    <div className="space-y-4">
      <div className="text-lg terminal-command">$ ./settings_manager.sh</div>
      
      <div className="content-card p-4">
        <div className="terminal-prompt mb-3">SYSTEM PREFERENCES</div>
        <div className="space-y-4">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="terminal-text capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <button
                onClick={() => setSettings({...settings, [key]: !value})}
                className={`toggle-switch ${value ? 'active' : 'inactive'}`}
              >
                <div className="toggle-handle"></div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}