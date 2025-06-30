import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export const formatRelativeTimeFormat = ({
    locale = 'en',
    date,
}: {
    locale?: string;
    date: Date;
}) => {
    if (locale !== 'en') {
        try {
            require(`dayjs/locale/${locale}`);
            dayjs.locale(locale);
        } catch (e) {
            // fallback en
            dayjs.locale('en');
        }
    }
    return dayjs(date).fromNow();
}
