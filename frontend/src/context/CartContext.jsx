import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cartItems');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id_variante === product.id_variante);
      if (existing) {
        // limit to available stock
        const newQuantity = Math.min(existing.cantidad + 1, product.stock);
        return prev.map(item => 
          item.id_variante === product.id_variante 
            ? { ...item, cantidad: newQuantity }
            : item
        );
      }
      return [...prev, { ...product, cantidad: 1 }];
    });
  };

  const removeFromCart = (id_variante) => {
    setCartItems(prev => prev.filter(item => item.id_variante !== id_variante));
  };

  const updateQuantity = (id_variante, cantidad) => {
    setCartItems(prev => prev.map(item => {
      if (item.id_variante === id_variante) {
        const stockLimit = item.stock;
        return { ...item, cantidad: Math.max(1, Math.min(cantidad, stockLimit)) };
      }
      return item;
    }));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.cantidad, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartCount,
      isCartOpen,
      setIsCartOpen
    }}>
      {children}
    </CartContext.Provider>
  );
};
