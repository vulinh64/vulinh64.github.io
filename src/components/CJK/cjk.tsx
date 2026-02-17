import { createCJK } from "./cjk-factory.tsx";

// CJK inline
export const CJK = createCJK({
    isBlock: false,
    isExtraLarge: false,
});

// CJK inline - large
export const XCJK = createCJK({
    isBlock: false,
    isExtraLarge: true,
});