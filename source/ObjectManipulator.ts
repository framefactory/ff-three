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
    EManipPointerEventSource,
    EManipPointerEventType,
    EManipTriggerEventType,
    IManip,
    IManipPointerEvent,
    IManipTriggerEvent
} from "@ff/browser/ManipTarget";

////////////////////////////////////////////////////////////////////////////////

enum EManipMode { Off, Pan, Orbit, Dolly, Zoom, PanDolly, Roll }
enum EManipPhase { Off, Active, Release }

export interface IManipPattern
{
    mode: EManipMode;
    source: EManipPointerEventSource;
    mouseButton?: number;
    touchCount?: number;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
}

const _vec3 = new THREE.Vector3();
const _vec3a = new THREE.Vector3();

const _defaultPattern: IManipPattern[] = [
    { source: EManipPointerEventSource.Mouse, mode: EManipMode.Pan, mouseButton: 0, shiftKey: true },
    { source: EManipPointerEventSource.Mouse, mode: EManipMode.Dolly, mouseButton: 0, ctrlKey: true },
    { source: EManipPointerEventSource.Mouse, mode: EManipMode.Orbit, mouseButton: 0 },
    { source: EManipPointerEventSource.Mouse, mode: EManipMode.Pan, mouseButton: 2 },
    { source: EManipPointerEventSource.Mouse, mode: EManipMode.Dolly, mouseButton: 1 },
    { source: EManipPointerEventSource.Touch, mode: EManipMode.Orbit, touchCount: 1 },
    { source: EManipPointerEventSource.Touch, mode: EManipMode.PanDolly, touchCount: 2 },
    { source: EManipPointerEventSource.Touch, mode: EManipMode.Pan, touchCount: 3 },
];

const _limit = (val, min, max) => !isNaN(min) && val < min ? min : (!isNaN(max) && val > max ? max : val);


export default class ObjectManipulator implements IManip
{
    readonly orientation = new THREE.Vector3(0, 0, 0);
    readonly offset = new THREE.Vector3(0, 0, 50);
    size = 50;
    zoom = 1;

    readonly minOrientation = [ -90, NaN, NaN ];
    readonly maxOrientation = [ 90, NaN, NaN ];
    readonly minOffset = [ NaN, NaN, 0.1 ];
    readonly maxOffset = [ NaN, NaN, 100 ];

    orientationEnabled = true;
    offsetEnabled = true;
    cameraMode = true;
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

    constructor()
    {
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

    setViewportSize(width: number, height: number)
    {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }

    fromCamera(camera: THREE.Camera)
    {
        threeMath.decomposeOrbitMatrix(camera.matrix, this.orientation, this.offset);
        this.orientation.multiplyScalar(math.RAD2DEG);

        const cam = camera as any;

        if ((this.orthographicMode = cam.isOrthographicCamera)) {
            this.size = cam.isUniversalCamera ? cam.size : cam.top - cam.bottom;
        }
    }

    toCamera(camera: THREE.Camera): boolean
    {
        if (!this.update()) {
            return false;
        }

        _vec3.copy(this.orientation).multiplyScalar(math.DEG2RAD);
        threeMath.composeOrbitMatrix(_vec3, this.offset, camera.matrix);
        camera.matrixWorldNeedsUpdate = true;

        const cam = camera as any;
        if (cam.isOrthographicCamera) {
            if (cam.isUniversalCamera) {
                cam.size = this.size;
            }
            else {
                const aspect = camera.userData["aspect"] || 1;
                const halfSize = this.size * 0.5;
                cam.left = -halfSize * aspect;
                cam.right = halfSize * aspect;
                cam.bottom = -halfSize;
                cam.top = halfSize;
            }
            cam.updateProjectionMatrix();
        }
    }

    fromObject(object: THREE.Object3D)
    {
        threeMath.decomposeOrbitMatrix(object.matrix, this.orientation, this.offset);
        this.orientation.multiplyScalar(math.RAD2DEG);
        this.orthographicMode = false;
    }

    toObject(object: THREE.Object3D): boolean
    {
        if (!this.update()) {
            return false;
        }

        _vec3.copy(this.orientation).multiplyScalar(math.DEG2RAD);
        threeMath.composeOrbitMatrix(_vec3, this.offset, object.matrix);
    }

    fromMatrix(matrix: THREE.Matrix4, invert: boolean = false)
    {
        threeMath.decomposeOrbitMatrix(matrix, this.orientation, this.offset);
        this.orientation.multiplyScalar(math.RAD2DEG);
        this.orthographicMode = false;
    }

    toMatrix(matrix: THREE.Matrix4, invert: boolean = false): boolean
    {
        if (!this.update()) {
            return false;
        }

        _vec3.copy(this.orientation).multiplyScalar(math.DEG2RAD);
        threeMath.composeOrbitMatrix(_vec3, this.offset, matrix);
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

            const delta = Math.abs(this.deltaX) + Math.abs(this.deltaY);
            if (delta < 0.1) {
                this.mode = EManipMode.Off;
                this.phase = EManipPhase.Off;
            }
            return true;
        }
    }

    protected updateByMode()
    {
        switch(this.mode) {
            case EManipMode.Orbit:
                this.updatePose(0, 0, 1, this.deltaY, this.deltaX, 0);
                break;

            case EManipMode.Pan:
                this.updatePose(this.deltaX, this.deltaY, 1, 0, 0, 0);
                break;

            case EManipMode.Roll:
                this.updatePose(0, 0, 1, 0, 0, this.deltaX);
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
        const {
            orientation, minOrientation, maxOrientation,
            offset, minOffset, maxOffset
        } = this;

        let inverse = this.cameraMode ? -1 : 1;

        if (this.orientationEnabled) {
            orientation.x += inverse * dPitch * 300 / this.viewportHeight;
            orientation.y += inverse * dHead * 300 / this.viewportHeight;
            orientation.z += inverse * dRoll * 300 / this.viewportHeight;

            // check limits
            orientation.x = _limit(orientation.x, minOrientation[0], maxOrientation[0]);
            orientation.y = _limit(orientation.y, minOrientation[1], maxOrientation[1]);
            orientation.z = _limit(orientation.z, minOrientation[2], maxOrientation[2]);
        }

        let factor;

        if (this.orthographicMode) {
            factor = this.size = dScale * this.size;
        } else {
            factor = offset.z = dScale * offset.z;
        }

        offset.x += dX * factor * inverse * 2 / this.viewportHeight;
        offset.y -= dY * factor * inverse * 2 / this.viewportHeight;

        // check limits
        offset.x = _limit(offset.x, minOffset[0], maxOffset[0]);
        offset.y = _limit(offset.y, minOffset[1], maxOffset[1]);

        if (this.orthographicMode) {
            this.size = _limit(this.size, minOffset[2], maxOffset[2]);
        }
        else {
            offset.z = _limit(offset.z, minOffset[2], maxOffset[2]);
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