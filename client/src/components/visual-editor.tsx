import { useState, useEffect, useCallback } from 'react';
import { Edit3, Save, X, Image, Type, Link, Settings, Palette, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface VisualEditorProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

interface EditableElement {
  id: string;
  type: 'text' | 'image' | 'link' | 'color' | 'section';
  content: string;
  key?: string;
  section?: string;
  element: HTMLElement;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
  };
}

export function VisualEditor({ isEditMode, onToggleEditMode }: VisualEditorProps) {
  const [editingElement, setEditingElement] = useState<EditableElement | null>(null);
  const [editableElements, setEditableElements] = useState<EditableElement[]>([]);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const { toast } = useToast();

  // Enhanced element discovery - finds all content elements
  const discoverEditableElements = useCallback(() => {
    const elements: EditableElement[] = [];
    
    // Find elements with data-editable attribute
    document.querySelectorAll('[data-editable]').forEach((el, index) => {
      const element = el as HTMLElement;
      const key = element.getAttribute('data-key') || `element-${index}`;
      const section = element.getAttribute('data-section') || 'general';
      
      elements.push({
        id: `editable-${index}`,
        type: getElementType(element),
        content: getElementContent(element),
        key,
        section,
        element,
        styles: getElementStyles(element)
      });
    });

    // Auto-discover common editable elements
    const commonSelectors = [
      'h1, h2, h3, h4, h5, h6',
      'p',
      '.text-cyan-400',
      '.text-green-400', 
      '.text-yellow-400',
      'button',
      'a',
      '.bg-gradient-to-',
      '[class*="text-"]',
      '[class*="bg-"]'
    ];

    commonSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach((el, index) => {
        const element = el as HTMLElement;
        
        // Skip if already has data-editable
        if (element.hasAttribute('data-editable')) return;
        
        // Skip system elements
        if (element.closest('.visual-editor') || 
            element.closest('[role="dialog"]') ||
            element.closest('.toast')) return;

        const key = generateKeyFromElement(element, index);
        
        elements.push({
          id: `auto-${selector.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`,
          type: getElementType(element),
          content: getElementContent(element),
          key,
          section: 'general',
          element,
          styles: getElementStyles(element)
        });
      });
    });

    setEditableElements(elements);
  }, []);

  // Get element type based on tag and content
  const getElementType = (element: HTMLElement): EditableElement['type'] => {
    if (element.tagName === 'A') return 'link';
    if (element.tagName === 'IMG') return 'image';
    if (element.style.backgroundColor || element.className.includes('bg-')) return 'color';
    return 'text';
  };

  // Extract content from element
  const getElementContent = (element: HTMLElement): string => {
    if (element.tagName === 'IMG') return element.getAttribute('src') || '';
    if (element.tagName === 'A') return element.getAttribute('href') || element.textContent || '';
    return element.textContent || element.innerHTML || '';
  };

  // Get current styles from element
  const getElementStyles = (element: HTMLElement) => {
    const computed = window.getComputedStyle(element);
    return {
      backgroundColor: computed.backgroundColor,
      textColor: computed.color,
      fontSize: computed.fontSize
    };
  };

  // Generate a meaningful key from element context
  const generateKeyFromElement = (element: HTMLElement, index: number): string => {
    const text = element.textContent?.slice(0, 20).replace(/\s+/g, '_').toLowerCase() || '';
    const tag = element.tagName.toLowerCase();
    const classList = Array.from(element.classList).slice(0, 2).join('_');
    
    return `${tag}_${classList || text || index}`.replace(/[^a-zA-Z0-9_]/g, '');
  };

  // Handle click on editable elements
  useEffect(() => {
    if (!isEditMode) return;

    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      const editableEl = editableElements.find(el => el.element === target || el.element.contains(target));
      
      if (editableEl) {
        setEditingElement(editableEl);
      }
    };

    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement;
      const editableEl = editableElements.find(el => el.element === target || el.element.contains(target));
      
      if (editableEl && editableEl.element !== hoveredElement) {
        // Remove previous highlight
        if (hoveredElement) {
          hoveredElement.style.outline = '';
          hoveredElement.style.backgroundColor = '';
        }
        
        // Add highlight to current element
        editableEl.element.style.outline = '2px dashed #06b6d4';
        editableEl.element.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
        setHoveredElement(editableEl.element);
      }
    };

    const handleMouseOut = (e: Event) => {
      const target = e.target as HTMLElement;
      if (hoveredElement && !hoveredElement.contains(target)) {
        hoveredElement.style.outline = '';
        hoveredElement.style.backgroundColor = '';
        setHoveredElement(null);
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      
      // Clean up highlights
      if (hoveredElement) {
        hoveredElement.style.outline = '';
        hoveredElement.style.backgroundColor = '';
      }
    };
  }, [isEditMode, editableElements, hoveredElement]);

  // Discover elements when edit mode is enabled
  useEffect(() => {
    if (isEditMode) {
      discoverEditableElements();
    } else {
      // Clean up highlights when exiting edit mode
      editableElements.forEach(el => {
        el.element.style.outline = '';
        el.element.style.backgroundColor = '';
      });
      setEditableElements([]);
      setEditingElement(null);
      setHoveredElement(null);
    }
  }, [isEditMode, discoverEditableElements]);

  // Save changes to the backend
  const saveElement = async (element: EditableElement, newContent: string, newStyles?: any) => {
    try {
      const response = await apiRequest('POST', '/api/admin/content', {
        key: element.key,
        section: element.section || 'general',
        title: element.type === 'text' ? newContent.slice(0, 100) : element.key,
        content: newContent,
        value: newContent,
        image_url: element.type === 'image' ? newContent : '',
        link_url: element.type === 'link' ? newContent : '',
        background_color: newStyles?.backgroundColor || '',
        text_color: newStyles?.textColor || '',
        font_size: newStyles?.fontSize || 'medium',
        position: 0,
        is_active: true
      });

      if (response.ok) {
        // Update the actual DOM element
        if (element.type === 'text') {
          element.element.textContent = newContent;
        } else if (element.type === 'link') {
          element.element.setAttribute('href', newContent);
        } else if (element.type === 'image') {
          element.element.setAttribute('src', newContent);
        }

        // Apply styles
        if (newStyles) {
          if (newStyles.backgroundColor) {
            element.element.style.backgroundColor = newStyles.backgroundColor;
          }
          if (newStyles.textColor) {
            element.element.style.color = newStyles.textColor;
          }
          if (newStyles.fontSize) {
            element.element.style.fontSize = newStyles.fontSize;
          }
        }

        toast({
          title: 'Content updated',
          description: 'Changes have been saved successfully'
        });
        
        setEditingElement(null);
      }
    } catch (error) {
      toast({
        title: 'Error saving content',
        description: 'Failed to save changes',
        variant: 'destructive'
      });
    }
  };

  if (!isEditMode && editableElements.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggleEditMode}
          className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Edit Page
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Edit Mode Controls */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <div className="bg-black/90 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-cyan-400 text-cyan-400">
              <Edit3 className="w-3 h-3 mr-1" />
              Edit Mode Active
            </Badge>
            <Button
              onClick={onToggleEditMode}
              variant="outline"
              size="sm"
              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
            >
              <EyeOff className="w-4 h-4 mr-1" />
              Exit
            </Button>
          </div>
          
          <div className="text-sm text-gray-300">
            <p className="mb-2">Click any element to edit it</p>
            <div className="space-y-1 text-xs">
              <p>• {editableElements.length} editable elements found</p>
              <p>• Hover to highlight elements</p>
              <p>• Changes save automatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* Element Editor Modal */}
      {editingElement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-gray-900 border-cyan-400/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-cyan-400">
                  Edit {editingElement.type.charAt(0).toUpperCase() + editingElement.type.slice(1)}
                </CardTitle>
                <Button
                  onClick={() => setEditingElement(null)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <EditForm
                element={editingElement}
                onSave={saveElement}
                onCancel={() => setEditingElement(null)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

// Enhanced editing form with full styling controls
interface EditFormProps {
  element: EditableElement;
  onSave: (element: EditableElement, content: string, styles?: any) => void;
  onCancel: () => void;
}

function EditForm({ element, onSave, onCancel }: EditFormProps) {
  const [content, setContent] = useState(element.content);
  const [backgroundColor, setBackgroundColor] = useState(element.styles?.backgroundColor || '');
  const [textColor, setTextColor] = useState(element.styles?.textColor || '');
  const [fontSize, setFontSize] = useState(element.styles?.fontSize || 'medium');

  const handleSave = () => {
    onSave(element, content, {
      backgroundColor,
      textColor,
      fontSize
    });
  };

  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-gray-800">
        <TabsTrigger value="content" className="data-[state=active]:bg-cyan-600">
          Content
        </TabsTrigger>
        <TabsTrigger value="style" className="data-[state=active]:bg-cyan-600">
          Style
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="content" className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-300">
            {element.type === 'image' ? 'Image URL' : 
             element.type === 'link' ? 'Link URL' : 'Text Content'}
          </Label>
          {element.type === 'text' ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              rows={4}
            />
          ) : (
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder={element.type === 'image' ? 'https://...' : 'Enter URL'}
            />
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Content Key</Label>
          <Input
            value={element.key || ''}
            disabled
            className="bg-gray-700 border-gray-600 text-gray-400"
          />
          <p className="text-xs text-gray-500">
            This key identifies the content element in the database
          </p>
        </div>
      </TabsContent>

      <TabsContent value="style" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Background Color</Label>
            <Input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="h-10 bg-gray-800 border-gray-600"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-300">Text Color</Label>
            <Input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="h-10 bg-gray-800 border-gray-600"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Font Size</Label>
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="xl">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-gray-800 rounded border border-gray-600">
          <Label className="text-gray-300 text-sm">Preview</Label>
          <div 
            className="mt-2 p-2 rounded border"
            style={{
              backgroundColor: backgroundColor || 'transparent',
              color: textColor || 'inherit',
              fontSize: fontSize === 'small' ? '0.875rem' : 
                       fontSize === 'large' ? '1.25rem' :
                       fontSize === 'xl' ? '1.5rem' : '1rem'
            }}
          >
            {content || 'Preview text'}
          </div>
        </div>
      </TabsContent>

      <div className="flex justify-end space-x-2 mt-6">
        <Button
          onClick={onCancel}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </Tabs>
  );
}