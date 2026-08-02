const SITE_URL = 'https://www.hlty.shop';

export const SHIPPING_RATE_EUR = 4.95;
export const FREE_SHIPPING_THRESHOLD_EUR = 50;
export const MERCHANT_RETURN_DAYS = 14;

const netherlands = {
  '@type': 'DefinedRegion',
  addressCountry: 'NL',
};

export const merchantReturnPolicy = {
  '@type': 'MerchantReturnPolicy',
  '@id': `${SITE_URL}/beleid/retour#retourbeleid`,
  applicableCountry: 'NL',
  returnPolicyCountry: 'NL',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: MERCHANT_RETURN_DAYS,
  merchantReturnLink: `${SITE_URL}/beleid/retour`,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/FreeReturn',
  refundType: 'https://schema.org/FullRefund',
};

export const shippingService = {
  '@type': 'ShippingService',
  '@id': `${SITE_URL}/beleid/verzending#standaardverzending-nederland`,
  name: 'Standaardverzending Nederland',
  description: '€ 4,95 verzendkosten; gratis vanaf een bestelbedrag van € 50.',
  fulfillmentType: 'https://schema.org/FulfillmentTypeDelivery',
  shippingConditions: [
    {
      '@type': 'ShippingConditions',
      shippingDestination: netherlands,
      orderValue: {
        '@type': 'MonetaryAmount',
        minValue: 0,
        maxValue: FREE_SHIPPING_THRESHOLD_EUR - 0.01,
        currency: 'EUR',
      },
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: SHIPPING_RATE_EUR,
        currency: 'EUR',
      },
    },
    {
      '@type': 'ShippingConditions',
      shippingDestination: netherlands,
      orderValue: {
        '@type': 'MonetaryAmount',
        minValue: FREE_SHIPPING_THRESHOLD_EUR,
        currency: 'EUR',
      },
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: 0,
        currency: 'EUR',
      },
    },
  ],
};
