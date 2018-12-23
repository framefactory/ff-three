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
    PointerEventSource,
    IManip,
    IPointerEvent,
    ITriggerEvent
} from "@ff/browser/ManipTarget";

////////////////////////////////////////////////////////////////////////////////

enum EManipMode { Off, Pan, Orbit, Dolly, Zoom, PanDolly, Roll }
enum EManipPhase { Off, Active, Release }

export interface IManipPattern
{
    mode: EManipMode;
    source: PointerEventSource;
    mouseButton?: number;
    touchCount?: number;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
}

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();

const _defaultPattern: IManipPattern[] = [
    { source: "mouse", mode: EManipMode.Pan, mouseButton: 0, shiftKey: true },
    { source: "mouse", mode: EManipMode.Dolly, mouseButton: 0, ctrlKey: true },
    { source: "mouse", mode: EManipMode.Orbit, mouseButton: 0 },
    { source: "mouse", mode: EManipMode.Pan, mouseButton: 2 },
    { source: "mouse", mode: EManipMode.Dolly, mouseButton: 1 },
    { source: "touch", mode: EManipMode.Orbit, touchCount: 1 },
    { source: "touch", mode: EManipMode.PanDolly, touchCount: 2 },
    { source: "touch", mode: EManipMode.Pan, touchCount: 3 },
];

const _limit = (val, min, max) => !isNaN(min) && val < min ? min : (!isNaN(max) && val > max ? max : val);


export default class ObjectManipulator implements IManip
{
    orientation = [ 0, 0, 0 ];
    offset = [ 0, 0, 50 ];
    size = 50;
    zoom = 1;

    minOrientation = [ -90, NaN, NaN ];
    maxOrientation = [ 90, NaN, NaN ];
    minOffset = [ NaN, NaN, 0.1 ];
    maxOffset = [ NaN, NaN, 100 ];

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

    onPointer(event: IPointerEvent)
    {
        if (event.isPrimary) {
            if (event.type === "pointer-down") {
                this.phase = EManipPhase.Active;
            }
            else if (event.type === "pointer-up") {
                this.phase = EManipPhase.Release;
                return true;
            }
        }

        if (event.type === "pointer-down") {
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

    onTrigger(event: ITriggerEvent)
    {
        if (event.type === "wheel") {
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

    setFromCamera(camera: THREE.Camera)
    {
        threeMath.decomposeOrbitMatrix(camera.matrix, _vec3a, _vec3b);
        _vec3a.multiplyScalar(math.RAD2DEG).toArray(this.orientation);
        _vec3b.toArray(this.offset);

        const cam = camera as any;

        if ((this.orthographicMode = cam.isOrthographicCamera)) {
            this.size = cam.isUniversalCamera ? cam.size : cam.top - cam.bottom;
        }
    }

    setFromObject(object: THREE.Object3D)
    {
        threeMath.decomposeOrbitMatrix(object.matrix, _vec3a, _vec3b);
        _vec3a.multiplyScalar(math.RAD2DEG).toArray(this.orientation);
        _vec3b.toArray(this.offset);

        this.orthographicMode = false;
    }

    setFromMatrix(matrix: THREE.Matrix4, invert: boolean = false)
    {
        threeMath.decomposeOrbitMatrix(matrix, _vec3a, _vec3b);
        _vec3a.multiplyScalar(math.RAD2DEG).toArray(this.orientation);
        _vec3b.toArray(this.offset);

        this.orthographicMode = false;
    }

    /**
     * Updates the manipulator. If its state has changed, updates the transform matrix of
     * the given camera. If the camera is orthographic, its size parameter is updated as well.
     * @param camera
     */
    toCamera(camera: THREE.Camera)
    {
        _vec3a.fromArray(this.orientation).multiplyScalar(math.DEG2RAD);
        _vec3b.fromArray(this.offset);
        threeMath.composeOrbitMatrix(_vec3a, _vec3b, camera.matrix);
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

    /**
     * Sets the given object's matrix from the manipulator's current orientation and offset.
     * @param object
     */
    toObject(object: THREE.Object3D)
    {
        _vec3a.fromArray(this.orientation).multiplyScalar(math.DEG2RAD);
        _vec3b.fromArray(this.offset);
        threeMath.composeOrbitMatrix(_vec3a, _vec3b, object.matrix);
        object.matrixWorldNeedsUpdate = true;
    }

    /**
     * Sets the given matrix from the manipulator's current orientation and offset.
     * @param matrix
     */
    toMatrix(matrix: THREE.Matrix4)
    {
        _vec3a.fromArray(this.orientation).multiplyScalar(math.DEG2RAD);
        _vec3b.fromArray(this.offset);
        threeMath.composeOrbitMatrix(_vec3a, _vec3b, matrix);
    }

    /**
     * Updates the manipulator.
     * @returns true if the state has changed during the update.
     */
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
            orientation[0] += inverse * dPitch * 300 / this.viewportHeight;
            orientation[1] += inverse * dHead * 300 / this.viewportHeight;
            orientation[2] += inverse * dRoll * 300 / this.viewportHeight;

            // check limits
            orientation[0] = _limit(orientation[0], minOrientation[0], maxOrientation[0]);
            orientation[1] = _limit(orientation[1], minOrientation[1], maxOrientation[1]);
            orientation[2] = _limit(orientation[2], minOrientation[2], maxOrientation[2]);
        }

        if (this.offsetEnabled) {
            let factor;

            if (this.orthographicMode) {
                factor = this.size = dScale * this.size;
                offset[2] = maxOffset[2];
            } else {
                factor = offset[2] = dScale * offset[2];
            }

            offset[0] += dX * factor * inverse * 2 / this.viewportHeight;
            offset[1] -= dY * factor * inverse * 2 / this.viewportHeight;

            // check limits
            offset[0] = _limit(offset[0], minOffset[0], maxOffset[0]);
            offset[1] = _limit(offset[1], minOffset[1], maxOffset[1]);

            if (this.orthographicMode) {
                this.size = _limit(this.size, minOffset[2], maxOffset[2]);
            }
            else {
                offset[2] = _limit(offset[2], minOffset[2], maxOffset[2]);
            }
        }
    }

    protected getModeFromEvent(event: IPointerEvent): EManipMode
    {
        if (event.source === "mouse") {
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
        else if (event.source === "touch") {
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