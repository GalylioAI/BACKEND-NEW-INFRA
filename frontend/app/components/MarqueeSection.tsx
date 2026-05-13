import { Fragment } from "react";

const StarIcon = () => (
  <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#marquee-clip)">
      <path fillRule="evenodd" clipRule="evenodd" d="M23.94 16.5L32.2515 21.2231L28.4072 27.7768L20.0957 23.0537V32.5H12.4072V23.0537L4.09569 27.7769L0.251465 21.2231L8.56296 16.5L0.251465 11.7768L4.09569 5.22312L12.4072 9.94631V0.5H20.0957V9.94631L28.4072 5.22319L32.2515 11.7769L23.94 16.5Z" fill="white" />
    </g>
    <defs>
      <clipPath id="marquee-clip">
        <rect width="32" height="32" fill="white" transform="translate(0 0.5)" />
      </clipPath>
    </defs>
  </svg>
);

const marqueeItems = [
  "MONITORING",
  "BENCHMARKING",
  "VEILLE CONCURRENTIELLE",
  "PRÉDICTION",
];

// Duplicate items to fill the track — original + 3 copies for seamless loop
const repeated = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

export default function MarqueeSection() {
  return (
    <section className="section-marquee">
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          flex-flow: row nowrap;
          align-items: center;
          animation: marquee-scroll 30s linear infinite;
          width: max-content;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .section-marquee .text-gradient.style-4 {
          background: linear-gradient(90deg, #5B21B6, #7C3AED) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }
        .section-marquee .rotate1 svg path {
          fill: #6D28D9 !important;
        }
        html[data-theme="dark"] .section-marquee .marquee-track,
        html:not([data-theme="light"]) .section-marquee .marquee-track {
          filter: drop-shadow(0 10px 24px rgba(0,0,0,0.35));
        }
        html[data-theme="dark"] .section-marquee .text-gradient.style-4,
        html:not([data-theme="light"]) .section-marquee .text-gradient.style-4 {
          background: none !important;
          color: #ffffff !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: #ffffff !important;
          text-shadow: 0 0 12px rgba(255,255,255,0.16);
        }
        html[data-theme="dark"] .section-marquee .rotate1 svg path,
        html:not([data-theme="light"]) .section-marquee .rotate1 svg path {
          fill: #c4b5fd !important;
          filter: drop-shadow(0 0 8px rgba(167,139,250,0.45));
        }
      `}</style>
      <div style={{ overflow: "hidden" }}>
        <div className="marquee-track tf-brand style-1">
          {repeated.map((text, index) => (
            <Fragment key={index}>
              <div className="brand-item text-uppercase" style={{ flex: "0 0 auto" }}>
                <div className="h1 fw-7 text-gradient style-4 animation-none">{text}</div>
              </div>
              <div className="brand-item" style={{ flex: "0 0 auto" }}>
                <div className="rotate1">
                  <StarIcon />
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
