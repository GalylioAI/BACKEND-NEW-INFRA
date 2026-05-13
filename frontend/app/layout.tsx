import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./dashboard/dashboard.css";
import { AuthProvider } from "./lib/auth/AuthProvider";
import { AppAccessGuard } from "./components/access/access-guard";

export const metadata: Metadata = {
  title: "1111.tn - Comparateur de prix tunisie",
  description:
    "Comparateur de prix tunisien avec comptes, favoris, alertes et tableau de bord securises.",
  authors: [{ name: "1111.tn" }],
  openGraph: {
    title: "1111.tn",
    description:
      "Comparateur de prix tunisien avec comptes, favoris, alertes et tableau de bord.",
    url: "https://1111.tn",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "1111.tn",
  },
  icons: {
    icon: "/images/logo/Favicon.png",
    apple: "/images/logo/Favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <link rel="stylesheet" href="/css/app.css" />
        <link rel="stylesheet" href="/css/light-mode.css?v=7" />
        <link rel="stylesheet" href="/css/textanimation.css" />
        <link rel="stylesheet" href="/css/responsive.css" />
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (() => {
              try {
                var saved = localStorage.getItem("theme");
                var theme = (saved === "light" || saved === "dark") ? saved : "dark";
                document.documentElement.setAttribute("data-theme", theme);
              } catch(e) {
                document.documentElement.setAttribute("data-theme", "dark");
              }
            })();
          `}
        </Script>
        <Script
          id="strip-extension-hydration-attrs"
          strategy="beforeInteractive"
        >
          {`
            (() => {
              const ATTRIBUTES = ["bis_skin_checked", "bis_size", "bis_id"];

              const stripAttributes = (root) => {
                if (!root || !root.querySelectorAll) {
                  return;
                }

                ATTRIBUTES.forEach((attribute) => {
                  if (root instanceof Element && root.hasAttribute(attribute)) {
                    root.removeAttribute(attribute);
                  }

                  root.querySelectorAll("[" + attribute + "]").forEach((node) => {
                    node.removeAttribute(attribute);
                  });
                });
              };

              stripAttributes(document.documentElement);

              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  if (mutation.type === "attributes" && mutation.target instanceof Element) {
                    if (ATTRIBUTES.includes(mutation.attributeName || "")) {
                      mutation.target.removeAttribute(mutation.attributeName);
                    }
                  }

                  mutation.addedNodes.forEach((node) => {
                    if (node instanceof Element) {
                      stripAttributes(node);
                    }
                  });
                });
              });

              observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ATTRIBUTES,
                childList: true,
                subtree: true,
              });

              window.addEventListener("load", () => {
                window.setTimeout(() => observer.disconnect(), 3000);
              });
            })();
          `}
        </Script>
      </head>
      <body className="body counter-scroll" suppressHydrationWarning>
        <AuthProvider>
          <AppAccessGuard>{children}</AppAccessGuard>
        </AuthProvider>
        <Script src="/js/jquery.min.js" strategy="afterInteractive" />
        <Script src="/js/bootstrap.min.js" strategy="afterInteractive" />
        <Script src="/js/plugin.js" strategy="lazyOnload" />
        <Script src="/js/swiper.js" strategy="lazyOnload" />
        <Script src="/js/countto.js" strategy="lazyOnload" />
        <Script src="/js/lazysize.min.js" strategy="lazyOnload" />
        <Script src="/js/jquery.isotope.min.js" strategy="lazyOnload" />
        <Script src="/js/infinityslide.js" strategy="lazyOnload" />
        <Script src="/js/matter.min.js" strategy="afterInteractive" />
        <Script src="/js/matter.js" strategy="lazyOnload" />
        <Script src="/js/textanimation.js" strategy="lazyOnload" />
        <Script src="/js/main.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
