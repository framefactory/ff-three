/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import { IManipBaseEvent, IManipPointerEvent, IManipTriggerEvent } from "@ff/browser/ManipTarget";

import UniversalCamera, { EViewPreset, EProjection } from "./UniversalCamera";
import ObjectManipulator from "./ObjectManipulator";

////////////////////////////////////////////////////////////////////////////////

export interface IViewportBaseEvent extends IManipBaseEvent
{
    viewport: Viewport | null;
    deviceX: number;
    deviceY: number;
}

export interface IViewportPointerEvent extends IManipPointerEvent, IViewportBaseEvent
{
}

export interface IViewportTriggerEvent extends IManipTriggerEvent, IViewportBaseEvent
{
}

export interface IViewportManip
{
    onPointer: (event: IViewportPointerEvent) => boolean;
    onTrigger: (event: IViewportTriggerEvent) => boolean;
}

export interface IViewportRect
{
    left: number;
    top: number;
    width: number;
    height: number;
}

export default class Viewport implements IViewportManip
{
    next: IViewportManip = null;
    enabled: boolean = true;

    private _relRect: IViewportRect;
    private _absRect: IViewportRect;
    private _vpAspect: number;

    private _canvasWidth: number;
    private _canvasHeight: number;

    private _camera: UniversalCamera;
    private _manip: ObjectManipulator;

    constructor(canvasWidth: number, canvasHeight: number)
    {
        this.next = null;

        this._relRect = {
            left: 0,
            top: 0,
            width: 1,
            height: 1
        };

        this._absRect = {
            left: 0,
            top: 0,
            width: canvasWidth,
            height: canvasHeight
        };

        this._vpAspect = 0;

        this._canvasWidth = canvasWidth;
        this._canvasHeight = canvasHeight;

        this._camera = null;
        this._manip = null;
    }

    get left() {
        return this._absRect.left;
    }

    get top() {
        return this._absRect.top;
    }

    get width() {
        return this._absRect.width;
    }

    get height() {
        return this._absRect.height;
    }

    get canvasWidth() {
        return this._canvasWidth;
    }

    get canvasHeight() {
        return this._canvasHeight;
    }

    get camera() {
        return this._camera;
    }

    setSize(left?: number, top?: number, width?: number, height?: number)
    {
        const relRect = this._relRect;
        relRect.left = left;
        relRect.top = top;
        relRect.width = width;
        relRect.height = height;

        this.updateViewport();
    }

    setCanvasSize(width: number, height: number)
    {
        this._canvasWidth = width;
        this._canvasHeight = height;

        this.updateViewport();
    }

    setBuiltInCamera(type: EProjection, preset?: EViewPreset)
    {
        if (!this._camera) {
            this._camera = new UniversalCamera(type);
            this._camera.matrixAutoUpdate = false;
            this._camera.setPreset(preset);
        }
    }

    enableCameraControl(state: boolean)
    {
        if (!state && this._manip) {
            this._manip = null;
        }
        else if (state && !this._manip && this._camera) {
            this._manip = new ObjectManipulator(this._camera);
        }
    }

    isPointInside(x: number, y: number): boolean
    {
        const absRect = this._absRect;
        return x >= absRect.left && x < absRect.left + absRect.width
            && y >= absRect.top && y < absRect.top + absRect.height;
    }

    getDevicePoint(x: number, y: number, result?: THREE.Vector2): THREE.Vector2
    {
        const absRect = this._absRect;

        const ndx = ((x - absRect.left) / absRect.width) * 2 - 1;
        const ndy = 1 - ((y - absRect.top) / absRect.height) * 2;

        return result ? result.set(ndx, ndy) : new THREE.Vector2(ndx, ndy);
    }

    getDeviceX(x: number): number
    {
        const absRect = this._absRect;
        return ((x - absRect.left) / absRect.width) * 2 - 1;
    }

    getDeviceY(y: number): number
    {
        const absRect = this._absRect;
        return 1 - ((y - absRect.top) / absRect.height) * 2;
    }

    render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera)
    {
        if (!this.enabled) {
            return;
        }

        const cam: any = this._camera || camera;

        const absRect = this._absRect;
        renderer.setViewport(absRect.left, absRect.top, absRect.width, absRect.height);

        const aspect = this._absRect.width / this._absRect.height;

        if (aspect !== this._vpAspect) {
            this._vpAspect = aspect;
            if (cam.isUniversalCamera || cam.isPerspectiveCamera) {
                cam.aspect = aspect;
                cam.updateProjectionMatrix();
            }
            else if (cam.isOrthographicCamera) {
                const dy = (cam.top - cam.bottom) * 0.5;
                cam.left = -dy * aspect;
                cam.right = dy * aspect;
                cam.updateProjectionMatrix();
            }
        }

        renderer["viewport"] = this;
        renderer.render(scene, camera);
    }

    convertEvent(event: IManipPointerEvent): IViewportPointerEvent;
    convertEvent(event: IManipTriggerEvent): IViewportTriggerEvent;

    convertEvent(event: IManipBaseEvent): IViewportBaseEvent
    {
        const vpEvent = event as IViewportBaseEvent;
        vpEvent.viewport = this;
        vpEvent.deviceX = this.getDeviceX(event.localX);
        vpEvent.deviceY = this.getDeviceY(event.localY);
        return vpEvent;
    }

    hitTestEvent(event: IManipPointerEvent): IViewportPointerEvent | null;
    hitTestEvent(event: IManipTriggerEvent): IViewportTriggerEvent | null;

    hitTestEvent(event: IManipBaseEvent): IViewportBaseEvent | null
    {
        if (!this.enabled || !this.isPointInside(event.localX, event.localY)) {
            return null;
        }
        const vpEvent = event as IViewportTriggerEvent;
        vpEvent.viewport = this;
        vpEvent.deviceX = this.getDeviceX(event.localX);
        vpEvent.deviceY = this.getDeviceY(event.localY);
        return vpEvent;
    }

    onPointer(event: IViewportPointerEvent)
    {
        if (this.enabled && this._manip && this._manip.onPointer(event)) {
            return true;
        }

        return this.next && this.next.onPointer(event);
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        if (this.enabled && this._manip && this._manip.onTrigger(event)) {
            return true;
        }

        return this.next && this.next.onTrigger(event);
    }

    protected updateViewport()
    {
        const relRect = this._relRect;
        const absRect = this._absRect;
        const canvasWidth = this._canvasWidth;
        const canvasHeight = this._canvasHeight;

        absRect.left = relRect.left * canvasWidth;
        absRect.top = relRect.top * canvasHeight;
        absRect.width = relRect.width * canvasWidth;
        absRect.height = relRect.height * canvasHeight;
    }
}