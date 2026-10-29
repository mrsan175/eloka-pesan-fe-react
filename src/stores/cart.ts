import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/utils';
import type { Product, CartItem, CartItemVariant, CartItemAddon } from '@/types';

interface PendingConflictItem {
  product: Product;
  quantity: number;
  variants: CartItemVariant[];
  addons: CartItemAddon[];
  notes?: string;
  newShopName?: string;
}

interface CartState {
  items: CartItem[];
  shopId: string | null;
  shopName: string | null;

  // Conflict state
  conflictModalOpen: boolean;
  pendingConflict: PendingConflictItem | null;

  // Actions
  addItem: (
    product: Product,
    quantity: number,
    variants?: CartItemVariant[],
    addons?: CartItemAddon[],
    notes?: string,
    shopName?: string
  ) => boolean; // returns false if conflict detected
  confirmReplaceCart: () => void;
  cancelReplaceCart: () => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  decreaseProduct: (productId: string) => void;
  updateNotes: (itemId: string, notes: string) => void;
  updateItem: (
    itemId: string,
    quantity: number,
    variants: CartItemVariant[],
    addons: CartItemAddon[],
    notes: string
  ) => void;
  getItemsByProduct: (productId: string) => CartItem[];
  clearCart: () => void;
  getTotalItems: () => number;
  getProductQuantity: (productId: string) => number;
  getSubtotal: () => number;
}

function areVariantsEqual(v1: CartItemVariant[] = [], v2: CartItemVariant[] = []) {
  if (v1.length !== v2.length) return false;
  const s1 = [...v1].map((v) => `${v.variantId}:${v.optionName}`).sort().join('|');
  const s2 = [...v2].map((v) => `${v.variantId}:${v.optionName}`).sort().join('|');
  return s1 === s2;
}

