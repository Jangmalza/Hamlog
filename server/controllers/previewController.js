import { fetchOpenGraphData } from '../services/previewService.js';

export const getPreview = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // Simple validation
        new URL(String(url));

        const data = await fetchOpenGraphData(String(url));
        res.json(data);
    } catch {
        res.status(400).json({ error: 'Invalid URL' });
    }
};
