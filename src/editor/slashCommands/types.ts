import type { Editor, Range } from '@tiptap/core';
import type { ReactNode } from 'react';

export interface SlashCommandContext {
  editor: Editor;
  range: Range;
}

export interface SlashCommandItem {
  title: string;
  description?: string;
  searchTerms?: string[];
  icon?: ReactNode;
  element?: ReactNode;
  command: (context: SlashCommandContext) => void | Promise<void>;
}
