import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Address from '../models/Address.js';

dotenv.config();

const users = [
  {
    name: 'ShopSphere Admin',
    email: 'admin@shopsphere.com',
    password: 'admin123',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
    isVerified: true
  },
  {
    name: 'John Doe',
    email: 'user@shopsphere.com',
    password: 'user123',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop',
    isVerified: true
  }
];

const categories = [
  {
    name: 'Electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'Fashion',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'Home & Kitchen',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600&auto=format&fit=crop'
  },
  {
    name: 'Beauty & Wellness',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop'
  }
];

const getProducts = (electronicsId, fashionId, homeId, beautyId) => [
  // Electronics
  {
    title: 'SoundPro Active ANC Wireless Headphones',
    description: 'Immerse yourself in pure studio quality sound. Engineered with top-tier active noise cancellation (ANC), premium memory foam earcups, 40-hour battery life, and Bluetooth 5.2 connectivity. Complete with high-fidelity 40mm dynamic drivers that deliver punchy bass and crystalline high registers.',
    price: 14999.00,
    discountPrice: 9999.00,
    stock: 25,
    brand: 'Acoustic Labs',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=600&auto=format&fit=crop'
    ],
    categoryId: electronicsId,
    ratings: 4.8,
    reviewsCount: 15
  },
  {
    title: 'VisionPro 34-Inch Ultra-Wide Curved Monitor',
    description: 'Unlock unprecedented productivity and gaming immersion. A premium 34-inch curved WQHD display with 144Hz refresh rate, 1ms response time, and 99% sRGB color gamut coverage. Includes height-adjustable ergonomic stand and dynamic picture-in-picture functionalities.',
    price: 44999.00,
    discountPrice: 38999.00,
    stock: 12,
    brand: 'VisualEdge',
    images: [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=600&auto=format&fit=crop'
    ],
    categoryId: electronicsId,
    ratings: 4.6,
    reviewsCount: 8
  },
  {
    title: 'SparkCharge Pro 3-in-1 Fast Wireless Dock',
    description: 'De-clutter your desk space elegantly. Charge your smartphone, wireless earbuds, and smartwatch concurrently at optimal speeds. Crafted from premium machined aluminum and soft-grip glass, providing standard thermal protection and sleek ambient glow indicators.',
    price: 4999.00,
    discountPrice: 3999.00,
    stock: 50,
    brand: 'VoltFlow',
    images: [
      'https://images.unsplash.com/photo-1622445262465-2481c4574875?q=80&w=600&auto=format&fit=crop'
    ],
    categoryId: electronicsId,
    ratings: 4.5,
    reviewsCount: 22
  },

  // Fashion
  {
    title: 'Classic Cafe Racer Leather Jacket',
    description: 'Timeless style meeting structural durability. Handcrafted from 100% genuine full-grain lambskin leather. Features heavy-duty YKK metal zippers, clean polyester inner lining, and four secure zippered utility pockets. Designed to develop a beautiful weathered patina with wear.',
    price: 24999.00,
    discountPrice: 19999.00,
    stock: 15,
    brand: 'Vanguard Tailors',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop'
    ],
    categoryId: fashionId,
    ratings: 4.9,
    reviewsCount: 9
  },
  {
    title: 'Minimalist Knit Merino Crewneck Sweater',
    description: 'Ultra-soft insulation for all seasons. Woven from 100% fine Australian Merino wool, delivering superior breathability, moisture-wicking properties, and complete scratch-free comfort. Perfect for elegant layered or standalone premium outfits.',
    price: 7999.00,
    discountPrice: 0,
    stock: 30,
    brand: 'Haven Loom',
    images: [
      'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?q=80&w=600&auto=format&fit=crop'
    ],
    categoryId: fashionId,
    ratings: 4.4,
    reviewsCount: 5
  },
  {
    title: 'ActiveComfort Breathable Knit Sneakers',
    description: 'Walk on clouds all day long. Features a high-tensile engineered knit upper that hugs your foot shape dynamically, coupled with dual-density proprietary foam outsoles. Extremely lightweight, breathable, and designed for active urban commuters.',
    price: 9999.00,
    discountPrice: 7999.00,
    stock: 18,
    brand: 'AeroStride',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop'
    ],
    categoryId: fashionId,
    ratings: 4.7,
    reviewsCount: 14
  },

  // Home & Kitchen
  {
    title: 'AuraMist Ultrasonic Essential Oil Diffuser',
    description: 'Transform your home environment into an elegant sensory sanctuary. Crafted from premium natural hand-cut ceramic, diffusing pure micro-particles for up to 8 hours. Integrates customizable warm-glow amber LED lighting and an auto-shutoff mechanism.',
    price: 5999.00,
    discountPrice: 3999.00,
    stock: 40,
    brand: 'AuraLiving',
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=600&auto=format&fit=crop'
    ],
    categoryId: homeId,
    ratings: 4.6,
    reviewsCount: 19
  },
  {
    title: 'Nordic Crafted Stoneware Coffee Mug Set',
    description: 'Savor your hot beverages with rustic elegance. A gorgeous set of 4 artisanal mugs, hand-glazed and fired in traditional kilns. Complete with premium matte speckles, ergonomic oversized comfort loops, and full dishwasher-friendly clay resilience.',
    price: 2999.00,
    discountPrice: 0,
    stock: 20,
    brand: 'Nordic Clay',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop'
    ],
    categoryId: homeId,
    ratings: 4.8,
    reviewsCount: 11
  },

  // Beauty & Wellness
  {
    title: 'Botanical Hydrating Vitamin C Glow Serum',
    description: 'Restore your natural radiance and smooth out skin texture. Infused with cold-pressed botanical extracts, organic Hyaluronic Acid, and 15% concentrated Vitamin C. Free from sulfates, parabens, and synthetic additives. Crafted for skin elasticity and brightness.',
    price: 3999.00,
    discountPrice: 2999.00,
    stock: 35,
    brand: 'Elysian Botanicals',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop'
    ],
    categoryId: beautyId,
    ratings: 4.7,
    reviewsCount: 13
  },
  // 1. Samsung Galaxy M35 5G
  {
    title: 'Samsung Galaxy M35 5G (Daylight Blue)',
    description: 'Powerhouse smartphone with massive 6000mAh battery, Exynos 1380 octa-core processor, and brilliant 120Hz sAMOLED display. Features 50MP triple camera setup with OIS for sharp, steady daylight and nighttime photography.',
    price: 22999.00,
    discountPrice: 19999.00,
    stock: 45,
    brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.5,
    reviewsCount: 120
  },
  // 2. Redmi Note 14 Pro Max 5G
  {
    title: 'Redmi Note 14 Pro Max 5G (Mystic Silver)',
    description: 'Supreme performance with MediaTek Dimensity 7300-Ultra chip, a stunning 1.5K curved AMOLED display, and a massive 200MP main sensor with OIS. Features IP68 water resistance and 80W HyperCharge speed.',
    price: 27999.00,
    discountPrice: 24999.00,
    stock: 30,
    brand: 'Xiaomi',
    images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.6,
    reviewsCount: 88
  },
  // 3. Realme Narzo 70 Pro
  {
    title: 'Realme Narzo 70 Pro (Glass Green)',
    description: 'Elevate your smartphone experience with premium Duo Touch Glass design, Dimensity 7050 5G chipset, and flagship Sony IMX890 OIS camera. Charges up to 50% in just 19 minutes with 67W SUPERVOOC charging.',
    price: 21999.00,
    discountPrice: 18999.00,
    stock: 50,
    brand: 'Realme',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.4,
    reviewsCount: 65
  },
  // 4. Vanguard Curved Pro Gaming Laptop
  {
    title: 'Vanguard Curved Pro Gaming Laptop (RTX 4060)',
    description: 'Elite heavy-duty performance gaming laptop. Equipped with Intel Core i7 13th Gen, 16GB DDR5 RAM, 1TB NVMe SSD, and NVIDIA GeForce RTX 4060 graphics. Completed with 165Hz IPS refresh screen.',
    price: 94999.00,
    discountPrice: 84999.00,
    stock: 8,
    brand: 'VisualEdge',
    images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.7,
    reviewsCount: 14
  },
  // 5. SoundFlux Active Noise Cancelling Earbuds
  {
    title: 'SoundFlux Active Noise Cancelling Earbuds',
    description: 'Experience ultra-immersive audio with 35dB Active Noise Cancellation, custom high-dynamic drivers, and IPX5 sweat resistance. Enjoy up to 30 hours of continuous playback with charging case.',
    price: 4999.00,
    discountPrice: 3499.00,
    stock: 80,
    brand: 'Acoustic Labs',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.3,
    reviewsCount: 42
  },
  // 6. AeroCharge Ultra 20,000mAh Power Bank
  {
    title: 'AeroCharge Ultra 20,000mAh Power Bank',
    description: 'Never run out of power. Features dual USB-A ports, a Type-C fast-charging port, and 22.5W two-way fast charging capabilities. Extremely compact, rugged, and certified safe for airline travel.',
    price: 2999.00,
    discountPrice: 1899.00,
    stock: 120,
    brand: 'VoltFlow',
    images: ['https://images.unsplash.com/photo-1609592424109-dd8956272583?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.5,
    reviewsCount: 95
  },
  // 7. VoltPulse Smart Sports Watch v4
  {
    title: 'VoltPulse Smart Sports Watch v4',
    description: 'Monitor your health and track active workouts dynamically. Features 1.43-inch AMOLED display, SpO2 blood oxygen tracking, active heart rate monitoring, sleep analyzer, and over 100 sports modes.',
    price: 6999.00,
    discountPrice: 4499.00,
    stock: 60,
    brand: 'VoltFlow',
    images: ['https://images.unsplash.com/photo-1544256718-3bcf237f3974?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.2,
    reviewsCount: 51
  },
  // 8. VisualEdge Full HD Smart LED Projector
  {
    title: 'VisualEdge Full HD Smart LED Projector',
    description: 'Transform any wall into an home cinema theater. Delivers crystal clear native 1080p resolution, 5000 Lumens brightness, built-in Android OS with streaming applications, and dual stereo speakers.',
    price: 19999.00,
    discountPrice: 12999.00,
    stock: 15,
    brand: 'VisualEdge',
    images: ['https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.4,
    reviewsCount: 18
  },
  // 9. VoltFlow Multi-Device Wireless Mechanical Keyboard
  {
    title: 'VoltFlow Multi-Device Wireless Mechanical Keyboard',
    description: 'Premium tactile typing for professionals. Features hot-swappable brown mechanical switches, multi-device Bluetooth syncing (connects up to 3 devices), vibrant white backlighting, and long-life rechargeable battery.',
    price: 8999.00,
    discountPrice: 6499.00,
    stock: 25,
    brand: 'VoltFlow',
    images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.6,
    reviewsCount: 29
  },
  // 10. Acoustic Pro Studio Bluetooth Speaker
  {
    title: 'Acoustic Pro Studio Bluetooth Speaker',
    description: 'Fills any room with deep, premium 360-degree sound. Features dual passive radiators, 40W powerful output, custom vocal clarify equalization, and IPX7 complete waterproof durability.',
    price: 11999.00,
    discountPrice: 7999.00,
    stock: 35,
    brand: 'Acoustic Labs',
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.7,
    reviewsCount: 38
  },
  // 11. Haven Loom Premium Linen Casual Shirt
  {
    title: 'Haven Loom Premium Linen Casual Shirt',
    description: 'Elegantly tailored casual button-up shirt. Woven from 100% premium organic flax linen, offering exceptional breathability and crisp, scratch-free comfort. Perfect for elegant summer outings.',
    price: 3499.00,
    discountPrice: 2499.00,
    stock: 40,
    brand: 'Haven Loom',
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop'],
    categoryId: fashionId,
    ratings: 4.3,
    reviewsCount: 22
  },
  // 12. AeroStride All-Weather Outdoor Joggers
  {
    title: 'AeroStride All-Weather Outdoor Joggers',
    description: 'Designed for active urban commutes and gym workouts. Features water-repellent high-stretch fabric, zippered secure utility pockets, and adjustable ankle cuffs. Quick-drying and extremely flexible.',
    price: 2999.00,
    discountPrice: 1899.00,
    stock: 55,
    brand: 'AeroStride',
    images: ['https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=600&auto=format&fit=crop'],
    categoryId: fashionId,
    ratings: 4.4,
    reviewsCount: 19
  },
  // 13. Vanguard Tailors Classic Trench Coat
  {
    title: 'Vanguard Tailors Classic Trench Coat',
    description: 'A timeless silhouette engineered with modern durability. Double-breasted layout handcrafted from heavy-duty gabardine canvas. Includes storm flaps, adjustable waist belt, and premium satin lining.',
    price: 18999.00,
    discountPrice: 12499.00,
    stock: 12,
    brand: 'Vanguard Tailors',
    images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop'],
    categoryId: fashionId,
    ratings: 4.8,
    reviewsCount: 7
  },
  // 14. AeroStride Premium Memory Foam Walking Shoes
  {
    title: 'AeroStride Premium Memory Foam Walking Shoes',
    description: 'Engineered for exceptional daily foot comfort. Features a multi-layer orthotic insole with responsive memory foam, high-grip slip resistant traction rubber outsoles, and lightweight stretch mesh fabric.',
    price: 6999.00,
    discountPrice: 4999.00,
    stock: 28,
    brand: 'AeroStride',
    images: ['https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=600&auto=format&fit=crop'],
    categoryId: fashionId,
    ratings: 4.6,
    reviewsCount: 31
  },
  // 15. AuraLiving Smart LED Bedside Table Lamp
  {
    title: 'AuraLiving Smart LED Bedside Table Lamp',
    description: 'Illuminate your bedroom with soft, therapeutic ambient colors. Touch sensitive controls, over 16 million RGB color choices, integration with smartphone application control, and built-in sleep timer.',
    price: 4999.00,
    discountPrice: 2999.00,
    stock: 45,
    brand: 'AuraLiving',
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop'],
    categoryId: homeId,
    ratings: 4.5,
    reviewsCount: 25
  },
  // 16. Nordic Clay Premium Ceramic Tea Set
  {
    title: 'Nordic Clay Premium Ceramic Tea Set',
    description: 'Sip your favorite premium loose leaf teas with artistic elegance. A stunning set containing a handcrafted teapot with wooden handle, and 4 matching speckled ceramic tea cups. Safe for dishwasher.',
    price: 2499.00,
    discountPrice: 1499.00,
    stock: 30,
    brand: 'Nordic Clay',
    images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=600&auto=format&fit=crop'],
    categoryId: homeId,
    ratings: 4.7,
    reviewsCount: 14
  },
  // 17. VoltPulse Smart Air Purifier for Home
  {
    title: 'VoltPulse Smart Air Purifier for Home',
    description: 'Breathe pristine, allergen-free air in your home. Features heavy-duty true HEPA H13 filtration system, capturing 99.97% of airborne dust, pet dander, mold spores, and kitchen odors. Quiet operation.',
    price: 15999.00,
    discountPrice: 11999.00,
    stock: 20,
    brand: 'VoltFlow',
    images: ['https://images.unsplash.com/photo-1585338107529-13afc5f02586?q=80&w=600&auto=format&fit=crop'],
    categoryId: homeId,
    ratings: 4.6,
    reviewsCount: 40
  },
  // 18. AuraLiving Elegant Cotton Quilt & Blanket
  {
    title: 'AuraLiving Elegant Cotton Quilt & Blanket',
    description: 'Premium lightweight, cozy comfort for all seasons. Woven from 100% long-staple Egyptian cotton thread, presenting double-sided geometric stitching. Breathable and completely machine washable.',
    price: 5999.00,
    discountPrice: 3999.00,
    stock: 25,
    brand: 'AuraLiving',
    images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=600&auto=format&fit=crop'],
    categoryId: homeId,
    ratings: 4.8,
    reviewsCount: 18
  },
  // 19. Elysian Botanicals Organic Aloe Hydrating Gel
  {
    title: 'Elysian Botanicals Organic Aloe Hydrating Gel',
    description: 'Soothing and intensely hydrating gel derived from 99% pure organic Aloe Vera. Free from artificial colors, synthetic fragrances, and parabens. Perfect to nourish sunburnt or sensitive skin.',
    price: 999.00,
    discountPrice: 699.00,
    stock: 100,
    brand: 'Elysian Botanicals',
    images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop'],
    categoryId: beautyId,
    ratings: 4.6,
    reviewsCount: 33
  },
  // 20. Elysian Botanicals Healing Tea Tree Face Wash
  {
    title: 'Elysian Botanicals Healing Tea Tree Face Wash',
    description: 'Purify oily or acne-prone skin gently. Formulated with premium Australian tea tree essential oil, neem leaf extracts, and salicylic acid. Clears away blemishes, controls excess oils, and keeps skin healthy.',
    price: 1299.00,
    discountPrice: 899.00,
    stock: 90,
    brand: 'Elysian Botanicals',
    images: ['https://images.unsplash.com/photo-1556228515-4198e8f8a69f?q=80&w=600&auto=format&fit=crop'],
    categoryId: beautyId,
    ratings: 4.7,
    reviewsCount: 45
  },
  // 21. VoltFlow Pro Gaming Mouse
  {
    title: 'VoltFlow Elite Wireless Gaming Mouse',
    description: 'Dominate the game with high-precision gaming mouse. Features an 26,000 DPI optical sensor, ultra-lightweight 58g chassis, dynamic RGB illumination, and 80-hour battery life. Complete with premium optical mouse switches and IPX5 water resistance for splash proof durability.',
    price: 4999.00,
    discountPrice: 3499.00,
    stock: 40,
    brand: 'VoltFlow',
    images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.6,
    reviewsCount: 28
  },
  // 22. VisionPro 11-inch Smart Quad-Speaker Tablet
  {
    title: 'VisionPro 11-inch Smart Quad-Speaker Tablet',
    description: 'Designed for students and professionals. Equipped with an octa-core MediaTek Dimensity 8020 processor, 8GB RAM, and 256GB storage. Features a brilliant 11-inch 120Hz IPS display, a huge 8000mAh battery for all-day multitasking, and a sharp 13MP rear camera for document scanning.',
    price: 29999.00,
    discountPrice: 24999.00,
    stock: 25,
    brand: 'VisualEdge',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.5,
    reviewsCount: 34
  },
  // 23. Acoustic Pro TWS Wireless Earbuds
  {
    title: 'Acoustic Pro TWS Wireless Earbuds',
    description: 'Enjoy continuous, crystal-clear audio with custom drivers and Active Noise Cancellation (ANC). Features ultra-low latency game mode, IPX5 waterproof rating for sweaty workouts, and a 40-hour battery life with charging case support.',
    price: 3999.00,
    discountPrice: 2499.00,
    stock: 85,
    brand: 'Acoustic Labs',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.4,
    reviewsCount: 40
  },
  // 24. VoltPulse 5G Ultra Smartphone
  {
    title: 'VoltPulse 5G Ultra Smartphone',
    description: 'Blazing-fast 5G connectivity powered by Snapdragon 8 Gen 1 processor. Comes with 12GB RAM, 256GB storage, and a gorgeous 120Hz AMOLED display. Capture cinematic photos with the 108MP main camera and enjoy days of usage with the 5000mAh battery supporting 65W fast charging.',
    price: 35999.00,
    discountPrice: 29999.00,
    stock: 30,
    brand: 'VoltFlow',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.7,
    reviewsCount: 55
  },
  // 25. VisualEdge Portable 4K Action Camera
  {
    title: 'VisualEdge Ultra HD 4K Action Camera',
    description: 'Capture high-octane adventures in native 4K resolution at 60FPS. Features an advanced 20MP sensor, dual color screens, EIS video stabilization, and IP68 waterproof casing up to 40 meters. Includes a standard 1050mAh battery for 90 minutes of continuous action recording.',
    price: 14999.00,
    discountPrice: 11999.00,
    stock: 20,
    brand: 'VisualEdge',
    images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=600&auto=format&fit=crop'],
    categoryId: electronicsId,
    ratings: 4.6,
    reviewsCount: 22
  },
  // 26. Vanguard Tailors Classic Denim Jacket
  {
    title: 'Vanguard Tailors Classic Denim Jacket',
    description: 'Rugged elegance meets casual style. Made from 100% premium rigid cotton denim, featuring a classic button closure, adjustable waist tabs, and four functional pockets. Wears down beautifully over time to develop a vintage character.',
    price: 5999.00,
    discountPrice: 4499.00,
    stock: 22,
    brand: 'Vanguard Tailors',
    images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=600&auto=format&fit=crop'],
    categoryId: fashionId,
    ratings: 4.5,
    reviewsCount: 17
  },
  // 27. Haven Loom Slim Fit Stretch Trousers
  {
    title: 'Haven Loom Slim Fit Stretch Trousers',
    description: 'Perfect for the modern office or formal evenings. Tailored from a premium breathable blend of viscose, polyester, and elastane for supreme stretch comfort. Features a flat-front design, belt loops, and secure welt back pockets.',
    price: 3999.00,
    discountPrice: 2999.00,
    stock: 35,
    brand: 'Haven Loom',
    images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop'],
    categoryId: fashionId,
    ratings: 4.4,
    reviewsCount: 19
  },
  // 28. AeroStride High-Impact Activewear Bra & Leggings Set
  {
    title: 'AeroStride High-Impact Activewear Bra & Leggings Set',
    description: 'Engineered for high-intensity gym workouts, yoga, or running. Features 4-way stretch fabric that is moisture-wicking and quick-drying. The sports bra provides high-impact support while the high-waisted leggings offer compression fit and sweat resistance.',
    price: 4999.00,
    discountPrice: 3499.00,
    stock: 28,
    brand: 'AeroStride',
    images: ['https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=600&auto=format&fit=crop'],
    categoryId: fashionId,
    ratings: 4.6,
    reviewsCount: 25
  },
  // 29. Vanguard Tailors Premium Leather Oxford Shoes
  {
    title: 'Vanguard Tailors Premium Leather Oxford Shoes',
    description: 'Walk with absolute confidence. Handcrafted from premium full-grain Italian leather, featuring a timeless cap-toe design, burnished finish, and cushioned memory foam footbed. Finished with a durable leather outsole and stacked heel.',
    price: 9999.00,
    discountPrice: 7999.00,
    stock: 15,
    brand: 'Vanguard Tailors',
    images: ['https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=600&auto=format&fit=crop'],
    categoryId: fashionId,
    ratings: 4.8,
    reviewsCount: 12
  },
  // 30. AeroStride All-Weather Commuter Backpack
  {
    title: 'AeroStride All-Weather Commuter Backpack',
    description: 'Sleek, lightweight travel companion. Made from water-resistant ballistic nylon, featuring a dedicated 16-inch padded laptop compartment, a secret anti-theft pocket, and ergonomic shoulder straps with memory foam backing.',
    price: 5999.00,
    discountPrice: 4499.00,
    stock: 30,
    brand: 'AeroStride',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop'],
    categoryId: fashionId,
    ratings: 4.7,
    reviewsCount: 33
  },
  // 31. AuraLiving Smart Wi-Fi Power Strip
  {
    title: 'AuraLiving Smart Wi-Fi Power Strip',
    description: 'Modernize your home power setup. Features 4 smart sockets that can be controlled individually via voice control (Alexa, Google Assistant) or app, and 3 USB fast charging ports. Integrates overload and surge protection.',
    price: 3499.00,
    discountPrice: 2499.00,
    stock: 50,
    brand: 'AuraLiving',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop'],
    categoryId: homeId,
    ratings: 4.5,
    reviewsCount: 20
  },
  // 32. VoltFlow Precision Temperature Electric Kettle
  {
    title: 'VoltFlow Precision Temperature Electric Kettle',
    description: 'The ultimate brewing companion for coffee and tea connoisseurs. Designed with an elegant stainless steel body, an ergonomic gooseneck spout for precise pour control, rapid 1500W heating, and real-time digital temperature control.',
    price: 7999.00,
    discountPrice: 5999.00,
    stock: 18,
    brand: 'VoltFlow',
    images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=600&auto=format&fit=crop'],
    categoryId: homeId,
    ratings: 4.7,
    reviewsCount: 14
  },
  // 33. AeroStride Premium Eco-Friendly Yoga Mat
  {
    title: 'AeroStride Premium Eco-Friendly Yoga Mat',
    description: 'Elevate your home workout and mindfulness routine. Made from high-density, biodegradable TPE material, providing excellent cushion, anti-slip double-sided texture, and complete sweat resistance. Ideal for yoga, pilates, and stretching.',
    price: 2999.00,
    discountPrice: 1999.00,
    stock: 40,
    brand: 'AeroStride',
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?q=80&w=600&auto=format&fit=crop'],
    categoryId: homeId,
    ratings: 4.6,
    reviewsCount: 27
  },
  // 34. Nordic Clay Artisanal Ceramic Wall Clock
  {
    title: 'Nordic Clay Artisanal Ceramic Wall Clock',
    description: 'Add a touch of minimalist elegance to your living room. Handcrafted from premium speckled clay with a beautiful matte glaze. Features a silent sweep quartz movement (no ticking noise) and elegant brass hands.',
    price: 4999.00,
    discountPrice: 3499.00,
    stock: 15,
    brand: 'Nordic Clay',
    images: ['https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?q=80&w=600&auto=format&fit=crop'],
    categoryId: homeId,
    ratings: 4.5,
    reviewsCount: 11
  },
  // 35. AuraLiving Luxe Velvet Decorative Throw Pillows (Set of 2)
  {
    title: 'AuraLiving Luxe Velvet Decorative Throw Pillows (Set of 2)',
    description: 'Transform your sofa or bedroom layout with cozy elegance. A gorgeous set of 2 square throw pillows, featuring ultra-soft luxe velvet covers with hidden zippers and premium hypoallergenic microfiber inserts.',
    price: 2499.00,
    discountPrice: 1799.00,
    stock: 25,
    brand: 'AuraLiving',
    images: ['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=600&auto=format&fit=crop'],
    categoryId: homeId,
    ratings: 4.6,
    reviewsCount: 16
  },
  // 36. Elysian Botanicals Daily Matte SPF 50 Sunscreen
  {
    title: 'Elysian Botanicals Daily Matte SPF 50 Sunscreen',
    description: 'Protect your skin daily. A lightweight, broad-spectrum SPF 50 gel that provides superior UVA/UVB protection with a clean matte finish. Free from parabens and sulfates. Infused with soothing Aloe Vera and green tea extracts.',
    price: 1499.00,
    discountPrice: 1199.00,
    stock: 65,
    brand: 'Elysian Botanicals',
    images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop'],
    categoryId: beautyId,
    ratings: 4.7,
    reviewsCount: 38
  },
  // 37. Elysian Botanicals Argan Oil Repair Hair Serum
  {
    title: 'Elysian Botanicals Argan Oil Repair Hair Serum',
    description: 'Revitalize dry and damaged hair instantly. Woven with organic Moroccan Argan Oil and Vitamin E, this lightweight, non-greasy hair serum smooths frizz, restores shine, and protects hair against heat styling.',
    price: 1999.00,
    discountPrice: 1499.00,
    stock: 45,
    brand: 'Elysian Botanicals',
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop'],
    categoryId: beautyId,
    ratings: 4.6,
    reviewsCount: 29
  },
  // 38. Elysian Botanicals Soothing Lip Balm Trio
  {
    title: 'Elysian Botanicals Soothing Lip Balm Trio',
    description: 'Heal dry, chapped lips with absolute comfort. A set of three organic nourishing lip balms (Mint, Coconut, Strawberry) crafted with premium beeswax, organic shea butter, and hydrating coconut oil. Fully chemical-free.',
    price: 999.00,
    discountPrice: 799.00,
    stock: 80,
    brand: 'Elysian Botanicals',
    images: ['https://images.unsplash.com/photo-1556228515-4198e8f8a69f?q=80&w=600&auto=format&fit=crop'],
    categoryId: beautyId,
    ratings: 4.5,
    reviewsCount: 22
  },
  // 39. Elysian Botanicals Rose Quartz Facial Jade Roller & Gua Sha Set
  {
    title: 'Elysian Botanicals Rose Quartz Facial Jade Roller & Gua Sha Set',
    description: 'Elevate your wellness and self-care routine with traditional wisdom. A handcrafted premium rose quartz jade roller and Gua Sha stone tool set designed to promote blood circulation, reduce skin puffiness, and enhance serum absorption.',
    price: 2499.00,
    discountPrice: 1899.00,
    stock: 35,
    brand: 'Elysian Botanicals',
    images: ['https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop'],
    categoryId: beautyId,
    ratings: 4.4,
    reviewsCount: 15
  },
  // 40. Elysian Botanicals Lavender Aromatherapy Soy Candle
  {
    title: 'Elysian Botanicals Lavender Aromatherapy Soy Candle',
    description: 'Create a calming sanctuary in your home or bedroom. Hand-poured with 100% natural organic soy wax and pure French lavender essential oils. Long-burning for up to 45 hours, free from parabens and synthetic fragrances.',
    price: 1999.00,
    discountPrice: 1399.00,
    stock: 40,
    brand: 'Elysian Botanicals',
    images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=600&auto=format&fit=crop'],
    categoryId: beautyId,
    ratings: 4.7,
    reviewsCount: 26
  }
];

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Purging existing documents...');
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Review.deleteMany();
    await Cart.deleteMany();
    await Order.deleteMany();
    await Address.deleteMany();

    console.log('Inserting mock users one by one (to trigger password hashing)...');
    for (const u of users) {
      await User.create(u);
    }
    console.log('Users successfully created!');

    console.log('Inserting categories one by one (to trigger slugification hooks)...');
    const createdCategories = [];
    for (const c of categories) {
      const createdCategory = await Category.create(c);
      createdCategories.push(createdCategory);
    }
    console.log('Categories created successfully!');

    // Fetch the generated ObjectIds
    const electronicsId = createdCategories.find(c => c.name === 'Electronics')._id;
    const fashionId = createdCategories.find(c => c.name === 'Fashion')._id;
    const homeId = createdCategories.find(c => c.name === 'Home & Kitchen')._id;
    const beautyId = createdCategories.find(c => c.name === 'Beauty & Wellness')._id;

    console.log('Inserting products linked to categories...');
    const productsList = getProducts(electronicsId, fashionId, homeId, beautyId);
    await Product.insertMany(productsList);
    console.log('Products created successfully!');

    console.log('Database Seeding Complete! 🌱');
    process.exit();
  } catch (error) {
    console.error(`Database seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
