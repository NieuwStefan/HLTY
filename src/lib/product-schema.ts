import type { Product, ProductVariant } from './shopify';
import { getGtinEntry } from './gtin';
import { formatProductTitle } from './product-title';

const SITE_URL = 'https://www.hlty.shop';

/** Bouwt één concrete Product/Offer-combinatie voor de zichtbare variant. */
export function buildProductSchema(
  product: Product,
  variant: ProductVariant | null,
  description: string,
): Record<string, unknown> {
  const productUrl = `${SITE_URL}/product/${product.handle}`;
  const images = [variant?.image?.url, ...product.images.map((image) => image.url)]
    .filter((url): url is string => Boolean(url))
    .filter((url, index, all) => all.indexOf(url) === index)
    .slice(0, 6);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: formatProductTitle(product.title, product.vendor),
    description,
    image: images,
    url: productUrl,
    ...(product.vendor ? { brand: { '@type': 'Brand', name: product.vendor } } : {}),
  };

  if (!variant) return schema;

  const sku = variant.sku?.trim();
  if (sku) schema.sku = sku;
  Object.assign(schema, getGtinEntry(variant.barcode));

  const price = Number.parseFloat(variant.price.amount);
  if (Number.isFinite(price) && price > 0 && variant.price.currencyCode) {
    schema.offers = {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: variant.price.currencyCode,
      price: price.toFixed(2),
      availability: variant.currentlyNotInStock
        ? 'https://schema.org/BackOrder'
        : variant.availableForSale
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    };
  }

  return schema;
}
