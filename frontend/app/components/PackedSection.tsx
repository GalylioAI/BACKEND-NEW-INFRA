export default function PackedSection() {
  return (
    <section className="section-packed" style={{ marginTop: "96px" }}>
      <style>{`
        @media (max-width: 600px) {
          .section-packed .wrap-grid-box.grid-4.packed-wrap {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 16px 10px !important;
          }
          .section-packed .packed-wrap .box-icon-item {
            padding: 6px 4px;
          }
          .section-packed .box-icon-item .icon {
            width: 44px;
            height: 44px;
            margin: 0 auto 12px;
          }
          .section-packed .box-icon-item .icon svg {
            width: 44px;
            height: 44px;
          }
          .section-packed .box-icon-item .content h5 {
            font-size: 13px;
            line-height: 1.3;
            margin-bottom: 8px !important;
          }
          .section-packed .box-icon-item .content p {
            font-size: 11px;
            line-height: 1.45;
            margin-bottom: 0;
          }
        }
        [data-theme="light"] .section-packed .box-icon-item .icon svg path,
        [data-theme="light"] .section-packed .box-icon-item .icon svg circle,
        [data-theme="light"] .section-packed .box-icon-item .icon svg rect,
        [data-theme="light"] .section-packed .box-icon-item .icon svg polygon,
        [data-theme="light"] .section-packed .box-icon-item .icon svg ellipse {
          fill: #111111 !important;
          stroke: #111111 !important;
        }
        [data-theme="light"] .section-packed {
          background: linear-gradient(180deg, #f3f5f2 0%, #eef1ed 100%) !important;
          border-top: 1px solid rgba(15,23,42,0.08);
          border-bottom: 1px solid rgba(15,23,42,0.08);
          padding: 18px 0;
        }
        [data-theme="light"] .section-packed .packed-wrap .box-icon-item {
          background: linear-gradient(160deg, rgba(255,255,255,0.96), rgba(248,250,252,0.93)) !important;
          border: 1.3px solid rgba(15,23,42,0.14) !important;
          border-radius: 16px;
          padding: 14px 10px;
          box-shadow: 0 8px 22px rgba(15,23,42,0.08), 0 0 0 1px rgba(255,255,255,0.6) inset;
        }
        [data-theme="light"] .section-packed .packed-wrap .box-icon-item:hover {
          border-color: rgba(91,33,182,0.32) !important;
          box-shadow: 0 12px 28px rgba(15,23,42,0.12), 0 0 0 1px rgba(91,33,182,0.1) !important;
        }
        [data-theme="light"] .section-packed .box-icon-item .content h5 {
          color: #0f172a !important;
          font-weight: 800 !important;
        }
        [data-theme="light"] .section-packed .box-icon-item .content p {
          color: rgba(15,23,42,0.72) !important;
        }
        [data-theme="light"] .section-packed .box-icon-item .icon {
          background: rgba(15,23,42,0.04);
          border-radius: 14px;
          box-shadow: 0 4px 12px rgba(15,23,42,0.08);
        }
      `}</style>
      <div className="container-2">
        <div className="row">
          <div className="col-12">
            <div className="wrap-grid-box grid-4 packed-wrap">
              {/* Super High Performance */}
              <div className="box-icon-item wow fadeInUp" data-wow-delay="0s">
                <div className="icon">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M11.6967 14.574C17.0225 9.27905 24.3545 6 32.4399 6C48.6733 6 61.8799 19.2066 61.8799 35.4399C61.8799 42.5413 59.3151 49.4001 54.658 54.7518C54.0958 55.4009 53.1103 55.4787 52.4528 54.9222L46.29 49.7246C45.608 49.1498 45.5428 48.1328 46.1239 47.476C49.0525 44.1514 50.6647 39.8756 50.6647 35.4399C50.6647 33.6693 50.4102 31.9177 49.9111 30.234C49.3223 28.2524 52.3329 27.3208 52.9343 29.3347C53.5217 31.312 53.8196 33.3658 53.8196 35.4399C53.8196 40.1055 52.3 44.6175 49.5095 48.3136L53.2652 51.4805C56.7973 46.8991 58.7256 41.2599 58.7256 35.4399C58.7256 21.4784 47.776 10.0564 34.0164 9.23349V14.1282C38.3658 14.4521 42.5505 16.0972 45.9396 18.861C47.5574 20.1788 45.5575 22.6188 43.9475 21.3046C40.7112 18.6676 36.6225 17.2138 32.4392 17.2138C22.389 17.2138 14.2138 25.389 14.2138 35.4392C14.2138 39.877 15.8274 44.1549 18.7602 47.4816C19.3448 48.1426 19.2712 49.1597 18.5962 49.7281L12.4439 54.9404C11.7885 55.4963 10.8044 55.4262 10.2366 54.7722C5.56898 49.4162 3 42.5518 3 35.4399C3 27.3545 6.27905 20.0225 11.5733 14.6974C11.5829 14.6865 11.5895 14.6743 11.5961 14.6621C11.6035 14.6483 11.6109 14.6346 11.6224 14.6231C11.6339 14.6116 11.6476 14.6042 11.6614 14.5968C11.6736 14.5902 11.6858 14.5836 11.6967 14.574ZM15.0304 15.7993L18.498 19.2662C21.871 16.3544 26.1545 14.4864 30.8628 14.1394V9.23349C24.8045 9.59588 19.3027 12.0079 15.0304 15.7993ZM11.6287 51.4987L15.3788 48.322C12.9002 45.0416 11.4275 41.1183 11.1247 37.0171H6.21947C6.5356 42.2798 8.40924 47.3288 11.6287 51.4987ZM6.23419 33.8628H11.1401C11.4864 29.1538 13.3551 24.8696 16.2676 21.4959L12.8 18.0297C9.00855 22.302 6.59658 27.8038 6.23419 33.8628ZM51.175 24.0405C49.7787 25.8721 37.4939 41.9806 36.0093 43.4674C33.9386 45.5373 30.5755 45.5288 28.514 43.4674C26.4483 41.4016 26.4483 38.0399 28.514 35.9742C30.0028 34.4854 45.8786 23.8828 49.0455 21.7736C50.5028 20.7909 52.2545 22.6232 51.175 24.0405ZM42.8351 29.7413C37.0439 33.6596 31.4334 37.524 30.7437 38.2039C28.7362 40.2114 31.772 43.2444 33.7788 41.2369C34.4672 40.5472 38.5719 35.2816 42.8351 29.7413ZM27.0126 52H37.8675C39.9549 52 39.9549 48.8458 37.8675 48.8458H27.0126C24.9251 48.8458 24.9251 52 27.0126 52ZM19.1657 54.8214H45.7142C47.8009 54.8214 47.8009 57.9757 45.7142 57.9757H19.1657C17.0783 57.9757 17.0783 54.8214 19.1657 54.8214Z"
                      fill="url(#paint0_linear_3791_1636)"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_3791_1636"
                        x1="61.8799"
                        y1="57.9757"
                        x2="-5.74894"
                        y2="22.8397"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="content text-center">
                  <h5 className="mb-16">Comparaison en temps réel</h5>
                  <p>
                    Suivez l&apos;évolution des prix en direct <br /> sur tous
                    les magasins tunisiens.
                  </p>
                </div>
              </div>

              {/* Friendly Mobile Users */}
              <div className="box-icon-item wow fadeInUp" data-wow-delay="0.1s">
                <div className="icon">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M37.1947 8.72217H31.528C30.7451 8.72217 30.1113 9.3559 30.1113 10.1388C30.1113 10.9218 30.7451 11.5555 31.528 11.5555H37.1947C37.9776 11.5555 38.6113 10.9218 38.6113 10.1388C38.6113 9.3559 37.9776 8.72217 37.1947 8.72217Z"
                      fill="url(#paint0_linear_3791_1642)"
                    />
                    <path
                      d="M43.3333 4H20.6667C17.5425 4 15 6.54247 15 9.66667V55C15 58.1242 17.5425 60.6667 20.6667 60.6667H43.3333C46.4575 60.6667 49 58.1242 49 55V9.66667C49 6.54247 46.4575 4 43.3333 4ZM46.1667 55C46.1667 56.565 44.8983 57.8333 43.3333 57.8333H20.6667C19.1017 57.8333 17.8333 56.565 17.8333 55V9.66667C17.8333 8.10169 19.1017 6.83333 20.6667 6.83333H43.3333C44.8983 6.83333 46.1667 8.10169 46.1667 9.66667V55Z"
                      fill="url(#paint1_linear_3791_1642)"
                    />
                    <path
                      d="M31.9998 55.9445C33.5646 55.9445 34.8332 54.676 34.8332 53.1112C34.8332 51.5464 33.5646 50.2778 31.9998 50.2778C30.435 50.2778 29.1665 51.5464 29.1665 53.1112C29.1665 54.676 30.435 55.9445 31.9998 55.9445Z"
                      fill="url(#paint2_linear_3791_1642)"
                    />
                    <path
                      d="M26.8053 11.5555C27.5877 11.5555 28.222 10.9212 28.222 10.1388C28.222 9.35643 27.5877 8.72217 26.8053 8.72217C26.0229 8.72217 25.3887 9.35643 25.3887 10.1388C25.3887 10.9212 26.0229 11.5555 26.8053 11.5555Z"
                      fill="url(#paint3_linear_3791_1642)"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_3791_1642"
                        x1="38.6113"
                        y1="11.5555"
                        x2="34.3257"
                        y2="5.65908"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <linearGradient
                        id="paint1_linear_3791_1642"
                        x1="49"
                        y1="60.6667"
                        x2="2.89776"
                        y2="47.9806"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <linearGradient
                        id="paint2_linear_3791_1642"
                        x1="34.8332"
                        y1="55.9445"
                        x2="28.004"
                        y2="52.8125"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <linearGradient
                        id="paint3_linear_3791_1642"
                        x1="28.222"
                        y1="11.5555"
                        x2="24.8074"
                        y2="9.98951"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="content text-center">
                  <h5 className="mb-16">Accessible sur mobile</h5>
                  <p>
                    Comparez les prix depuis votre <br /> téléphone, partout et
                    à tout moment.
                  </p>
                </div>
              </div>

              {/* Optimal Code */}
              <div className="box-icon-item wow fadeInUp" data-wow-delay="0.2s">
                <div className="icon">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M8.92188 4H55.0781C57.792 4 60 6.20795 60 8.92188V54.8594C60 57.5733 57.792 59.7812 55.0781 59.7812H8.92188C6.20795 59.7812 4 57.5733 4 54.8594V8.92188C4 6.20795 6.20795 4 8.92188 4ZM55.0781 7.28125H8.92188C8.01723 7.28125 7.28125 8.01723 7.28125 8.92188V17.125H56.7188V8.92188C56.7188 8.01723 55.9828 7.28125 55.0781 7.28125ZM8.92188 56.5H55.0781C55.9828 56.5 56.7188 55.764 56.7188 54.8594V20.4062H7.28125V54.8594C7.28125 55.764 8.01723 56.5 8.92188 56.5ZM35.4139 26.3224C35.7708 25.4896 36.7354 25.1039 37.5682 25.4608C38.401 25.8176 38.7868 26.7821 38.4298 27.615L28.5861 50.5838C28.2293 51.4163 27.2649 51.8024 26.4318 51.4454C25.5991 51.0885 25.2132 50.1239 25.5702 49.2912L35.4139 26.3224ZM23.4374 30.8658C22.8712 30.1582 21.8386 30.0436 21.1314 30.6096L12.9283 37.1721C12.1081 37.828 12.1075 39.0778 12.9283 39.7343L21.1314 46.2968C21.839 46.8629 22.8716 46.7481 23.4374 46.0407C24.0034 45.3331 23.8888 44.3006 23.1811 43.7347L16.5794 38.4532L23.1811 33.1718C23.8888 32.6058 24.0034 31.5734 23.4374 30.8658ZM42.8687 30.6096L51.0718 37.1721C51.8925 37.8286 51.892 39.0783 51.0718 39.7342L42.8687 46.2967C42.1621 46.8622 41.1295 46.7489 40.5627 46.0406C39.9967 45.333 40.1113 44.3007 40.819 43.7346L47.4206 38.4533L40.819 33.1718C40.1113 32.6058 39.9967 31.5733 40.5627 30.8658C41.1286 30.1582 42.1611 30.0435 42.8687 30.6096ZM12.3125 13.8438C13.2186 13.8438 13.9531 13.1092 13.9531 12.2031C13.9531 11.297 13.2186 10.5625 12.3125 10.5625C11.4064 10.5625 10.6719 11.297 10.6719 12.2031C10.6719 13.1092 11.4064 13.8438 12.3125 13.8438ZM20.5156 12.2031C20.5156 13.1092 19.7811 13.8438 18.875 13.8438C17.9689 13.8438 17.2344 13.1092 17.2344 12.2031C17.2344 11.297 17.9689 10.5625 18.875 10.5625C19.7811 10.5625 20.5156 11.297 20.5156 12.2031Z"
                      fill="url(#paint0_linear_3791_1657)"
                    />
                    <path
                      d="M24.5 11.375C25.5355 11.375 26.375 10.5355 26.375 9.5C26.375 8.46447 25.5355 7.625 24.5 7.625C23.4645 7.625 22.625 8.46447 22.625 9.5C22.625 10.5355 23.4645 11.375 24.5 11.375Z"
                      fill="url(#paint1_linear_3791_1657)"
                    />
                    <path
                      d="M43.25 11.375H54.5C55.5355 11.375 56.375 10.5355 56.375 9.5C56.375 8.4645 55.5355 7.625 54.5 7.625H43.25C42.2145 7.625 41.375 8.4645 41.375 9.5C41.375 10.5355 42.2145 11.375 43.25 11.375Z"
                      fill="url(#paint2_linear_3791_1657)"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_3791_1657"
                        x1="60"
                        y1="59.7812"
                        x2="-7.3958"
                        y2="28.7509"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <linearGradient
                        id="paint1_linear_3791_1657"
                        x1="26.375"
                        y1="11.375"
                        x2="21.8557"
                        y2="9.30237"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <linearGradient
                        id="paint2_linear_3791_1657"
                        x1="56.375"
                        y1="11.375"
                        x2="51.3629"
                        y2="2.18045"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="content text-center">
                  <h5 className="mb-16">Détection des faux prix</h5>
                  <p>
                    Notre IA identifie les gonflements <br /> artificiels avant
                    les soldes.
                  </p>
                </div>
              </div>

              {/* Fully Responsive */}
              <div className="box-icon-item wow fadeInUp" data-wow-delay="0.3s">
                <div className="icon">
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_3791_1669)">
                      <path
                        d="M34.9091 45.0906C35.7124 45.0906 36.3636 44.4394 36.3636 43.6361C36.3636 42.8328 35.7124 42.1816 34.9091 42.1816C34.1058 42.1816 33.4546 42.8328 33.4546 43.6361C33.4546 44.4394 34.1058 45.0906 34.9091 45.0906Z"
                        fill="url(#paint0_linear_3791_1669)"
                      />
                      <path
                        d="M10.182 53.8182C10.9853 53.8182 11.6365 53.167 11.6365 52.3637C11.6365 51.5604 10.9853 50.9092 10.182 50.9092C9.37874 50.9092 8.72754 51.5604 8.72754 52.3637C8.72754 53.167 9.37874 53.8182 10.182 53.8182Z"
                        fill="url(#paint1_linear_3791_1669)"
                      />
                      <path
                        d="M59.6365 5.81836H10.182C7.70923 5.81836 5.81836 7.70923 5.81836 10.182V24.7275C5.81836 25.6002 6.40023 26.182 7.27286 26.182C8.14548 26.182 8.72736 25.6001 8.72736 24.7275V10.1821C8.72736 9.30936 9.30923 8.72761 10.1819 8.72761H59.6364C60.5091 8.72761 61.0909 9.30948 61.0909 10.1821V45.0912C61.0909 45.964 60.509 46.5457 59.6364 46.5457H24.7274C23.8546 46.5457 23.2729 47.1276 23.2729 48.0002C23.2729 48.8729 23.8547 49.4547 24.7274 49.4547H27.6365V53.8184C27.6365 54.6911 27.0546 55.2729 26.182 55.2729H24.7275C23.8547 55.2729 23.273 55.8547 23.273 56.7274C23.273 57.6 23.8549 58.1819 24.7275 58.1819H45.0911C45.9639 58.1819 46.5456 57.6 46.5456 56.7274C46.5456 55.8547 45.9637 55.2729 45.0911 55.2729H43.6366C42.7639 55.2729 42.1821 54.691 42.1821 53.8184V49.4547H59.6366C62.1094 49.4547 64.0002 47.5639 64.0002 45.0911V10.1821C64.0001 7.70936 62.1092 5.81836 59.6365 5.81836ZM30.2546 55.273C30.4001 54.8366 30.5455 54.4002 30.5455 53.8185V49.4549H39.2727V53.8185C39.2727 54.4004 39.4182 54.8366 39.5636 55.273H30.2546Z"
                        fill="url(#paint2_linear_3791_1669)"
                      />
                      <path
                        d="M56.7274 37.8184H24.7274C23.8547 37.8184 23.2729 38.4002 23.2729 39.2729C23.2729 40.1455 23.8548 40.7274 24.7274 40.7274H56.7274C57.6002 40.7274 58.1819 40.1455 58.1819 39.2729C58.1819 38.4002 57.6002 37.8184 56.7274 37.8184Z"
                        fill="url(#paint3_linear_3791_1669)"
                      />
                      <path
                        d="M16 29.0908H4.36363C1.89088 29.0908 0 30.9818 0 33.4544V53.8181C0 56.2908 1.89088 58.1817 4.36363 58.1817H16C18.4727 58.1817 20.3636 56.2908 20.3636 53.8181V33.4544C20.3636 30.9818 18.4727 29.0908 16 29.0908ZM17.4545 53.8181C17.4545 54.6908 16.8726 55.2726 16 55.2726H4.36363C3.49088 55.2726 2.90913 54.6907 2.90913 53.8181V33.4544C2.90913 32.5817 3.491 31.9999 4.36363 31.9999H16C16.8727 31.9999 17.4545 32.5818 17.4545 33.4544V53.8181Z"
                        fill="url(#paint4_linear_3791_1669)"
                      />
                    </g>
                    <defs>
                      <linearGradient
                        id="paint0_linear_3791_1669"
                        x1="36.3636"
                        y1="45.0906"
                        x2="32.8578"
                        y2="43.4828"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <linearGradient
                        id="paint1_linear_3791_1669"
                        x1="11.6365"
                        y1="53.8182"
                        x2="8.13079"
                        y2="52.2104"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <linearGradient
                        id="paint2_linear_3791_1669"
                        x1="64.0002"
                        y1="58.1819"
                        x2="-3.3707"
                        y2="23.851"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <linearGradient
                        id="paint3_linear_3791_1669"
                        x1="58.1819"
                        y1="40.7274"
                        x2="56.5546"
                        y2="31.7711"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <linearGradient
                        id="paint4_linear_3791_1669"
                        x1="20.3636"
                        y1="58.1817"
                        x2="-6.56393"
                        y2="49.537"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stopColor="#3BDEB9" />
                        <stop offset="0.5" stopColor="#77E590" />
                        <stop offset="1" stopColor="#CCFF9B" />
                      </linearGradient>
                      <clipPath id="clip0_3791_1669">
                        <rect width="64" height="64" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
                <div className="content text-center">
                  <h5 className="mb-16">Alertes personnalisées</h5>
                  <p>
                    Recevez une notification dès qu&apos;un <br /> prix baisse
                    sur votre produit favori.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
