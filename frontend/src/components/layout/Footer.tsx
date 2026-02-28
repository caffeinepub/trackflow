export default function Footer() {
  const hostname = window.location.hostname || 'trackflow';
  const utmUrl = `https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="border-t border-slate-100 py-4 px-6 text-center text-xs text-slate-400">
      <span>© {new Date().getFullYear()} TrackFlow. All rights reserved.</span>
      <span className="mx-2">·</span>
      <span>
        Built with <span className="text-red-400">♥</span> using{' '}
        <a
          href={utmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-600 transition-colors"
        >
          caffeine.ai
        </a>
      </span>
    </footer>
  );
}
