/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import System from "@ff/core/ecs/System";
import Component from "@ff/core/ecs/Component";
import Pulse from "@ff/core/ecs/Pulse";

import RenderView, {
    Viewport,
    IViewportManip,
    IViewportPointerEvent,
    IViewportTriggerEvent
} from "./RenderView";

////////////////////////////////////////////////////////////////////////////////

export interface IRenderContext
{
    view: RenderView;
    viewport: Viewport;
    scene: THREE.Scene;
    camera: THREE.Camera;
}

export interface IRenderable extends Component
{
    preRender?: (context: IRenderContext) => void;
    postRender?: (context: IRenderContext) => void;
}

export default class RenderSystem extends System implements IViewportManip
{
    next: IViewportManip;

    protected views: RenderView[] = [];

    protected preRenderList: IRenderable[] = [];
    protected postRenderList: IRenderable[] = [];

    get scene(): THREE.Scene
    {
        return null;
    }

    get camera(): THREE.Camera
    {
        return null;
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

    advance(pulse: Pulse)
    {
        this.update(pulse);
        this.tick(pulse);

        const scene = this.scene;
        const camera = this.camera;

        if (!scene || !camera) {
            return;
        }

        this.views.forEach(view => view.render(scene, camera));
    }

    preRender(context: IRenderContext)
    {
        const renderables = this.preRenderList;
        for (let i = 0, n = renderables.length; i < n; ++i) {
            renderables[i].preRender(context);
        }
    }

    postRender(context: IRenderContext)
    {
        const renderables = this.postRenderList;
        for (let i = 0, n = renderables.length; i < n; ++i) {
            renderables[i].postRender(context);
        }
    }

    onPointer(event: IViewportPointerEvent)
    {
        return this.next ? this.next.onPointer(event) : false;
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        return this.next ? this.next.onTrigger(event) : false;
    }

    protected didAddComponent(component: IRenderable)
    {
        if (component.preRender) {
            this.preRenderList.push(component);
        }
        if (component.postRender) {
            this.postRenderList.push(component);
        }
    }

    protected willRemoveComponent(component: IRenderable)
    {
        let index = this.preRenderList.indexOf(component);
        if (index >= 0) {
            this.preRenderList.splice(index, 1);
        }

        index = this.postRenderList.indexOf(component);
        if (index >= 0) {
            this.postRenderList.splice(index, 1);
        }
    }
}