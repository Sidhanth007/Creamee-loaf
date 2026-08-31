import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  {
    slug: "cakes",
    name: "Cakes",
    description: "Celebration cakes baked fresh to order",
    sortOrder: 1,
    imageUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
  },
  {
    slug: "cupcakes",
    name: "Cupcakes",
    description: "Single-serve happiness, frosted by hand",
    sortOrder: 2,
    imageUrl:
      "https://images.unsplash.com/photo-1519869325930-281384150729?w=800&q=80",
  },
  {
    slug: "cookies",
    name: "Cookies",
    description: "Crisp edges, chewy centres, big flavour",
    sortOrder: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80",
  },
  {
    slug: "brownies",
    name: "Brownies & Bars",
    description: "Fudgy, gooey and dangerously good",
    sortOrder: 4,
    imageUrl:
      "https://images.unsplash.com/photo-1515037893149-de7f840978e2?w=800&q=80",
  },
  {
    slug: "breads",
    name: "Breads & Loaves",
    description: "Artisan sourdough, tea cakes and loaves",
    sortOrder: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  },
];

// price is in paise: ₹549 = 54900
const products: Array<{
  slug: string;
  name: string;
  description: string;
  price: number;
  unitLabel: string;
  category: string;
  isEggless?: boolean;
  isFeatured?: boolean;
  imageUrl: string;
}> = [
  {
    slug: "classic-chocolate-truffle-cake",
    name: "Classic Chocolate Truffle Cake",
    description:
      "Rich, moist chocolate sponge layered with silky dark-chocolate truffle ganache and finished with a glossy glaze. Our best-seller for birthdays and anniversaries.",
    price: 74900,
    unitLabel: "1 kg",
    category: "cakes",
    isFeatured: true,
    imageUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80",
  },
  {
    slug: "fresh-fruit-cream-cake",
    name: "Fresh Fruit & Cream Cake",
    description:
      "Light vanilla sponge with fresh seasonal fruit and softly whipped cream. Refreshing, not too sweet, and a favourite with kids.",
    price: 69900,
    unitLabel: "1 kg",
    category: "cakes",
    isEggless: true,
    isFeatured: true,
    imageUrl:
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80",
  },
  {
    slug: "red-velvet-cream-cheese-cake",
    name: "Red Velvet Cream Cheese Cake",
    description:
      "Velvety cocoa sponge in signature red, layered with tangy cream-cheese frosting. Elegant enough for any celebration.",
    price: 79900,
    unitLabel: "1 kg",
    category: "cakes",
    imageUrl:
      "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=800&q=80",
  },
  {
    slug: "rasmalai-fusion-cake",
    name: "Rasmalai Fusion Cake",
    description:
      "Saffron-cardamom sponge soaked in rasmalai milk, layered with malai cream and topped with pistachios. An Indian-fusion showstopper.",
    price: 84900,
    unitLabel: "1 kg",
    category: "cakes",
    isEggless: true,
    imageUrl:
      "https://images.unsplash.com/photo-1618426703623-c1b335803e07?w=800&q=80",
  },
  {
    slug: "belgian-chocolate-cupcakes",
    name: "Belgian Chocolate Cupcakes",
    description:
      "Deep chocolate cupcakes crowned with swirls of Belgian chocolate buttercream and a chocolate shard.",
    price: 39900,
    unitLabel: "Box of 6",
    category: "cupcakes",
    isFeatured: true,
    imageUrl:
      "https://images.unsplash.com/photo-1603532648955-039310d9ed75?w=800&q=80",
  },
  {
    slug: "vanilla-berry-cupcakes",
    name: "Vanilla Berry Cupcakes",
    description:
      "Classic vanilla cupcakes with berry compote centres and vanilla-bean buttercream, finished with a fresh berry.",
    price: 34900,
    unitLabel: "Box of 6",
    category: "cupcakes",
    isEggless: true,
    imageUrl:
      "https://images.unsplash.com/photo-1615832494873-b0c52d519696?w=800&q=80",
  },
  {
    slug: "double-chocolate-chip-cookies",
    name: "Double Chocolate Chip Cookies",
    description:
      "Bakery-style cookies loaded with dark and milk chocolate chips — crisp at the edges, gooey in the middle.",
    price: 29900,
    unitLabel: "Box of 8",
    category: "cookies",
    isFeatured: true,
    imageUrl:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800&q=80",
  },
  {
    slug: "oatmeal-raisin-cookies",
    name: "Oatmeal Raisin Cookies",
    description:
      "Old-fashioned chewy oatmeal cookies with plump raisins and a hint of cinnamon.",
    price: 24900,
    unitLabel: "Box of 8",
    category: "cookies",
    isEggless: true,
    imageUrl:
      "https://images.unsplash.com/photo-1568051243858-533a607809a5?w=800&q=80",
  },
  {
    slug: "classic-fudge-brownies",
    name: "Classic Fudge Brownies",
    description:
      "Dense, fudgy brownies with a crackly top, made with 60% dark couverture chocolate.",
    price: 34900,
    unitLabel: "Box of 4",
    category: "brownies",
    isFeatured: true,
    imageUrl:
      "https://images.unsplash.com/photo-1515037893149-de7f840978e2?w=800&q=80",
  },
  {
    slug: "sea-salt-caramel-blondies",
    name: "Sea Salt Caramel Blondies",
    description:
      "Butterscotch blondies swirled with house-made caramel and flaked sea salt.",
    price: 37900,
    unitLabel: "Box of 4",
    category: "brownies",
    imageUrl:
      "https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=800&q=80",
  },
  {
    slug: "country-sourdough-loaf",
    name: "Country Sourdough Loaf",
    description:
      "Naturally leavened sourdough with a blistered crust and open, tangy crumb. Fermented for 24 hours.",
    price: 27900,
    unitLabel: "600 g loaf",
    category: "breads",
    imageUrl:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
  },
  {
    slug: "banana-walnut-tea-cake",
    name: "Banana Walnut Tea Cake",
    description:
      "Moist banana loaf studded with toasted walnuts — perfect with your evening chai.",
    price: 32900,
    unitLabel: "500 g loaf",
    category: "breads",
    isEggless: true,
    imageUrl:
      "https://images.unsplash.com/photo-1632931057819-4eefffa8e007?w=800&q=80",
  },
];

