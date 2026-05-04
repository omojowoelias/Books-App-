const { PrismaClient } = require('@prisma/client/index.js');
const prisma = new PrismaClient();

async function main() {
    const publisher = await prisma.publisher.create({
        data: {
            name: "Hachette Book Group",
            author: "Rocket Locken",
            description: "Never say never"
        }
    });
    await prisma.book.createMany({
        data: [
            {
                title: "First Book",
                url: "https://picsum.photos/200",
                description: "Sample book 1",
                publisherId: publisher.id
            },
            {
                title: "Second Book",
                url: "https://picsum.photos/201",
                description: "Sample book 2",
                publisherId: publisher.id
            },
            {
                title: "Third Book",
                url: "https://picsum.photos/202",
                description: "Sample book 3",
                publisherId: publisher.id
            }
        ]
    });
}

main()
.then(async () => {
    console.log("Database seeded successfully");
    await prisma.$disconnect();
})
.catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1)
});