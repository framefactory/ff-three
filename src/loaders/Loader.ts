/**
 * FF Typescript Foundation Library
 * Copyright 2024 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { LoadingManager } from "three";

////////////////////////////////////////////////////////////////////////////////

export class Loader
{
    static readonly assetType: string = "";
    static readonly extensions: string[] = [];

    get extensions() {
        return (this.constructor as typeof Loader).extensions;
    }
    get assetType() {
        return (this.constructor as typeof Loader).assetType;
    }

    constructor(loadingManager: LoadingManager)
    {
        // do nothing
    }

    canLoad(path: string)
    {
        const extension = path.split(".").pop().toLowerCase();
        return this.extensions.indexOf(extension) >= 0;
    }

    async load(url: string): Promise<any>
    {
        return Promise.reject();
    }
}