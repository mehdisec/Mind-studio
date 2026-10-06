import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../db';
import { seedSampleMindmapForPage } from '../utils/defaultSampleMindmap';

export const getPages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    let pages = await prisma.page.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { nodes: true },
        },
      },
    });

    // If no pages exist yet, create a default Page 1 with sample mindmap
    if (pages.length === 0) {
      const defaultPage = await prisma.page.create({
        data: {
          userId,
          title: 'Page 1',
          order: 0,
        },
        include: {
          _count: {
            select: { nodes: true },
          },
        },
      });
      await seedSampleMindmapForPage(userId, defaultPage.id);
      const reloaded = await prisma.page.findUnique({
        where: { id: defaultPage.id },
        include: {
          _count: {
            select: { nodes: true },
          },
        },
      });
      pages = [reloaded || defaultPage];
    }

    res.json({ pages });
  } catch (error) {
    console.error('getPages error:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
};

export const createPage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { title, theme, pageMode, diagramType, diagramData } = req.body;

    const count = await prisma.page.count({ where: { userId } });
    const pageTitle = title?.trim() || `Page ${count + 1}`;
    const mode = pageMode === 'diagram' ? 'diagram' : 'mindmap';

    const newPage = await prisma.page.create({
      data: {
        userId,
        title: pageTitle,
        order: count,
        theme: theme || 'cyberpunk',
        pageMode: mode,
        diagramType: diagramType || 'pastel-mindmap',
        diagramData: diagramData ? (typeof diagramData === 'string' ? diagramData : JSON.stringify(diagramData)) : '',
      },
      include: {
        _count: {
          select: { nodes: true },
        },
      },
    });

    // Automatically seed sample mindmap if it's a mindmap page
    if (mode === 'mindmap') {
      await seedSampleMindmapForPage(userId, newPage.id);
    }

    const reloadedPage = await prisma.page.findUnique({
      where: { id: newPage.id },
      include: {
        _count: {
          select: { nodes: true },
        },
      },
    });

    res.status(201).json({ page: reloadedPage || newPage });
  } catch (error) {
    console.error('createPage error:', error);
    res.status(500).json({ error: 'Failed to create page' });
  }
};

export const updatePage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title, order, theme, pageMode, diagramType, diagramData } = req.body;

    const existingPage = await prisma.page.findFirst({
      where: { id, userId },
    });

    if (!existingPage) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const updated = await prisma.page.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() || 'Untitled Page' }),
        ...(order !== undefined && { order: Number(order) }),
        ...(theme !== undefined && { theme: String(theme).trim() }),
        ...(pageMode !== undefined && { pageMode: String(pageMode) }),
        ...(diagramType !== undefined && { diagramType: String(diagramType) }),
        ...(diagramData !== undefined && {
          diagramData: typeof diagramData === 'string' ? diagramData : JSON.stringify(diagramData),
        }),
      },
      include: {
        _count: {
          select: { nodes: true },
        },
      },
    });

    res.json({ page: updated });
  } catch (error) {
    console.error('updatePage error:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
};

export const deletePage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existingPage = await prisma.page.findFirst({
      where: { id, userId },
    });

    if (!existingPage) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    // Delete the page (cascades to its nodes and edges)
    await prisma.page.delete({
      where: { id },
    });

    // Check if any pages remain; if none, recreate a default Page 1
    const remainingCount = await prisma.page.count({ where: { userId } });
    if (remainingCount === 0) {
      await prisma.page.create({
        data: {
          userId,
          title: 'Page 1',
          order: 0,
        },
      });
    }

    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    console.error('deletePage error:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
};
