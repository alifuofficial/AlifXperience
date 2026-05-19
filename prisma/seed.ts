import { PrismaClient } from "../src/generated/client/index.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Run a raw query to clean up any legacy roles from previous application deployments
  try {
    const updatedCount = await prisma.$executeRawUnsafe(
      "UPDATE User SET role = 'USER' WHERE role NOT IN ('USER', 'ADMIN', 'AUTHOR', 'TENANT')"
    );
    console.log(`[Seed Clean] Successfully migrated ${updatedCount} legacy roles to USER.`);
  } catch (err) {
    console.error("[Seed Clean] Failed to migrate legacy roles:", err);
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@alifx.com" },
    update: { password: hashedPassword },
    create: {
      email: "admin@alifx.com",
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Admin created:", admin.email);

  const categories = ["AI", "Software", "Hardware", "Future", "Robotics"];
  const categoryMap: Record<string, string> = {};
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase() },
    });
    categoryMap[name] = cat.id;
  }
  console.log("Categories seeded");

  const posts = [
    {
      title: "The Neural Link Revolution: Merging Mind and Machine by 2030",
      slug: "neural-link-revolution",
      excerpt: "New breakthroughs in non-invasive brain-computer interfaces promise to change how we interact with technology forever.",
      content: `<p>For decades, the concept of a "Brain-Computer Interface" (BCI) was relegated to the dusty shelves of science fiction. It was the stuff of cyberpunk novels and dystopian movies—a direct cable from cortex to cloud. But as we stand on the precipice of 2030, that cable has not only been cut, it has been replaced by a whisper-thin, invisible mesh that sits comfortably on the scalp.</p>

<h2>Beyond Typing with Thoughts</h2>
<p>Early iterations of this technology focused on accessibility—allowing those with paralysis to control cursors or robotic limbs. While that remains a vital application, the consumer market is exploding. Imagine designing a 3D model simply by visualizing it.</p>

<blockquote>"We are moving past input devices. The keyboard and mouse were bottlenecks. The mind is the ultimate controller, and we have finally built the receiver." — Dr. Elena Rostova, CEO of CortexFlow</blockquote>

<h3>The Privacy Paradox</h3>
<p>Data privacy laws have struggled to keep up with social media algorithms. With neural data, the stakes are exponentially higher.</p>`,
      coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2000&auto=format&fit=crop",
      published: true,
      categoryName: "AI",
    },
    {
      title: "Building Scalable Microservices with Node.js and Docker",
      slug: "scalable-microservices-nodejs",
      excerpt: "A comprehensive guide to architecting and deploying production-ready microservices.",
      content: `<p>In today's cloud-native ecosystem, microservices have become the de facto standard for building scalable applications.</p>

<h2>Why Microservices?</h2>
<p>Microservices architecture allows teams to develop, deploy, and scale services independently.</p>

<h2>Setting Up Your First Service</h2>
<p>Let's create a simple user service using Express.js and containerize it with Docker.</p>`,
      coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2000&auto=format&fit=crop",
      published: true,
      categoryName: "Software",
    },
    {
      title: "Quantum Computing: The Next Frontier in Processing Power",
      slug: "quantum-computing-frontier",
      excerpt: "Exploring how quantum computers will revolutionize cryptography, drug discovery, and AI.",
      content: `<p>Quantum computing represents perhaps the most significant paradigm shift in computing history.</p>

<h2>How Quantum Computers Work</h2>
<p>Through phenomena like superposition and entanglement, quantum computers can process exponentially more possibilities.</p>

<h2>Applications Across Industries</h2>
<p>From drug discovery to financial modeling, quantum computers will transform multiple industries.</p>`,
      coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2000&auto=format&fit=crop",
      published: true,
      categoryName: "Hardware",
    },
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        published: post.published,
        authorId: admin.id,
        categoryId: categoryMap[post.categoryName],
      },
    });
    console.log("Post created:", post.slug);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });