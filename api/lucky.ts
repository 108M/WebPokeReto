const LUCKY_IPS = ['213.94.48.123'];

export default function handler(req: any, res: any) {
    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    const ip = forwarded
        ? forwarded.split(',')[0].trim()
        : (req.socket?.remoteAddress ?? '');

    res.status(200).json({ lucky: LUCKY_IPS.includes(ip) });
}
