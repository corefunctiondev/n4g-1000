import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertSiteContentSchema, type SiteContent, type InsertSiteContent } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LogOut, Save, Plus, Edit, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingContent, setEditingContent] = useState<SiteContent | null>(null);

  // Check for stored admin session
  const [adminUser, setAdminUser] = useState<any>(null);
  const [verifyingSession, setVerifyingSession] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('admin_user');
    const storedSession = localStorage.getItem('admin_session');
    
    if (storedUser && storedSession) {
      try {
        const user = JSON.parse(storedUser);
        const session = JSON.parse(storedSession);
        
        // Check if session is still valid
        if (session.expires_at && new Date(session.expires_at * 1000) > new Date()) {
          setAdminUser({ user });
        } else {
          // Session expired
          localStorage.removeItem('admin_user');
          localStorage.removeItem('admin_session');
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_session');
        navigate('/admin/login');
      }
    } else {
      navigate('/admin/login');
    }
    
    setVerifyingSession(false);
  }, [navigate]);

  // Get site content
  const { data: siteContent = [], isLoading: loadingContent } = useQuery<SiteContent[]>({
    queryKey: ['/api/admin/content'],
    enabled: !!adminUser,
  });

  const form = useForm<InsertSiteContent>({
    resolver: zodResolver(insertSiteContentSchema),
    defaultValues: {
      key: '',
      section: 'general',
      title: '',
      subtitle: '',
      content: '',
      imageUrl: '',
      videoUrl: '',
      linkUrl: '',
      buttonText: '',
      backgroundColor: '',
      textColor: '',
      fontSize: 'medium',
      position: 0,
      isActive: true,
    },
  });

  // Logout function for Supabase Auth
  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_session');
    setAdminUser(null);
    navigate('/admin/login');
    toast({
      title: 'Logged out',
      description: 'Admin session ended',
    });
  };

  // Create/update content mutation
  const saveContentMutation = useMutation({
    mutationFn: async (data: InsertSiteContent) => {
      const url = editingContent 
        ? `/api/admin/content/${editingContent.id}`
        : '/api/admin/content';
      
      return apiRequest(editingContent ? 'PUT' : 'POST', url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
      setEditingContent(null);
      form.reset();
      toast({
        title: editingContent ? 'Content updated' : 'Content created',
        description: 'Site content saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save content',
        variant: 'destructive',
      });
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/content/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
      toast({
        title: 'Content deleted',
        description: 'Site content removed successfully',
      });
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!verifyingSession && !adminUser) {
      navigate('/admin/login');
    }
  }, [adminUser, verifyingSession, navigate]);

  const onSubmit = (data: InsertSiteContent) => {
    saveContentMutation.mutate(data);
  };

  const handleEdit = (content: SiteContent) => {
    setEditingContent(content);
    form.reset({
      key: content.key,
      section: content.section,
      title: content.title ?? '',
      subtitle: content.subtitle ?? '',
      content: content.content ?? '',
      imageUrl: content.imageUrl ?? '',
      videoUrl: content.videoUrl ?? '',
      linkUrl: content.linkUrl ?? '',
      buttonText: content.buttonText ?? '',
      backgroundColor: content.backgroundColor ?? '',
      textColor: content.textColor ?? '',
      fontSize: content.fontSize ?? 'medium',
      position: content.position ?? 0,
      isActive: content.isActive,
    });
  };

  const handleCancelEdit = () => {
    setEditingContent(null);
    form.reset();
  };

  if (verifyingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pioneer-black to-pioneer-dark-gray flex items-center justify-center">
        <div className="text-cyan-400">Verifying admin session...</div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pioneer-black to-pioneer-dark-gray p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">ADMIN DASHBOARD</h1>
            <p className="text-gray-400">Content Management System</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="content" className="space-y-6">
          <TabsList className="bg-gray-800 border-cyan-400/30">
            <TabsTrigger value="content" className="data-[state=active]:bg-cyan-600">
              Site Content
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-cyan-600">
              Media Manager
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-600">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Form */}
              <Card className="bg-gray-900 border-cyan-400/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400">
                    {editingContent ? 'Edit Content' : 'Create New Content'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="key"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Content Key</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-gray-800 border-gray-600 text-white"
                                  placeholder="home_hero, nav_menu, etc."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="section"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Section</FormLabel>
                              <FormControl>
                                <select 
                                  {...field}
                                  className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded"
                                >
                                  <option value="header">Header</option>
                                  <option value="hero">Hero Section</option>
                                  <option value="about">About</option>
                                  <option value="services">Services</option>
                                  <option value="portfolio">Portfolio</option>
                                  <option value="contact">Contact</option>
                                  <option value="footer">Footer</option>
                                  <option value="navigation">Navigation</option>
                                  <option value="general">General</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Title</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  className="bg-gray-800 border-gray-600 text-white"
                                  placeholder="Main heading"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="subtitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Subtitle</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  className="bg-gray-800 border-gray-600 text-white"
                                  placeholder="Subheading"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Content</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value || ''}
                                className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                                placeholder="Enter content text"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Image URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ''}
                                className="bg-gray-800 border-gray-600 text-white"
                                placeholder="https://example.com/image.jpg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="videoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Video URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ''}
                                className="bg-gray-800 border-gray-600 text-white"
                                placeholder="https://youtube.com/watch?v=..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="linkUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Link URL</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  className="bg-gray-800 border-gray-600 text-white"
                                  placeholder="https://example.com"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="buttonText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Button Text</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  className="bg-gray-800 border-gray-600 text-white"
                                  placeholder="Learn More, Contact Us, etc."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="backgroundColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Background Color</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  type="color"
                                  className="bg-gray-800 border-gray-600 text-white h-10"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="textColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Text Color</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ''}
                                  type="color"
                                  className="bg-gray-800 border-gray-600 text-white h-10"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fontSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">Font Size</FormLabel>
                              <FormControl>
                                <select 
                                  {...field}
                                  value={field.value || 'medium'}
                                  className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded"
                                >
                                  <option value="small">Small</option>
                                  <option value="medium">Medium</option>
                                  <option value="large">Large</option>
                                  <option value="xl">Extra Large</option>
                                  <option value="2xl">2X Large</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Display Order</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                value={field.value || 0}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="bg-gray-800 border-gray-600 text-white"
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={saveContentMutation.isPending}
                          className="bg-cyan-600 hover:bg-cyan-700 flex-1"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saveContentMutation.isPending ? 'Saving...' : editingContent ? 'Update' : 'Create'}
                        </Button>
                        {editingContent && (
                          <Button
                            type="button"
                            onClick={handleCancelEdit}
                            variant="outline"
                            className="border-gray-600"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Content List */}
              <Card className="bg-gray-900 border-cyan-400/30">
                <CardHeader>
                  <CardTitle className="text-cyan-400">Existing Content</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingContent ? (
                    <div className="text-gray-400">Loading content...</div>
                  ) : siteContent.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                      <p>No content found</p>
                      <p className="text-sm mt-2">Create your first piece of content to start building your website</p>
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-96 overflow-y-auto">
                      {/* Group content by section */}
                      {Object.entries(
                        siteContent.reduce((acc: Record<string, SiteContent[]>, content) => {
                          const section = content.section || 'general';
                          if (!acc[section]) acc[section] = [];
                          acc[section].push(content);
                          return acc;
                        }, {})
                      )
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([section, contents]) => (
                        <div key={section} className="border border-gray-700 rounded">
                          <div className="bg-gray-800 px-3 py-2 border-b border-gray-700">
                            <h4 className="text-cyan-400 font-medium capitalize">{section}</h4>
                          </div>
                          <div className="p-2 space-y-2">
                            {contents
                              .sort((a, b) => (a.position || 0) - (b.position || 0))
                              .map((content: SiteContent) => (
                              <div key={content.id} className="bg-gray-900 p-3 rounded border border-gray-600">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="text-white font-medium text-sm">{content.key}</h5>
                                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">#{content.position || 0}</span>
                                    </div>
                                    {content.title && (
                                      <p className="text-gray-300 text-sm font-medium">{content.title}</p>
                                    )}
                                    {content.subtitle && (
                                      <p className="text-gray-400 text-xs">{content.subtitle}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => handleEdit(content)}
                                      className="bg-blue-600 hover:bg-blue-700 h-7 w-7 p-0"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => deleteContentMutation.mutate(content.id)}
                                      variant="destructive"
                                      className="h-7 w-7 p-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                {content.content && (
                                  <p className="text-gray-300 text-xs mb-2 line-clamp-2">{content.content}</p>
                                )}
                                <div className="flex flex-wrap gap-1 text-xs">
                                  {content.imageUrl && <span className="bg-green-900 text-green-300 px-2 py-1 rounded">Image</span>}
                                  {content.videoUrl && <span className="bg-purple-900 text-purple-300 px-2 py-1 rounded">Video</span>}
                                  {content.linkUrl && <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded">Link</span>}
                                  {content.buttonText && <span className="bg-orange-900 text-orange-300 px-2 py-1 rounded">Button</span>}
                                  {content.backgroundColor && <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded">Styled</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Media Manager Tab */}
          <TabsContent value="media">
            <Card className="bg-gray-900 border-cyan-400/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">Media Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-400">
                  Media upload and management features will be available soon.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-gray-900 border-cyan-400/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-medium mb-2">Admin User</h3>
                    <p className="text-gray-400">
                      Logged in as: <span className="text-cyan-400">{adminUser?.user?.username}</span>
                    </p>
                  </div>
                  <Separator className="bg-gray-600" />
                  <div>
                    <h3 className="text-white font-medium mb-2">Security</h3>
                    <p className="text-gray-400 text-sm">
                      Session expires in 24 hours. All admin actions are logged and secured.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}