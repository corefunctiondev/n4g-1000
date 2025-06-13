import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminLoginSchema, type AdminLogin } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Menu, X, ArrowLeft, Home, Music, Terminal } from 'lucide-react';

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const form = useForm<AdminLogin>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: AdminLogin) => {
      const response = await apiRequest('POST', '/api/admin/login', credentials);
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Store the session data in localStorage for the admin panel
      if (data.session) {
        localStorage.setItem('admin_session', JSON.stringify(data.session));
        localStorage.setItem('admin_user', JSON.stringify(data.user));
      }
      
      toast({
        title: 'Login successful',
        description: 'Welcome to the admin panel',
      });
      
      navigate('/admin/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials or insufficient permissions',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AdminLogin) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pioneer-black to-pioneer-dark-gray relative">
      {/* Header with navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-cyan-400/30">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Home</span>
          </button>
          
          <h1 className="text-cyan-400 font-mono text-lg">ADMIN LOGIN</h1>
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors lg:hidden"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile burger menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-black/95 border-t border-cyan-400/30">
            <div className="flex flex-col p-4 space-y-3">
              <button
                onClick={() => { navigate('/'); setIsMenuOpen(false); }}
                className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition-colors p-2"
              >
                <Home size={20} />
                <span>Home</span>
              </button>
              <button
                onClick={() => { navigate('/cdj'); setIsMenuOpen(false); }}
                className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition-colors p-2"
              >
                <Music size={20} />
                <span>CDJ Interface</span>
              </button>
              <button
                onClick={() => { navigate('/terminal'); setIsMenuOpen(false); }}
                className="flex items-center gap-3 text-cyan-400 hover:text-cyan-300 transition-colors p-2"
              >
                <Terminal size={20} />
                <span>Terminal OS</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 pt-20">
        <Card className="w-full max-w-md bg-gray-900 border-cyan-400/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-cyan-400">ADMIN ACCESS</CardTitle>
            <p className="text-gray-400 text-sm">Secure Authentication Required</p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          className="bg-gray-800 border-gray-600 text-white focus:border-cyan-400"
                          placeholder="Enter admin email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          className="bg-gray-800 border-gray-600 text-white focus:border-cyan-400"
                          placeholder="Enter admin password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {loginMutation.isPending ? 'Authenticating...' : 'LOGIN'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}