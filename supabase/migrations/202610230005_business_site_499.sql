-- Business websites now cost ₱499 per month. 12 months is still priced as 10 (two months free).
-- Keep in sync with businessPlans in src/lib/checkout-products.ts. Orders already created keep
-- the price they were made at.
update public.pricing_plans as plan
set price_centavos = new_price.price, name = new_price.name
from (values
  ('business-site-1m', 'Business website, 1 month', 49900),
  ('business-site-3m', 'Business website, 3 months', 149700),
  ('business-site-6m', 'Business website, 6 months', 299400),
  ('business-site-12m', 'Business website, 12 months', 499000)
) as new_price(slug, name, price)
where plan.slug = new_price.slug;
