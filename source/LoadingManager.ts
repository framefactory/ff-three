/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

export default class LoadingManager extends THREE.LoadingManager
{
    constructor()
    {
        super();

        this.onStart = this.onLoadingStart.bind(this);
        this.onProgress = this.onLoadingProgress.bind(this);
        this.onLoad = this.onLoadingCompleted.bind(this);
        this.onError = this.onLoadingError.bind(this);
    }

    protected onLoadingStart()
    {
        console.log("Loading files...");
    }

    protected onLoadingProgress(url, itemsLoaded, itemsTotal)
    {
        console.log(`Loaded ${itemsLoaded} of ${itemsTotal} files: ${url}`);
    }

    protected onLoadingCompleted()
    {
        console.log("Loading completed");
    }

    protected onLoadingError()
    {
        console.error(`Loading error`);
    }
}