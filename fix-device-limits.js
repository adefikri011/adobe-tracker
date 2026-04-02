const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('📋 PLANS SEBELUM PERBAIKAN:');
    const plansBefore = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
    plansBefore.forEach(p => {
      console.log(`  ${p.name} (${p.slug}) - $${p.price} - ${p.durationDays}d - Device Limit: ${p.deviceLimit}`);
    });

    console.log('\n⚙️  FIXING DEVICE LIMITS...\n');

    const updates = [];
    
    for (const plan of plansBefore) {
      let newLimit = plan.deviceLimit;
      const nameL = plan.name.toLowerCase();
      const slugL = plan.slug.toLowerCase();

      // Auto-assign based on plan characteristics
      if (nameL.includes('free') || slugL.includes('free')) {
        newLimit = 1;
      } else if (nameL.includes('30') || slugL.includes('30')) {
        newLimit = 3;
      } else if (nameL.includes('15') || slugL.includes('15')) {
        newLimit = 2;
      } else if (nameL.includes('14') || slugL.includes('14')) {
        newLimit = 2;
      } else if (nameL.includes('7') || slugL.includes('7')) {
        newLimit = 1;
      } else if (nameL.includes('3') || slugL.includes('3')) {
        newLimit = 1;
      } else if (nameL.includes('pro') || slugL.includes('pro')) {
        newLimit = plan.price > 10 ? 3 : 2;
      }

      if (newLimit !== plan.deviceLimit) {
        updates.push({ id: plan.id, old: plan.deviceLimit, new: newLimit });
        await prisma.plan.update({
          where: { id: plan.id },
          data: { deviceLimit: newLimit },
        });
        console.log(`  ✅ ${plan.name}: ${plan.deviceLimit} → ${newLimit}`);
      }
    }

    console.log('\n📋 PLANS SETELAH PERBAIKAN:');
    const plansAfter = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
    plansAfter.forEach(p => {
      console.log(`  ${p.name} (${p.slug}) - $${p.price} - ${p.durationDays}d - Device Limit: ${p.deviceLimit}`);
    });

    console.log(`\n🎉 TOTAL UPDATED: ${updates.length} plans`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
})();
