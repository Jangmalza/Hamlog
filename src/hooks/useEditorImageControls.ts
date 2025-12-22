import { useCallback, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { Editor } from '@tiptap/react';
import { extractImageWidth, parseImageWidthInput } from '../utils/editorImage';

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
  const [imageWidthInput, setImageWidthInput] = useState('');
  const [imageWidthError, setImageWidthError] = useState('');
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
    if (!editor.isActive('image')) {
      setImageWidthInput('');
      setImageWidthError('');
      return;
    }
    const attrs = editor.getAttributes('image') as Record<string, string>;
    setImageWidthInput(extractImageWidth(attrs));
    setImageWidthError('');
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
      const coordinates = view.posAtCoords({
        left: event.clientX,
        top: event.clientY
      });
      if (coordinates?.pos) {
        editorRef.current?.chain().focus().setTextSelection(coordinates.pos).run();
      }
      void uploadImageToEditor(file);
      return true;
    },
    [editorRef, getImageFileFromTransfer, uploadImageToEditor]
  );

  const applyImageWidth = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!editor.isActive('image')) return;
    const parsed = parseImageWidthInput(imageWidthInput);
    if (parsed.kind === 'error') {
      setImageWidthError(parsed.message);
      return;
    }

    if (parsed.kind === 'clear') {
      editor
        .chain()
        .focus()
        .updateAttributes('image', {
          dataWidth: null,
          width: null,
          style: null,
          size: 'full'
        })
        .run();
      setImageWidthInput('');
      setImageWidthError('');
      return;
    }

    editor
      .chain()
      .focus()
      .updateAttributes('image', {
        dataWidth: parsed.dataWidth,
        width: parsed.widthAttr,
        style: `width: ${parsed.cssValue};`,
        size: 'custom'
      })
      .run();
    setImageWidthInput(parsed.displayValue ?? parsed.cssValue);
    setImageWidthError('');
  }, [editorRef, imageWidthInput]);

  const clearImageWidth = useCallback(() => {
    setImageWidthInput('');
    setImageWidthError('');
    const editor = editorRef.current;
    if (!editor || !editor.isActive('image')) return;
    editor
      .chain()
      .focus()
      .updateAttributes('image', {
        dataWidth: null,
        width: null,
        style: null,
        size: 'full'
      })
      .run();
  }, [editorRef]);

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
    imageWidthInput,
    imageWidthError,
    setImageWidthInput,
    setImageWidthError,
    uploadImageToEditor,
    handleSelectionUpdate,
    handlePaste,
    handleDrop,
    applyImageWidth,
    clearImageWidth,
    handleToolbarImageUpload,
    handleInsertImageUrl
  };
};
