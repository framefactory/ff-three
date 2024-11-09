/**
 * FF Typescript Foundation Library
 * Copyright 2024 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import resolvePathname from "resolve-pathname";

import {
    Group, 
    LoadingManager, 
    Object3D, 
    Scene 
} from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

import { Loader } from "./Loader.js";

////////////////////////////////////////////////////////////////////////////////

/**
 * Extended Three.js glTF loader with built-in DRACO mesh compression support.
 */
export class ModelLoader extends Loader
{
    static readonly assetType = "model";
    static readonly extensions = [ "gltf", "glb" ];

    static dracoPath: string = "js/draco/";

    protected gltfLoader: GLTFLoader;


    constructor(loadingManager?: LoadingManager)
    {
        super(loadingManager);

        const dracoLoader = new DRACOLoader();
        const dracoUrl = resolvePathname(ModelLoader.dracoPath, window.location.origin + window.location.pathname);
        dracoLoader.setDecoderPath(dracoUrl);

        if (ENV_DEVELOPMENT) {
            console.log("ModelLoader.constructor - DRACO library path: %s", dracoUrl);
        }

        this.gltfLoader = new GLTFLoader(loadingManager);
        this.gltfLoader.setDRACOLoader(dracoLoader);
    }

    async load(url: string): Promise<Object3D>
    {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(url, gltf => {
                const root = gltf.scene;

                if (root.type === "Scene") {
                    const model = new Group();
                    root.children.forEach(child => model.add(child));
                    resolve(model);
                }

                resolve(root);
            },
            null,
            (error: string) => {
                console.error(`failed to load '${url}': ${error}`);
                reject(new Error(error));
            })
        });
    }
}