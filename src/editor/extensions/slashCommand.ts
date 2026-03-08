import { Extension } from '@tiptap/core';
import type { Editor, Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import type { Instance } from 'tippy.js';
import {
    SlashCommandList,
    type SlashCommandListHandle,
    type SlashCommandListProps
} from '../../components/editor/SlashCommandList';
import type { SlashCommandItem } from '../slashCommands/types';

type SlashSuggestionOptions = Omit<SuggestionOptions<SlashCommandItem, SlashCommandItem>, 'editor'>;

interface SlashCommandExtensionOptions {
    suggestion: SlashSuggestionOptions;
}

interface SuggestionCommandPayload {
    editor: Editor;
    range: Range;
    props: SlashCommandItem;
}

export const SlashCommand = Extension.create<SlashCommandExtensionOptions>({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: SuggestionCommandPayload) => {
                    props.command({ editor, range });
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion<SlashCommandItem, SlashCommandItem>({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export const renderItems = () => {
    let component: ReactRenderer<SlashCommandListHandle, SlashCommandListProps> | null = null;
    let popup: Instance[] | null = null;

    return {
        onStart: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
            component = new ReactRenderer<SlashCommandListHandle, SlashCommandListProps>(SlashCommandList, {
                props,
                editor: props.editor,
            });

            if (!props.clientRect) {
                return;
            }

            const getReferenceClientRect = () => props.clientRect?.() ?? new DOMRect();

            popup = tippy('body', {
                getReferenceClientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
            });
        },

        onUpdate: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => {
            component?.updateProps(props);

            if (!props.clientRect) {
                return;
            }

            const getReferenceClientRect = () => props.clientRect?.() ?? new DOMRect();

            popup?.[0]?.setProps({
                getReferenceClientRect,
            });
        },

        onKeyDown: (props: SuggestionKeyDownProps) => {
            if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
            }

            return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit: () => {
            popup?.[0]?.destroy();
            component?.destroy();
            popup = null;
            component = null;
        },
    };
};
