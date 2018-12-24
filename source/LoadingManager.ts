/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

////////////////////////////////////////////////////////////////////////////////

const _VERBOSE = false;

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
        if (_VERBOSE) {
            console.debug("Loading files...");
        }
    }

    protected onLoadingProgress(url, itemsLoaded, itemsTotal)
    {
        if (_VERBOSE) {
            console.debug(`Loaded ${itemsLoaded} of ${itemsTotal} files: ${url}`);
        }
    }

    protected onLoadingCompleted()
    {
        if (_VERBOSE) {
            console.debug("Loading completed");
        }
    }

    protected onLoadingError()
    {
        if (_VERBOSE) {
            console.error(`Loading error`);
        }
    }
}