import { readVisitorData, writeVisitorData } from '../models/visitorModel.js';

const KEEP_DAYS = 120;
let writeQueue = Promise.resolve();

const toDateKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const cutoffDateKey = () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
    return toDateKey(cutoff);
};

const enqueue = (task) => {
    const next = writeQueue.then(task, task);
    writeQueue = next.then(() => undefined, () => undefined);
    return next;
};

const pruneDailyData = (data) => {
    const minDate = cutoffDateKey();
    Object.keys(data.dailyVisitors).forEach((dateKey) => {
        if (dateKey < minDate) delete data.dailyVisitors[dateKey];
    });
    Object.keys(data.dailySeenVisitorIds).forEach((dateKey) => {
        if (dateKey < minDate) delete data.dailySeenVisitorIds[dateKey];
    });
};

export async function trackAndGetVisitorStats(visitorId) {
    return enqueue(async () => {
        const today = toDateKey();
        const data = await readVisitorData();

        pruneDailyData(data);

        const seenAll = new Set(data.seenVisitorIds);
        const seenToday = new Set(data.dailySeenVisitorIds[today] || []);

        let changed = false;

        if (!seenAll.has(visitorId)) {
            seenAll.add(visitorId);
            data.totalVisitors += 1;
            changed = true;
        }

        if (!seenToday.has(visitorId)) {
            seenToday.add(visitorId);
            data.dailyVisitors[today] = (data.dailyVisitors[today] || 0) + 1;
            changed = true;
        }

        if (changed) {
            data.seenVisitorIds = [...seenAll];
            data.dailySeenVisitorIds[today] = [...seenToday];
            await writeVisitorData(data);
        }

        return {
            totalVisitors: data.totalVisitors,
            todayVisitors: data.dailyVisitors[today] || 0,
            date: today
        };
    });
}
