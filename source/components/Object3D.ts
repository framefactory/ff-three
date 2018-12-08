/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import Component, { IComponentEvent } from "@ff/core/ecs/Component";
import Transform from "./Transform";

////////////////////////////////////////////////////////////////////////////////

export interface IObject3DObjectEvent extends IComponentEvent<Object3D>
{
    current: THREE.Object3D;
    next: THREE.Object3D;
}

export interface IObject3DRenderContext
{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
    geometry: THREE.Geometry | THREE.BufferGeometry;
    material: THREE.Material;
    group: THREE.Group;
}

const _renderContext = {
    renderer: null,
    scene: null,
    camera: null,
    geometry: null,
    material: null,
    group: null
};

export default abstract class Object3D extends Component
{
    static readonly type: string = "Object3D";

    protected _transform: Transform = null;
    private _object: THREE.Object3D = null;

    constructor(id?: string)
    {
        super(id);
        this.addEvent("object");
    }

    get transform(): Transform
    {
        return this._transform;
    }

    get object3D(): THREE.Object3D | null
    {
        return this._object;
    }

    set object3D(object: THREE.Object3D)
    {
        if (this._object && this._transform) {
            this._transform.removeObject3D(this._object);
            this._object.onBeforeRender = undefined;
            this._object.onAfterRender = undefined;
        }

        this.emit<IObject3DObjectEvent>("object", { current: this._object, next: object });
        this._object = object;

        if (object) {
            object.matrixAutoUpdate = false;

            if (this.beforeRender) {
                object.onBeforeRender = this._onBeforeRender;
            }
            if (this.afterRender) {
                object.onAfterRender = this._onAfterRender;
            }

            if (this._transform) {
                this._transform.addObject3D(object);
            }
        }
    }

    abstract beforeRender?(context: IObject3DRenderContext);
    abstract afterRender?(context: IObject3DRenderContext);

    create()
    {
        this.trackComponent(Transform, transform => {
            this._transform = transform;
            if (this._object) {
                transform.addObject3D(this._object);
            }
        }, transform => {
            this._transform = null;
            if (this._object) {
                transform.removeObject3D(this._object);
            }
        });
    }

    dispose()
    {
        if (this._object && this._transform) {
            this._transform.removeObject3D(this._object);
        }

        super.dispose();
    }

    toString()
    {
        return super.toString() + (this._object ? ` - type: ${this._object.type}` : " - (null)");
    }

    private _onBeforeRender(
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.Camera,
        geometry: THREE.Geometry | THREE.BufferGeometry,
        material: THREE.Material,
        group: THREE.Group)
    {
        _renderContext.renderer = renderer;
        _renderContext.scene = scene;
        _renderContext.camera = camera;
        _renderContext.geometry = geometry;
        _renderContext.material = material;
        _renderContext.group = group;

        this.beforeRender(_renderContext);
    }

    private _onAfterRender(
        renderer: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.Camera,
        geometry: THREE.Geometry | THREE.BufferGeometry,
        material: THREE.Material,
        group: THREE.Group)
    {
        _renderContext.renderer = renderer;
        _renderContext.scene = scene;
        _renderContext.camera = camera;
        _renderContext.geometry = geometry;
        _renderContext.material = material;
        _renderContext.group = group;

        this.afterRender(_renderContext);
    }
}