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

          // STRATEGY: Edge Detection for Columns
          // Find all images in the editor DOM
          const editorDom = view.dom as HTMLElement;
          // Improved selector to catch images inside NodeViews (ImageComponent) and standard images
          const images = Array.from(editorDom.querySelectorAll('.image-component img, img.post-image, img[data-type="custom-image"]'));

          let targetImage: Element | null = null;
          let dropSide: 'left' | 'right' | null = null;

          const SCAN_DISTANCE = 100; // Pixel distance to consider "near"

          // Find the closest image vertically that we are horizontally within range of
          for (const img of images) {
            const rect = img.getBoundingClientRect();
            // Check if Y is within reasonable range (e.g. same line)
            if (clientY >= rect.top && clientY <= rect.bottom) {
              // We are inside the vertical strip of this image.
              // Now check X.
              // We accept drops slightly outside the image too (gaps).
              if (clientX >= rect.left - SCAN_DISTANCE && clientX <= rect.right + SCAN_DISTANCE) {
                // Potential target
                const width = rect.width;
                const offsetX = clientX - rect.left;

                // Define trigger zones
                // 0% - 30%: Left
                // 70% - 100%: Right

                if (offsetX < width * 0.3) {
                  targetImage = img;
                  dropSide = 'left';
                  break;
                } else if (offsetX > width * 0.7) {
                  targetImage = img;
                  dropSide = 'right';
                  break;
                }
              }
            }
          }

          if (targetImage && dropSide) {
            // Find the NodeView wrapper if possible (for React components)
            const wrapper = targetImage.closest('.image-component') || targetImage;
            const domPos = view.posAtDOM(wrapper, 0);

            if (typeof domPos === 'number') {
              // Try to resolve the node at this position
              let node = view.state.doc.nodeAt(domPos);

              // If not found directly, try resolving (sometimes posAtDOM points inside/before)
              if (!node || node.type.name !== 'image') {
                const $pos = view.state.doc.resolve(domPos);
                node = $pos.nodeAfter || $pos.nodeBefore;
              }

              // Verify it is an image
              if (node && node.type.name === 'image') {

                // Create Columns Structure
                // Two columns.
                // If dropSide is left: [New, Existing]
                // If dropSide is right: [Existing, New]

                // FIX: Use 'image' type, matching the schema
                const newImageNode = { type: 'image', attrs: { src: url, size: 'full' } };
                const existingImageNode = { type: 'image', attrs: { ...node.attrs } }; // Preserve existing

                const leftContent = dropSide === 'left' ? newImageNode : existingImageNode;
                const rightContent = dropSide === 'left' ? existingImageNode : newImageNode;

                const columnsNode = {
                  type: 'columns',
                  attrs: { layout: 'two-column' },
                  content: [
                    { type: 'column', content: [leftContent] },
                    { type: 'column', content: [rightContent] }
                  ]
                };

                // Replace the existing image node with the new columns node
                // Use domPos if it maps to the start of the node
                editorRef.current?.chain()
                  .deleteRange({ from: domPos, to: domPos + node.nodeSize })
                  .insertContentAt(domPos, columnsNode)
                  .run();

                grouped = true;
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
