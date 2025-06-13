import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Plus, Trash2, Eye, Edit3, Home, User, Music, Headphones, Calendar, Mail, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { SiteContent } from '@/../../shared/schema';
import { useLocation } from 'wouter';

interface ContentManagerProps {
  onLogout?: () => void;
}

const pageConfigs = [
  { id: 'home', name: 'Home Page', icon: Home, description: 'Main landing page content' },
  { id: 'about', name: 'About Page', icon: User, description: 'DJ profiles and bio information' },
  { id: 'sets', name: 'Sets Page', icon: Music, description: 'DJ set listings and details' },
  { id: 'podcasts', name: 'Podcasts Page', icon: Headphones, description: 'Podcast episodes and descriptions' },
  { id: 'bookings', name: 'Bookings Page', icon: Calendar, description: 'Booking information and calendar' },
  { id: 'releases', name: 'Releases Page', icon: Music, description: 'Music releases and tracks' },
  { id: 'mixes', name: 'Mixes Page', icon: Music, description: 'DJ mix collections' },
  { id: 'contact', name: 'Contact Page', icon: Mail, description: 'Contact information and forms' },
  { id: 'general', name: 'Global Settings', icon: Settings, description: 'Site-wide settings and branding' }
];

interface ContentItem {
  id?: number;
  key: string;
  section: string;
  title?: string;
  content?: string;
  value?: string;
  subtitle?: string;
  image_url?: string;
  video_url?: string;
  link_url?: string;
  button_text?: string;
  background_color?: string;
  text_color?: string;
  font_size?: string;
  position: number;
  is_active: boolean;
}

