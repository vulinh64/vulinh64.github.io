import clsx from "clsx";
import styles from "./styles.module.css";
import React from "react";

// import { CJK } from '@site/src/components/CJK/cjk.tsx';
// import { CJKB } from '@site/src/components/CJK/cjk-block.tsx';
// import { XCJK } from '@site/src/components/CJK/cjk.tsx';
// import { XCJKB } from '@site/src/components/CJK/cjk-block.tsx';

type FactoryOptions = {
    isBlock: boolean;
    isExtraLarge: boolean;
};

export function createCJK({isBlock, isExtraLarge}: FactoryOptions) {
    const E = isBlock ? "div" : "span";

    return function CJKComponent({children}: {
        children: React.ReactNode;
    }) {
        return (
            <E className={clsx(isExtraLarge ? styles.xcjk : styles.cjk)}>
                {children}
            </E>
        );
    };
}
