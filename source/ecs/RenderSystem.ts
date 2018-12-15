/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import { Dictionary } from "@ff/core/types";

import {
    Component,
    IComponentTypeEvent,
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

let _nextObjectIndex = 1;

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
    protected objects: Dictionary<THREE.Object3D>;

    protected manipTargets: Set<IManipTarget>;

    protected _activeSceneComponent: Scene;
    protected _activeCameraComponent: Camera;


    constructor(registry?: Registry)
    {
        super(registry);

        this.onAnimationFrame = this.onAnimationFrame.bind(this);

        this.pulse = new Pulse();
        this.animHandler = 0;
        this.views = [];
        this.objects = {};

        this.manipTargets = new Set();

        this._activeSceneComponent = null;
        this._activeCameraComponent = null;

        this.addComponentTypeListener(Scene, this.onSceneComponent, this);
        this.addComponentTypeListener(Camera, this.onCameraComponent, this);
    }

    get activeSceneComponent() {
        return this._activeSceneComponent;
    }

    get activeCameraComponent() {
        return this._activeCameraComponent;
    }

    get activeScene(): THREE.Scene {
        return this._activeSceneComponent ? this._activeSceneComponent.scene : null;
    }

    get activeCamera(): THREE.Camera {
        return this._activeCameraComponent ? this._activeCameraComponent.camera : null;
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
        //console.log("RenderSystem.attachView - total views: %s", this.views.length);
    }

    detachView(view: RenderView)
    {
        const index = this.views.indexOf(view);
        if (index < 0) {
            throw new Error("render view not found");
        }
        this.views.splice(index, 1);
        //console.log("RenderSystem.detachView - total views: %s", this.views.length);
    }

    addObject3D(object: THREE.Object3D)
    {
        const index = _nextObjectIndex++;
        object.userData["index"] = index;
        this.objects[index] = object;
    }

    removeObject3D(object: THREE.Object3D)
    {
        const index = object.userData["index"];
        delete this.objects[index];
    }

    getObjectByIndex(index: number): THREE.Object3D
    {
        return this.objects[index];
    }

    onPointer(event: IViewPointerEvent)
    {
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
        //console.log("RenderSystem.onTrigger - %s", EManipTriggerEventType[event.type]);

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

        // this in turn calls preRender() and postRender() for each view and viewport
        this.views.forEach(view => view.render());
    }

    protected onAnimationFrame()
    {
        this.renderFrame();
        this.animHandler = window.requestAnimationFrame(this.onAnimationFrame);
    }

    protected onCameraComponent(event: IComponentTypeEvent<Camera>)
    {
        if (event.add && !this._activeCameraComponent) {
            this._activeCameraComponent = event.component;
        }
        else if (event.remove && this._activeCameraComponent === event.component) {
            this._activeCameraComponent = null;
        }
    }

    protected onSceneComponent(event: IComponentTypeEvent<Scene>)
    {
        if (event.add && !this._activeSceneComponent) {
            this._activeSceneComponent = event.component;
        }
        else if (event.remove && this._activeSceneComponent === event.component) {
            this._activeSceneComponent = null;
        }
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