/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import IndexShader from "./shaders/IndexShader";
import PositionShader from "./shaders/PositionShader";
import NormalShader from "./shaders/NormalShader";

import { IViewportBaseEvent } from "./Viewport";

////////////////////////////////////////////////////////////////////////////////

const _vec3 = new THREE.Vector3();

export default class GPUPicker
{
    protected renderer: THREE.WebGLRenderer;

    protected pickTextures: THREE.WebGLRenderTarget[];
    protected pickBuffer: Uint8Array;

    protected indexShader: IndexShader;
    protected positionShader: PositionShader;
    protected normalShader: NormalShader;

    constructor(renderer: THREE.WebGLRenderer)
    {
        this.renderer = renderer;

        this.pickTextures = [];
        for (let i = 0; i < 3; ++i) {
            this.pickTextures[i] = new THREE.WebGLRenderTarget(1, 1, { stencilBuffer: false });
        }
        this.pickBuffer = new Uint8Array(4);

        this.indexShader = new IndexShader();
        this.positionShader = new PositionShader();
        this.normalShader = new NormalShader();

    }

    pickIndex(scene: THREE.Scene, camera: THREE.Camera, event: IViewportBaseEvent): number
    {
        const viewport = event.viewport;
        camera = viewport.updateCamera(camera);

        const overrideMaterial = scene.overrideMaterial;
        scene.overrideMaterial = this.indexShader;

        const renderer = this.renderer;
        const pickTexture = this.pickTextures[0];
        const color = renderer.getClearColor().clone();
        renderer.setClearColor(0);

        viewport.applyPickViewport(pickTexture, event);
        renderer.render(scene, camera, pickTexture, true);

        renderer.setRenderTarget();
        renderer.setClearColor(color);
        scene.overrideMaterial = overrideMaterial;

        const buffer = this.pickBuffer;
        renderer.readRenderTargetPixels(pickTexture, 0, 0, 1, 1, buffer);
        return buffer[0] + buffer[1] * 256 + buffer[2] * 65536;
    }

    pickPosition(scene: THREE.Scene, camera: THREE.Camera,
        boundingBox: THREE.Box3, event: IViewportBaseEvent): THREE.Vector3
    {
        const viewport = event.viewport;
        camera = viewport.updateCamera(camera);

        const overrideMaterial = scene.overrideMaterial;
        const shader = scene.overrideMaterial = this.positionShader;

        const renderer = this.renderer;
        const pickTextures = this.pickTextures;
        const color = renderer.getClearColor().clone();
        renderer.setClearColor(0);

        for (let i = 0; i < 3; ++i) {
            shader.uniforms.index.value = i;
            shader.uniforms.range.value[0] = boundingBox.min.getComponent(i);
            shader.uniforms.range.value[1] = boundingBox.max.getComponent(i);
            viewport.applyPickViewport(pickTextures[i], event);
            renderer.render(scene, camera, pickTextures[i], true);
        }

        renderer.setRenderTarget();
        renderer.setClearColor(color);
        scene.overrideMaterial = overrideMaterial;

        const buffer = this.pickBuffer;
        const position = new THREE.Vector3();

        for (let i = 0; i < 3; ++i) {
            renderer.readRenderTargetPixels(pickTextures[i], 0, 0, 1, 1, buffer);
            position[i] = buffer[0] / 255
                + buffer[1] / 255 / 256
                + buffer[2] / 255 / 65536
                + buffer[3] / 255 / 16777216;
        }

        boundingBox.getSize(_vec3);
        return position.multiply(_vec3).add(boundingBox.min);
    }

    pickNormal(scene: THREE.Scene, camera: THREE.Camera, event: IViewportBaseEvent): THREE.Vector3
    {
        const viewport = event.viewport;
        camera = viewport.updateCamera(camera);

        const overrideMaterial = scene.overrideMaterial;
        scene.overrideMaterial = this.normalShader;

        const renderer = this.renderer;
        const pickTexture = this.pickTextures[0];
        const color = renderer.getClearColor().clone();
        renderer.setClearColor(0);

        viewport.applyPickViewport(pickTexture, event);
        renderer.render(scene, camera, pickTexture, true);

        renderer.setRenderTarget();
        renderer.setClearColor(color);
        scene.overrideMaterial = overrideMaterial;

        const buffer = this.pickBuffer;
        renderer.readRenderTargetPixels(pickTexture, 0, 0, 1, 1, buffer);
        return new THREE.Vector3(
            buffer[0] / 255 * 2 - 1,
            buffer[1] / 255 * 2 - 1,
            buffer[2] / 255 * 2 - 1
        ).normalize();
    }
}