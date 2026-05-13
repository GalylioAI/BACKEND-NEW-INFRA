import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import TrendingSection from "./components/TrendingSection";
import { ParapharmacieShowcaseSection } from "./components/ParapharmacieShowcaseSection";
import MarqueeSection from "./components/MarqueeSection";
import DevelopedSection from "./components/DevelopedSection";
import DemoSection from "./components/DemoSection";
import OjjaSection from "./components/OjjaSection";
import QoffetEttounsiSection from "./components/QoffetEttounsiSection";
import PackedSection from "./components/PackedSection";
import FeaturesSection from "./components/FeaturesSection";
import PredictionSection from "./components/PredictionSection";
import InnerPageSection from "./components/InnerPageSection";
import GetSection from "./components/GetSection";
import FaqsSection from "./components/FaqsSection";
import CtaMarqueeSection from "./components/CtaMarqueeSection";
import Footer from "./components/Footer";
import { getMergeStats, getShopDetails } from "./lib/demo-data/analytics";
import { loadBlogs } from "./lib/blog-content";
import { getProductCategories, listProducts } from "./lib/demo-data/catalog";
import type { BlogArticle, CatalogProduct } from "./lib/demo-data/types";
import { compactNumber } from "./lib/product-utils";

const ELECTROMENAGER = "\u00c9lectrom\u00e9nager";

async function optional<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

async function getLandingData() {
  const [electroProducts, allProducts, categories, mergeStats, shopDetails] =
    await Promise.all([
      optional(
        listProducts({
          category: ELECTROMENAGER,
          category_type: "top_category",
          limit: 4,
        }),
      ),
      optional(listProducts({ limit: 8 })),
      optional(getProductCategories("top_category")),
      optional(getMergeStats()),
      optional(getShopDetails()),
    ]);
  const trendCategoryNames = (
    categories || ["Informatique", ELECTROMENAGER, "Gaming", "TV / Photo / Son"]
  )
    .filter(Boolean)
    .slice(0, 5);

  const trendCategories = await Promise.all(
    trendCategoryNames.map(async (category) => {
      const response = await optional(
        listProducts({ category, category_type: "top_category", limit: 6 }),
      );
      return {
        label: category,
        products: (response?.products || []) as CatalogProduct[],
      };
    }),
  );

  const shopCount =
    (shopDetails?.retails_shops.length || 0) +
    (shopDetails?.para_shops.length || 0);
  const commonProducts =
    (mergeStats?.retails?.common_products || 0) +
    (mergeStats?.para?.common_products || 0);
  const blogs = await loadBlogs();

  return {
    heroProducts: ((electroProducts?.products.length
      ? electroProducts.products
      : allProducts?.products) || []) as CatalogProduct[],
    trending: trendCategories,
    shopDetails,
    latestBlog: (blogs[0] || null) as BlogArticle | null,
    heroStats: [
      {
        value: compactNumber(allProducts?.total || 0),
        label: "Produits compares",
      },
      { value: compactNumber(shopCount), label: "Magasins indexes" },
      { value: compactNumber(commonProducts), label: "Prix croises" },
    ],
  };
}

