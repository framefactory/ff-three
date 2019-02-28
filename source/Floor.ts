/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import { Dictionary } from "@ff/core/types";

import * as fragmentShader from "!raw-loader!./shaders/floorPhongShader.frag";
import * as vertexShader from "!raw-loader!./shaders/floorPhongShader.vert";

////////////////////////////////////////////////////////////////////////////////

export default class Floor extends THREE.Mesh
{
    geometry: THREE.PlaneBufferGeometry;
    material: FloorMaterial;

    constructor()
    {
        super(
            new THREE.PlaneBufferGeometry(2, 2, 1, 1),
            new FloorMaterial()
        );

        this.geometry.rotateX(-90 * THREE.Math.DEG2RAD);

        this.receiveShadow = true;
    }

    dispose()
    {
        this.geometry.dispose();
        this.material.dispose();
    }
}

export interface IFloorMaterialParameters extends THREE.MeshPhongMaterialParameters
{

}

export class FloorMaterial extends THREE.MeshPhongMaterial
{
    isMeshPhongMaterial: boolean;
    isFloorMaterial: boolean;

    uniforms: {
    };

    defines: Dictionary<any> = {};

    vertexShader: string;
    fragmentShader: string;

    constructor(params?: IFloorMaterialParameters)
    {
        super(params);

        this.type = "FloorMaterial";

        this.isMeshPhongMaterial = true;
        this.isFloorMaterial = true;

        this.defines = {};
        this.uniforms = THREE.UniformsUtils.merge([
            THREE.ShaderLib.phong.uniforms
        ]);

        this.vertexShader = vertexShader;
        this.fragmentShader = fragmentShader;

        this.transparent = true;
    }
}

