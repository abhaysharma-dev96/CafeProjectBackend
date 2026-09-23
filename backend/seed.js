import 'dotenv/config';
import bcrypt from 'bcryptjs';
import connectDB from './config/db.js';
import AdminUser from './models/AdminUser.js';
import MenuItem from './models/MenuItem.js';
import Table from './models/Table.js';

const defaultMenuItems = [
  { name: 'Pour Over', price: 6.50, category: 'Coffee', desc: 'Single-origin Ethiopian Yirgacheffe, meticulously hand-poured.', tags: ['Floral', 'Citrus'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOOQNAbo4eg1Ws9f8nAjZdiykhLil9lmwq_jK_8FOJtwLUfKqgGG0IK6lbibJjrHKovbiZSgj2m6eXcEtNUWWJIULn4EHNJF3uHXvprEQ_A6JelNyfhT4UzDvbXrR-4HlhStpBC6X0O5xgYnCLxRH2eBr7dvUTOqIDInornXfRXHH1NtWeI1QEOTRwhDlcFvlHam6ouCZeNWbY-8AQqTkjYFQW2K5SsjfpBMKJFmUpoRkIX4NaWJaP' },
  { name: 'Iced Flat White', price: 5.50, category: 'Coffee', desc: 'Our signature house blend espresso pulled over cold milk and ice.', tags: ['Smooth', 'Bold'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKBUTy0yzZCRbYhGEJe1P3GYQN6yQ8EGtW2wkGB_pwnueLMimZORKZvVRXzotBOySsmz-I49sE2HTJczkz5j0RlUc79OQ86SRCpDMbRY1iYRUOTuXzmB7jFYg6R-2btg2oPra66P582sbDU4zZSfnyNo8J9FzH5hFfkxDWWNVftgBdf9EGabt6wIuDiVGGdUiPL1JCZreIURQJiRmhvUwrTIlU3eukGAN5pfq-P7Pm608o4_IakIl1' },
  { name: 'Cold Brew', price: 5.25, category: 'Coffee', desc: 'Slow-steeped 18 hours for a smooth, low-acidity concentrate over ice.', tags: ['Smooth', 'Strong'], image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=600' },
  { name: 'Cappuccino', price: 5.00, category: 'Coffee', desc: 'Equal parts espresso, steamed milk, and velvety microfoam.', tags: ['Classic', 'Creamy'], image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=600' },
  { name: 'Chai Latte', price: 5.75, category: 'Tea', desc: 'House-spiced masala chai steeped slow, finished with silky steamed milk.', tags: ['Spiced', 'Warm'], image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&q=80&w=600' },
  { name: 'Jasmine Green Tea', price: 4.75, category: 'Tea', desc: 'Delicate loose-leaf jasmine green tea, floral and light.', tags: ['Floral', 'Light'], image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&q=80&w=600' },
  { name: 'Peppermint Tisane', price: 4.50, category: 'Tea', desc: 'Caffeine-free peppermint leaves, steeped bright and cooling.', tags: ['Herbal', 'Caffeine-Free'], image: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&q=80&w=600' },
  { name: 'Earl Grey', price: 4.75, category: 'Tea', desc: 'Bergamot-scented black tea, served with a splash of oat milk on request.', tags: ['Citrus', 'Classic'], image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=600' },
  { name: 'Almond Croissant', price: 4.75, category: 'Snacks', desc: 'Twice-baked butter croissant filled with rich frangipane.', tags: ['Nutty', 'Flaky'], image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDs1CGvwCP8USi4gKGI1OKIe-5M0UarFpN-ychTTTOXTEk-t_xG1Di2CbArQnHh4HlB6-gcdXmjZg5VBAhFfLx43ClWjWGBKHNcIOtndBru0H4abhSqsy34Fjq3f9jdsQ1QobN6g_F1UK2MLNdqnEYIj1OJiq8Q6YfEgDHV4GkzibMffnahDSWmhpjaFQwAkCe3fww2GcIg18FtzA0yOoolzHB4k1MYxPhsBMUW17bXXwc82GRdh7Pu' },
  { name: 'Blueberry Muffin', price: 3.95, category: 'Snacks', desc: 'Moist muffin studded with wild blueberries and a crumb topping.', tags: ['Fruity', 'Soft'], image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&q=80&w=600' },
  { name: 'Avocado Toast', price: 7.50, category: 'Snacks', desc: 'Sourdough, smashed avocado, chili flakes, and a drizzle of olive oil.', tags: ['Savory', 'Fresh'], image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&q=80&w=600' },
  { name: 'Lavender Shortbread', price: 3.75, category: 'Desserts', desc: 'Buttery shortbread infused with a hint of culinary lavender.', tags: ['Buttery', 'Floral'], image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=600' },
  { name: 'Dark Chocolate Tart', price: 6.25, category: 'Desserts', desc: 'Silky 70% dark chocolate ganache in a crisp cocoa shell.', tags: ['Rich', 'Decadent'], image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600' },
  { name: 'Cinnamon Roll', price: 4.95, category: 'Desserts', desc: 'Soft laminated dough swirled with cinnamon sugar, cream cheese glaze.', tags: ['Warm', 'Sweet'], image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&q=80&w=600' },
  { name: 'Basque Cheesecake', price: 6.50, category: 'Desserts', desc: 'Burnt-top cheesecake, creamy center, no crust needed.', tags: ['Creamy', 'Rich'], image: 'https://images.unsplash.com/photo-1567327613485-fbc7bf196198?auto=format&fit=crop&q=80&w=600' }
];

const defaultTables = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];

const seed = async () => {
  await connectDB();

  // Keep demo credentials synchronized with the environment when seeding.
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  await AdminUser.findOneAndUpdate(
    { username: process.env.ADMIN_USERNAME },
    { username: process.env.ADMIN_USERNAME, password: adminPassword, role: 'admin' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('Admin credentials synchronized.');

  const kitchenPassword = await bcrypt.hash(process.env.KITCHEN_PASSWORD, 10);
  await AdminUser.findOneAndUpdate(
    { username: process.env.KITCHEN_USERNAME },
    { username: process.env.KITCHEN_USERNAME, password: kitchenPassword, role: 'kitchen' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  console.log('Kitchen credentials synchronized.');

  // Seed menu items (only if the menu collection is empty)
  const menuCount = await MenuItem.countDocuments();
  if (menuCount === 0) {
    await MenuItem.insertMany(defaultMenuItems);
    console.log(`${defaultMenuItems.length} menu items seeded.`);
  } else {
    console.log('Menu items already exist, skipping.');
  }

  // Seed tables (only if empty)
  const tableCount = await Table.countDocuments();
  if (tableCount === 0) {
    await Table.insertMany(defaultTables.map((label) => ({ label })));
    console.log(`${defaultTables.length} tables seeded.`);
  } else {
    console.log('Tables already exist, skipping.');
  }

  console.log('Seeding complete.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
