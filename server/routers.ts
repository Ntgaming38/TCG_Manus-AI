import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  products: router({
    list: protectedProcedure
      .input(z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(({ ctx, input }) => db.listProducts(ctx.user.id, input)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getProductById(input.id)),

    suggestions: protectedProcedure
      .input(z.object({ search: z.string() }))
      .query(({ ctx, input }) => db.getProductSuggestions(ctx.user.id, input.search)),

    inStock: protectedProcedure
      .query(({ ctx }) => db.getInStockProducts(ctx.user.id)),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["card", "box", "pack"]),
        series: z.string().optional(),
        setName: z.string().optional(),
        quantity: z.number().min(0).default(1),
        buyPrice: z.number().min(0).default(0),
        marketPrice: z.number().min(0).optional(),
        sellPrice: z.number().min(0).optional(),
        description: z.string().optional(),
        cardNumber: z.string().optional(),
        language: z.string().optional(),
        rarity: z.string().optional(),
        condition: z.string().optional(),
        psaGrade: z.string().optional(),
        releaseDate: z.string().optional(),
        image: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.createProduct({
        userId: ctx.user.id,
        name: input.name,
        type: input.type,
        series: input.series || "Pokemon",
        setName: input.setName,
        quantity: input.quantity,
        buyPrice: String(input.buyPrice),
        marketPrice: input.marketPrice ? String(input.marketPrice) : undefined,
        sellPrice: input.sellPrice ? String(input.sellPrice) : undefined,
        description: input.description,
        cardNumber: input.cardNumber,
        language: input.language || "Japanese",
        rarity: input.rarity,
        condition: input.condition || "New",
        psaGrade: input.psaGrade,
        releaseDate: input.releaseDate,
        image: input.image,
        status: "in_stock",
      })),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        series: z.string().optional(),
        setName: z.string().optional(),
        quantity: z.number().optional(),
        buyPrice: z.number().optional(),
        marketPrice: z.number().optional(),
        sellPrice: z.number().optional(),
        description: z.string().optional(),
        cardNumber: z.string().optional(),
        language: z.string().optional(),
        rarity: z.string().optional(),
        condition: z.string().optional(),
        psaGrade: z.string().optional(),
        releaseDate: z.string().optional(),
        image: z.string().optional(),
        status: z.enum(["in_stock", "sold", "reserved", "traded", "damaged"]).optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = {};
        Object.entries(data).forEach(([key, val]) => {
          if (val !== undefined) {
            if (['buyPrice', 'marketPrice', 'sellPrice'].includes(key)) {
              updateData[key] = String(val);
            } else {
              updateData[key] = val;
            }
          }
        });
        return db.updateProduct(id, ctx.user.id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteProduct(input.id, ctx.user.id)),

    updateMarketPrice: protectedProcedure
      .input(z.object({ id: z.number(), marketPrice: z.number() }))
      .mutation(({ ctx, input }) => db.updateMarketPrice(input.id, ctx.user.id, String(input.marketPrice))),

    updateSnkrdunkUrl: protectedProcedure
      .input(z.object({ id: z.number(), snkrdunkUrl: z.string().url() }))
      .mutation(({ ctx, input }) => db.updateSnkrdunkUrl(input.id, ctx.user.id, input.snkrdunkUrl)),

    syncSnkrdunkPrice: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.syncSnkrdunkPriceForProduct(input.id, ctx.user.id)),

    syncAllSnkrdunk: protectedProcedure
      .mutation(({ ctx }) => db.syncAllSnkrdunkPrices(ctx.user.id)),

    markDamaged: protectedProcedure
      .input(z.object({
        productId: z.number(),
        damagedQty: z.number().min(1),
        damageNote: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.markProductAsDamaged(ctx.user.id, input)),

    damaged: protectedProcedure
      .query(({ ctx }) => db.getDamagedProducts(ctx.user.id)),
  }),

  purchases: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(({ ctx, input }) => db.listPurchases(ctx.user.id, input)),

    create: protectedProcedure
      .input(z.object({
        productName: z.string().min(1),
        productType: z.string().default("card"),
        series: z.string().optional(),
        shop: z.string().optional(),
        purchaseType: z.string().optional(),
        quantity: z.number().min(1).default(1),
        price: z.number().min(0),
        note: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.createPurchase(ctx.user.id, input)),

    update: protectedProcedure
      .input(z.object({
        purchaseId: z.number(),
        quantity: z.number().min(1).optional(),
        price: z.number().min(0).optional(),
        shop: z.string().optional(),
        note: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.updatePurchase(ctx.user.id, input)),

    delete: protectedProcedure
      .input(z.object({ purchaseId: z.number() }))
      .mutation(({ ctx, input }) => db.deletePurchase(ctx.user.id, input.purchaseId)),
  }),

  sales: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(({ ctx, input }) => db.listSales(ctx.user.id, input)),

    create: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        salePrice: z.number().min(0),
        isDamaged: z.boolean().optional(),
        platform: z.string().optional(),
        fee: z.number().optional(),
        shippingFee: z.number().optional(),
        otherCost: z.number().optional(),
        note: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.createSale(ctx.user.id, input)),

    update: protectedProcedure
      .input(z.object({
        saleId: z.number(),
        quantity: z.number().min(1).optional(),
        salePrice: z.number().min(0).optional(),
        note: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.updateSale(ctx.user.id, input)),

    delete: protectedProcedure
      .input(z.object({ saleId: z.number() }))
      .mutation(({ ctx, input }) => db.deleteSale(ctx.user.id, input.saleId)),
  }),

  dashboard: router({
    stats: protectedProcedure
      .query(({ ctx }) => db.getDashboardStats(ctx.user.id)),
  }),

  reports: router({
    overview: protectedProcedure
      .query(({ ctx }) => db.getReportsOverview(ctx.user.id)),
  }),

  shops: router({
    list: protectedProcedure
      .query(({ ctx }) => db.listShops(ctx.user.id)),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        location: z.string().optional(),
        note: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.createShop({
        userId: ctx.user.id,
        name: input.name,
        location: input.location,
        note: input.note,
      })),
  }),

  chyusen: router({
    list: protectedProcedure
      .query(({ ctx }) => db.listChyusenEntries(ctx.user.id)),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        productName: z.string().optional(),
        sourceName: z.string().optional(),
        sourceUrl: z.string().optional(),
        registrationStartAt: z.coerce.date().optional(),
        registrationDeadline: z.coerce.date().optional(),
        drawAt: z.coerce.date().optional(),
        resultStatus: z.enum(["pending", "won", "lost", "not_entered", "cancelled"]).default("pending"),
        isRegistered: z.boolean().default(false),
        notes: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.createChyusenEntry({
        userId: ctx.user.id,
        title: input.title,
        productName: input.productName,
        sourceName: input.sourceName,
        sourceUrl: input.sourceUrl,
        registrationStartAt: input.registrationStartAt,
        registrationDeadline: input.registrationDeadline,
        drawAt: input.drawAt,
        resultStatus: input.resultStatus,
        isRegistered: input.isRegistered,
        notes: input.notes,
      })),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        productName: z.string().optional(),
        sourceName: z.string().optional(),
        sourceUrl: z.string().optional(),
        registrationStartAt: z.coerce.date().optional(),
        registrationDeadline: z.coerce.date().optional(),
        drawAt: z.coerce.date().optional(),
        resultStatus: z.enum(["pending", "won", "lost", "not_entered", "cancelled"]).optional(),
        isRegistered: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateChyusenEntry(ctx.user.id, id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteChyusenEntry(ctx.user.id, input.id)),

    previewSource: protectedProcedure
      .input(z.object({ sourceUrl: z.string().url() }))
      .mutation(({ input }) => db.previewChyusenSource(input.sourceUrl)),

    sources: protectedProcedure
      .query(({ ctx }) => db.listChyusenSources(ctx.user.id)),

    addSource: protectedProcedure
      .input(z.object({
        sourceUrl: z.string().url(),
        sourceLabel: z.string().max(255).optional(),
        confirmedDraft: z.object({
          title: z.string().min(1),
          productName: z.string().optional(),
          registrationStartAt: z.coerce.date().optional(),
          registrationDeadline: z.coerce.date().optional(),
          drawAt: z.coerce.date().optional(),
          note: z.string().max(1000).optional(),
        }).optional(),
      }))
      .mutation(({ ctx, input }) => db.addChyusenSource(ctx.user.id, input)),

    updateSource: protectedProcedure
      .input(z.object({ id: z.number(), sourceLabel: z.string().max(255).optional(), isActive: z.boolean().optional() }))
      .mutation(({ ctx, input }) => {
        const { id, ...data } = input;
        return db.updateChyusenSource(ctx.user.id, id, data);
      }),

    deleteSource: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteChyusenSource(ctx.user.id, input.id)),

    refreshSource: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.scanChyusenSource(ctx.user.id, input.id)),

    notifications: protectedProcedure
      .query(({ ctx }) => db.listChyusenNotifications(ctx.user.id)),

    markNotificationRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.markChyusenNotificationRead(ctx.user.id, input.id)),
  }),
});

export type AppRouter = typeof appRouter;
