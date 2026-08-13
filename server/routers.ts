import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { extractAssistantText } from "./aiResponse";
import { buildTcgAssistantSystemPrompt } from "./tcgAssistantPrompt";

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

  ai: router({
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(2000),
        })).min(1).max(12),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const cardProducts = await db.listProducts(ctx.user.id, { type: "card" });
          const cardAnalysis = cardProducts.map((p: any) => {
            const buyP = Number(p.buyPrice || 0);
            const marketP = Number(p.marketPrice || buyP);
            const unrealizedProfit = (marketP - buyP) * Math.max(0, p.quantity - (p.damagedQuantity || 0));
            const roi = buyP > 0 ? Number((((marketP - buyP) / buyP) * 100).toFixed(1)) : 0;
            return {
              id: p.id,
              name: p.name,
              buyPrice: buyP,
              marketPrice: marketP,
              suggestedMarketPrice: marketP,
              unrealizedProfit,
              roi,
              quantity: p.quantity,
            };
          });
          cardAnalysis.sort((a, b) => b.unrealizedProfit - a.unrealizedProfit);
          const stats = await db.getDashboardStats(ctx.user.id);
          const context = {
            dashboard: stats,
            topCardsAnalysis: cardAnalysis.slice(0, 10),
          };

          const response = await invokeLLM({
            model: "claude-haiku-4-5",
            maxTokens: 1000,
            messages: [
              {
                role: "system",
                content: buildTcgAssistantSystemPrompt(context),
              },
              ...input.messages.map((m) => ({ role: m.role, content: m.content })),
            ],
          });

          const content = extractAssistantText(response);
          if (!content) {
            throw new Error(`LLM không trả về nội dung hiển thị được (finish_reason: ${response.choices?.[0]?.finish_reason ?? "unknown"}).`);
          }
          return content;
        } catch (error) {
          console.error("AI chat error:", error);
          return "Xin lỗi, hiện tại Trợ lý AI chưa thể hoàn tất phân tích. Vui lòng thử lại sau ít phút.";
        }
      }),

    analysisChartData: protectedProcedure
      .query(async ({ ctx }) => {
        const cardProducts = await db.listProducts(ctx.user.id, { type: "card" });
        const cardAnalysis = cardProducts.map((p: any) => {
          const buyP = Number(p.buyPrice || 0);
          const marketP = Number(p.marketPrice || buyP);
          const unrealizedProfit = (marketP - buyP) * Math.max(0, p.quantity - (p.damagedQuantity || 0));
          const roi = buyP > 0 ? Number((((marketP - buyP) / buyP) * 100).toFixed(1)) : 0;
          return {
            id: p.id,
            name: p.name,
            buyPrice: buyP,
            marketPrice: marketP,
            suggestedMarketPrice: marketP,
            unrealizedProfit,
            roi,
          };
        });
        cardAnalysis.sort((a, b) => b.unrealizedProfit - a.unrealizedProfit);

        const stats = await db.getDashboardStats(ctx.user.id);
        return {
          dashboard: stats,
          topCardsAnalysis: cardAnalysis.slice(0, 10),
          inventorySummary: {
            totalCardsInStock: cardProducts.reduce((sum: number, p: any) => sum + p.quantity, 0),
            linkedToSnkrdunk: cardProducts.filter((p: any) => Boolean(p.snkrdunkUrl)).length,
          },
        };
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
});

export type AppRouter = typeof appRouter;
