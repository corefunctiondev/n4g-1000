import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, LogOut, Home, User, Mail, Music, Headphones, Calendar, FileText, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface SimpleAdminProps {
  onLogout?: () => void;
}

interface ContentItem {
  id: number;
  key: string;
  section: string;
  title?: string;
  subtitle?: string;
  content?: string;
  value?: string;
  image_url?: string;
  video_url?: string;
  link_url?: string;
  button_text?: string;
}

export default function SimpleAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSection, setSelectedSection] = useState('home');
  const [editingItems, setEditingItems] = useState<{[key: string]: string}>({});

  const { data: allContent = [], isLoading } = useQuery({
    queryKey: ['/api/admin/content'],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: number; field: string; value: string }) => {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) {
        throw new Error('Failed to update content');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
      toast({
        title: "Success",
        description: "Content updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setLocation('/admin/login');
  };

  const handleSave = (item: ContentItem, field: string, value: string) => {
    updateMutation.mutate({ 
      id: item.id, 
      field, 
      value 
    });
    
    // Clear the editing state
    const editKey = `${item.id}-${field}`;
    setEditingItems(prev => {
      const newState = { ...prev };
      delete newState[editKey];
      return newState;
    });
  };

  const getDisplayValue = (item: ContentItem, field: string = '') => {
    if (field === 'link_url') return item.link_url || '';
    if (field === 'image_url') return item.image_url || '';
    if (item.title) return item.title;
    if (item.content) return item.content;
    if (item.value) return item.value;
    if (item.button_text) return item.button_text;
    return '';
  };

  const getFieldType = (item: ContentItem) => {
    if (item.content && item.content.length > 100) return 'content';
    if (item.title) return 'title';
    if (item.content) return 'content';
    if (item.value) return 'value';
    if (item.button_text) return 'button_text';
    return 'title';
  };

  const groupedContent = allContent.reduce((acc: {[key: string]: ContentItem[]}, item: ContentItem) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {});

  const sections = [
    { id: 'home', name: 'Home Page', icon: Home },
    { id: 'about', name: 'About Page', icon: User },
    { id: 'contact', name: 'Contact Page', icon: Mail },
    { id: 'sets', name: 'Sets Page', icon: Music },
    { id: 'podcasts', name: 'Podcasts Page', icon: Headphones },
    { id: 'bookings', name: 'Bookings Page', icon: Calendar },
    { id: 'releases', name: 'Releases Page', icon: FileText },
    { id: 'mixes', name: 'Mixes Page', icon: Radio },
  ];

  const currentSectionItems = groupedContent[selectedSection] || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
        <div>Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-700 p-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-cyan-400 mb-2">Need For Groove</h1>
          <p className="text-sm text-gray-400">Admin Dashboard</p>
        </div>

        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedSection === section.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-cyan-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{section.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-8 pt-6 border-t border-gray-700 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/')}
            className="w-full border-cyan-600 text-cyan-400 hover:bg-cyan-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Site
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full border-red-600 text-red-400 hover:bg-red-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">
            {sections.find(s => s.id === selectedSection)?.name || 'Edit Content'}
          </h2>
          <p className="text-gray-400 mt-1">Edit the content for this page</p>
        </div>

        <div className="space-y-4">
          {currentSectionItems.map((item: ContentItem) => {
            const fieldType = getFieldType(item);
            const editKey = `${item.id}-${fieldType}`;
            const currentValue = editingItems[editKey] ?? getDisplayValue(item);
            
            return (
              <Card key={item.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="text-sm text-cyan-400 font-medium">
                      {item.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        {fieldType === 'content' && currentValue && currentValue.length > 100 ? (
                          <Textarea
                            value={currentValue}
                            onChange={(e) => setEditingItems(prev => ({
                              ...prev,
                              [editKey]: e.target.value
                            }))}
                            className="bg-gray-700 border-gray-600 text-gray-100 min-h-[100px]"
                            placeholder="Enter content..."
                          />
                        ) : (
                          <Input
                            value={currentValue}
                            onChange={(e) => setEditingItems(prev => ({
                              ...prev,
                              [editKey]: e.target.value
                            }))}
                            className="bg-gray-700 border-gray-600 text-gray-100"
                            placeholder="Enter text..."
                          />
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleSave(item, fieldType, currentValue)}
                        disabled={updateMutation.isPending}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>

                    {/* Special fields for show content */}
                    {item.key.includes('show') && (
                      <div className="space-y-3 border-t border-gray-600 pt-3">
                        <div className="text-xs text-gray-400">Show Details</div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <label className="text-xs text-gray-400 block mb-1">Show Link URL</label>
                            <Input
                              value={editingItems[`${item.id}-link_url`] ?? getDisplayValue(item, 'link_url')}
                              onChange={(e) => setEditingItems(prev => ({
                                ...prev,
                                [`${item.id}-link_url`]: e.target.value
                              }))}
                              className="bg-gray-700 border-gray-600 text-gray-100"
                              placeholder="https://example.com/event"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSave(item, 'link_url', editingItems[`${item.id}-link_url`] ?? getDisplayValue(item, 'link_url'))}
                            disabled={updateMutation.isPending}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white mt-5"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <label className="text-xs text-gray-400 block mb-1">Show Image URL</label>
                            <Input
                              value={editingItems[`${item.id}-image_url`] ?? getDisplayValue(item, 'image_url')}
                              onChange={(e) => setEditingItems(prev => ({
                                ...prev,
                                [`${item.id}-image_url`]: e.target.value
                              }))}
                              className="bg-gray-700 border-gray-600 text-gray-100"
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSave(item, 'image_url', editingItems[`${item.id}-image_url`] ?? getDisplayValue(item, 'image_url'))}
                            disabled={updateMutation.isPending}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white mt-5"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}