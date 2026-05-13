export default function FeaturesSection() {
  return (
    <section id="features" className="section-features">
      <style>{`
        @media (max-width: 600px) {
          .section-features .container {
            padding-left: 12px;
            padding-right: 12px;
          }
          .section-features .row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin: 0;
          }
          .section-features .row > [class*="col-"] {
            width: 100%;
            max-width: 100%;
            padding: 0;
            margin: 0;
          }
          .section-features .feature-box {
            margin-bottom: 0;
            padding-top: 12px !important;
            border-radius: 12px;
          }
          .section-features .feature-box .feature-inner {
            padding: 12px 10px !important;
          }
          .section-features .feature-box .content {
            padding-left: 8px;
            padding-right: 8px;
            margin-bottom: 10px !important;
          }
          .section-features .feature-box .content .title {
            font-size: 13px;
            line-height: 1.3;
            margin-bottom: 6px;
          }
          .section-features .feature-box .content p {
            font-size: 10px;
            line-height: 1.45;
          }
          .section-features .feature-box .content .sub {
            font-size: 8px;
            line-height: 1.2;
          }
          .section-features .feature-box .image img {
            border-radius: 8px !important;
          }
          .section-features .feature-box.style-row {
            flex-direction: column;
            row-gap: 10px;
          }
          .section-features .feature-box.style-row .content,
          .section-features .feature-box.style-row .image {
            width: 100%;
            max-width: 100%;
          }
          .section-features .row > [class*="col-"]:last-child {
            grid-column: 1 / -1;
            display: flex;
            justify-content: center;
          }
          .section-features .row > [class*="col-"]:last-child .feature-box {
            width: 100%;
            max-width: 300px;
          }
        }
        .section-features .box-tag .eff::after {
          background-image: linear-gradient(90deg, transparent, rgba(59, 222, 185, 1), transparent);
        }
        [data-theme="light"] .section-features .box-tag .eff::after {
          background-image: linear-gradient(90deg, transparent, rgba(0,0,0,0.75), transparent) !important;
        }
        [data-theme="light"] .section-features .feature-box {
          background: linear-gradient(160deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95)) !important;
          border: 1.6px solid rgba(15,23,42,0.2) !important;
          box-shadow:
            0 0 0 1px rgba(15,23,42,0.06),
            0 12px 28px rgba(15,23,42,0.1) !important;
        }
        [data-theme="light"] .section-features .feature-box:hover {
          border-color: rgba(91,33,182,0.34) !important;
          box-shadow:
            0 0 0 1px rgba(91,33,182,0.12),
            0 16px 34px rgba(15,23,42,0.14) !important;
        }
        [data-theme="light"] .section-features .feature-box.style-row {
          border: 1.6px solid rgba(15,23,42,0.22) !important;
          box-shadow:
            0 0 0 1px rgba(15,23,42,0.07),
            0 14px 30px rgba(15,23,42,0.11) !important;
        }
        [data-theme="light"] .section-features .feature-box .content .title,
        [data-theme="light"] .section-features .feature-box .title {
          color: #0f172a !important;
        }
        .section-features .feature-box .content .title,
        .section-features .feature-box .title {
          font-weight: 900 !important;
        }
        [data-theme="light"] .section-features .feature-box .content p {
          color: rgba(15,23,42,0.72) !important;
        }
        [data-theme="light"] .section-features .feature-box .sub.text-gradient.style-3 {
          color: #5b21b6 !important;
          background: none !important;
          -webkit-text-fill-color: #5b21b6 !important;
          -webkit-background-clip: initial !important;
          background-clip: initial !important;
          font-weight: 800 !important;
        }
      `}</style>
      <img loading="lazy" decoding="async" className="img-item item-circle-2" src="/images/item/item-circle-blur.webp" alt="1111.tn's web development project screenshot" />
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="heading-section style-2 align-items-end">
              <img loading="lazy" decoding="async" className="img-bg item-circle-2" src="/images/item/item-circle-blur.webp" alt="1111.tn's web development project screenshot" />
              <div>
                <div className="sub-title box-tag wow fadeInUp" data-wow-delay="0s">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5001 11.1518L14.5786 11.6126C14.3018 11.7502 14.0778 11.9742 13.9402 12.251L13.4794 13.1726C13.4138 13.3054 13.225 13.3054 13.1594 13.1726L12.6986 12.251C12.561 11.9742 12.337 11.7502 12.0602 11.6126L11.1387 11.1518C11.0059 11.0862 11.0059 10.8974 11.1387 10.8318L12.0602 10.371C12.337 10.2335 12.561 10.0095 12.6986 9.73266L13.1594 8.81109C13.225 8.67829 13.4138 8.67829 13.4794 8.81109L13.9402 9.73266C14.0778 10.0095 14.3018 10.2335 14.5786 10.371L15.5001 10.8318C15.6329 10.8974 15.6329 11.0862 15.5001 11.1518Z" fill="url(#paint0_linear_3740_16590)" />
                    <path d="M10.8092 8.37279L8.65888 9.44796C8.01409 9.77116 7.49091 10.2943 7.16772 10.9391L6.09255 13.0895C5.93895 13.3967 5.50057 13.3967 5.34697 13.0895L4.2718 10.9391C3.94861 10.2943 3.42542 9.77116 2.78064 9.44796L0.630294 8.37279C0.323105 8.2192 0.323105 7.78081 0.630294 7.62721L2.78064 6.55204C3.42542 6.22885 3.94861 5.70566 4.2718 5.06088L5.34697 2.91054C5.50057 2.60334 5.93895 2.60334 6.09255 2.91054L7.16772 5.06088C7.49091 5.70566 8.01409 6.22885 8.65888 6.55204L10.8092 7.62721C11.1164 7.78081 11.1164 8.2192 10.8092 8.37279Z" fill="url(#paint1_linear_3740_16590)" />
                    <path d="M11.1151 3.83366L11.5706 3.60595C11.7074 3.53795 11.8181 3.42725 11.8861 3.29046L12.1138 2.83503C12.1462 2.7694 12.2395 2.7694 12.2719 2.83503L12.4996 3.29046C12.5676 3.42725 12.6783 3.53795 12.8151 3.60595L13.2706 3.83366C13.3362 3.86608 13.3362 3.95938 13.2706 3.9918L12.8151 4.21952C12.6783 4.28752 12.5676 4.39821 12.4996 4.535L12.2719 4.99044C12.2395 5.05527 12.1462 5.05527 12.1138 4.99044L11.8861 4.535C11.8181 4.39821 11.7074 4.28752 11.5706 4.21952L11.1151 3.9918C11.0495 3.95938 11.0495 3.86608 11.1151 3.83366Z" fill="url(#paint2_linear_3740_16590)" />
                    <defs>
                      <linearGradient id="paint0_linear_3740_16590" x1="15.5997" y1="13.2722" x2="10.1035" y2="10.7515" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#3BDEB9" /><stop offset="0.5" stopColor="#77E590" /><stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <linearGradient id="paint1_linear_3740_16590" x1="11.0396" y1="13.3199" x2="-1.78273" y2="7.43927" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#3BDEB9" /><stop offset="0.5" stopColor="#77E590" /><stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <linearGradient id="paint2_linear_3740_16590" x1="13.3198" y1="5.03906" x2="10.6038" y2="3.79314" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#3BDEB9" /><stop offset="0.5" stopColor="#77E590" /><stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="text-gradient style-2">Pourquoi 1111.tn</span>
                  <span className="eff"></span>
                </div>
                <div className="heading fw-6 mb-0 wow fadeInUp h1" data-wow-delay="0.1s">
                  <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
                    <span className="cd-words-wrapper">
                      <span className="item-text is-visible"><i className="in">I</i><i className="in">n</i><i className="in">t</i><i className="in">e</i><i className="in">l</i><i className="in">l</i><i className="in">i</i><i className="in">g</i><i className="in">e</i><i className="in">n</i><i className="in">t</i><i className="in">e</i><i className="in">s</i></span>
                      <span className="item-text is-hidden"><i className="out">I</i><i className="out">n</i><i className="out">t</i><i className="out">e</i><i className="out">l</i><i className="out">l</i><i className="out">i</i><i className="out">g</i><i className="out">e</i><i className="out">n</i><i className="out">t</i><i className="out">e</i><i className="out">s</i></span>
                      <span className="item-text is-hidden"><i className="in">I</i><i className="in">n</i><i className="in">t</i><i className="in">e</i><i className="in">l</i><i className="in">l</i><i className="in">i</i><i className="in">g</i><i className="in">e</i><i className="in">n</i><i className="in">t</i><i className="in">e</i><i className="in">s</i></span>
                    </span>
                  </span>
                  {" "}Fonctionnalités
                </div>
              </div>
              <p className="wow fadeInUp" data-wow-delay="0s">1111.tn regroupe tout ce qu&apos;il faut pour comparer les prix, détecter les arnaques <br /> et prendre les meilleures décisions d&apos;achat en Tunisie.</p>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Product Swatches */}
          <div className="col-md-4">
            <div className="feature-box wow fadeInUp" data-wow-delay="0s">
              <div className="content mb-18">
                <div className="sub text-gradient style-3 animation-none">FONCTIONNALITÉ CLÉE</div>
                <div className="title">Comparaison de Prix</div>
                <p>Comparez instantanément les prix de plus de <br /> 50 000 produits à travers 10+ magasins en ligne.</p>
              </div>
              <div className="image center">
                <img loading="lazy" src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80" alt="Comparaison de prix entre boutiques" style={{borderRadius:"12px",objectFit:"cover",width:"100%"}} />
              </div>
            </div>
          </div>

          {/* Multiple Product Layouts */}
          <div className="col-md-4">
            <div className="feature-box pt-37 wow fadeInUp" data-wow-delay="0.1s">
              <div className="content mb-61">
                <div className="title">Détection Faux Prix</div>
                <p>Notre IA détecte les gonflements de prix artificiels <br /> avant les soldes — protégez-vous des <br /> arnaques tarifaires.</p>
              </div>
              <div className="image center">
                <img loading="lazy" src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80" alt="Détection de faux prix" style={{borderRadius:"12px",objectFit:"cover",width:"100%"}} />
              </div>
            </div>
          </div>

          {/* Dynamic Mega Menu */}
          <div className="col-md-4">
            <div className="feature-box wow fadeInUp" data-wow-delay="0.2s">
              <div className="content mb-3">
                <div className="sub text-gradient style-3 animation-none">FONCTIONNALITÉ CLÉE</div>
                <div className="title">Alertes Prix Prédictives</div>
                <p>Soyez alerté avant une hausse de prix imminente <br /> grâce à notre système de prédiction IA.</p>
              </div>
              <div className="image center">
                <img loading="lazy" src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80" alt="Alertes prix prédictives" style={{borderRadius:"12px",objectFit:"cover",width:"100%"}} />
              </div>
            </div>
          </div>

          {/* Sticky Product Cart — full width */}
          <div className="col-md-12">
            <div className="feature-box style-row type-1 align-items-center wow fadeInUp" data-wow-delay="0s">
              <div className="content mb-26">
                <div className="sub text-gradient style-3 animation-none">FONCTIONNALITÉ CLÉE</div>
                <div className="title">Veille Concurrentielle</div>
                <p>Analysez les stratégies tarifaires de vos concurrents <br /> et restez toujours un pas en avance <br /> sur le marché tunisien.</p>
              </div>
              <div className="image">
                <img loading="lazy" src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80" alt="Veille concurrentielle" style={{borderRadius:"12px",objectFit:"cover",width:"100%"}} />
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="col-md-4">
            <div className="feature-box wow fadeInUp" data-wow-delay="0s">
              <div className="content mb-54">
                <div className="title">Supermarché & Électroménager</div>
                <p>Comparez les prix des grandes surfaces et <br /> électroménager : Mytek, Spacenet, Tunisianet...</p>
              </div>
              <div className="image center">
                <img loading="lazy" src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80" alt="Supermarché et électroménager" style={{borderRadius:"12px",objectFit:"cover",width:"100%"}} />
              </div>
            </div>
          </div>

          {/* Frequently Bought Together */}
          <div className="col-md-4">
            <div className="feature-box wow fadeInUp" data-wow-delay="0.1s">
              <div className="content mb-31">
                <div className="sub text-gradient style-3 animation-none">FONCTIONNALITÉ CLÉE</div>
                <div className="title">Parapharmacie</div>
                <p>Comparez Vichy, Avène, Bioderma et plus encore <br /> dans les catégories Solaire, Hygiène, <br /> Maman &amp; Bébé.</p>
              </div>
              <div className="image center">
                <img loading="lazy" src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80" alt="Parapharmacie" style={{borderRadius:"12px",objectFit:"cover",width:"100%"}} />
              </div>
            </div>
          </div>

          {/* Advance Product Filter */}
          <div className="col-md-4">
            <div className="feature-box wow fadeInUp" data-wow-delay="0s">
              <div className="content mb-15">
                <div className="title">Couffin Tounsi</div>
                <p>Suivez les prix des produits du marché traditionnel <br /> dans Monoprix, Carrefour et Géant.</p>
              </div>
              <div className="image center">
                <img loading="lazy" src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80" alt="Couffin Tounsi" style={{borderRadius:"12px",objectFit:"cover",width:"100%"}} />
              </div>
            </div>
          </div>

          {/* Product Video Section */}
          <div className="col-md-8">
            <div className="feature-box style-row align-items-center pt-0 wow fadeInUp" data-wow-delay="0.1s">
              <div className="image mw-382">
                <img loading="lazy" src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80" alt="Produits du moment" style={{borderRadius:"12px",objectFit:"cover",width:"100%"}} />
              </div>
              <div className="content mb-26">
                <div className="sub text-gradient style-3 animation-none">FONCTIONNALITÉ CLÉE</div>
                <div className="title">Produits du Moment</div>
                <p>Découvrez les produits tendance de la semaine <br /> avec avis, notes et comparaison de prix <br /> en temps réel.</p>
              </div>
            </div>
          </div>

          {/* Quick View Section */}
          <div className="col-md-4">
            <div className="feature-box wow fadeInUp" data-wow-delay="0s">
              <div className="content mb-31">
                <div className="title">Dashboard Analytique</div>
                <p>Accédez à un tableau de bord complet pour <br /> suivre les évolutions de prix et <br /> l&apos;historique des offres.</p>
              </div>
              <div className="image center">
                <img loading="lazy" src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80" alt="Dashboard analytique" style={{borderRadius:"12px",objectFit:"cover",width:"100%"}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
