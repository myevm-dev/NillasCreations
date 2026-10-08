import { localProducts, type Product } from "./products";
import { squareConfiguration, squareRequest, StoreError } from "./square";

type CatalogObject = {
  id: string; type: string; is_deleted?: boolean; present_at_all_locations?: boolean;
  present_at_location_ids?: string[]; absent_at_location_ids?: string[];
  image_data?: { url?: string };
  item_data?: { name?: string; description?: string; is_archived?: boolean; image_ids?: string[]; modifier_list_info?: { enabled?: boolean; min_selected_modifiers?: number }[]; variations?: CatalogObject[] };
  item_variation_data?: { name?: string; pricing_type?: string; price_money?: { amount?: number; currency?: string };
    location_overrides?: { location_id: string; sold_out?: boolean; price_money?: { amount?: number; currency?: string } }[] };
};

function availableAt(object: CatalogObject, location: string) {
  return !object.is_deleted && !object.absent_at_location_ids?.includes(location) &&
    (object.present_at_all_locations !== false || Boolean(object.present_at_location_ids?.includes(location)));
}

export async function getProducts(): Promise<Product[]> {
  const source = process.env.CATALOG_SOURCE || "local";
  if (source === "local") return localProducts.map(p => ({ ...p, id: String(p.id) }));
  if (source !== "square") throw new StoreError("The product catalog is temporarily unavailable.", 503);
  const allowed = new Set((process.env.SQUARE_STOREFRONT_ITEM_IDS || "").split(",").map(x => x.trim()).filter(Boolean));
  if (!allowed.size) throw new StoreError("The product catalog is being prepared. Please contact us to order.", 503);
  const { locationId } = squareConfiguration();
  const objects: CatalogObject[] = [];
  let cursor: string | undefined;
  do {
    const page = await squareRequest<{ objects?: CatalogObject[]; cursor?: string }>(`/catalog/list?types=ITEM,IMAGE${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    objects.push(...(page.objects || []));
    cursor = page.cursor;
  } while (cursor);
  const images = new Map(objects.filter(o => o.type === "IMAGE").map(o => [o.id, o.image_data?.url]));
  return objects.filter(o => o.type === "ITEM" && allowed.has(o.id) && availableAt(o, locationId) && !o.item_data?.is_archived && !o.item_data?.modifier_list_info?.some(m => m.enabled !== false && (m.min_selected_modifiers || 0) > 0)).flatMap(item => {
    const data = item.item_data!;
    return (data.variations || []).filter(v => availableAt(v, locationId)).flatMap(variation => {
      const v = variation.item_variation_data;
      const override = v?.location_overrides?.find(o => o.location_id === locationId);
      const price = override?.price_money || v?.price_money;
      if (!v || v.pricing_type !== "FIXED_PRICING" || override?.sold_out || price?.currency !== "USD" || !Number.isSafeInteger(price.amount) || price.amount! <= 0) return [];
      const image = images.get(data.image_ids?.[0] || "");
      return [{ id: variation.id, catalogObjectId: variation.id,
        name: `${data.name || "Bakery item"}${v.name && v.name !== "Regular" ? ` (${v.name})` : ""}`,
        price: price.amount! / 100, description: data.description || "Freshly baked to order.",
        image: image?.startsWith("https://") ? image : "/shopitemphotosoon.png" }];
    });
  });
}
