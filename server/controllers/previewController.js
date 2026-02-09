import { fetchOpenGraphData } from '../services/previewService.js';
import { assertSafePreviewUrl } from '../utils/urlSafety.js';

export const getPreview = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const safeUrl = await assertSafePreviewUrl(String(url));

        const data = await fetchOpenGraphData(safeUrl);
        res.json(data);
    } catch (error) {
        if (error && typeof error === 'object' && error.code === 'blocked_url') {
            return res.status(403).json({ error: 'Blocked URL' });
        }
        return res.status(400).json({ error: 'Invalid URL' });
    }
};
