const STORAGE_KEY = 'lam_recently_viewed';
const MAX_ITEMS = 8;

export function getRecentlyViewedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error loading recently viewed IDs:', err);
    return [];
  }
}

export function addRecentlyViewedId(productId) {
  if (!productId) return;
  try {
    const current = getRecentlyViewedIds();
    const filtered = current.filter((id) => id !== productId);
    const updated = [productId, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error adding recently viewed product:', err);
  }
}

export function getRecentlyViewedProducts(allProducts = [], allShops = []) {
  const ids = getRecentlyViewedIds();
  if (!ids.length || !allProducts.length) return [];

  // Map IDs to actual product objects preserving recency order
  return ids
    .map((id) => allProducts.find((p) => p.id === id || p._id === id))
    .filter(Boolean);
}
