/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import { EManipPointerEventType, IManip, IManipPointerEvent, IManipTriggerEvent } from "@ff/browser/ManipTarget";

import { ECameraPreset, ECameraType } from "../UniversalCamera";
import RenderSystem, { IRenderContext } from "./RenderSystem";
import Viewport, { IViewportManip, IViewportPointerEvent, IViewportTriggerEvent } from "../Viewport";

////////////////////////////////////////////////////////////////////////////////

export { Viewport, IViewportManip, IViewportPointerEvent, IViewportTriggerEvent };

export default class RenderView implements IManip
{
    next: IViewportManip;

    readonly system: RenderSystem;
    readonly canvas: HTMLCanvasElement;
    readonly overlay: HTMLElement;
    readonly renderer: THREE.WebGLRenderer;

    protected viewports: Viewport[];
    protected activeViewport: Viewport;
    protected context: IRenderContext;

    constructor(system: RenderSystem, canvas: HTMLCanvasElement,
        overlay: HTMLElement, params?: THREE.WebGLRendererParameters)
    {
        this.next = null;
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
        this.activeViewport = null;

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

        const viewports = this.viewports;
        for (let i = 0, n = viewports.length; i < n; ++i) {
            const viewport = viewports[i];
            if (viewport.enabled) {
                context.viewport = viewport;
                this.system.preRender(context);
                viewport.render(this.renderer, scene, camera);
                this.system.postRender(context);
            }
        }
    }

    resize(width: number, height: number)
    {
        this.canvas.width = width;
        this.canvas.height = height;

        this.renderer.setSize(width, height, false);
        this.viewports.forEach(viewport => viewport.setCanvasSize(width, height));
    }

    addViewport(type?: ECameraType, preset?: ECameraPreset): Viewport
    {
        const viewport = new Viewport(this.canvasWidth, this.canvasHeight);
        viewport.setCanvasSize(this.canvasWidth, this.canvasHeight);

        if (type !== undefined) {
            viewport.setBuiltInCamera(type, preset);
        }

        this.viewports.push(viewport);
        return viewport;
    }

    removeViewport(viewport: Viewport)
    {
        const index = this.viewports.indexOf(viewport);
        if (index < 0) {
            throw new Error("viewport not found");
        }

        this.viewports.slice(index, 1);
    }

    enableViewport(index: number, enabled: boolean)
    {
        this.viewports[index].enabled = enabled;
    }

    getViewportCount()
    {
        return this.viewports.length;
    }

    onPointer(event: IManipPointerEvent)
    {
        const next = this.next;
        if (!next) {
            return false;
        }

        let vpEvent = null;

        if (event.isPrimary) {
            if (event.type === EManipPointerEventType.Down) {
                const viewports = this.viewports;
                for (let i = 0, n = viewports.length; i < n; ++i) {
                    const viewport = viewports[i];
                    if ((vpEvent = viewport.hitTestEvent(event))) {
                        this.activeViewport = viewport;
                        break;
                    }
                }
            }
            else if (event.type === EManipPointerEventType.Up) {
                vpEvent = this.activeViewport.convertEvent(event);
                this.activeViewport = null;
            }
        }
        if (this.activeViewport) {
            vpEvent = this.activeViewport.convertEvent(event);
        }

        return vpEvent ? next.onPointer(vpEvent) : false;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        const next = this.next;
        if (!next) {
            return false;
        }

        let vpEvent = null;

        if (this.activeViewport) {
            vpEvent = this.activeViewport.convertEvent(event);
        }
        else {
            const viewports = this.viewports;
            for (let i = 0, n = viewports.length; i < n; ++i) {
                const viewport = viewports[i];
                if ((vpEvent = viewport.hitTestEvent(event))) {
                    break;
                }
            }
        }

        return vpEvent ? next.onTrigger(vpEvent) : false;
    }
}