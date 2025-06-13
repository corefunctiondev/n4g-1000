import { useState, useEffect } from 'react';
import { Edit3, Save, X, Image, Type, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface VisualEditorProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

interface EditableElement {
  id: string;
  type: 'text' | 'image' | 'link';
  content: string;
  key?: string;
  element: HTMLElement;
}

export function VisualEditor({ isEditMode, onToggleEditMode }: VisualEditorProps) {
  const [editingElement, setEditingElement] = useState<EditableElement | null>(null);
  const [editableElements, setEditableElements] = useState<EditableElement[]>([]);

  useEffect(() => {
    if (isEditMode) {
      // Find all editable elements on the page
      const elements = document.querySelectorAll('[data-editable]');
      const editables: EditableElement[] = [];

      elements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        const type = htmlEl.dataset.editableType as 'text' | 'image' | 'link' || 'text';
        const key = htmlEl.dataset.contentKey;
        
        editables.push({
          id: `editable-${index}`,
          type,
          content: type === 'image' ? htmlEl.getAttribute('src') || '' : htmlEl.textContent || '',
          key,
          element: htmlEl
        });

        // Add click handler and visual indicator
        htmlEl.style.position = 'relative';
        htmlEl.style.cursor = 'pointer';
        htmlEl.style.outline = '2px dashed #06b6d4';
        htmlEl.style.outlineOffset = '2px';
        
        // Add edit icon
        const editIcon = document.createElement('div');
        editIcon.innerHTML = '✏️';
        editIcon.style.position = 'absolute';
        editIcon.style.top = '-10px';
        editIcon.style.right = '-10px';
        editIcon.style.background = '#06b6d4';
        editIcon.style.color = 'white';
        editIcon.style.borderRadius = '50%';
        editIcon.style.width = '20px';
        editIcon.style.height = '20px';
        editIcon.style.display = 'flex';
        editIcon.style.alignItems = 'center';
        editIcon.style.justifyContent = 'center';
        editIcon.style.fontSize = '10px';
        editIcon.style.zIndex = '1000';
        htmlEl.appendChild(editIcon);

        const handleClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          setEditingElement(editables.find(item => item.element === htmlEl) || null);
        };

        htmlEl.addEventListener('click', handleClick);
        htmlEl.dataset.editHandler = 'true';
      });

      setEditableElements(editables);
    } else {
      // Remove edit mode styling and handlers
      const elements = document.querySelectorAll('[data-edit-handler="true"]');
      elements.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.outline = '';
        htmlEl.style.cursor = '';
        htmlEl.style.position = '';
        
        // Remove edit icon
        const editIcon = htmlEl.querySelector('div');
        if (editIcon && editIcon.innerHTML === '✏️') {
          editIcon.remove();
        }
        
        // Remove event listeners by cloning the element
        const newEl = htmlEl.cloneNode(true) as HTMLElement;
        htmlEl.parentNode?.replaceChild(newEl, htmlEl);
      });
      
      setEditableElements([]);
      setEditingElement(null);
    }

    return () => {
      // Cleanup on unmount
      const elements = document.querySelectorAll('[data-edit-handler="true"]');
      elements.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.outline = '';
        htmlEl.style.cursor = '';
        htmlEl.style.position = '';
      });
    };
  }, [isEditMode]);

  const handleSaveContent = async (newContent: string) => {
    if (!editingElement || !editingElement.key) return;

    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: editingElement.key,
          content: newContent,
        }),
      });

      if (response.ok) {
        // Update the element on the page
        if (editingElement.type === 'image') {
          editingElement.element.setAttribute('src', newContent);
        } else {
          editingElement.element.textContent = newContent;
        }
        
        setEditingElement(null);
        window.location.reload(); // Refresh to show changes
      }
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  return (
    <>
      {/* Edit Mode Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={onToggleEditMode}
          variant={isEditMode ? "destructive" : "default"}
          size="sm"
          className="shadow-lg"
        >
          {isEditMode ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Exit Edit Mode
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Page
            </>
          )}
        </Button>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="fixed top-20 right-4 bg-cyan-600 text-white px-3 py-2 rounded-lg shadow-lg z-40">
          <div className="text-sm font-medium">Edit Mode Active</div>
          <div className="text-xs opacity-90">Click any outlined element to edit</div>
        </div>
      )}

      {/* Content Editor Modal */}
      {editingElement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                {editingElement.type === 'image' && <Image className="w-5 h-5 mr-2" />}
                {editingElement.type === 'text' && <Type className="w-5 h-5 mr-2" />}
                {editingElement.type === 'link' && <Link className="w-5 h-5 mr-2" />}
                Edit {editingElement.type === 'image' ? 'Image' : 'Text'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingElement(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <EditForm
              element={editingElement}
              onSave={handleSaveContent}
              onCancel={() => setEditingElement(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}

interface EditFormProps {
  element: EditableElement;
  onSave: (content: string) => void;
  onCancel: () => void;
}

function EditForm({ element, onSave, onCancel }: EditFormProps) {
  const [content, setContent] = useState(element.content);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(content);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="content">
          {element.type === 'image' ? 'Image URL' : 'Content'}
        </Label>
        {element.type === 'text' && content.length > 50 ? (
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1"
            rows={3}
          />
        ) : (
          <Input
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1"
            placeholder={element.type === 'image' ? 'https://example.com/image.jpg' : 'Enter text content'}
          />
        )}
      </div>

      <div className="flex space-x-2">
        <Button type="submit" className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}