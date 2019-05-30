/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import "three/examples/js/loaders/OBJLoader";
const OBJLoader = (THREE as any).OBJLoader;

import "three/examples/js/loaders/PLYLoader";
const PLYLoader = (THREE as any).PLYLoader;

import Loader from "./Loader";

////////////////////////////////////////////////////////////////////////////////

export default class GeometryLoader extends Loader
{
    static readonly assetType = "geometry";
    static readonly extensions = [ "obj", "ply" ];

    protected objLoader;
    protected plyLoader;

    constructor(loadingManager: THREE.LoadingManager)
    {
        super(loadingManager);

        this.objLoader = new OBJLoader(loadingManager);
        this.plyLoader = new PLYLoader(loadingManager);
    }

    async load(url: string): Promise<THREE.Geometry>
    {
        const extension = url.split(".").pop().toLowerCase();

        return new Promise((resolve, reject) => {
            if (extension === "obj") {
                this.objLoader.load(url, result => {
                    const geometry = result.children[0].geometry;
                    if (geometry && geometry.type === "Geometry" || geometry.type === "BufferGeometry") {
                        return resolve(geometry);
                    }

                    return reject(new Error(`Can't parse geometry from '${url}'`));
                });
            }
            else if (extension === "ply") {
                this.plyLoader.load(url, geometry => {
                    if (geometry && geometry.type === "Geometry" || geometry.type === "BufferGeometry") {
                        return resolve(geometry);
                    }

                    return reject(new Error(`Can't parse geometry from '${url}'`));
                });
            }
            else {
                throw new Error(`Can't load geometry, unknown extension: '${extension}' in '${url}'`);
            }
        });
    }
}