/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import { IManipBaseEvent, IManipPointerEvent, IManipTriggerEvent } from "@ff/browser/ManipTarget";

import UniversalCamera, { EProjection, EViewPreset } from "./UniversalCamera";
import ObjectManipulator from "./ObjectManipulator";

////////////////////////////////////////////////////////////////////////////////

export interface IViewportBaseEvent extends IManipBaseEvent
{
    viewport: Viewport | null;
    deviceX: number;
    deviceY: number;
}

export interface IViewportPointerEvent extends IManipPointerEvent, IViewportBaseEvent { }
export interface IViewportTriggerEvent extends IManipTriggerEvent, IViewportBaseEvent { }

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

    private _canvasWidth: number;
    private _canvasHeight: number;

    private _sceneCamera: THREE.Camera;
    private _vpCamera: UniversalCamera;
    private _manip: ObjectManipulator;
    private _initManip = false;

    constructor(left?: number, top?: number, width?: number, height?: number)
    {
        this.next = null;

        this._relRect = {
            left: left || 0,
            top: top || 0,
            width: width || 1,
            height: height || 1
        };

        this._absRect = {
            left: 0,
            top: 0,
            width: 1,
            height: 1
        };

        this._canvasWidth = 1;
        this._canvasHeight = 1;

        this._sceneCamera = null;
        this._vpCamera = null;
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
        return this._vpCamera || this._sceneCamera;
    }

    get sceneCamera() {
        return this._sceneCamera;
    }

    get viewportCamera() {
        return this._vpCamera;
    }

    get manip() {
        return this._manip;
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

        if (this._manip) {
            this._manip.setViewportSize(width, height);
        }
    }

    setBuiltInCamera(type: EProjection, preset?: EViewPreset)
    {
        if (!this._vpCamera) {
            this._vpCamera = new UniversalCamera(type);
            this._vpCamera.matrixAutoUpdate = false;
        }
        else {
            this._vpCamera.setType(type);
        }

        if (preset !== undefined) {
            this._vpCamera.setPreset(preset);
        }
    }

    unsetBuiltInCamera()
    {
        this._vpCamera = null;
    }

    enableCameraManip(state: boolean): ObjectManipulator
    {
        if (!state && this._manip) {
            this._manip = null;
        }
        else if (state) {
            if (!this._manip) {
                this._manip = new ObjectManipulator();
                this._manip.setViewportSize(this.width, this.height);
            }
            this._initManip = true;
        }

        return this._manip;
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

    updateCamera(sceneCamera?: THREE.Camera): THREE.Camera
    {
        this._sceneCamera = sceneCamera;
        const currentCamera: any = this._vpCamera || sceneCamera;
        if (!currentCamera) {
            return;
        }

        if (this._manip) {
            if (this._initManip) {
                this._initManip = false;
                this._manip.fromCamera(currentCamera);
            }

            this._manip.toCamera(currentCamera);
        }

        const absRect = this._absRect;
        const aspect = absRect.width / absRect.height;

        if (aspect !== currentCamera.userData["aspect"]) {
            currentCamera.userData["aspect"] = aspect;
            if (currentCamera.isUniversalCamera || currentCamera.isPerspectiveCamera) {
                currentCamera.aspect = aspect;
                currentCamera.updateProjectionMatrix();
            }
            else if (currentCamera.isOrthographicCamera) {
                const dy = (currentCamera.top - currentCamera.bottom) * 0.5;
                currentCamera.left = -dy * aspect;
                currentCamera.right = dy * aspect;
                currentCamera.updateProjectionMatrix();
            }
        }

        return currentCamera;
    }

    applyViewport(renderer: THREE.WebGLRenderer)
    {
        const absRect = this._absRect;
        renderer.setViewport(absRect.left, absRect.top, absRect.width, absRect.height);
        renderer["viewport"] = this;
    }

    applyPickViewport(target: THREE.WebGLRenderTarget, event: IViewportBaseEvent)
    {
        const absRect = this._absRect;
        const left = event.localX - absRect.left;
        const top = event.localY - absRect.top;
        target.viewport.set(-left, -absRect.height + top, absRect.width, absRect.height);

        //console.log("Viewport.applyPickViewport - offset: ", -left, -top);
    }

    extendEvent(event: IManipPointerEvent): IViewportPointerEvent;
    extendEvent(event: IManipTriggerEvent): IViewportTriggerEvent;
    extendEvent(event: IManipBaseEvent): IViewportBaseEvent
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
        if (this.enabled && this._manip) {
            return this._manip.onPointer(event);
        }

        return false;
    }

    onTrigger(event: IViewportTriggerEvent)
    {
        if (this.enabled && this._manip) {
            return this._manip.onTrigger(event);
        }

        return false;
    }

    protected updateViewport()
    {
        const relRect = this._relRect;
        const absRect = this._absRect;
        const canvasWidth = this._canvasWidth;
        const canvasHeight = this._canvasHeight;

        absRect.left = Math.round(relRect.left * canvasWidth);
        absRect.top = Math.round(relRect.top * canvasHeight);
        absRect.width = Math.round(relRect.width * canvasWidth);
        absRect.height = Math.round(relRect.height * canvasHeight);
    }
}