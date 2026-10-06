import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export async function getNodes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    let pageId = req.query.pageId as string | undefined;

    if (!pageId) {
      const defaultPage = await prisma.page.findFirst({
        where: { userId },
        orderBy: { order: 'asc' },
      });
      pageId = defaultPage?.id;
    }

    const nodes = await prisma.node.findMany({
      where: {
        userId,
        ...(pageId ? { pageId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    // Parse tags JSON string to array
    const formattedNodes = nodes.map((n) => ({
      ...n,
      tags: typeof n.tags === 'string' ? JSON.parse(n.tags || '[]') : n.tags,
    }));

    res.json({ nodes: formattedNodes });
  } catch (error) {
    console.error('Get nodes error:', error);
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
}

export async function createNode(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    let {
      pageId,
      title,
      importance = 5,
      note = '',
      posX = 0,
      posY = 0,
      tags = [],
      nodeType = 'text',
      imageUrl = '',
      imageSize = 'small',
      highlighted = false,
      highlightColor = 'gold',
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Node title is required' });
      return;
    }

    // Verify pageId or link to user's first page
    if (pageId) {
      const pageExists = await prisma.page.findFirst({
        where: { id: pageId, userId },
      });
      if (!pageExists) {
        const defaultPage = await prisma.page.findFirst({
          where: { userId },
          orderBy: { order: 'asc' },
        });
        pageId = defaultPage?.id;
      }
    } else {
      const defaultPage = await prisma.page.findFirst({
        where: { userId },
        orderBy: { order: 'asc' },
      });
      pageId = defaultPage?.id;
    }

    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags.slice(0, 4)) : JSON.stringify([]);

    const node = await prisma.node.create({
      data: {
        userId,
        pageId: pageId || null,
        title: title.trim(),
        importance: Math.max(1, Math.min(10, parseInt(importance, 10) || 5)),
        note: note || '',
        posX: parseFloat(posX) || 0,
        posY: parseFloat(posY) || 0,
        tags: tagsJson,
        nodeType: nodeType || 'text',
        imageUrl: imageUrl || '',
        imageSize: imageSize || 'small',
        highlighted: Boolean(highlighted),
        highlightColor: highlightColor || 'gold',
      },
    });

    res.status(201).json({
      node: {
        ...node,
        tags: JSON.parse(node.tags),
      },
    });
  } catch (error) {
    console.error('Create node error:', error);
    res.status(500).json({ error: 'Failed to create node' });
  }
}

export async function updateNode(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const {
      pageId,
      title,
      importance,
      note,
      posX,
      posY,
      tags,
      nodeType,
      imageUrl,
      imageSize,
      highlighted,
      highlightColor,
    } = req.body;

    const existing = await prisma.node.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Node not found or not owned by user' });
      return;
    }

    const dataToUpdate: any = {};
    if (pageId !== undefined) dataToUpdate.pageId = pageId;
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (importance !== undefined) dataToUpdate.importance = Math.max(1, Math.min(10, parseInt(importance, 10)));
    if (note !== undefined) dataToUpdate.note = note;
    if (posX !== undefined) dataToUpdate.posX = parseFloat(posX);
    if (posY !== undefined) dataToUpdate.posY = parseFloat(posY);
    if (tags !== undefined) {
      dataToUpdate.tags = Array.isArray(tags) ? JSON.stringify(tags.slice(0, 4)) : JSON.stringify([]);
    }
    if (nodeType !== undefined) dataToUpdate.nodeType = nodeType;
    if (imageUrl !== undefined) dataToUpdate.imageUrl = imageUrl;
    if (imageSize !== undefined) dataToUpdate.imageSize = imageSize;
    if (highlighted !== undefined) dataToUpdate.highlighted = Boolean(highlighted);
    if (highlightColor !== undefined) dataToUpdate.highlightColor = highlightColor;

    const updated = await prisma.node.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({
      node: {
        ...updated,
        tags: JSON.parse(updated.tags),
      },
    });
  } catch (error) {
    console.error('Update node error:', error);
    res.status(500).json({ error: 'Failed to update node' });
  }
}

export async function deleteNode(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.node.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Node not found or not owned by user' });
      return;
    }

    // Delete associated edges first
    await prisma.edge.deleteMany({
      where: {
        OR: [{ sourceNodeId: id }, { targetNodeId: id }],
      },
    });

    await prisma.node.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Node deleted successfully' });
  } catch (error) {
    console.error('Delete node error:', error);
    res.status(500).json({ error: 'Failed to delete node' });
  }
}

export async function batchUpdatePositions(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { positions } = req.body; // Array of { id, posX, posY }

    if (!Array.isArray(positions)) {
      res.status(400).json({ error: 'Positions must be an array' });
      return;
    }

    const updates = positions.map((pos) =>
      prisma.node.updateMany({
        where: { id: pos.id, userId },
        data: {
          posX: parseFloat(pos.posX),
          posY: parseFloat(pos.posY),
        },
      })
    );

    await prisma.$transaction(updates);

    res.json({ success: true, count: positions.length });
  } catch (error) {
    console.error('Batch update positions error:', error);
    res.status(500).json({ error: 'Failed to batch update positions' });
  }
}

export async function clearPageNodes(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { pageId } = req.body;

    if (!pageId) {
      res.status(400).json({ error: 'PageId is required' });
      return;
    }

    // Verify page ownership
    const page = await prisma.page.findFirst({
      where: { id: pageId, userId },
    });

    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    // Delete all edges on this page
    await prisma.edge.deleteMany({
      where: { pageId, userId },
    });

    // Delete all nodes on this page
    const deletedNodes = await prisma.node.deleteMany({
      where: { pageId, userId },
    });

    res.json({
      success: true,
      count: deletedNodes.count,
      message: 'All nodes and edges cleared from page',
    });
  } catch (error) {
    console.error('Clear page nodes error:', error);
    res.status(500).json({ error: 'Failed to clear page nodes' });
  }
}