export default async function Home() {
  const landing = await getLandingData();

  return (
    <>
      <div className="tfmouseCursor cursor-outer"></div>
      <div className="tfmouseCursor cursor-inner"></div>

      <div id="wrapper">
        <div id="pagee" className="">
          {/* Main Header */}
          <Header />

          {/* slider */}
          <HeroSection
            products={landing.heroProducts}
            stats={landing.heroStats}
            latestBlog={landing.latestBlog}
          />

          {/* section-marquee */}
          <MarqueeSection />

          {/* section-developed */}
          <DevelopedSection />

          {/* section-trending */}
          <TrendingSection categories={landing.trending} />

          {/* section-parapharmacie */}
          <ParapharmacieShowcaseSection />

          {/* section-demo */}
          <DemoSection analytics={landing.shopDetails} />
          {/* /section-demo */}

          {/* section-ojja */}
          <OjjaSection />
          {/* /section-ojja */}

          {/* section-qoffet */}
          <QoffetEttounsiSection />

          {/* section-mobile hidden on request */}

          {/* section-packed */}
          <PackedSection />
          {/* /section-packed */}

          {/* section-features */}
          <FeaturesSection />
          {/* /section-features */}

          {/* section-prediction */}
          <PredictionSection />
          {/* /section-prediction */}

          {/* section-innerpage */}
          <InnerPageSection />
          {/* /section-innerpage */}

          {/* section-get */}
          <GetSection />
          {/* /section-get */}

          {/* section-exclusive */}
          {/* <section className="section-exclusive">
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <div className="heading-section center">
                                <div className="heading fw-6 wow fadeInUp" data-wow-delay="0.1s">
                                    <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
                                        <span className="cd-words-wrapper">
                                            <span className="item-text is-visible">Premium</span>
                                            <span className="item-text is-hidden">Premium</span>
                                            <span className="item-text is-hidden">Premium</span>
                                        </span>                                          
                                    </span>
                                    and
                                    <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
                                        <span className="cd-words-wrapper">
                                            <span className="item-text is-visible">Exclusive</span>
                                            <span className="item-text is-hidden">Exclusive</span>
                                            <span className="item-text is-hidden">Exclusive</span>
                                        </span>                                          
                                    </span>
                                    Features for Free
                                </div>
                                <p className=" wow fadeInUp" data-wow-delay="0.2s">Enhance your website’s flexibility and performance with robust, high-quality features—completely free and <br /> designed to empower your site’s functionality and user experience.</p>
                            </div>
                        </div>
                    </div>
                    <div className="exclusive-wrap">
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/html-5.png" alt="" />
                            </div>
                            <div className="text">HTML5</div>
                        </div>
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/css-3.png" alt="" />
                            </div>
                            <div className="text">CSS3</div>
                        </div>
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/bootstrap-5.png" alt="" />
                            </div>
                            <div className="text">Bootstrap 5</div>
                        </div>
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/sass.png" alt="" />
                            </div>
                            <div className="text">SASS</div>
                        </div>
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/swiper.png" alt="" />
                            </div>
                            <div className="text">Swipe Slider</div>
                        </div>
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/w3c.png" alt="" />
                            </div>
                            <div className="text">W3C Validation</div>
                        </div>
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/wow.png" alt="" />
                            </div>
                            <div className="text">Wow JS</div>
                        </div>
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/photoswipe.png" alt="" />
                            </div>
                            <div className="text">PhotoSwipes</div>
                        </div>
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/lightbox.png" alt="" />
                            </div>
                            <div className="text">Lightbox</div>
                        </div>
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/img-compare.png" alt="" />
                            </div>
                            <div className="text">Image Compare Viewer</div>
                        </div>
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/google-font.png" alt="" />
                            </div>
                            <div className="text">Google Fonts</div>
                        </div>
                        <div className="exclusive-item">
                            <div className="image">
                                <img src="/images/exclusive/SEO.png" alt="" />
                            </div>
                            <div className="text">SEO Optimized</div>
                        </div>
                    </div>
                </div>
            </section> */}
          {/* /section-exclusive */}

          {/* section-unlock */}
          {/* <section className="section-unlock">
                <img loading="lazy"  className="item-1 item-circle-2" src="/images/item/item-circle-blur.png" alt="Vineta’s web development project screenshot" />
                <div className="section-unlock-wrap">
                    <img src="/images/item/grid-1.png" alt="" />
                    <div className="content">
                        <div className="heading-section">
                            <div className="heading wow fadeInUp" data-wow-delay="0.1s">
                                <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
                                    <span className="cd-words-wrapper">
                                        <span className="item-text is-visible">Unlock</span>
                                        <span className="item-text is-hidden">Unlock</span>
                                        <span className="item-text is-hidden">Unlock</span>
                                    </span>                                          
                                </span>
                                the Full Vineta
                                <span className="fw-4 fst-italic font-playfair-display animationtext letters rotate-3">
                                    <span className="cd-words-wrapper">
                                        <span className="item-text is-visible">Bundle</span>
                                        <span className="item-text is-hidden">Bundle</span>
                                        <span className="item-text is-hidden">Bundle</span>
                                    </span>                                          
                                </span>
                            </div>
                            <p className=" wow fadeInUp" data-wow-delay="0.2s">Purchase Vineta HTML and receive the Vineta Figma version at no extra cost. Enjoy seamless design, customization in one complete package.</p>
                        </div>
                        <a href="/products" className="tf-btn-4 light_skew_hover type-white wow fadeInUp" target="_blank" data-wow-delay="0.2s">Get Vineta Templates Now</a>
                    </div>
                    <div className="image">
                        <span className="item-1"></span>
                        <span className="item-2"></span>
                        <span className="item-3"></span>
                        <span className="item-4"></span>
                        <img loading="lazy" src="/images/item/unlock-1.png" className="lazyload" alt="" />
                    </div>
                </div>
            </section> */}
          {/* /section-unlock */}

          {/* section-faqs */}
          <FaqsSection />
          {/* /section-faqs */}

          {/* section-marquee */}
          <CtaMarqueeSection />
          {/* /section-marquee */}

          {/* footer */}
          <Footer />
          {/* /footer */}
        </div>
        {/* /#page */}
      </div>
      {/* /#wrapper */}

      <a id="scroll-top" className="button-go">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_18482_1195)">
            <path
              d="M3 11.25L12 2.25L21 11.25H16.5V19.5C16.5 19.6989 16.421 19.8897 16.2803 20.0303C16.1397 20.171 15.9489 20.25 15.75 20.25H8.25C8.05109 20.25 7.86032 20.171 7.71967 20.0303C7.57902 19.8897 7.5 19.6989 7.5 19.5V11.25H3Z"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_18482_1195">
              <rect width="24" height="24" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </a>

      {/* Demo Popup */}
      <div className="pass_pop" id="demoPopup">
        <div className="overlay"></div>
        <div className="wrap">
          <button className="close" id="closePopup">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
            >
              <path d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"></path>
            </svg>
          </button>
          <div className="content text-start">
            <p className="heading">
              Please enter store password <span className="linear">"1"</span>
              <br />
              to view live demo
            </p>
            <a
              href="#"
              id="popupDemoLink"
              target="_blank"
              className="view_more hdt-btn-hover-icon"
            >
              View now{" "}
              <svg
                className="hdt-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="9"
                height="9"
                viewBox="0 0 9 9"
                fill="none"
              >
                <path
                  d="M1.14084 8.48218L0.279297 7.62064L6.18699 1.71295H0.894682V0.482178H8.2793V7.86679H7.04853V2.57449L1.14084 8.48218Z"
                  fill="white"
                ></path>
              </svg>
            </a>
            <p className="sub">WE APOLOGIZE FOR THIS INCONVENIENCE!</p>
          </div>
        </div>
      </div>
    </>
  );
}
