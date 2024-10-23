/**
 * FF Typescript Foundation Library
 * Copyright 2024 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

// Webpack constant: true during development build
declare const ENV_DEVELOPMENT: boolean;
// Webpack constant: true during production build
declare const ENV_PRODUCTION: boolean;

declare module '*.frag' {
    const content: string;
    export default content;
}

declare module '*.vert' {
    const content: string;
    export default content;
}