// Demo reviewers — showcase accounts that cannot be logged into (random password).
const demoReviewers = [
  { email: "priya.demo@example.com", name: "Priya Sharma" },
  { email: "rahul.demo@example.com", name: "Rahul Mehta" },
  { email: "ananya.demo@example.com", name: "Ananya Iyer" },
  { email: "vikram.demo@example.com", name: "Vikram Patel" },
];

// slug -> [reviewer index, rating, comment]
const demoReviews: Record<string, [number, number, string][]> = {
  "classic-chocolate-truffle-cake": [
    [0, 5, "Ordered for my husband's birthday — the ganache was unreal. Everyone asked where it was from!"],
    [1, 5, "Rich but not too sweet. Easily the best truffle cake I've had in the city."],
    [2, 4, "Beautiful finish and very fresh. Slightly dense for my taste, but delicious."],
  ],
  "fresh-fruit-cream-cake": [
    [3, 5, "So light! The fruit was genuinely fresh, not tinned. Kids demolished it."],
    [0, 4, "Lovely and not overly sweet. Would order again for summer parties."],
  ],
  "red-velvet-cream-cheese-cake": [
    [1, 5, "The cream cheese frosting is perfectly tangy. Gorgeous colour too."],
    [2, 5, "Got this for our anniversary — moist, elegant, and the message piping was beautiful."],
  ],
  "rasmalai-fusion-cake": [
    [0, 5, "A rasmalai in cake form! Saffron flavour comes through beautifully. Showstopper."],
    [3, 4, "Very unique. The malai layers are delicious — a little rich, share generously!"],
  ],
  "belgian-chocolate-cupcakes": [
    [2, 5, "That buttercream swirl! Ordered twice in one month, no regrets."],
    [1, 4, "Proper dark chocolate flavour, not the fake kind. Great with coffee."],
  ],
  "vanilla-berry-cupcakes": [
    [3, 5, "The berry centre is such a lovely surprise. Prettiest box of cupcakes ever."],
    [0, 4, "Soft, fresh and the compote is tangy-sweet. My daughter's favourite."],
  ],
  "double-chocolate-chip-cookies": [
    [1, 5, "Crisp edge, gooey middle — exactly as promised. Dangerous to keep at home."],
    [2, 5, "Warmed them for 10 seconds and they were bakery-perfect. Superb."],
    [3, 4, "Generous chocolate chunks. A bit big for one sitting (not complaining)."],
  ],
  "oatmeal-raisin-cookies": [
    [0, 4, "Chewy and comforting, just like homemade. Lovely cinnamon note."],
    [3, 4, "Not too sweet, plump raisins. Great with evening chai."],
  ],
  "classic-fudge-brownies": [
    [2, 5, "Crackly top, fudgy inside — brownie perfection. The 60% chocolate shows."],
    [1, 5, "Ordered for office treats, finished in minutes. Will reorder."],
  ],
  "sea-salt-caramel-blondies": [
    [3, 5, "The sea salt takes these to another level. Caramel is clearly homemade."],
    [0, 4, "Sweet, buttery, indulgent. One piece is genuinely enough — almost."],
  ],
  "country-sourdough-loaf": [
    [1, 5, "Proper crust and an open, tangy crumb. As good as any artisan bakery."],
    [2, 4, "Fresh and flavourful. Made the best grilled cheese with it."],
  ],
  "banana-walnut-tea-cake": [
    [0, 5, "Moist, nutty and smells incredible. Perfect tea-time slice."],
    [3, 4, "Tastes homemade in the best way. Walnuts nicely toasted."],
  ],
};

