/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import math from "@ff/core/math";
import threeMath from "./math";

import {
    EManipPointerEventSource, EManipPointerEventType, EManipTriggerEventType,
    IManip, IManipPointerEvent, IManipTriggerEvent
} from "@ff/browser/ManipTarget";

////////////////////////////////////////////////////////////////////////////////

enum EManipMode { Off, Pan, Orbit, Dolly, Zoom, PanDolly, Roll }
enum EManipPhase { Off, Active, Release }


export default class ObjectManipulator implements IManip
{
    readonly orientation = new THREE.Vector3();
    readonly offset = new THREE.Vector2();
    distance = 50;
    zoom = 1;

    readonly minOrientation = new THREE.Vector3(-90, NaN, NaN);
    readonly maxOrientation = new THREE.Vector3(90, NaN, NaN);
    readonly minOffset = new THREE.Vector2(NaN, NaN);
    readonly maxOffset = new THREE.Vector2(NaN, NaN);

    orientationEnabled = true;
    orthographicMode = false;

    protected mode = EManipMode.Off;
    protected phase = EManipPhase.Off;
    protected prevPinchDist = 0;

    protected deltaX = 0;
    protected deltaY = 0;
    protected deltaPinch = 0;
    protected deltaWheel = 0;

    protected viewportWidth = 100;
    protected viewportHeight = 100;

    private _target: THREE.Object3D = null;
    private _matrix: THREE.Matrix4 = null;

    protected checkLimits()
    {
        const {
            orientation, minOrientation, maxOrientation,
            offset, minOffset, maxOffset
        } = this;

        for (let i = 0; i < 3; ++i) {
            if (!isNaN(minOrientation[i]) && orientation[i] < minOrientation[i]) {
                orientation[i] = minOrientation[i];
            }
            if (!isNaN(maxOrientation[i]) && orientation[i] > maxOrientation[i]) {
                orientation[i] = maxOrientation[i];
            }
        }
        for (let i = 0; i < 2; ++i) {
            if (!isNaN(minOffset[i]) && offset[i] < minOffset[i]) {
                offset[i] = minOffset[i];
            }
            if (!isNaN(maxOffset[i]) && offset[i] > maxOffset[i]) {
                offset[i] = maxOffset[i];
            }
        }
    }


    constructor(target?: THREE.Object3D)
    {
        this.target = target || null;
    }

    set target(target: THREE.Object3D) {
        this._target = target;
        if (target) {
            target.matrixAutoUpdate = false;
            threeMath.decomposeOrbitMatrix(target.matrix, this.orientation, this.offset);
            this._matrix = target.matrix;
        }
        else {
            this._matrix = new THREE.Matrix4();
        }
    }

    get target() {
        return this._target;
    }

    get matrix() {
        return this._target ? this._target.matrix : this._matrix;
    }

