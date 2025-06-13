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

  // Verify admin session on load
  const { data: adminUser, isLoading: verifyingSession } = useQuery<{ user: { id: number; username: string; isAdmin: boolean } }>({
    queryKey: ['/api/admin/verify'],
    retry: false,
  });

  // Get site content
  const { data: siteContent = [], isLoading: loadingContent } = useQuery<SiteContent[]>({
    queryKey: ['/api/admin/content'],
    enabled: !!adminUser,
  });

  const form = useForm<InsertSiteContent>({
    resolver: zodResolver(insertSiteContentSchema),
    defaultValues: {
      key: '',
      title: '',
      content: '',
      imageUrl: '',
      videoUrl: '',
      linkUrl: '',
      isActive: true,
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/logout'),
    onSuccess: () => {
      navigate('/admin/login');
      toast({
        title: 'Logged out',
        description: 'Admin session ended',
      });
    },
  });

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
      title: content.title ?? '',
      content: content.content ?? '',
      imageUrl: content.imageUrl ?? '',
      videoUrl: content.videoUrl ?? '',
      linkUrl: content.linkUrl ?? '',
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
            onClick={() => logoutMutation.mutate()}
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
                                placeholder="home_hero, about_text, etc."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                                placeholder="Content title"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                    <div className="text-gray-400">No content found</div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {siteContent.map((content: SiteContent) => (
                        <div key={content.id} className="bg-gray-800 p-4 rounded border border-gray-600">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-white font-medium">{content.key}</h3>
                              {content.title && (
                                <p className="text-gray-400 text-sm">{content.title}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleEdit(content)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => deleteContentMutation.mutate(content.id)}
                                variant="destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {content.content && (
                            <p className="text-gray-300 text-sm truncate">{content.content}</p>
                          )}
                          {(content.imageUrl || content.videoUrl || content.linkUrl) && (
                            <div className="text-xs text-gray-500 mt-2">
                              {content.imageUrl && <span>📷 Image </span>}
                              {content.videoUrl && <span>🎥 Video </span>}
                              {content.linkUrl && <span>🔗 Link</span>}
                            </div>
                          )}
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
                      Logged in as: <span className="text-cyan-400">{adminUser.user?.username}</span>
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