const deliverySlots = [
  { label: "Morning", startTime: "10:00", endTime: "12:00", sortOrder: 1 },
  { label: "Afternoon", startTime: "13:00", endTime: "15:00", sortOrder: 2 },
  { label: "Evening", startTime: "17:00", endTime: "19:00", sortOrder: 3 },
  { label: "Night", startTime: "19:00", endTime: "21:00", sortOrder: 4 },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: c,
    });
  }

  for (const p of products) {
    const { category, ...data } = p;
    const cat = await prisma.category.findUniqueOrThrow({
      where: { slug: category },
    });
    await prisma.product.upsert({
      where: { slug: p.slug },
      create: { ...data, categoryId: cat.id },
      update: { ...data, categoryId: cat.id },
    });
  }

  for (const s of deliverySlots) {
    const existing = await prisma.deliverySlot.findFirst({
      where: { startTime: s.startTime, endTime: s.endTime },
    });
    if (existing) {
      await prisma.deliverySlot.update({ where: { id: existing.id }, data: s });
    } else {
      await prisma.deliverySlot.create({ data: s });
    }
  }

  // Demo reviewers + reviews (idempotent via upserts).
  const reviewerIds: string[] = [];
  for (const r of demoReviewers) {
    const passwordHash = await bcrypt.hash(randomBytes(24).toString("hex"), 10);
    const user = await prisma.user.upsert({
      where: { email: r.email },
      create: {
        email: r.email,
        name: r.name,
        passwordHash,
        emailVerified: new Date(),
      },
      update: { name: r.name },
    });
    reviewerIds.push(user.id);
  }

  let reviewCount = 0;
  for (const [slug, reviews] of Object.entries(demoReviews)) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) continue;
    for (const [reviewerIdx, rating, comment] of reviews) {
      await prisma.review.upsert({
        where: {
          userId_productId: {
            userId: reviewerIds[reviewerIdx],
            productId: product.id,
          },
        },
        create: {
          userId: reviewerIds[reviewerIdx],
          productId: product.id,
          rating,
          comment,
          isApproved: true,
        },
        update: { rating, comment, isApproved: true },
      });
      reviewCount++;
    }
  }

  console.log(
    `Seeded ${categories.length} categories, ${products.length} products, ${deliverySlots.length} delivery slots, ${reviewCount} demo reviews.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
