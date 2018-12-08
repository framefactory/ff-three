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

import RenderSystemView, { Viewport } from "./RenderSystemView";

////////////////////////////////////////////////////////////////////////////////

export interface IRenderContext
{
    view: RenderSystemView;
    viewport: Viewport;
    scene: THREE.Scene;
    camera: THREE.Camera;
}

export interface IRenderable extends Component
{
    preRender?: (context: IRenderContext) => void;
    postRender?: (context: IRenderContext) => void;
}

export default class RenderSystem extends System
{
    protected renderViews: RenderSystemView[] = [];

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

    attachView(view: RenderSystemView)
    {
        this.renderViews.push(view);
    }

    detachView(view: RenderSystemView)
    {
        const index = this.renderViews.indexOf(view);
        if (index < 0) {
            throw new Error("render view not found");
        }
        this.renderViews.splice(index, 1);
    }

    advance(pulse: Pulse)
    {
        this.update(pulse);
        this.tick(pulse);

        const scene = this.scene;
        const camera = this.camera;

        this.renderViews.forEach(renderView => renderView.render(scene, camera));
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