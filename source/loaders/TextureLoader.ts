/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import Loader from "./Loader";

////////////////////////////////////////////////////////////////////////////////

export default class TextureLoader extends Loader
{
    static readonly assetType = "texture";
    static readonly extensions = [ "jpg", "jpeg", "png" ];

    protected textureLoader: THREE.TextureLoader;

    constructor(loadingManager: THREE.LoadingManager)
    {
        super(loadingManager);

        this.textureLoader = new THREE.TextureLoader(loadingManager);
    }

    async load(url: string): Promise<THREE.Texture>
    {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(url, texture => {
                resolve(texture);

            }, null, errorEvent => {
                console.error(errorEvent);
                reject(new Error(errorEvent.message));
            });
        });
    }
}