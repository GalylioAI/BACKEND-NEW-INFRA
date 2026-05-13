export default function MobileSection() {
  return (
    <section className="section-mobile">
      <img
        loading="lazy"
        className="item-1 item-circle-1"
        src="/images/item/item-circle.webp"
        alt="1111.tn mobile comparison preview"
      />
      <div className="container-2">
        <div className="row">
          <div className="col-12">
            <div className="heading-section center">
              <img
                loading="lazy"
                className="img-bg"
                src="/images/item/grid-2.webp"
                alt="1111.tn mobile comparison preview"
              />
              <div className="sub-heading wow fadeInUp" data-wow-delay="0s">
                Comparaison Mobile
              </div>
              <div className="heading wow fadeInUp" data-wow-delay="0.1s">
                <div>
                  <img
                    loading="lazy"
                    src="/images/item/arrow.webp"
                    alt="1111.tn's web development project screenshot"
                  />
                </div>
                Expérience
              </div>
              <div className="heading1 fw-6 wow fadeInUp" data-wow-delay="0.2s">
                <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
                  <span className="cd-words-wrapper">
                    <span className="item-text is-visible">1111.tn</span>
                    <span className="item-text is-hidden">1111.tn</span>
                    <span className="item-text is-hidden">1111.tn</span>
                  </span>
                </span>
              </div>
              <p className="wow fadeInUp" data-wow-delay="0.3s">
                Comparez les prix des magasins tunisiens sur mobile en temps
                réel, <br /> avec une navigation rapide et une lecture claire
                des meilleures offres.
              </p>
            </div>
          </div>
          <div className="col-12">
            <div className="mobile-view-wrap">
              <div className="box-bg"></div>
              <div className="mobile-view-item">
                <div className="wrap-video">
                  <video
                    preload="none"
                    playsInline
                    autoPlay
                    loop
                    muted
                    controls
                  >
                    <source src="/images/1.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
              <div className="mobile-view-item">
                <div className="wrap-video">
                  <video
                    preload="none"
                    playsInline
                    autoPlay
                    loop
                    muted
                    controls
                  >
                    <source src="/images/2.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
              <div className="mobile-view-item">
                <div className="wrap-video">
                  <video
                    preload="none"
                    playsInline
                    autoPlay
                    loop
                    muted
                    controls
                  >
                    <source src="/images/3.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
              <div className="mobile-view-item">
                <div className="wrap-video">
                  <video
                    preload="none"
                    playsInline
                    autoPlay
                    loop
                    muted
                    controls
                  >
                    <source src="/images/4.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
