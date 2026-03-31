import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        bgColor: "#F0E68C",
        textColor: "#000000",
        fontSize: 16,
        fontFamily: "Figtree",
        toastMessage: "Merci de visiter mon portfolio !",
        toastDelayMs: 180000,
      },
    });
    console.log("SiteSettings seeded");
  }

  const existingInfo = await prisma.personalInfo.findFirst();
  if (!existingInfo) {
    await prisma.personalInfo.create({
      data: {
        name: "",
        surname: "",
        email: "",
      },
    });
    console.log("PersonalInfo seeded");
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
