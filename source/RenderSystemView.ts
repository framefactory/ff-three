/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import { IManipPointerEvent, IManipTriggerEvent } from "@ff/browser/ManipTarget";

import RenderSystem, { IRenderContext } from "./RenderSystem";
import UniversalCamera from "./UniversalCamera";
import Viewport from "./Viewport";

////////////////////////////////////////////////////////////////////////////////

export { Viewport };

export default class RenderSystemView
{
    readonly system: RenderSystem;
    readonly canvas: HTMLCanvasElement;
    readonly overlay: HTMLElement;
    readonly renderer: THREE.WebGLRenderer;

    protected viewports: Viewport[];
    protected context: IRenderContext;

    constructor(system: RenderSystem, canvas: HTMLCanvasElement,
        overlay: HTMLElement, params?: THREE.WebGLRendererParameters)
    {
        this.system = system;
        this.canvas = canvas;
        this.overlay = overlay;

        const rendererParams = Object.assign({}, {
            canvas,
            antialias: true,
            devicePixelRatio: window.devicePixelRatio
        }, params);

        this.renderer = new THREE.WebGLRenderer(rendererParams);

        this.viewports = [];

        this.context = {
            view: this,
            viewport: null,
            scene: null,
            camera: null
        };

        this.system.attachView(this);
    }

    get canvasWidth()
    {
        return this.canvas.width;
    }

    get canvasHeight()
    {
        return this.canvas.height;
    }

    dispose()
    {
        this.system.detachView(this);
    }

    render(scene: THREE.Scene, camera: THREE.Camera)
    {
        const context = this.context;
        context.scene = scene;
        context.camera = camera;

        this.viewports.forEach(viewport => {
            context.viewport = viewport;
            this.system.preRender(context);
            viewport.render(this.renderer, scene, camera);
            this.system.postRender(context);
        });
    }

    resize(width: number, height: number)
    {
        this.canvas.width = width;
        this.canvas.height = height;

        this.renderer.setSize(width, height, false);
        this.viewports.forEach(viewport => viewport.setCanvasSize(width, height));
    }

    forEachViewport(callback: (viewport: Viewport, index: number) => void)
    {
        this.viewports.forEach(callback);
    }

    addViewport(left: number, top: number, right: number, bottom: number)
    {

    }

    removeViewport(index: number)
    {
        this.viewports.slice(index, 1);
    }

    getViewportCount()
    {
        return this.viewports.length;
    }

    onPointer(event: IManipPointerEvent)
    {
        return false;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        return false;
    }
}