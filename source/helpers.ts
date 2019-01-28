/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();

export function disposeObject(object: THREE.Object3D)
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
                    if (texture && texture.isTexture) {
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

/**
 * Computes the bounding box of the given object, relative to the given root (same as object if
 * not specified explicitly). Accounts for the transforms of all children relative to the root.
 * Caller is responsible for emptying the given bounding box, and for updating the matrices of
 * all child objects.
 * @param object
 * @param box The box to be updated.
 * @param root
 */
export function computeLocalBoundingBox(object: THREE.Object3D, box: THREE.Box3, root?: THREE.Object3D)
{
    if (!root) {
        root = object;
    }

    const geometry = (object as any).geometry;
    if (geometry && object.visible) {

        let current = object;
        _mat4.identity();

        while(current && current !== root) {
            _mat4.premultiply(current.matrix);
            current = current.parent;
        }

        if (geometry.isGeometry) {
            const vertices = geometry.vertices;
            for (let i = 0, n = vertices.length; i < n; ++i) {
                _vec3.copy(vertices[i]).applyMatrix4(_mat4);
                box.expandByPoint(_vec3);
            }
        }
        else if (geometry.isBufferGeometry) {
            const attribute = geometry.attributes.position;
            if (attribute !== undefined) {
                for (let i = 0, n = attribute.count; i < n; ++i) {
                    _vec3.fromBufferAttribute(attribute, i).applyMatrix4(_mat4);
                    box.expandByPoint(_vec3);
                }
            }
        }
    }

    const children = object.children;
    for (let i = 0, n = children.length; i < n; ++i) {
        computeLocalBoundingBox(children[i], box, root);
    }
}