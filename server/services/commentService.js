import {
    getCommentsByPostId,
    createComment as createCommentModel,
    deleteComment as deleteCommentModel
} from '../models/commentModel.js';

export async function getCommentsService(postId) {
    const normalizedPostId = String(postId ?? '').trim();
    if (!normalizedPostId) {
        return { success: false, error: 'Post ID is required', code: 'validation_error' };
    }

    const comments = await getCommentsByPostId(normalizedPostId);

    // Exclude password from response
    // eslint-disable-next-line no-unused-vars
    const safeComments = comments.map(({ password, ...rest }) => rest);

    return { success: true, data: safeComments };
}

export async function createCommentService({ postId, author, password, content }) {
    const normalizedPostId = String(postId ?? '').trim();
    const normalizedAuthor = String(author ?? '').trim();
    const normalizedPassword = String(password ?? '');
    const normalizedContent = String(content ?? '').trim();

    if (!normalizedPostId || !normalizedAuthor || !normalizedPassword || !normalizedContent) {
        return { success: false, error: 'All fields are required.', code: 'validation_error' };
    }

    const newComment = await createCommentModel({
        postId: normalizedPostId,
        author: normalizedAuthor,
        password: normalizedPassword,
        content: normalizedContent
    });

    // eslint-disable-next-line no-unused-vars
    const { password: _, ...safeComment } = newComment;

    return { success: true, data: safeComment };
}

export async function deleteCommentService(id, password) {
    const normalizedPassword = String(password ?? '');
    if (!normalizedPassword) {
        return { success: false, error: 'Password is required.', code: 'validation_error' };
    }

    const result = await deleteCommentModel(id, normalizedPassword);

    if (!result.success) {
        if (result.reason === 'not_found') {
            return { success: false, error: 'Comment not found.', code: 'not_found' };
        }
        if (result.reason === 'wrong_password') {
            return { success: false, error: 'Incorrect password.', code: 'forbidden' };
        }
        return { success: false, error: 'Failed to delete comment.', code: 'internal_error' };
    }

    return { success: true };
}
