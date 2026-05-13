export default function GetSection() {
  return (
    <section id="performance" className="section-get">
      <style>{`
        .section-get#performance .performance-cta {
          display: none;
          position: relative;
          overflow: hidden;
          background: transparent !important;
          color: #ffffff !important;
          border: 1px solid rgba(255,255,255,0.55) !important;
          box-shadow: inset 0 0 0 0 rgba(255,255,255,0.15), 0 8px 20px rgba(0,0,0,0.28);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, background-color 0.3s ease;
        }
        .section-get#performance .performance-cta::before {
          content: "";
          position: absolute;
          top: 0;
          left: -160%;
          width: 120%;
          height: 100%;
          transform: skewX(-20deg);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
        }
        .section-get#performance .performance-cta:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.9) !important;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08), 0 14px 28px rgba(0,0,0,0.34);
        }
        .section-get#performance .performance-cta:hover::before {
          animation: performance-cta-shine 0.8s ease;
        }
        @keyframes performance-cta-shine {
          from { left: -160%; }
          to { left: 180%; }
        }
        [data-theme="light"] .section-get#performance {
          background: linear-gradient(180deg, #f4f6f3 0%, #eef2ed 100%) !important;
        }
        [data-theme="light"] .section-get#performance .heading1,
        [data-theme="light"] .section-get#performance .heading {
          color: #0f172a !important;
          text-shadow: none !important;
        }
        [data-theme="light"] .section-get#performance .heading1 span {
          background: linear-gradient(90deg, #7c3aed, #4f46e5) !important;
        }
        [data-theme="light"] .section-get#performance .heading .item-text,
        [data-theme="light"] .section-get#performance .heading .item-text i {
          color: #111827 !important;
          -webkit-text-fill-color: #111827 !important;
          text-shadow: none !important;
        }
        [data-theme="light"] .section-get#performance p {
          color: rgba(15,23,42,0.72) !important;
          font-weight: 600 !important;
        }
        [data-theme="light"] .section-get#performance .performance-cta {
          display: inline-flex !important;
          background: transparent !important;
          border: 1px solid rgba(15,23,42,0.45) !important;
          color: #111827 !important;
          box-shadow: inset 0 0 0 0 rgba(15,23,42,0.08), 0 10px 22px rgba(15,23,42,0.16) !important;
        }
        [data-theme="light"] .section-get#performance .performance-cta:hover {
          background: rgba(15,23,42,0.06) !important;
          border-color: rgba(15,23,42,0.72) !important;
          color: #0b0f19 !important;
        }
        [data-theme="light"] .section-get#performance .matter-box {
          background: linear-gradient(170deg, #ffffff 0%, #f8f9ff 100%) !important;
          border: 1.4px solid rgba(15,23,42,0.14) !important;
          border-radius: 28px !important;
          box-shadow: 0 16px 34px rgba(15,23,42,0.1), 0 0 0 1px rgba(255,255,255,0.72) inset !important;
          overflow: hidden !important;
        }
        [data-theme="light"] .section-get#performance .matter-box::before {
          opacity: 0.3 !important;
          filter: hue-rotate(220deg) saturate(0.78) brightness(1.12);
        }
        [data-theme="light"] .section-get#performance .matter-box canvas {
          background: radial-gradient(circle at 24% 16%, #ffffff 0%, #f3f5ff 58%, #eef2ff 100%) !important;
          border: 1px solid rgba(15,23,42,0.12) !important;
          border-radius: 28px !important;
          background-color: #edf3ff !important;
          background-image: radial-gradient(circle at 24% 16%, #ffffff 0%, #f3f5ff 58%, #eef2ff 100%) !important;
        }
        [data-theme="light"] .section-get#performance .item-circle-1 {
          opacity: 0.28 !important;
          filter: hue-rotate(230deg) saturate(0.86) brightness(1.05);
        }
      `}</style>
      <img
        loading="lazy"
        className="item-1 item-circle-1"
        src="/images/item/item-circle.webp"
        alt="Visual element for 1111.tn price comparison"
      />
      <img
        loading="lazy"
        className="item-2 item-circle-1"
        src="/images/item/item-circle.webp"
        alt="Visual element for 1111.tn price comparison"
      />
      <img
        loading="lazy"
        className="item-3 item-circle-1"
        src="/images/item/item-circle.webp"
        alt="Visual element for 1111.tn price comparison"
      />
      <div className="container">
        <div className="row">
          <div className="col-lg-5">
            <div className="content">
              <div className="heading1 wow fadeInUp" data-wow-delay="0s">
                Comparateur 1111.tn
                <span></span>
              </div>
              <div className="heading-section">
                <div className="heading wow fadeInUp" data-wow-delay="0.1s">
                  Comparez les{" "}
                  <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
                    <span className="cd-words-wrapper">
                      <span className="item-text is-visible">
                        <i className="in">p</i>
                        <i className="in">r</i>
                        <i className="in">i</i>
                        <i className="in">x</i>
                      </span>
                      <span className="item-text is-hidden">
                        <i className="out">d</i>
                        <i className="out">e</i>
                        <i className="out">a</i>
                        <i className="out">l</i>
                        <i className="out">s</i>
                      </span>
                      <span className="item-text is-hidden">
                        <i className="out">p</i>
                        <i className="out">r</i>
                        <i className="out">o</i>
                        <i className="out">m</i>
                        <i className="out">o</i>
                        <i className="out">s</i>
                      </span>
                    </span>
                  </span>{" "}
                  dans{" "}
                  <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3 d-inline-flex">
                    <span className="cd-words-wrapper">
                      <span className="item-text is-visible">
                        <i className="in">T</i>
                        <i className="in">u</i>
                        <i className="in">n</i>
                        <i className="in">i</i>
                        <i className="in">s</i>
                        <i className="in">i</i>
                        <i className="in">e</i>
                      </span>
                      <span className="item-text is-hidden">
                        <i className="in">m</i>
                        <i className="in">a</i>
                        <i className="in">g</i>
                        <i className="in">a</i>
                        <i className="in">s</i>
                        <i className="in">i</i>
                        <i className="in">n</i>
                        <i className="in">s</i>
                      </span>
                      <span className="item-text is-hidden">
                        <i className="out">e</i>
                        <i className="out">n</i>
                        <i className="out"> </i>
                        <i className="out">l</i>
                        <i className="out">i</i>
                        <i className="out">g</i>
                        <i className="out">n</i>
                        <i className="out">e</i>
                      </span>
                    </span>
                  </span>
                  !
                </div>
                <p className="wow fadeInUp" data-wow-delay="0.2s">
                  Trouvez le meilleur prix sur vos produits en quelques
                  secondes. <br /> Comparez entre magasins physiques et en
                  ligne, en temps reel.
                </p>
              </div>
              <div className="wow fadeInUp" data-wow-delay="0.3s">
                <a
                  href="#"
                  className="tf-btn-4 performance-cta light_skew_hover type-white wow fadeInUp"
                  data-wow-delay="0.2s"
                >
                  Comparer maintenant
                </a>
              </div>
            </div>
          </div>
          <div className="col-lg-7">
            <div id="matter-box" className="matter-box">
              <canvas
                width="1328"
                height="938"
                data-pixel-ratio="2"
                style={{
                  width: "664px",
                  height: "469px",
                  backgroundColor: "#edf3ff",
                  backgroundImage:
                    "radial-gradient(circle at 20% 15%, #ffffff 0%, #f3f6ff 56%, #eaf0ff 100%)",
                }}
              ></canvas>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
