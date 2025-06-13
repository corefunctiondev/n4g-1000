import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, LogOut } from 'lucide-react';
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
  content?: string;
  button_text?: string;
}

export default function SimpleAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingItems, setEditingItems] = useState<{[key: string]: string}>({});

  // Check authentication
  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    if (!adminSession) {
      setLocation('/admin/login');
      return;
    }

    try {
      const session = JSON.parse(adminSession);
      if (!session.access_token) {
        setLocation('/admin/login');
        return;
      }
    } catch (error) {
      localStorage.removeItem('admin_session');
      setLocation('/admin/login');
    }
  }, [setLocation]);

  // Fetch all content
  const { data: allContent = [], isLoading } = useQuery({
    queryKey: ['/api/admin/content-all'],
    queryFn: async () => {
      const response = await fetch('/api/admin/content', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('admin_session') || '{}').access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch content');
      return await response.json();
    }
  });

  // Update content mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, value, field }: { id: number; value: string; field: string }) => {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('admin_session') || '{}').access_token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          [field]: value
        })
      });
      
      if (!response.ok) throw new Error('Failed to update content');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content-all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content/section'] });
      toast({
        title: 'Updated!',
        description: 'Your changes have been saved'
      });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    setLocation('/admin/login');
  };

  const handleSave = (item: ContentItem, field: string, value: string) => {
    updateMutation.mutate({ id: item.id, value, field });
  };

  const handleInputChange = (itemId: number, value: string) => {
    setEditingItems(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const getDisplayValue = (item: ContentItem) => {
    if (item.title) return item.title;
    if (item.content) return item.content;
    if (item.button_text) return item.button_text;
    return '';
  };

  const getFieldType = (item: ContentItem) => {
    if (item.title) return 'title';
    if (item.content) return 'content';
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

  const sectionNames: {[key: string]: string} = {
    home: 'Home Page',
    about: 'About Page', 
    contact: 'Contact Page',
    sets: 'Sets Page',
    podcasts: 'Podcasts Page',
    bookings: 'Bookings Page',
    releases: 'Releases Page',
    mixes: 'Mixes Page'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/')}
              className="text-white border-gray-600 hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Website
            </Button>
            <h1 className="text-2xl font-bold">Edit Website Content</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {Object.entries(groupedContent).map(([section, items]) => (
            <Card key={section} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-cyan-400 text-xl">
                  {sectionNames[section] || section}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item: ContentItem) => {
                  const currentValue = editingItems[item.id] !== undefined 
                    ? editingItems[item.id] 
                    : getDisplayValue(item);
                  const fieldType = getFieldType(item);
                  
                  return (
                    <div key={item.id} className="border border-gray-600 rounded-lg p-4">
                      <div className="mb-2">
                        <span className="text-sm text-gray-400 capitalize">
                          {item.key.replace(/_/g, ' ')}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        {fieldType === 'content' ? (
                          <Textarea
                            value={currentValue}
                            onChange={(e) => handleInputChange(item.id, e.target.value)}
                            className="flex-1 bg-gray-700 border-gray-600 text-white"
                            rows={3}
                          />
                        ) : (
                          <Input
                            value={currentValue}
                            onChange={(e) => handleInputChange(item.id, e.target.value)}
                            className="flex-1 bg-gray-700 border-gray-600 text-white"
                          />
                        )}
                        
                        <Button
                          onClick={() => handleSave(item, fieldType, currentValue)}
                          disabled={updateMutation.isPending}
                          className="bg-cyan-600 hover:bg-cyan-700"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}