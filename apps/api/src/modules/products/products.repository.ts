import { prisma } from "@dipantauin/prisma";

type ProductPreview = {
  marketplace: string;
  externalProductId: string | null;
  canonicalUrl: string;
  name: string;
  sellerName?: string;
  imageUrl: string | null;
  price: number;
  originalPrice: number | null;
  availability: string;
  fetchedAt: Date;
};

export class ProductsRepository {
  static findByExternalIdentity(platform: string, externalProductId: string) {
    return prisma.product.findUnique({
      where: { platform_externalProductId: { platform, externalProductId } },
    });
  }

  static findByCanonicalUrl(canonicalUrl: string) {
    return prisma.product.findFirst({ where: { canonicalUrl } });
  }

  static create(preview: ProductPreview) {
    return prisma.product.create({
      data: {
        platform: preview.marketplace,
        externalProductId: preview.externalProductId,
        url: preview.canonicalUrl,
        canonicalUrl: preview.canonicalUrl,
        name: preview.name,
        sellerName: preview.sellerName,
        imageUrl: preview.imageUrl,
        currentPrice: preview.price,
        originalPrice: preview.originalPrice,
        availability: preview.availability,
        lastCheckedAt: preview.fetchedAt,
        status: "ACTIVE",
      },
    });
  }

  static findRecent() {
    return prisma.product.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  }

  static findById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  }

  static deleteById(id: string) {
    return prisma.product.delete({ where: { id } });
  }
}
