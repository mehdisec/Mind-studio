import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export async function getEdges(req: AuthRequest, res: Response): Promise<void> {
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

    const edges = await prisma.edge.findMany({
      where: {
        userId,
        ...(pageId ? { pageId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ edges });
  } catch (error) {
    console.error('Get edges error:', error);
    res.status(500).json({ error: 'Failed to fetch edges' });
  }
}

export async function createEdge(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    let { sourceNodeId, targetNodeId, label = '', weight = 1.0, pageId } = req.body;

    if (!sourceNodeId || !targetNodeId) {
      res.status(400).json({ error: 'sourceNodeId and targetNodeId are required' });
      return;
    }

    if (sourceNodeId === targetNodeId) {
      res.status(400).json({ error: 'Cannot connect a node to itself' });
      return;
    }

    // Verify both nodes belong to the user
    const [sourceNode, targetNode] = await Promise.all([
      prisma.node.findFirst({ where: { id: sourceNodeId, userId } }),
      prisma.node.findFirst({ where: { id: targetNodeId, userId } }),
    ]);

    if (!sourceNode || !targetNode) {
      res.status(404).json({ error: 'One or both nodes do not exist or belong to another user' });
      return;
    }

    // Inherit pageId from source node if not explicitly provided
    if (!pageId) {
      pageId = sourceNode.pageId || undefined;
    }

    // Check if edge already exists in either direction
    const existing = await prisma.edge.findFirst({
      where: {
        userId,
        OR: [
          { sourceNodeId, targetNodeId },
          { sourceNodeId: targetNodeId, targetNodeId: sourceNodeId },
        ],
      },
    });

    if (existing) {
      res.status(200).json({ edge: existing, existed: true });
      return;
    }

    const edge = await prisma.edge.create({
      data: {
        userId,
        pageId: pageId || null,
        sourceNodeId,
        targetNodeId,
        label: label || null,
        weight: parseFloat(weight) || 1.0,
      },
    });

    res.status(201).json({ edge });
  } catch (error) {
    console.error('Create edge error:', error);
    res.status(500).json({ error: 'Failed to create edge' });
  }
}

export async function updateEdge(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { label, weight, pageId } = req.body;

    const existing = await prisma.edge.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Edge not found or not owned by user' });
      return;
    }

    const updated = await prisma.edge.update({
      where: { id },
      data: {
        ...(typeof label === 'string' ? { label: label.trim() || null } : {}),
        ...(typeof weight === 'number' ? { weight } : {}),
        ...(pageId !== undefined ? { pageId } : {}),
      },
    });

    res.json({ edge: updated });
  } catch (error) {
    console.error('Update edge error:', error);
    res.status(500).json({ error: 'Failed to update edge' });
  }
}

export async function deleteEdge(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.edge.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Edge not found or not owned by user' });
      return;
    }

    await prisma.edge.delete({
      where: { id },
    });

    res.json({ success: true, message: 'Edge deleted successfully' });
  } catch (error) {
    console.error('Delete edge error:', error);
    res.status(500).json({ error: 'Failed to delete edge' });
  }
}
