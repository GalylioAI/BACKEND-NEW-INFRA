"use client";

const row1 = [
  { src: "/images/Smartphones.webp", alt: "Smartphones" },
  { src: "/images/laptops-informatique.webp", alt: "Laptops & Informatique" },
  { src: "/images/casques-audio.webp", alt: "Casques & Audio" },
  { src: "/images/gaming.webp", alt: "Gaming" },
  { src: "/images/télévisions.jfif", alt: "Télévisions" },
];

const row2 = [
  { src: "/images/geant.png", alt: "Géant" },
  { src: "/images/aziza.png", alt: "Aziza" },
  { src: "/images/parashop.png", alt: "ParaShop" },
  { src: "/images/parafendri.jpg", alt: "ParaFendri" },
  { src: "/images/parahouse.png", alt: "ParaHouse" },
  { src: "/images/mg.png", alt: "MG" },
];

const fallbackImageByAlt: Record<string, string> = {
  Smartphones: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=520&q=85",
  "Laptops & Informatique": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=520&q=85",
  "Casques & Audio": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=520&q=85",
  Gaming: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=520&q=85",
  Télévisions: "https://images.unsplash.com/photo-1593359677879-a4bb92f4834b?w=520&q=85",
  "Beauté & Soins": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=520&q=85",
  Supermarché: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=520&q=85",
  "Mode & Vêtements": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=520&q=85",
  Parapharmacie: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=520&q=85",
  Électroménager: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=520&q=85",
  "Couffin Tounsi": "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=520&q=85",
};

const IMAGE_WIDTH = 240;
const IMAGE_HEIGHT = 170;

