export const mockMenuData = {
  restaurant: [
    { id: 'r1', name: 'Wagyu Beef Filet', description: 'Truffle mashed potatoes, asparagus, red wine reduction', price: 85, image: '🥩' },
    { id: 'r2', name: 'Lobster Tail', description: 'Garlic herb butter, roasted seasonal vegetables', price: 95, image: '🦞' },
    { id: 'r3', name: 'Truffle Mushroom Risotto', description: 'Arborio rice, wild mushrooms, parmesan crisp', price: 45, image: '🍄' },
    { id: 'r4', name: 'Caesar Salad', description: 'Crisp romaine, house-made croutons, shaved parmesan', price: 25, image: '🥗' }
  ],
  cafe: [
    { id: 'c1', name: 'Signature Espresso', description: 'Double shot of our house blend', price: 8, image: '☕' },
    { id: 'c2', name: 'Vanilla Bean Latte', description: 'Espresso, steamed milk, real vanilla bean syrup', price: 12, image: '🥛' },
    { id: 'c3', name: 'Artisan Croissant', description: 'Butter flaky pastry baked fresh daily', price: 10, image: '🥐' },
    { id: 'c4', name: 'Matcha Green Tea', description: 'Premium ceremonial grade matcha', price: 14, image: '🍵' }
  ],
  laundry: [
    { id: 'l1', name: 'Suit Dry Cleaning', description: 'Two-piece suit professional cleaning', price: 45, image: '👔' },
    { id: 'l2', name: 'Dress Shirt Pressing', description: 'Washed and crisply pressed', price: 15, image: '👕' },
    { id: 'l3', name: 'Evening Gown Care', description: 'Delicate handling and spot cleaning', price: 65, image: '👗' },
    { id: 'l4', name: 'Express Wash & Fold', description: 'Per bag, returned same day', price: 35, image: '🧺' }
  ]
};

// Initial empty orders for admin view
export const initialOrders = [];
