import { Link } from "react-router-dom";
import { useSite } from "../../lib/site";

/** One line above the header, managed in wp-admin (Store & brand). Renders nothing when switched off. */
export default function AnnouncementBar() {
  const { announcement } = useSite();
  if (!announcement) return null;
  const inner = <span className="eyebrow block max-w-full truncate text-[10px] md:text-[11px] tracking-[0.14em] md:tracking-[0.16em]">{announcement.text}</span>;
  return (
    <div className="bg-charcoal text-ivory text-center h-8 md:h-9 flex items-center justify-center gutter overflow-hidden">
      <div className="min-w-0 max-w-full">
        {announcement.url ? (
          announcement.url.startsWith("/") ? (
            <Link to={announcement.url} className="block max-w-full hover:opacity-70 transition-opacity">{inner}</Link>
          ) : (
            <a href={announcement.url} className="block max-w-full hover:opacity-70 transition-opacity" target="_blank" rel="noopener noreferrer">{inner}</a>
          )
        ) : (
          inner
        )}
      </div>
    </div>
  );
}
