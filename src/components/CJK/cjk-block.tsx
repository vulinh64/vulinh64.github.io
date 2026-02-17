import { createCJK } from "./cjk-factory.tsx";

// CJK block
export const CJKB = createCJK({
    isBlock: true,
    isExtraLarge: false,
});

// CJK block - large
export const XCJKB = createCJK({
    isBlock: true,
    isExtraLarge: true,
});