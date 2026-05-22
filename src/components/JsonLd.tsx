// Renders een <script type="application/ld+json"> blok.
//
// React 19 hoist <script type="application/ld+json"> niet automatisch
// naar <head>, maar dat is geen probleem — Google en andere crawlers
// scannen JSON-LD ongeacht waar het in het document staat. Het tag
// rendert dus gewoon op de plek waar je <JsonLd /> aanroept.
//
// Het renderen via `dangerouslySetInnerHTML` voorkomt dat React
// de inhoud tussen text-nodes splitst — daardoor parseert Google de
// JSON in één geheel.

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
