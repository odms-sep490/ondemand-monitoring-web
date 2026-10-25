export function AttitudeIndicator({
  roll,
  pitch,
  label,
}: {
  roll: number | null
  pitch: number | null
  label: string
}) {
  const r = roll ?? 0
  const p = Math.max(-30, Math.min(30, pitch ?? 0))
  return (
    <div className="fc-instrument">
      <svg viewBox="0 0 200 200" className="fc-attitude" aria-hidden="true">
        <defs>
          <clipPath id="fc-att-clip">
            <circle cx="100" cy="100" r="86" />
          </clipPath>
        </defs>
        <g clipPath="url(#fc-att-clip)">
          <g transform={`rotate(${-r} 100 100) translate(0 ${p * 2.2})`}>
            <rect x="-100" y="-200" width="400" height="300" fill="#2f7fd8" />
            <rect x="-100" y="100" width="400" height="300" fill="#8a5a2b" />
            <line
              x1="-100"
              y1="100"
              x2="300"
              y2="100"
              stroke="#fff"
              strokeWidth="2"
            />
            {[-20, -10, 10, 20].map((deg) => (
              <g key={deg}>
                <line
                  x1="80"
                  x2="120"
                  y1={100 - deg * 2.2}
                  y2={100 - deg * 2.2}
                  stroke="#fff"
                  strokeWidth="1.6"
                />
                <text x="126" y={104 - deg * 2.2} fill="#fff" fontSize="10">
                  {Math.abs(deg)}
                </text>
              </g>
            ))}
          </g>
        </g>
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="#334155"
          strokeWidth="6"
        />
        <path d="M100 18l-6 10h12z" fill="#facc15" />
        <path
          d="M58 100h26l6 8 6-8h0M110 100h0l6 8 6-8h20"
          fill="none"
          stroke="#facc15"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="100" cy="100" r="3.5" fill="#facc15" />
      </svg>
      <span>{label}</span>
    </div>
  )
}
