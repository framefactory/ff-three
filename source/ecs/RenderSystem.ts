/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import {
    System,
    Registry,
    Pulse
} from "@ff/core/ecs";

import RenderView, {
    Viewport,
    IViewportManip,
    IViewportPointerEvent,
    IViewportTriggerEvent
} from "./RenderView";

import Scene from "./components/Scene";
import Camera from "./components/Camera";

////////////////////////////////////////////////////////////////////////////////

export interface IRenderContext
{
    view: RenderView;
    viewport: Viewport;
    scene: THREE.Scene;
    camera: THREE.Camera;
}

export default class RenderSystem extends System
{
    next: IViewportManip;

    protected pulse: Pulse;
    protected animHandler: number;
    protected views: RenderView[];


    constructor(registry?: Registry)
    {
        super(registry);

        this.onAnimationFrame = this.onAnimationFrame.bind(this);

        this.pulse = new Pulse();
        this.animHandler = 0;
        this.views = [];
    }

    start()
    {
        if (this.animHandler === 0) {
            this.pulse.start();
            this.animHandler = window.requestAnimationFrame(this.onAnimationFrame);
        }
    }

    stop()
    {
        if (this.animHandler !== 0) {
            this.pulse.stop();
            window.cancelAnimationFrame(this.animHandler);
            this.animHandler = 0;
        }
    }

    attachView(view: RenderView)
    {
        view.next = this;
        this.views.push(view);
    }

    detachView(view: RenderView)
    {
        const index = this.views.indexOf(view);
        if (index < 0) {
            throw new Error("render view not found");
        }
        view.next = null;
        this.views.splice(index, 1);
    }

    onPointer(event: IViewportPointerEvent)
    {
        return this.next ? this.next.onPointer(event) : false;
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        return this.next ? this.next.onTrigger(event) : false;
    }

    protected renderFrame()
    {
        const pulse = this.pulse;
        pulse.advance();

        this.update(pulse);
        this.tick(pulse);

        const module = this.module;
        const sceneComponent = module.components.get(Scene);
        const cameraComponent = module.components.get(Camera);

        if (!sceneComponent || !cameraComponent) {
            console.warn("scene and/or camera component missing");
            return;
        }

        const scene = sceneComponent.scene;
        const camera = cameraComponent.camera;

        if (!scene || !camera) {
            this.stop();
            throw new Error("scene and/or camera missing");
        }

        // this in turn calls preRender() and postRender() for each view and viewport
        this.views.forEach(view => view.render(scene, camera));
    }

    protected onAnimationFrame()
    {
        this.renderFrame();
        this.animHandler = window.requestAnimationFrame(this.onAnimationFrame);
    }
}