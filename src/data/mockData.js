

export const mockMenuData = {
  restaurant: [
    { id: 'r1', name: 'Wagyu Beef Filet', description: 'Gourmet Wagyu beef seared to perfection, served with truffle mashed potatoes and fresh asparagus.', price: 85, image: '/assets/menu/wagyu.png' },
    { id: 'r2', name: 'Lobster Tail', description: 'Succulent grilled lobster tail drizzled with garlic herb butter and roasted seasonal vegetables.', price: 95, image: '/assets/menu/lobster.png' },
    { id: 'r3', name: 'Truffle Risotto', description: 'Creamy Arborio rice infused with wild mushrooms and finished with aged parmesan crisp.', price: 45, image: '/assets/menu/wagyu.png' }, 
    { id: 'r4', name: 'Caesar Salad', description: 'Crisp romaine hearts, house-made sourdough croutons, and delicate shavings of parmesan.', price: 25, image: '/assets/menu/lobster.png' } 
  ],
  cafe: [
    { id: 'c1', name: 'Signature Espresso', description: 'A bold, premium double shot of our house artisan blend with a rich, golden crema.', price: 8, image: '/assets/menu/espresso.png' },
    { id: 'c2', name: 'Vanilla Bean Latte', description: 'Smooth espresso paired with velvet steamed milk and authentic Madagascar vanilla bean syrup.', price: 12, image: '/assets/menu/espresso.png' },
    { id: 'c3', name: 'Artisan Croissant', description: 'Golden, flaky layers of pure butter pastry, baked to a delicate crisp every morning.', price: 10, image: '/assets/menu/espresso.png' }
  ],
  laundry: [
    { id: 'l1', name: 'Executive Suit Care', description: 'Professional dry cleaning and precision pressing for two-piece suits, ensuring a crisp finish.', price: 45, image: '/assets/menu/suit.png' },
    { id: 'l2', name: 'Premium Shirt Press', description: 'Delicately washed and hand-pressed for a sharp, executive look.', price: 15, image: '/assets/menu/suit.png' },
    { id: 'l3', name: 'Evening Gown Service', description: 'Specialized care and spot cleaning for delicate fabrics and embellishments.', price: 65, image: '/assets/menu/suit.png' }
  ]
};

// Initial empty orders for admin view
export const initialOrders = [];
