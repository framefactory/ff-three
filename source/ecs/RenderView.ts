/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import { Component } from "@ff/core/ecs";

import {
    EManipPointerEventType,
    IManip,
    IManipBaseEvent,
    IManipPointerEvent,
    IManipTriggerEvent
} from "@ff/browser/ManipTarget";

import RenderSystem, { IRenderContext } from "./RenderSystem";
import Viewport, { IViewportBaseEvent } from "../Viewport";

////////////////////////////////////////////////////////////////////////////////

export { Viewport };

export interface IPickInfo
{
    component: Component;
    object3D: THREE.Object3D;
    position: THREE.Vector3;
    normal: THREE.Vector3;
}

export interface IViewBaseEvent extends IViewportBaseEvent
{
    view: RenderView;
    pick: IPickInfo;
}

export interface IViewPointerEvent extends IManipPointerEvent, IViewBaseEvent { }
export interface IViewTriggerEvent extends IManipTriggerEvent, IViewBaseEvent { }

export default class RenderView implements IManip
{
    readonly system: RenderSystem;
    readonly renderer: THREE.WebGLRenderer;
    readonly canvas: HTMLCanvasElement;
    readonly overlay: HTMLElement;
    readonly viewports: Viewport[] = [];

    protected activeViewport: Viewport = null;
    protected shouldResize = false;
    protected context: IRenderContext;

    constructor(system: RenderSystem, canvas: HTMLCanvasElement, overlay: HTMLElement)
    {
        this.system = system;
        this.canvas = canvas;
        this.overlay = overlay;

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true
        });

        this.renderer.autoClear = false;
        this.renderer.setClearColor("#0090c0");

        this.context = {
            view: this,
            viewport: null,
            scene: null,
            camera: null
        };
    }

    get canvasWidth()
    {
        return this.canvas.width;
    }

    get canvasHeight()
    {
        return this.canvas.height;
    }

    attach()
    {
        const width = this.canvasWidth;
        const height = this.canvasHeight;

        this.viewports.forEach(viewport => viewport.setCanvasSize(width, height));
        this.renderer.setSize(width, height, false);

        this.system.attachView(this);
    }

    detach()
    {
        this.system.detachView(this);
    }

    render(scene: THREE.Scene, camera: THREE.Camera)
    {
        if (this.shouldResize) {
            this.shouldResize = false;

            const width = this.canvas.width = this.canvas.clientWidth;
            const height = this.canvas.height = this.canvas.clientHeight;

            this.viewports.forEach(viewport => viewport.setCanvasSize(width, height));

            if (this.renderer) {
                this.renderer.setSize(width, height, false);
            }

        }

        const context = this.context;
        context.scene = scene;
        context.camera = camera;

        this.renderer.clear();

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

    resize()
    {
        this.shouldResize = true;
    }

    addViewport(): Viewport
    {
        const viewport = new Viewport();
        this.viewports.push(viewport);
        return viewport;
    }

    addViewports(count: number)
    {
        for (let i = 0; i < count; ++i) {
            this.viewports.push(new Viewport());
        }
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
        const system = this.system;
        if (!system) {
            return false;
        }

        if (event.type === EManipPointerEventType.Hover ||
            (event.isPrimary && event.type === EManipPointerEventType.Down)) {
            this.activeViewport = null;
        }

        const viewEvent = this.routeEvent(event);

        if (viewEvent) {
            return system.onPointer(viewEvent) || this.activeViewport.onPointer(viewEvent);
        }

        return false;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        const system = this.system;
        if (!system) {
            return false;
        }

        const viewEvent = this.routeEvent(event);

        if (viewEvent) {
            return system.onTrigger(viewEvent) || this.activeViewport.onTrigger(viewEvent);
        }

        return false;
    }

    protected routeEvent(event: IManipPointerEvent): IViewPointerEvent;
    protected routeEvent(event: IManipTriggerEvent): IViewTriggerEvent;
    protected routeEvent(event: IManipBaseEvent): IViewBaseEvent
    {
        // if no active viewport, perform a hit test against all viewports
        if (!this.activeViewport) {
            const viewports = this.viewports;
            for (let i = 0, n = viewports.length; i < n; ++i) {
                const vp = viewports[i];
                if (vp.enabled && vp.isPointInside(event.localX, event.localY)) {
                    this.activeViewport = vp;
                    break;
                }
            }
        }

        const viewport = this.activeViewport;

        // if we have an active viewport now, augment event with viewport/view information
        if (viewport) {
            const viewEvent = event as IViewBaseEvent;
            viewEvent.view = this;
            viewEvent.viewport = viewport;
            viewEvent.deviceX = viewport.getDeviceX(event.localX);
            viewEvent.deviceY = viewport.getDeviceY(event.localY);
            return viewEvent;
        }

        // without an active viewport, return null to cancel the event
        return null;
    }
}