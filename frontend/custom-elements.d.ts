import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "sticky-banner": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
