import { useEffect, useRef } from "react";
// @ts-ignore
import SwaggerUIBundle from "swagger-ui-dist/swagger-ui-bundle.js";
import "swagger-ui-dist/swagger-ui.css";

export default function SwaggerUIComponent() {
  const ref = useRef(null);
  const url = `${import.meta.env.PUBLIC_API_URL}/docs`;
  useEffect(() => {
    if (ref.current) {
      SwaggerUIBundle({
        url: url,
        dom_id: '#swagger-ui',
        domNode: ref.current,
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        supportedSubmitMethods: [], 
      });
    }
  }, []);

  return <div ref={ref} id="swagger-ui" />;
}
