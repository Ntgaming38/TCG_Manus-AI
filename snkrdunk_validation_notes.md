# SNKRDUNK validation note

Source URL: https://snkrdunk.com/en/trading-cards/721913

Retrieved on 2026-08-11. The public page title is `Pokemon Card Game MEGA High Class Pack "MEGA Dream ex" Box | SNKRDUNK`. The page exposes `US $84~` in the public rendered content, while the user-provided handoff expects the Japanese first-choice value `1個 (99+) ¥13,300` for this product. The current adapter intentionally parses only JPY price markup/JSON and does not convert USD or invent a fallback. If the raw public HTML does not contain a JPY price, sync must return an error and keep the existing marketPrice unchanged, as specified by the handoff.

A localized route test at https://snkrdunk.com/ja/trading-cards/721913 returned 404, so the adapter must not assume a Japanese URL path or synthesize a JPY price from the English page's USD display.

The saved adapter validation script fetched the real product URL successfully but returned the expected error: `Không tìm thấy giá công khai trên trang SNKRDUNK. Giá chưa được cập nhật.` This confirms the adapter does not treat the page's visible USD $84 as JPY and does not write a fallback price.

A read-only bulk-sync validation against the current user data returned `updatedCount: 0`, `skippedCount: 22`, and `errors: []`, confirming products without SNKRDUNK links are reported as skipped and no records are modified.
