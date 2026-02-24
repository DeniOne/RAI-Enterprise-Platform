import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

@Injectable()
export class IntercompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async isIntercompany(
    sellerPartyId: string,
    buyerPartyId: string,
    asOf: Date,
  ): Promise<boolean> {
    const [sellerRoots, buyerRoots] = await Promise.all([
      this.collectOwnershipRoots(sellerPartyId, asOf),
      this.collectOwnershipRoots(buyerPartyId, asOf),
    ]);

    for (const rootId of sellerRoots) {
      if (buyerRoots.has(rootId)) {
        return true;
      }
    }

    return false;
  }

  private async collectOwnershipRoots(partyId: string, asOf: Date): Promise<Set<string>> {
    const visited = new Set<string>();
    const queue: string[] = [partyId];
    const roots = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      const parentEdges = await this.prisma.partyRelation.findMany({
        where: {
          sourcePartyId: current,
          relationType: "OWNERSHIP",
          validFrom: { lte: asOf },
          OR: [{ validTo: null }, { validTo: { gt: asOf } }],
        },
        select: { targetPartyId: true },
      });

      if (parentEdges.length === 0) {
        roots.add(current);
      }

      for (const edge of parentEdges) {
        queue.push(edge.targetPartyId);
      }
    }

    return roots;
  }
}