    setViewportSize(width: number, height: number)
    {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    update(): boolean
    {
        if (this.phase === EManipPhase.Off && this.deltaWheel === 0) {
            return false;
        }

        if (this.deltaWheel !== 0) {
            this.updatePose(0, 0, this.deltaWheel * 0.07 + 1, 0, 0, 0);
            this.deltaWheel = 0;
            return true;
        }

        if (this.phase === EManipPhase.Active) {
            if (this.deltaX === 0 && this.deltaY === 0 && this.deltaPinch === 1) {
                return false;
            }

            this.updateByMode();
            this.deltaX = 0;
            this.deltaY = 0;
            this.deltaPinch = 1;
            return true;
        }
        else if (this.phase === EManipPhase.Release) {
            this.deltaX *= 0.85;
            this.deltaY *= 0.85;
            this.deltaPinch = 1;
            this.updateByMode();

            const delta = Math.abs(this.deltaX) + Math.abs(this.deltaY) + Math.abs(this.deltaPinch * 100 - 1);
            if (delta < 0.1) {
                this.mode = EManipMode.Off;
                this.phase = EManipPhase.Off;
            }
            return true;
        }
    }

        onPointer(event: IManipPointerEvent)
    {
        if (event.isPrimary) {
            if (event.type === EManipPointerEventType.Down) {
                this.phase = EManipPhase.Active;
            }
            else if (event.type === EManipPointerEventType.Up) {
                this.phase = EManipPhase.Release;
                return true;
            }
        }

        if (event.type === EManipPointerEventType.Down) {
            this.mode = this.getModeFromEvent(event);
        }

        this.deltaX += event.movementX;
        this.deltaY += event.movementY;

        // calculate pinch
        if (event.pointerCount === 2) {
            const positions = event.activePositions;
            const dx = positions[1].clientX - positions[0].clientX;
            const dy = positions[1].clientY - positions[0].clientY;
            const pinchDist = Math.sqrt(dx * dx + dy * dy);

            const prevPinchDist = this.prevPinchDist || pinchDist;
            this.deltaPinch *= prevPinchDist > 0 ? (pinchDist / prevPinchDist) : 1;
            this.prevPinchDist = pinchDist;
        }
        else {
            this.deltaPinch = 1;
            this.prevPinchDist = 0;
        }

        return true;
    }

    onTrigger(event: IManipTriggerEvent)
    {
        if (event.type === EManipTriggerEventType.Wheel) {
            this.deltaWheel += math.limit(event.wheel, -1, 1);
            return true;
        }

        return false;
    }

    protected updateByMode()
    {
        switch(this.mode) {
            case EManipMode.Orbit:
                this.updatePose(0, 0, 0, this.deltaY, this.deltaX, 0);
                break;

            case EManipMode.Pan:
                this.updatePose(this.deltaX, this.deltaY, 0, 0, 0, 0);
                break;

            case EManipMode.Roll:
                this.updatePose(0, 0, 0, 0, 0, this.deltaX);
                break;

            case EManipMode.Dolly:
                this.updatePose(0, 0, this.deltaY * 0.0075 + 1, 0, 0, 0);
                break;

            case EManipMode.PanDolly:
                const pinchScale = (this.deltaPinch - 1) * 0.5 + 1;
                this.updatePose(this.deltaX, this.deltaY, 1 / pinchScale, 0, 0, 0);
                break;
        }
    }

    protected updatePose(dX, dY, dScale, dPitch, dHead, dRoll)
    {
        const orientation = this.orientation;
        const offset = this.offset;

        if (this.orientationEnabled) {
            orientation.x += dPitch * 300 / this.viewportHeight;
            orientation.y += dHead * 300 / this.viewportHeight;
            orientation.z += dRoll * 300 / this.viewportHeight;
        }

        let factor;

        if (this.orthographicMode) {
            factor = this.size = Math.max(this.size, 0.1) * dScale;
        }
        else {
            factor = this.offset.z = Math.max(this.offset.z, 0.1) * dScale;
        }

        offset.x -= dX * factor / this.viewportHeight;
        offset.y += dY * factor / this.viewportHeight;

        if (this._target) {
            threeMath.composeOrbitMatrix(orientation, offset, this._target.matrix);
            this._target.matrixWorldNeedsUpdate = true;
        }
        else {
            threeMath.composeOrbitMatrix(orientation, offset, this._matrix);
        }
    }

    protected getModeFromEvent(event: IManipPointerEvent): EManipMode
    {
        if (event.source === EManipPointerEventSource.Mouse) {
            const button = event.originalEvent.button;

            // left button
            if (button === 0) {
                if (event.ctrlKey) {
                    return EManipMode.Pan;
                }
                if (event.altKey) {
                    return EManipMode.Dolly;
                }

                return EManipMode.Orbit;
            }

            // right button
            if (button === 2) {
                if (event.altKey) {
                    return EManipMode.Roll;
                }
                else {
                    return EManipMode.Pan;
                }
            }

            // middle button
            if (button === 1) {
                return EManipMode.Dolly;
            }
        }
        else if (event.source === EManipPointerEventSource.Touch) {
            const count = event.pointerCount;

            if (count === 1) {
                return EManipMode.Orbit;
            }

            if (count === 2) {
                return EManipMode.PanDolly;
            }

            return EManipMode.Pan;
        }
    }
}