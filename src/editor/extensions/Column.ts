import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        columns: {
            setColumnsLayout: (layout: 'two-column' | 'three-column') => ReturnType;
            moveColumnLeft: () => ReturnType;
            moveColumnRight: () => ReturnType;
        };
    }
}

export const Columns = Node.create({
    name: 'columns',
    group: 'block',
    content: 'column+',
    isolating: true,
    defining: true,

    addAttributes() {
        return {
            layout: {
                default: 'two-column',
                parseHTML: element => element.getAttribute('data-layout'),
                renderHTML: attributes => ({ 'data-layout': attributes.layout }),
            },
        };
    },

    addCommands() {
        return {
            setColumnsLayout: (layout: 'two-column' | 'three-column') => ({ state, dispatch }) => {
                const { selection } = state;
                const { $from } = selection;

                // Find the parent `columns` node position
                let columnsPos = -1;
                let columns = null;

                // Traverse up
                for (let d = $from.depth; d > 0; d--) {
                    const node = $from.node(d);
                    if (node.type.name === 'columns') {
                        columns = node;
                        columnsPos = $from.before(d);
                        break;
                    }
                }

                if (!columns || columnsPos === -1) return false;

                if (dispatch) {
                    const currentLayout = columns.attrs.layout;
                    if (currentLayout === layout) return true;

                    // Execute logic
                    const tr = state.tr;

                    // Update attribute first
                    tr.setNodeMarkup(columnsPos, undefined, { ...columns.attrs, layout });

                    // Check children
                    const childCount = columns.childCount;

                    if (layout === 'three-column' && childCount < 3) {
                        // Add columns
                        const needed = 3 - childCount;
                        const nodes = [];
                        for (let i = 0; i < needed; i++) {
                            const node = state.schema.nodes.column.createAndFill();
                            if (node) nodes.push(node);
                        }
                        if (nodes.length > 0) {
                            tr.insert(columnsPos + columns.nodeSize - 1, nodes);
                        }
                    } else if (layout === 'two-column' && childCount > 2) {
                        // Remove extra columns
                        // We need to calculate position of 3rd column.
                        let pos = columnsPos + 1;
                        for (let i = 0; i < 2; i++) {
                            pos += columns.child(i).nodeSize;
                        }
                        // Now pos is at start of 3rd column
                        // We want to delete from here to end.
                        tr.delete(pos, columnsPos + columns.nodeSize - 1);
                    }

                    dispatch(tr);
                }
                return true;
            },
            moveColumnLeft: () => ({ state, dispatch }) => {
                const { selection } = state;
                const { $from } = selection;

                let columnIndex = -1;
                let columnsPos = -1;
                let columnsNode = null;

                // Find 'column' and 'columns'
                for (let d = $from.depth; d > 0; d--) {
                    const node = $from.node(d);
                    if (node.type.name === 'column') {
                        // Parent should be columns
                        const parent = $from.node(d - 1);
                        if (parent && parent.type.name === 'columns') {
                            columnsNode = parent;
                            columnsPos = $from.before(d - 1);
                            columnIndex = $from.index(d - 1);
                        }
                        break;
                    }
                }

                if (columnIndex <= 0 || !columnsNode) return false;

                if (dispatch) {
                    const tr = state.tr;
                    const columnNode = columnsNode.child(columnIndex);
                    const prevColumnNode = columnsNode.child(columnIndex - 1);

                    const currentSize = columnNode.nodeSize;
                    const prevSize = prevColumnNode.nodeSize;

                    // Calculate positions
                    let prevPos = columnsPos + 1;
                    for (let i = 0; i < columnIndex - 1; i++) {
                        prevPos += columnsNode.child(i).nodeSize;
                    }
                    const currentPos = prevPos + prevSize;

                    tr.delete(currentPos, currentPos + currentSize);
                    tr.insert(prevPos, columnNode);

                    dispatch(tr);
                }
                return true;
            },
            moveColumnRight: () => ({ state, dispatch }) => {
                const { selection } = state;
                const { $from } = selection;

                let columnIndex = -1;
                let columnsPos = -1;
                let columnsNode = null;

                // Find 'column' and 'columns'
                for (let d = $from.depth; d > 0; d--) {
                    const node = $from.node(d);
                    if (node.type.name === 'column') {
                        const parent = $from.node(d - 1);
                        if (parent && parent.type.name === 'columns') {
                            columnsNode = parent;
                            columnsPos = $from.before(d - 1);
                            columnIndex = $from.index(d - 1);
                        }
                        break;
                    }
                }

                if (!columnsNode || columnIndex === -1 || columnIndex >= columnsNode.childCount - 1) return false;

                if (dispatch) {
                    const tr = state.tr;
                    const columnNode = columnsNode.child(columnIndex);
                    const nextColumnNode = columnsNode.child(columnIndex + 1);

                    const currentSize = columnNode.nodeSize;
                    const nextSize = nextColumnNode.nodeSize;

                    let currentPos = columnsPos + 1;
                    for (let i = 0; i < columnIndex; i++) {
                        currentPos += columnsNode.child(i).nodeSize;
                    }

                    tr.delete(currentPos, currentPos + currentSize);
                    tr.insert(currentPos + nextSize, columnNode);

                    dispatch(tr);
                }
                return true;
            }
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="columns"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'columns', class: 'flex gap-4 my-4 flex-col sm:flex-row' }), 0];
    },
});

export const Column = Node.create({
    name: 'column',
    content: 'block+',
    isolating: true,
    defining: true,

    parseHTML() {
        return [
            {
                tag: 'div[data-type="column"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'column', class: 'flex-1 min-w-0' }), 0];
    },
});
