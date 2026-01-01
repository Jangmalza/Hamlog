import {
    getCommentsByPostId,
    createComment as createCommentModel,
    deleteComment as deleteCommentModel
} from '../models/commentModel.js';

export const getComments = async (req, res) => {
    try {
        const { postId } = req.query;
        if (!postId) {
            return res.status(400).json({ message: 'Post ID is required' });
        }
        const comments = await getCommentsByPostId(postId);
        // Exclude password from response
        // eslint-disable-next-line no-unused-vars
        const safeComments = comments.map(({ password, ...rest }) => rest);
        res.json({ comments: safeComments });
    } catch (error) {
        console.error('Failed to fetch comments', error);
        res.status(500).json({ message: 'Failed to load comments.' });
    }
};

export const createComment = async (req, res) => {
    try {
        const { postId, author, password, content } = req.body;
        if (!postId || !content || !password || !author) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const newComment = await createCommentModel({ postId, author, password, content });
        // eslint-disable-next-line no-unused-vars
        const { password: _, ...safeComment } = newComment;
        res.status(201).json({ comment: safeComment });
    } catch (error) {
        console.error('Failed to create comment', error);
        res.status(500).json({ message: 'Failed to post comment.' });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Password is required.' });
        }

        const result = await deleteCommentModel(id, password);
        if (!result.success) {
            if (result.reason === 'not_found') {
                return res.status(404).json({ message: 'Comment not found.' });
            }
            if (result.reason === 'wrong_password') {
                return res.status(403).json({ message: 'Incorrect password.' });
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to delete comment', error);
        res.status(500).json({ message: 'Failed to delete comment.' });
    }
};
