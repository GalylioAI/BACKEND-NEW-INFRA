export default function Footer() {
  return (
    <footer>
      <style>{`
        footer {
          position: relative;
          margin-top: 48px;
        }
        [data-theme="light"] footer .container {
          background: linear-gradient(165deg, #ffffff 0%, #f7f9ff 58%, #eef2ff 100%) !important;
          border: 1.6px solid rgba(15,23,42,0.16) !important;
          box-shadow: 0 18px 40px rgba(15,23,42,0.12), 0 0 0 1px rgba(255,255,255,0.75) inset !important;
          position: relative;
          overflow: hidden;
        }
        [data-theme="light"] footer .container::before,
        [data-theme="light"] footer .container::after {
          content: "";
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
        }
        [data-theme="light"] footer .container::before {
          width: 280px;
          height: 280px;
          top: -120px;
          right: -90px;
          background: radial-gradient(circle, rgba(124,58,237,0.2) 0%, rgba(124,58,237,0) 72%);
        }
        [data-theme="light"] footer .container::after {
          width: 240px;
          height: 240px;
          bottom: -110px;
          left: -80px;
          background: radial-gradient(circle, rgba(79,70,229,0.16) 0%, rgba(79,70,229,0) 72%);
        }
        [data-theme="light"] footer .text {
          color: #0f172a !important;
          font-weight: 800 !important;
          text-shadow: none !important;
          letter-spacing: -0.01em;
          position: relative;
          z-index: 1;
        }
        [data-theme="light"] footer .text-1 {
          color: rgba(15,23,42,0.72) !important;
          font-weight: 600 !important;
          font-size: 16px !important;
          position: relative;
          z-index: 1;
        }
        [data-theme="light"] footer .line-row,
        [data-theme="light"] footer .line-row1 {
          background: linear-gradient(90deg, rgba(124,58,237,0), rgba(124,58,237,0.48), rgba(79,70,229,0.42), rgba(124,58,237,0)) !important;
          position: relative;
          z-index: 1;
        }
        [data-theme="light"] footer .btn-buy {
          color: #ffffff !important;
          background: linear-gradient(90deg, #7c3aed, #4f46e5) !important;
          border: 1px solid rgba(79,70,229,0.38) !important;
          box-shadow: 0 12px 26px rgba(79,70,229,0.28) !important;
          border-radius: 999px !important;
          font-weight: 800 !important;
          position: relative;
          z-index: 1;
        }
        [data-theme="light"] footer .btn-buy svg path {
          fill: #ffffff !important;
        }
        [data-theme="light"] footer .btn-buy:hover {
          background: linear-gradient(90deg, #6d28d9, #4338ca) !important;
          border-color: rgba(67,56,202,0.62) !important;
          box-shadow: 0 14px 30px rgba(67,56,202,0.34) !important;
        }
        [data-theme="light"] footer .copyright {
          color: rgba(15,23,42,0.68) !important;
          font-weight: 600 !important;
          position: relative;
          z-index: 1;
        }
        [data-theme="light"] footer .copyright a,
        [data-theme="light"] footer .copyright .text-white {
          color: #111827 !important;
          font-weight: 700 !important;
        }
        @media (max-width: 600px) {
          [data-theme="light"] footer .container::before {
            width: 190px;
            height: 190px;
            top: -95px;
            right: -70px;
          }
          [data-theme="light"] footer .container::after {
            width: 160px;
            height: 160px;
            bottom: -80px;
            left: -60px;
          }
          [data-theme="light"] footer .text-1 {
            font-size: 13px !important;
          }
        }
        footer .container {
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 34px 20px 24px;
          background: linear-gradient(160deg, rgba(59,222,185,0.06), rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.25));
          box-shadow: 0 20px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        footer .text {
          font-size: clamp(1.3rem, 3vw, 2.2rem);
          line-height: 1.25;
          margin-bottom: 14px;
        }
        footer .text-1 {
          max-width: 760px;
          margin-left: auto;
          margin-right: auto;
          color: rgba(255,255,255,0.65);
          font-size: 15px;
          line-height: 1.65;
          margin-bottom: 20px;
        }
        footer .btn-buy {
          margin-bottom: 34px;
          padding: 13px 26px;
          font-size: 14px;
          gap: 10px;
          color: #fff !important;
          background: rgba(255,255,255,0.03) !important;
          border: 1px solid rgba(255,255,255,0.28);
          box-shadow: 0 10px 24px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.12);
          transition: transform .24s ease, border-color .24s ease, box-shadow .24s ease, background .24s ease;
        }
        footer .btn-buy svg path {
          fill: #fff;
          transition: fill .24s ease;
        }
        footer .btn-buy:hover {
          transform: translateY(-2px);
          background: rgba(59,222,185,0.12) !important;
          border-color: rgba(59,222,185,0.55);
          box-shadow: 0 14px 30px rgba(59,222,185,0.28), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        footer .btn-buy:hover svg path {
          fill: #ccff9b;
        }
        footer .copyright {
          color: rgba(255,255,255,0.55);
          font-size: 13px;
          line-height: 1.6;
        }
        @media (max-width: 600px) {
          footer .container {
            border-radius: 16px;
            padding: 22px 14px 16px;
          }
          footer .line-row { margin-bottom: 18px; }
          footer .text {
            font-size: 1.05rem;
            margin-bottom: 8px;
          }
          footer .text-1 {
            font-size: 12px;
            line-height: 1.45;
            margin-bottom: 12px;
          }
          footer .btn-buy {
            width: 100%;
            justify-content: center;
            margin-bottom: 18px;
            padding: 10px 14px;
            font-size: 12px;
          }
          footer .line-row1 { margin-bottom: 12px; }
          footer .copyright {
            font-size: 10px;
            line-height: 1.45;
          }
        }
      `}</style>
      <div className="container">
        <div className="line-row"></div>
        <div className="text">
          Gratuit — Transparent — Fait avec ❤️ en Tunisie
        </div>
        <div className="text-1">
          Rejoignez 1111.tn aujourd&apos;hui et commencez à comparer <br /> les
          prix intelligemment en Tunisie.
        </div>
        <a
          href="#"
          className="tf-btn-4 light_skew_hover type-white wow fadeInUp btn-buy"
          data-wow-delay="0.2s"
        >
          S&apos;inscrire Gratuitement
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.0002 2.58008C7.61638 2.58008 3.70534 5.73104 2.7883 10.0218C2.33014 12.1657 2.63878 14.4454 3.66094 16.3854C4.6447 18.2523 6.2575 19.7612 8.1871 20.6163C10.1942 21.506 12.4985 21.661 14.6081 21.0543C16.6433 20.4692 18.4478 19.185 19.6764 17.461C22.2451 13.857 21.9017 8.7944 18.8796 5.56496C17.1084 3.67232 14.5927 2.58008 12.0002 2.58008ZM16.5192 12.5034L13.9512 15.1333C13.301 15.7993 12.2733 14.7903 12.9209 14.1274L14.2166 12.8005H8.07598C7.6399 12.8005 7.27606 12.4364 7.27606 12.0006C7.27606 11.5647 7.64014 11.2006 8.07598 11.2006H14.1859L12.8645 9.87944C12.2078 9.2228 13.2259 8.20448 13.8825 8.86112L16.5132 11.4915C16.7921 11.7702 16.7947 12.2214 16.5192 12.5034Z"
              fill="black"
            />
          </svg>
        </a>
        <div className="line-row1"></div>
        <div className="copyright">
          © 2026{" "}
          <a className="text-white" href="#">
            1111.tn
          </a>{" "}
          — Tous droits réservés. Contactez-nous :{" "}
          <a className="text-white" href="mailto:contact@1111.tn">
            contact@1111.tn
          </a>{" "}
          | Tunis, Tunisie
        </div>
      </div>
    </footer>
  );
}