function areAddonsEqual(a1: CartItemAddon[] = [], a2: CartItemAddon[] = []) {
  if (a1.length !== a2.length) return false;
  const s1 = [...a1].map((a) => `${a.addonId}:${a.quantity}`).sort().join('|');
  const s2 = [...a2].map((a) => `${a.addonId}:${a.quantity}`).sort().join('|');
  return s1 === s2;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shopId: null,
      shopName: null,
      conflictModalOpen: false,
      pendingConflict: null,

      addItem: (product, quantity, variants = [], addons = [], notes = '', shopName) => {
        const state = get();
        const incomingShopId = product.shopId;
        const incomingShopName = shopName || product.category?.name || 'Outlet Lain';

        // Check if conflict with different shop
        if (state.shopId && state.items.length > 0 && state.shopId !== incomingShopId) {
          // Open conflict prompt
          set({
            conflictModalOpen: true,
            pendingConflict: {
              product,
              quantity,
              variants,
              addons,
              notes,
              newShopName: incomingShopName,
            },
          });
          return false;
        }

        // Calculate unit price with variants
        let unitPrice = parseFloat(product.price);
        variants.forEach((v) => {
          unitPrice += parseFloat(v.priceAdjust);
        });

        // Check if an identical item already exists in cart
        const existingIndex = state.items.findIndex((item) => {
          return (
            item.productId === product.id &&
            areVariantsEqual(item.variants, variants) &&
            areAddonsEqual(item.addons, addons) &&
            (item.notes || '') === (notes || '')
          );
        });

        if (existingIndex > -1) {
          // Merge quantity
          const updatedItems = [...state.items];
          const existingItem = updatedItems[existingIndex];
          const newQty = existingItem.quantity + quantity;

          let itemSubtotal = parseFloat(existingItem.unitPrice) * newQty;
          existingItem.addons.forEach((a) => {
            itemSubtotal += parseFloat(a.price) * a.quantity * newQty;
          });

          updatedItems[existingIndex] = {
            ...existingItem,
            quantity: newQty,
            subtotal: itemSubtotal.toString(),
          };

          set({
            items: updatedItems,
            shopId: state.shopId || incomingShopId,
            shopName: state.shopName || incomingShopName,
          });
          return true;
        }

        // Calculate subtotal for new item
        let subtotal = unitPrice * quantity;
        addons.forEach((a) => {
          subtotal += parseFloat(a.price) * a.quantity * quantity;
        });

        const newItem: CartItem = {
          id: generateId(),
          productId: product.id,
          quantity,
          unitPrice: unitPrice.toString(),
          variants,
          addons,
          notes,
          product,
          subtotal: subtotal.toString(),
        };

        set({
          items: [...state.items, newItem],
          shopId: state.shopId || incomingShopId,
          shopName: state.shopName || incomingShopName,
        });
        return true;
      },

      confirmReplaceCart: () => {
        const state = get();
        if (!state.pendingConflict) {
          set({ conflictModalOpen: false });
          return;
        }

        const { product, quantity, variants, addons, notes, newShopName } = state.pendingConflict;

        // Calculate unit price
        let unitPrice = parseFloat(product.price);
        variants.forEach((v) => {
          unitPrice += parseFloat(v.priceAdjust);
        });

        let subtotal = unitPrice * quantity;
        addons.forEach((a) => {
          subtotal += parseFloat(a.price) * a.quantity * quantity;
        });

        const newItem: CartItem = {
          id: generateId(),
          productId: product.id,
          quantity,
          unitPrice: unitPrice.toString(),
          variants,
          addons,
          notes,
          product,
          subtotal: subtotal.toString(),
        };

        set({
          items: [newItem],
          shopId: product.shopId,
          shopName: newShopName || 'Outlet Baru',
          conflictModalOpen: false,
          pendingConflict: null,
        });
      },

      cancelReplaceCart: () => {
        set({
          conflictModalOpen: false,
          pendingConflict: null,
        });
      },

      removeItem: (itemId) =>
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== itemId);
          return {
            items: newItems,
            ...(newItems.length === 0 && { shopId: null, shopName: null }),
          };
        }),

      updateQuantity: (itemId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter((item) => item.id !== itemId);
            return {
              items: newItems,
              ...(newItems.length === 0 && { shopId: null, shopName: null }),
            };
          }

          return {
            items: state.items.map((item) => {
              if (item.id === itemId) {
                let subtotal = parseFloat(item.unitPrice) * quantity;
                item.addons.forEach((a) => {
                  subtotal += parseFloat(a.price) * a.quantity * quantity;
                });
                return { ...item, quantity, subtotal: subtotal.toString() };
              }
              return item;
            }),
          };
        }),

      decreaseProduct: (productId) =>
        set((state) => {
          // Find the last added item for this product
          const matchingItems = state.items.filter((item) => item.productId === productId);
          if (matchingItems.length === 0) return state;

          const targetItem = matchingItems[matchingItems.length - 1];

          if (targetItem.quantity > 1) {
            const newQty = targetItem.quantity - 1;
            let subtotal = parseFloat(targetItem.unitPrice) * newQty;
            targetItem.addons.forEach((a) => {
              subtotal += parseFloat(a.price) * a.quantity * newQty;
            });

            return {
              items: state.items.map((item) =>
                item.id === targetItem.id
                  ? { ...item, quantity: newQty, subtotal: subtotal.toString() }
                  : item
              ),
            };
          } else {
            // Remove this item
            const newItems = state.items.filter((item) => item.id !== targetItem.id);
            return {
              items: newItems,
              ...(newItems.length === 0 && { shopId: null, shopName: null }),
            };
          }
        }),

      updateNotes: (itemId, notes) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, notes } : item
          ),
        })),

      updateItem: (itemId, quantity, variants, addons, notes) =>
        set((state) => {
          const itemIndex = state.items.findIndex((i) => i.id === itemId);
          if (itemIndex === -1) return state;

          const currentItem = state.items[itemIndex];
          const product = currentItem.product;

          // Re-calculate unit price with new variants
          let unitPrice = parseFloat(product?.price || currentItem.unitPrice);
          variants.forEach((v) => {
            unitPrice += parseFloat(v.priceAdjust);
          });

          // Re-calculate subtotal
          let subtotal = unitPrice * quantity;
          addons.forEach((a) => {
            subtotal += parseFloat(a.price) * a.quantity * quantity;
          });

          const updatedItems = [...state.items];
          updatedItems[itemIndex] = {
            ...currentItem,
            quantity,
            unitPrice: unitPrice.toString(),
            variants,
            addons,
            notes,
            subtotal: subtotal.toString(),
          };

          return { items: updatedItems };
        }),

      getItemsByProduct: (productId) => {
        const state = get();
        return state.items.filter((item) => item.productId === productId);
      },

      clearCart: () =>
        set({
          items: [],
          shopId: null,
          shopName: null,
        }),

      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },

      getProductQuantity: (productId) => {
        const state = get();
        return state.items
          .filter((item) => item.productId === productId)
          .reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        const state = get();
        return state.items.reduce((total, item) => total + parseFloat(item.subtotal), 0);
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        shopId: state.shopId,
        shopName: state.shopName,
      }),
    }
  )
);