function InnerPageRow({ items, reverse }: { items: { src: string; alt: string }[]; reverse?: boolean }) {
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div style={{ overflow: "hidden" }}>
      <div
        className="tf-brand style-3"
        style={{
          display: "flex",
          flexFlow: "row nowrap",
          alignItems: "center",
          width: "max-content",
          animation: `innerpage-scroll-${reverse ? "reverse" : "forward"} 52s linear infinite`,
        }}
      >
        {repeated.map((item, i) => (
          <div key={i} className="brand-item" style={{ flex: "0 0 auto", width: `${IMAGE_WIDTH}px`, height: `${IMAGE_HEIGHT}px` }}>
            <img
              loading="lazy"
              src={item.src}
              alt={item.alt}
              onError={(e) => {
                const fallback = fallbackImageByAlt[item.alt];
                if (!fallback || e.currentTarget.src === fallback) return;
                e.currentTarget.src = fallback;
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px", display: "block" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InnerPageSection() {
  return (
    <section className="section-innerpage">
      <style>{`
        [data-theme="light"] .section-innerpage {
          background: linear-gradient(180deg, #f4f6f3 0%, #eef2ed 100%) !important;
        }
        [data-theme="light"] .section-innerpage .heading-section .img-bg {
          opacity: 0.12 !important;
          filter: hue-rotate(230deg) saturate(0.8) brightness(1.15);
        }
        [data-theme="light"] .section-innerpage .sub-title.box-tag {
          background: #ffffff !important;
          border: 1px solid #000000 !important;
          box-shadow: 0 8px 18px rgba(15,23,42,0.1);
        }
        [data-theme="light"] .section-innerpage .sub-title.box-tag svg path {
          fill: #000000 !important;
        }
        [data-theme="light"] .section-innerpage .sub-title.box-tag .text-gradient.style-2 {
          background: none !important;
          -webkit-text-fill-color: #111827 !important;
          color: #111827 !important;
          font-weight: 800 !important;
          position: relative;
          z-index: 2;
          text-shadow: none !important;
        }
        [data-theme="light"] .section-innerpage .sub-title.box-tag .eff {
          background: rgba(255,255,255,0.92) !important;
          border: 1px solid #000000 !important;
          z-index: 1 !important;
        }
        [data-theme="light"] .section-innerpage .sub-title.box-tag > svg {
          position: relative;
          z-index: 2;
        }
        [data-theme="light"] .section-innerpage .heading {
          color: #0f172a !important;
          text-shadow: none !important;
        }
        [data-theme="light"] .section-innerpage .heading .item-text,
        [data-theme="light"] .section-innerpage .heading .item-text i {
          color: #111827 !important;
          -webkit-text-fill-color: #111827 !important;
          text-shadow: none !important;
        }
        [data-theme="light"] .section-innerpage p {
          color: rgba(15,23,42,0.72) !important;
          font-weight: 600 !important;
        }
        [data-theme="light"] .section-innerpage .brand-wrap .brand-item img {
          border: 1.5px solid rgba(15,23,42,0.16) !important;
          box-shadow: 0 10px 24px rgba(15,23,42,0.12);
          background: #ffffff !important;
        }
        @keyframes innerpage-scroll-forward {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes innerpage-scroll-reverse {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @media (max-width: 767px) {
          .section-innerpage .brand-wrap {
            gap: 14px;
          }
          .section-innerpage .brand-wrap .brand-item {
            width: 190px !important;
            height: 128px !important;
          }
        }
        @media (max-width: 480px) {
          .section-innerpage .brand-wrap .brand-item {
            width: 150px !important;
            height: 104px !important;
          }
        }
      `}</style>

      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="heading-section center">
              <img loading="lazy" className="img-bg" src="/images/item/grid-2.webp" alt="" />
              <div className="sub-title box-tag wow fadeInUp" data-wow-delay="0s">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5001 11.1518L14.5786 11.6126C14.3018 11.7502 14.0778 11.9742 13.9402 12.251L13.4794 13.1726C13.4138 13.3054 13.225 13.3054 13.1594 13.1726L12.6986 12.251C12.561 11.9742 12.337 11.7502 12.0602 11.6126L11.1387 11.1518C11.0059 11.0862 11.0059 10.8974 11.1387 10.8318L12.0602 10.371C12.337 10.2335 12.561 10.0095 12.6986 9.73266L13.1594 8.81109C13.225 8.67829 13.4138 8.67829 13.4794 8.81109L13.9402 9.73266C14.0778 10.0095 14.3018 10.2335 14.5786 10.371L15.5001 10.8318C15.6329 10.8974 15.6329 11.0862 15.5001 11.1518Z" fill="url(#paint0_ip)" />
                  <path d="M10.8092 8.37279L8.65888 9.44796C8.01409 9.77116 7.49091 10.2943 7.16772 10.9391L6.09255 13.0895C5.93895 13.3967 5.50057 13.3967 5.34697 13.0895L4.2718 10.9391C3.94861 10.2943 3.42542 9.77116 2.78064 9.44796L0.630294 8.37279C0.323105 8.2192 0.323105 7.78081 0.630294 7.62721L2.78064 6.55204C3.42542 6.22885 3.94861 5.70566 4.2718 5.06088L5.34697 2.91054C5.50057 2.60334 5.93895 2.60334 6.09255 2.91054L7.16772 5.06088C7.49091 5.70566 8.01409 6.22885 8.65888 6.55204L10.8092 7.62721C11.1164 7.78081 11.1164 8.2192 10.8092 8.37279Z" fill="url(#paint1_ip)" />
                  <path d="M11.1151 3.83366L11.5706 3.60595C11.7074 3.53795 11.8181 3.42725 11.8861 3.29046L12.1138 2.83503C12.1462 2.7694 12.2395 2.7694 12.2719 2.83503L12.4996 3.29046C12.5676 3.42725 12.6783 3.53795 12.8151 3.60595L13.2706 3.83366C13.3362 3.86608 13.3362 3.95938 13.2706 3.9918L12.8151 4.21952C12.6783 4.28752 12.5676 4.39821 12.4996 4.535L12.2719 4.99044C12.2395 5.05527 12.1462 5.05527 12.1138 4.99044L11.8861 4.535C11.8181 4.39821 11.7074 4.28752 11.5706 4.21952L11.1151 3.9918C11.0495 3.95938 11.0495 3.86608 11.1151 3.83366Z" fill="url(#paint2_ip)" />
                  <defs>
                    <linearGradient id="paint0_ip" x1="15.5997" y1="13.2722" x2="10.1035" y2="10.7515" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3BDEB9" /><stop offset="0.5" stopColor="#77E590" /><stop offset="1" stopColor="#CCFF9B" />
                    </linearGradient>
                    <linearGradient id="paint1_ip" x1="11.0396" y1="13.3199" x2="-1.78273" y2="7.43927" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3BDEB9" /><stop offset="0.5" stopColor="#77E590" /><stop offset="1" stopColor="#CCFF9B" />
                    </linearGradient>
                    <linearGradient id="paint2_ip" x1="13.3198" y1="5.03906" x2="10.6038" y2="3.79314" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3BDEB9" /><stop offset="0.5" stopColor="#77E590" /><stop offset="1" stopColor="#CCFF9B" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-gradient style-2">Pages 1111.tn</span>
                <span className="eff"></span>
              </div>

              <div className="heading fw-6 wow fadeInUp" data-wow-delay="0.1s">
                <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
                  <span className="cd-words-wrapper">
                    <span className="item-text is-visible"><i className="in">T</i><i className="in">o</i><i className="in">u</i><i className="in">t</i><i className="in">e</i><i className="in">s</i></span>
                    <span className="item-text is-hidden"><i className="out">T</i><i className="out">o</i><i className="out">u</i><i className="out">t</i><i className="out">e</i><i className="out">s</i></span>
                    <span className="item-text is-hidden"><i className="in">T</i><i className="in">o</i><i className="in">u</i><i className="in">t</i><i className="in">e</i><i className="in">s</i></span>
                  </span>
                </span>
                {" "}les catégories pour{" "}
                <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
                  <span className="cd-words-wrapper">
                    <span className="item-text is-visible"><i className="in">c</i><i className="in">o</i><i className="in">m</i><i className="in">p</i><i className="in">a</i><i className="in">r</i><i className="in">e</i><i className="in">r</i></span>
                    <span className="item-text is-hidden"><i className="out">c</i><i className="out">o</i><i className="out">m</i><i className="out">p</i><i className="out">a</i><i className="out">r</i><i className="out">e</i><i className="out">r</i></span>
                    <span className="item-text is-hidden"><i className="in">c</i><i className="in">o</i><i className="in">m</i><i className="in">p</i><i className="in">a</i><i className="in">r</i><i className="in">e</i><i className="in">r</i></span>
                  </span>
                </span>
              </div>

              <p className="wow fadeInUp" data-wow-delay="0.2s">
                Électronique, parapharmacie, supermarché, couffin tounsi — comparez tout, <br /> partout, en temps réel sur 1111.tn.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="brand-wrap">
        <InnerPageRow items={row1} />
        <InnerPageRow items={row2} reverse />
      </div>
    </section>
  );
}
