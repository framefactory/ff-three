/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";


export function dispose(object: THREE.Object3D)
{
    const geometries = new Map<string, THREE.BufferGeometry>();
    const materials = new Map<string, THREE.Material>();
    const textures = new Map<string, THREE.Texture>();

    object.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) {
            const geometry = mesh.geometry as THREE.BufferGeometry;
            if (geometry) {
                geometries.set(geometry.uuid, geometry);
            }
            const material = mesh.material as THREE.Material;
            if (material) {
                materials.set(material.uuid, material);
                for (let key in material) {
                    const texture = material[key] as any; // THREE.Texture;
                    if (texture.isTexture) {
                        textures.set(texture.uuid, texture);
                    }
                }

            }
        }
    });

    for (let entry of textures) {
        entry[1].dispose();
    }
    for (let entry of materials) {
        entry[1].dispose();
    }
    for (let entry of geometries) {
        entry[1].dispose();
    }
}