function AdminContentManager({ onLogout }: ContentManagerProps) {
  const [selectedPage, setSelectedPage] = useState('home');
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check authentication on mount
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

  // Fetch content for selected page
  const { data: pageContent = [], isLoading } = useQuery({
    queryKey: [`/api/admin/content`, selectedPage],
    queryFn: async () => {
      const response = await fetch(`/api/admin/content?section=${selectedPage}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('admin_session') || '{}').access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch content');
      return await response.json();
    }
  });

  // Create or update content mutation
  const saveContentMutation = useMutation({
    mutationFn: async (content: Partial<ContentItem>) => {
      const url = content.id ? `/api/admin/content/${content.id}` : '/api/admin/content';
      const method = content.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('admin_session') || '{}').access_token}`
        },
        credentials: 'include',
        body: JSON.stringify(content)
      });
      
      if (!response.ok) throw new Error('Failed to save content');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/content`] });
      setEditingItem(null);
      setIsCreating(false);
      toast({
        title: 'Content saved',
        description: 'Content has been updated successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save content',
        variant: 'destructive'
      });
    }
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${JSON.parse(localStorage.getItem('admin_session') || '{}').access_token}`
        },
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to delete content');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/content`] });
      toast({
        title: 'Content deleted',
        description: 'Content has been removed successfully'
      });
    }
  });

  const handleSave = (content: Partial<ContentItem>) => {
    saveContentMutation.mutate({
      ...content,
      section: selectedPage,
      position: content.position || pageContent.length
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this content?')) {
      deleteContentMutation.mutate(id);
    }
  };

  const startCreating = () => {
    setEditingItem({
      key: '',
      section: selectedPage,
      title: '',
      content: '',
      value: '',
      position: pageContent.length,
      is_active: true
    });
    setIsCreating(true);
  };

  const currentPage = pageConfigs.find(p => p.id === selectedPage);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-black border-b border-cyan-400 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-cyan-400">ADMIN CONTENT MANAGER</div>
            <Badge variant="outline" className="border-green-400 text-green-400">
              {currentPage?.name}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => window.open('/', '_blank')}>
              <Eye className="w-4 h-4 mr-1" />
              View Site
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Page Navigation */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-400 mb-4">SELECT PAGE TO EDIT</div>
            {pageConfigs.map((page) => {
              const Icon = page.icon;
              const isActive = selectedPage === page.id;
              return (
                <button
                  key={page.id}
                  onClick={() => setSelectedPage(page.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{page.name}</div>
                      <div className="text-xs text-gray-400">{page.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-cyan-400">{currentPage?.name}</h1>
              <p className="text-gray-400 mt-1">{currentPage?.description}</p>
            </div>
            <Button onClick={startCreating} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading content...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content List */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-300">Current Content</h2>
                {pageContent.length === 0 ? (
                  <Card className="bg-gray-800 border-gray-600">
                    <CardContent className="p-6 text-center">
                      <div className="text-gray-400">No content found for this page.</div>
                      <Button onClick={startCreating} className="mt-4 bg-cyan-600 hover:bg-cyan-700">
                        Create First Content
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  pageContent.map((item) => (
                    <Card key={item.id} className="bg-gray-800 border-gray-600">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-cyan-400">
                            {item.title || item.key || 'Untitled'}
                          </CardTitle>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingItem(item)}
                              className="border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(item.id!)}
                              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-gray-400">Key:</span> {item.key}</div>
                          {item.subtitle && <div><span className="text-gray-400">Subtitle:</span> {item.subtitle}</div>}
                          {item.content && (
                            <div>
                              <span className="text-gray-400">Content:</span>
                              <div className="text-gray-300 truncate">{item.content}</div>
                            </div>
                          )}
                          {item.value && <div><span className="text-gray-400">Value:</span> {item.value}</div>}
                          <div className="flex items-center space-x-4 pt-2">
                            <Badge variant={item.is_active ? "default" : "secondary"}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <span className="text-xs text-gray-500">Position: {item.position}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Content Editor */}
              {(editingItem || isCreating) && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-300">
                    {isCreating ? 'Create New Content' : 'Edit Content'}
                  </h2>
                  <ContentEditor
                    content={editingItem!}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingItem(null);
                      setIsCreating(false);
                    }}
                    isLoading={saveContentMutation.isPending}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Content Editor Component
interface ContentEditorProps {
  content: ContentItem;
  onSave: (content: ContentItem) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ContentEditor({ content, onSave, onCancel, isLoading }: ContentEditorProps) {
  const [formData, setFormData] = useState<ContentItem>(content);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field: keyof ContentItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-cyan-400">Content Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="basic" className="data-[state=active]:bg-cyan-600">Basic</TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-cyan-600">Content</TabsTrigger>
              <TabsTrigger value="style" className="data-[state=active]:bg-cyan-600">Style</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Content Key *</Label>
                  <Input
                    value={formData.key}
                    onChange={(e) => updateField('key', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="unique_content_key"
                    required
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Position</Label>
                  <Input
                    type="number"
                    value={formData.position}
                    onChange={(e) => updateField('position', parseInt(e.target.value))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Title</Label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Content title"
                />
              </div>

              <div>
                <Label className="text-gray-300">Subtitle</Label>
                <Input
                  value={formData.subtitle || ''}
                  onChange={(e) => updateField('subtitle', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Content subtitle"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="text-gray-300">Active</Label>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label className="text-gray-300">Main Content</Label>
                <Textarea
                  value={formData.content || ''}
                  onChange={(e) => updateField('content', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white h-32"
                  placeholder="Main content text..."
                />
              </div>

              <div>
                <Label className="text-gray-300">Value</Label>
                <Input
                  value={formData.value || ''}
                  onChange={(e) => updateField('value', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Content value"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Image URL</Label>
                  <Input
                    value={formData.image_url || ''}
                    onChange={(e) => updateField('image_url', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Video URL</Label>
                  <Input
                    value={formData.video_url || ''}
                    onChange={(e) => updateField('video_url', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Link URL</Label>
                  <Input
                    value={formData.link_url || ''}
                    onChange={(e) => updateField('link_url', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Button Text</Label>
                  <Input
                    value={formData.button_text || ''}
                    onChange={(e) => updateField('button_text', e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Click here"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Background Color</Label>
                  <Input
                    type="color"
                    value={formData.background_color || '#000000'}
                    onChange={(e) => updateField('background_color', e.target.value)}
                    className="h-10 bg-gray-700 border-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Text Color</Label>
                  <Input
                    type="color"
                    value={formData.text_color || '#ffffff'}
                    onChange={(e) => updateField('text_color', e.target.value)}
                    className="h-10 bg-gray-700 border-gray-600"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Font Size</Label>
                <Select value={formData.font_size || 'medium'} onValueChange={(value) => updateField('font_size', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-gray-700 rounded border border-gray-600">
                <Label className="text-gray-300 text-sm">Preview</Label>
                <div 
                  className="mt-2 p-3 rounded border"
                  style={{
                    backgroundColor: formData.background_color || 'transparent',
                    color: formData.text_color || 'inherit',
                    fontSize: formData.font_size === 'small' ? '0.875rem' : 
                             formData.font_size === 'large' ? '1.25rem' :
                             formData.font_size === 'xl' ? '1.5rem' : '1rem'
                  }}
                >
                  {formData.title || formData.content || formData.value || 'Preview text'}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Content'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Wrapper component for routing
export default function AdminContentManagerWrapper() {
  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    window.location.href = '/admin/login';
  };

  return <AdminContentManager onLogout={handleLogout} />;
}