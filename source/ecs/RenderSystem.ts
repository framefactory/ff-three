/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import {
    Component,
    System,
    Registry,
    Pulse
} from "@ff/core/ecs";

import RenderView, {
    Viewport,
    IViewPointerEvent,
    IViewTriggerEvent
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

export interface IManipTarget extends Component
{
    onPointer?: (event: IViewPointerEvent) => boolean;
    onTrigger?: (event: IViewTriggerEvent) => boolean;
}

export default class RenderSystem extends System
{
    protected pulse: Pulse;
    protected animHandler: number;
    protected views: RenderView[];
    protected manipTargets: Set<IManipTarget>;


    constructor(registry?: Registry)
    {
        super(registry);

        this.onAnimationFrame = this.onAnimationFrame.bind(this);

        this.pulse = new Pulse();
        this.animHandler = 0;
        this.views = [];
        this.manipTargets = new Set();
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
        this.views.push(view);
        console.log("RenderSystem.attachView - total views: %s", this.views.length);
    }

    detachView(view: RenderView)
    {
        const index = this.views.indexOf(view);
        if (index < 0) {
            throw new Error("render view not found");
        }
        this.views.splice(index, 1);
        console.log("RenderSystem.detachView - total views: %s", this.views.length);
    }

    onPointer(event: IViewPointerEvent)
    {
        // console.log("RenderSystem.onPointer - %s%s (%s, %s)",
        //     event.isPrimary ? "primary " : "",
        //     EManipPointerEventType[event.type],
        //     event.deviceX, event.deviceY);

        let handled = false;
        this.manipTargets.forEach(target => {
            if (target.onPointer && target.onPointer(event)) {
                handled = true;
            }
        });

        return handled;
    }

    onTrigger(event: IViewTriggerEvent)
    {
        // console.log("RenderSystem.onTrigger - %s", EManipTriggerEventType[event.type]);

        let handled = false;
        this.manipTargets.forEach(target => {
            if (target.onTrigger && target.onTrigger(event)) {
                handled = true;
            }
        });

        return handled;
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

    protected componentAdded(component: Component): void
    {
        super.componentAdded(component);

        const manipTarget = component as IManipTarget;
        if (manipTarget.onPointer || manipTarget.onTrigger) {
            this.manipTargets.add(manipTarget);
        }
    }

    protected componentRemoved(component: Component): void
    {
        super.componentRemoved(component);

        const manipTarget = component as IManipTarget;
        if (manipTarget.onPointer || manipTarget.onTrigger) {
            this.manipTargets.delete(manipTarget);
        }
    }
}