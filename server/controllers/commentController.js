import {
    getCommentsService,
    createCommentService,
    deleteCommentService
} from '../services/commentService.js';

export const getComments = async (req, res) => {
    try {
        const { postId } = req.query;
        const result = await getCommentsService(postId);

        if (!result.success) {
            return res.status(400).json({ message: result.error });
        }

        res.json({ comments: result.data });
    } catch (error) {
        console.error('Failed to fetch comments', error);
        res.status(500).json({ message: 'Failed to load comments.' });
    }
};

export const createComment = async (req, res) => {
    try {
        const result = await createCommentService(req.body);

        if (!result.success) {
            return res.status(400).json({ message: result.error });
        }

        res.status(201).json({ comment: result.data });
    } catch (error) {
        console.error('Failed to create comment', error);
        res.status(500).json({ message: 'Failed to post comment.' });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        const result = await deleteCommentService(id, password);

        if (!result.success) {
            const status = result.code === 'not_found' ? 404
                : result.code === 'forbidden' ? 403
                    : result.code === 'validation_error' ? 400
                        : 500;
            return res.status(status).json({ message: result.error });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete comment', error);
        res.status(500).json({ message: 'Failed to delete comment.' });
    }
};
