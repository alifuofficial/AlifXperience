const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();

async function main() {
  const post = await prisma.post.findFirst({
    where: { slug: 'quantum-computing-the-next-frontier-in-processing-power' },
  });
  console.log("POST CONTENT:");
  console.log(post.content);
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
