import { useCallback, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Editor } from '@tiptap/react';


interface UseEditorImageControlsProps {
  editorRef: MutableRefObject<Editor | null>;
  maxUploadMb: number;
  uploadLocalImage: (file: File) => Promise<{ url: string }>;
}

export const useEditorImageControls = ({
  editorRef,
  maxUploadMb,
  uploadLocalImage
}: UseEditorImageControlsProps) => {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isImageSelected, setIsImageSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getImageFileFromTransfer = useCallback((transfer?: DataTransfer | null) => {
    if (!transfer) return null;
    const files = Array.from(transfer.files ?? []);
    return files.find(file => file.type.startsWith('image/')) ?? null;
  }, []);

  const uploadImageToEditor = useCallback(
    async (file: File) => {
      setUploadError('');
      if (file.size > maxUploadMb * 1024 * 1024) {
        setUploadError(`이미지는 ${maxUploadMb}MB 이하만 가능합니다.`);
        return;
      }

      const currentEditor = editorRef.current;
      if (!currentEditor) return;
      setUploadingImage(true);
      try {
        const { url } = await uploadLocalImage(file);
        const imageAttrs = { src: url, alt: file.name, size: 'full' };
        currentEditor.chain().focus().setImage(imageAttrs).run();
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : '이미지 업로드에 실패했습니다.';
        setUploadError(message);
      } finally {
        setUploadingImage(false);
      }
    },
    [editorRef, maxUploadMb, uploadLocalImage]
  );

  const handleSelectionUpdate = useCallback((editor: Editor) => {
    const { selection } = editor.state;
    // Check both standard isActive and explicit NodeSelection for 'image' type
    const active = editor.isActive('image') || ((selection as any).node?.type.name === 'image');

    setIsImageSelected(active);

    if (!active) {
      return;
    }
  }, []);

  const handlePaste = useCallback(
    (_view: unknown, event: ClipboardEvent) => {
      const file = getImageFileFromTransfer(event.clipboardData);
      if (!file) return false;
      event.preventDefault();
      void uploadImageToEditor(file);
      return true;
    },
    [getImageFileFromTransfer, uploadImageToEditor]
  );

  const handleDrop = useCallback(
    (view: any, event: DragEvent, _slice: unknown, moved: boolean) => {
      if (moved) return false;
      const file = getImageFileFromTransfer(event.dataTransfer);
      if (!file) return false;

      event.preventDefault();

      const clientX = event.clientX;
      const clientY = event.clientY;

      const handleUploadAndInsert = async () => {
        try {
          const { url } = await uploadLocalImage(file);
          let grouped = false;

          // STRATEGY: Magnet detection
          // Find all images in the editor DOM
          const editorDom = view.dom as HTMLElement;
          const images = Array.from(editorDom.querySelectorAll('img'));

          let closestImage: HTMLImageElement | null = null;
          let minDistance = Infinity;
          const THRESHOLD = 100; // Increased threshold for easier grouping

          images.forEach(img => {
            const rect = img.getBoundingClientRect();
            // Calculate distance from point to rectangle
            const dx = Math.max(rect.left - clientX, 0, clientX - rect.right);
            const dy = Math.max(rect.top - clientY, 0, clientY - rect.bottom);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDistance) {
              minDistance = dist;
              closestImage = img;
            }
          });

          if (closestImage && minDistance < THRESHOLD) {
            const domPos = view.posAtDOM(closestImage, 0);
            if (typeof domPos === 'number') {
              const node = view.state.doc.nodeAt(domPos);
              // Verify it's effectively an image or we can resolve it
              if (node && node.type.name === 'image') {
                const existingSrc = node.attrs.src;

                // Check if parent is already a gallery
                const $pos = view.state.doc.resolve(domPos);
                const parent = $pos.parent;

                if (parent.type.name === 'imageGallery') {
                  // Append to existing gallery
                  editorRef.current?.chain()
                    .insertContentAt(domPos + node.nodeSize, { type: 'image', attrs: { src: url } })
                    .run();
                  grouped = true;
                } else {
                  // Create new gallery
                  editorRef.current?.chain()
                    .deleteRange({ from: domPos, to: domPos + node.nodeSize })
                    .insertContentAt(domPos, {
                      type: 'imageGallery',
                      attrs: { columns: 2 },
                      content: [
                        { type: 'image', attrs: { src: existingSrc } },
                        { type: 'image', attrs: { src: url } }
                      ]
                    })
                    .run();
                  grouped = true;
                }
              }
            }
          }

          if (!grouped) {
            // Fallback: Standard insert at coords
            const freshCoords = view.posAtCoords({ left: clientX, top: clientY });
            if (freshCoords) {
              editorRef.current?.chain().focus().setTextSelection(freshCoords.pos).setImage({ src: url }).run();
            } else {
              editorRef.current?.chain().focus().setImage({ src: url }).run();
            }
          }
        } catch (e) {
          console.error(e);
        }
      };

      void handleUploadAndInsert();
      return true;
    },
    [editorRef, getImageFileFromTransfer, uploadLocalImage]
  );



  const handleToolbarImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInsertImageUrl = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const url = window.prompt('이미지 URL을 입력하세요');
    if (!url) return;
    const imageAttrs = { src: url, size: 'full' };
    editor.chain().focus().setImage(imageAttrs).run();
  }, [editorRef]);

  return {
    fileInputRef,
    uploadingImage,
    uploadError,
    uploadImageToEditor,
    handleSelectionUpdate,
    handlePaste,
    handleDrop,
    handleToolbarImageUpload,
    handleInsertImageUrl,
    isImageSelected
  };
};
