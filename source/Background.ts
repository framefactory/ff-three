/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

////////////////////////////////////////////////////////////////////////////////

export enum EBackgroundMode { Solid, LinearGradient, RadialGradient }

export default class Background extends THREE.Mesh
{
    geometry: BackgroundGeometry;
    material: BackgroundMaterial;

    constructor()
    {
        super(new BackgroundGeometry(), new BackgroundMaterial());

        this.frustumCulled = false;
        this.renderOrder = -Infinity;
        this.matrixAutoUpdate = false;
    }

    dispose()
    {
        this.geometry.dispose();
        this.material.dispose();
    }

    updateMatrixWorld(force: boolean)
    {
    }
}

export class BackgroundGeometry extends THREE.BufferGeometry
{
    constructor()
    {
        super();

        const vertices = new Float32Array([
            -1, -1, 0, 0, 0,
            1, -1, 0, 1, 0,
            1, 1, 0, 1, 1,
            -1, 1, 0, 0, 1
        ]);

        const buffer = new THREE.InterleavedBuffer(vertices, 5);

        this.setIndex([ 0, 1, 2, 0, 2, 3 ]);
        this.addAttribute('position', new THREE.InterleavedBufferAttribute(buffer, 3, 0, false));
        this.addAttribute('uv', new THREE.InterleavedBufferAttribute(buffer, 2, 3, false));
    }
}

export class BackgroundMaterial extends THREE.RawShaderMaterial
{
    set mode(mode: EBackgroundMode) {
        this.uniforms.mode.value = mode;
    }
    get mode() {
        return this.uniforms.mode.value;
    }

    set color0(color: THREE.Vector3 | THREE.Color)
    {
        if (color instanceof THREE.Color) {
            const value = this.uniforms.color0.value;
            value.x = color.r;
            value.y = color.g;
            value.z = color.b;
        }
        else {
            this.uniforms.color0.value.copy(color);
        }
    }
    get color0() {
        return this.uniforms.color0.value;
    }

    set color1(color: THREE.Vector3 | THREE.Color)
    {
        if (color instanceof THREE.Color) {
            const value = this.uniforms.color1.value;
            value.x = color.r;
            value.y = color.g;
            value.z = color.b;
        }
        else {
            this.uniforms.color1.value.copy(color);
        }
    }
    get color1() {
        return this.uniforms.color1.value;
    }

    set noise(noise: number) {
        this.uniforms.noise.value = noise;
    }
    get noise() {
        return this.uniforms.noise.value;
    }

    depthTest = false;
    depthWrite = false;
    transparent = false;

    uniforms = {
        mode: { value: EBackgroundMode.LinearGradient },
        color0: { value: new THREE.Vector3(0.15, 0.2, 0.25) },
        color1: { value: new THREE.Vector3(0, 0, 0) },
        noise: { value: 0.02 }
    };

    vertexShader = [
        "precision highp float;",
        "attribute vec3 position;",
        "attribute vec2 uv;",
        "varying vec2 ndc;",

        "void main() {",
        "  ndc = position.xy;",
        "  gl_Position = vec4(position, 1.0);",
        "}",
    ].join("\n");

    // NOTE: Source of random function:
    // http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/

    fragmentShader = [
        "precision highp float;",
        "uniform vec3 color0;",
        "uniform vec3 color1;",
        "uniform float noise;",
        "uniform int mode;",
        "varying vec2 ndc;",

        "float rand(vec2 co) {",
            "float dt = dot(co.xy ,vec2(12.9898, 78.233));",
            "float sn = mod(dt, 3.14);",
            "return fract(sin(sn) * 43758.5453);",
        "}",

        "void main() {",
        "  float f = mode == 0 ? 0.0 : (mode == 1 ? ndc.y * 0.5 + 0.5 : length(ndc) * 0.707);",
        "  gl_FragColor = vec4(mix(color0, color1, f) + noise * rand(ndc), 1.0);",
        "}"
    ].join("\n");
}