import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const prisma = new PrismaClient();

export async function initDatabaseAndSeed() {
  try {
    // Check if admin user exists (either by new email or legacy admin email)
    const adminEmail = 'mehdisec@gmail.com';
    const targetPasswordHash = await bcrypt.hash('Mehdi!12817', 10);

    let admin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { email: 'admin@mindmap.local' },
          { email: 'admin' }
        ]
      }
    });

    if (admin) {
      // Ensure admin email, password and default avatar are up to date
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: {
          email: adminEmail,
          name: 'Mehdi Mirzaei',
          passwordHash: targetPasswordHash,
          avatarUrl: admin.avatarUrl && admin.avatarUrl !== '' ? admin.avatarUrl : '/default-avatar.png',
        }
      });
      console.log('✅ Admin user updated: Mehdisec@gmail.com / password updated');
    } else {
      admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Mehdi Mirzaei',
          passwordHash: targetPasswordHash,
          avatarUrl: '/default-avatar.png',
        }
      });
      console.log('✅ Admin user created: Mehdisec@gmail.com / password: Mehdi!12817');

      // Create default Page 1 for the admin
      const page1 = await prisma.page.create({
        data: {
          userId: admin.id,
          title: 'Page 1',
          order: 0,
        }
      });

      // Seed initial sample thoughts for the admin on Page 1
      const node1 = await prisma.node.create({
        data: {
          userId: admin.id,
          pageId: page1.id,
          title: 'هوش مصنوعی زاینده (Generative AI)',
          importance: 9,
          note: '# هوش مصنوعی زاینده\n\nمدل‌های زبانی بزرگ (LLM) و ترنسفورمرها با مکانیزم توجه چندگانه (Multi-Head Attention) مبنای سیستم‌های هوشمند امروزی هستند.\n\n- یادگیری عمیق\n- شبکه‌های عصبی',
          posX: 0,
          posY: 0,
          tags: JSON.stringify(['AI', 'DeepLearning', 'LLM'])
        }
      });

      const node2 = await prisma.node.create({
        data: {
          userId: admin.id,
          pageId: page1.id,
          title: 'معماری ترنسفورمر (Transformers)',
          importance: 8,
          note: 'معماری انقلابی مبتنی بر خودتوجهی (Self-Attention) که پردازش موازی و درک کانتکست طولانی را ممکن ساخت.',
          posX: 220,
          posY: -120,
          tags: JSON.stringify(['Architecture', 'Attention'])
        }
      });

      const node3 = await prisma.node.create({
        data: {
          userId: admin.id,
          pageId: page1.id,
          title: 'گراف دانش (Knowledge Graphs)',
          importance: 7,
          note: 'سیستم‌های ذخیره‌سازی داده‌های ارتباطی و شبکه‌های مفهومی که روابط بین موجودیت‌ها را نمایش می‌دهند.',
          posX: 220,
          posY: 120,
          tags: JSON.stringify(['Graph', 'Ontology'])
        }
      });

      // Connect nodes on Page 1
      await prisma.edge.create({
        data: {
          userId: admin.id,
          pageId: page1.id,
          sourceNodeId: node1.id,
          targetNodeId: node2.id,
          label: 'بخش اصلی',
          weight: 1.5
        }
      });

      await prisma.edge.create({
        data: {
          userId: admin.id,
          pageId: page1.id,
          sourceNodeId: node1.id,
          targetNodeId: node3.id,
          label: 'یکپارچه‌سازی مفهومی',
          weight: 1.2
        }
      });
      console.log('🌱 Initial sample knowledge graph nodes seeded on Page 1.');
    }

    // For existing users, ensure default avatar and at least one Page
    await prisma.user.updateMany({
      where: {
        OR: [
          { avatarUrl: null },
          { avatarUrl: '' }
        ]
      },
      data: { avatarUrl: '/default-avatar.png' }
    });

    const users = await prisma.user.findMany();
      for (const u of users) {
        let userPage = await prisma.page.findFirst({
          where: { userId: u.id },
          orderBy: { order: 'asc' }
        });

        if (!userPage) {
          userPage = await prisma.page.create({
            data: {
              userId: u.id,
              title: 'Page 1',
              order: 0,
            }
          });
        }

        // Link unassigned nodes to this page
        await prisma.node.updateMany({
          where: { userId: u.id, pageId: null },
          data: { pageId: userPage.id }
        });

        // Link unassigned edges to this page
        await prisma.edge.updateMany({
          where: { userId: u.id, pageId: null },
          data: { pageId: userPage.id }
        });
      }
  } catch (error) {
    console.error('Error during database initialization/seed:', error);
  }
}
