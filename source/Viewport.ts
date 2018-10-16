/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import { IManipPointerEvent, IManipTriggerEvent } from "@ff/react/ManipTarget";

////////////////////////////////////////////////////////////////////////////////

export interface IViewportPointerEvent extends IManipPointerEvent
{
    viewport: Viewport | null;
    deviceX: number;
    deviceY: number;
}

export interface IViewportTriggerEvent extends IManipTriggerEvent
{
    viewport: Viewport | null;
    deviceX: number;
    deviceY: number;
}

export default class Viewport
{
    left: number;
    top: number;
    width: number;
    height: number;

    canvasWidth: number;
    canvasHeight: number;

    private _vp: {
        x: number;
        y: number;
        w: number;
        h: number;
    };

    constructor(left?: number, top?: number, width?: number, height?: number)
    {
        this.left = left || 0;
        this.top = top || 0;
        this.width = width !== undefined ? width : 1;
        this.height = height !== undefined ? height : 1;

        this.canvasWidth = 1;
        this.canvasHeight = 1;

        this._vp = { x: 0, y: 0, w: 1, h: 1};
    }

    isPointInside(x: number, y: number): boolean
    {
        const vp = this._vp;
        return x >= vp.x && x < vp.x + vp.w
            && y >= vp.y && y < vp.y + vp.h;
    }

    getDevicPoint(x: number, y: number, result?: THREE.Vector2): THREE.Vector2
    {
        const vp = this._vp;

        const ndx = ((x - vp.x) / vp.w) * 2 - 1;
        const ndy = 1 - ((y - vp.y) / vp.h) * 2;

        return result ? result.set(ndx, ndy) : new THREE.Vector2(ndx, ndy);
    }

    getDeviceX(x: number): number
    {
        const vp = this._vp;
        return ((x - vp.x) / vp.w) * 2 - 1;
    }

    getDeviceY(y: number): number
    {
        const vp = this._vp;
        return 1 - ((y - vp.y) / vp.h) * 2;
    }

    setCanvasSize(width: number, height: number)
    {
        this.canvasWidth = width;
        this.canvasHeight = height;

        this.updateViewport();
    }

    protected updateViewport()
    {
        const vp = this._vp;
        vp._x = this.left * this.canvasWidth;
        vp._y = this.top * this.canvasHeight;
        vp.w = this.width * this.canvasWidth;
        vp.h = this.height * this.canvasHeight;
    }
}