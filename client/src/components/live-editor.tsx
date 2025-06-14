import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { X, Save, Edit3, Eye, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface LiveEditorProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onLogout: () => void;
}

interface EditableElement {
  id: string;
  element: HTMLElement;
  originalContent: string;
  contentKey: string;
  section: string;
  fieldType: string;
  dbId?: number;
}

export function LiveEditor({ isEditMode, onToggleEditMode, onLogout }: LiveEditorProps) {
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editableElements, setEditableElements] = useState<EditableElement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Find and mark all editable elements
  useEffect(() => {
    if (!isEditMode) {
      // Clean up when exiting edit mode
      document.querySelectorAll('.live-editor-highlight').forEach(el => {
        el.classList.remove('live-editor-highlight');
      });
      setEditableElements([]);
      return;
    }

    const elements: EditableElement[] = [];
    
    // Find elements with data-content-key attribute
    document.querySelectorAll('[data-content-key]').forEach((el, index) => {
      if (el instanceof HTMLElement) {
        const contentKey = el.getAttribute('data-content-key') || '';
        const section = el.getAttribute('data-section') || 'general';
        const fieldType = el.getAttribute('data-field-type') || 'content';
        const dbId = el.getAttribute('data-db-id');
        
        const editableElement: EditableElement = {
          id: `editable-${index}`,
          element: el,
          originalContent: el.textContent || el.getAttribute('src') || el.getAttribute('href') || '',
          contentKey,
          section,
          fieldType,
          dbId: dbId ? parseInt(dbId) : undefined
        };
        
        elements.push(editableElement);
        
        // Add visual indicators
        el.classList.add('live-editor-highlight');
        el.style.cursor = 'pointer';
        el.style.position = 'relative';
        
        // Add click handler
        const handleClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedElement(editableElement);
          setEditValue(editableElement.originalContent);
        };
        
        el.addEventListener('click', handleClick);
        
        // Store the handler for cleanup
        (el as any).__liveEditorHandler = handleClick;
      }
    });
    
    setEditableElements(elements);
    
    // Cleanup function
    return () => {
      elements.forEach(({ element }) => {
        if ((element as any).__liveEditorHandler) {
          element.removeEventListener('click', (element as any).__liveEditorHandler);
          delete (element as any).__liveEditorHandler;
        }
      });
    };
  }, [isEditMode]);

  const handleSave = async () => {
    if (!selectedElement || !selectedElement.dbId) return;
    
    setIsLoading(true);
    try {
      const storedSession = localStorage.getItem('admin_session');
      let token = '';
      
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          token = session.access_token;
        } catch (error) {
          console.error('Error parsing session:', error);
        }
      }
      
      const response = await fetch(`/api/admin/content/${selectedElement.dbId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ [selectedElement.fieldType]: editValue }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update content');
      }
      
      // Update the element directly
      if (selectedElement.element.tagName === 'IMG') {
        selectedElement.element.setAttribute('src', editValue);
      } else if (selectedElement.element.tagName === 'A') {
        selectedElement.element.setAttribute('href', editValue);
      } else {
        selectedElement.element.textContent = editValue;
      }
      
      // Update the originalContent
      selectedElement.originalContent = editValue;
      
      // Invalidate cache to refresh any other components
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content'] });
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      
      toast({
        title: "Success",
        description: "Content updated successfully",
      });
      
      setSelectedElement(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedElement(null);
    setEditValue('');
  };

  return (
    <>
      {/* Live Editor Toolbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-cyan-500/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="text-cyan-400 font-semibold">Live Editor</div>
            <Button
              onClick={onToggleEditMode}
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              className={isEditMode ? 
                "bg-cyan-500 hover:bg-cyan-600 text-black" : 
                "border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
              }
            >
              {isEditMode ? <Eye className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              {isEditMode ? 'Preview Mode' : 'Edit Mode'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-400">
              {isEditMode ? 'Click any element to edit' : 'Click Edit Mode to start editing'}
            </div>
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedElement && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-gray-900 border-cyan-500/30 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-cyan-400">
                Edit {selectedElement.fieldType}
              </h3>
              <Button
                onClick={handleCancel}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Content Key: {selectedElement.contentKey}
                </label>
                <label className="text-sm text-gray-400 mb-2 block">
                  Section: {selectedElement.section}
                </label>
              </div>
              
              {selectedElement.originalContent.length > 100 ? (
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter content..."
                  className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                />
              ) : (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter content..."
                  className="bg-gray-800 border-gray-700 text-white"
                />
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CSS for highlighting editable elements */}
      <style>{`
        .live-editor-highlight {
          outline: 2px dashed rgba(6, 182, 212, 0.5) !important;
          outline-offset: 2px !important;
          background-color: rgba(6, 182, 212, 0.1) !important;
          transition: all 0.2s ease !important;
        }
        
        .live-editor-highlight:hover {
          outline-color: rgba(6, 182, 212, 0.8) !important;
          background-color: rgba(6, 182, 212, 0.2) !important;
          transform: scale(1.02) !important;
        }
      `}</style>
    </>
  );
}