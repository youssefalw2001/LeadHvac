type Props = {
  className?: string;
  showWordmark?: boolean;
};

export function JobLeakMark({ className = '', showWordmark = true }: Props) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-jobleak-ink shadow-premium">
        <svg viewBox="0 0 44 44" className="h-9 w-9" aria-hidden="true">
          <defs>
            <linearGradient id="jlBlue" x1="6" y1="6" x2="38" y2="38">
              <stop stopColor="#2f6df6" />
              <stop offset="1" stopColor="#0b3b9e" />
            </linearGradient>
          </defs>
          <path d="M22 3c-8.2 0-14.8 6.6-14.8 14.8 0 10.2 14.8 22.8 14.8 22.8s14.8-12.6 14.8-22.8C36.8 9.6 30.2 3 22 3Z" fill="#08111f" />
          <circle cx="22" cy="18" r="12" fill="none" stroke="url(#jlBlue)" strokeWidth="2.6" />
          <circle cx="22" cy="18" r="7.2" fill="none" stroke="#2f6df6" strokeWidth="2.2" opacity="0.75" />
          <circle cx="22" cy="18" r="3.4" fill="#2f6df6" />
          <path d="M22 18 32 8" stroke="#eaf2ff" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="33.5" cy="6.5" r="3" fill="#ff7a1a" />
          <path d="M22 27c2.8 3 4 5 4 6.7a4 4 0 0 1-8 0c0-1.7 1.2-3.7 4-6.7Z" fill="#fff" />
          <path d="M22 31c1.3 1.5 1.9 2.5 1.9 3.4a1.9 1.9 0 1 1-3.8 0c0-.9.6-1.9 1.9-3.4Z" fill="#ff7a1a" />
        </svg>
      </div>
      {showWordmark && (
        <div className="leading-none">
          <strong className="block text-xl font-black tracking-[-0.06em] text-jobleak-ink">JobLeak</strong>
          <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">AI Opportunity Radar</span>
        </div>
      )}
    </div>
  );
}
