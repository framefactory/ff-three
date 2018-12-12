/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

////////////////////////////////////////////////////////////////////////////////

const _halfPi = Math.PI * 0.5;

const _cameraOrientation = [
    new THREE.Vector3(0, -_halfPi, 0), // left
    new THREE.Vector3(0, _halfPi, 0),  // right
    new THREE.Vector3(_halfPi, 0, 0),  // top
    new THREE.Vector3(-_halfPi, 0, 0), // bottom
    new THREE.Vector3(0, 0, 0),        // front
    new THREE.Vector3(0, 0, Math.PI),  // back
];

export enum EProjection { Perspective, Orthographic }
export enum EViewPreset { None = -1, Left, Right, Top, Bottom, Front, Back }

export default class UniversalCamera extends THREE.Camera
{
    type: string;
    isPerspectiveCamera: boolean;
    isOrthographicCamera: boolean;
    isUniversalCamera = true;

    fov = 50;
    size = 20;
    aspect = 1;
    zoom = 1;
    near = 0.1;
    far = 2000;

    // additional perspective parameters
    focus = 10;
    filmGauge = 35;
    filmOffset = 0;

    constructor(type?: EProjection)
    {
        super();
        this.setType(type);
    }

    setType(type: EProjection)
    {
        if (type === EProjection.Orthographic) {
            this.type = "OrthographicCamera";
            this.isPerspectiveCamera = false;
            this.isOrthographicCamera = true;
        }
        else {
            this.type = "PerspectiveCamera";
            this.isPerspectiveCamera = true;
            this.isOrthographicCamera = false;
        }

        this.updateProjectionMatrix();
    }

    getType()
    {
        return this.isOrthographicCamera ? EProjection.Orthographic : EProjection.Perspective;
    }

    setPreset(preset: EViewPreset)
    {
        if (preset !== EViewPreset.None) {
            this.rotation.setFromVector3(_cameraOrientation[preset], "XYZ");
            this.updateMatrix();
        }
    }

    setFocalLength(focalLength: number)
    {
        const vExtentSlope = 0.5 * this.getFilmHeight() / focalLength;
        this.fov = THREE.Math.RAD2DEG * 2 * Math.atan(vExtentSlope);
        this.updateProjectionMatrix();
    }

    getFocalLength()
    {
        const vExtentSlope = Math.tan(THREE.Math.DEG2RAD * 0.5 * this.fov);
        return 0.5 * this.getFilmHeight() / vExtentSlope;
    }

    getEffectiveFOV()
    {
        return THREE.Math.RAD2DEG * 2 * Math.atan(
            Math.tan(THREE.Math.DEG2RAD * 0.5 * this.fov) / this.zoom);
    }

    getFilmWidth()
    {
        return this.filmGauge * Math.min(this.aspect, 1);
    }

    getFilmHeight()
    {
        return this.filmGauge / Math.max(this.aspect, 1);
    }

    updateProjectionMatrix()
    {
        if (this.isOrthographicCamera) {
            const dy = this.size / (2 * this.zoom);
            const dx = dy * this.aspect;

            this.projectionMatrix.makeOrthographic(-dx, dx, dy, -dy, this.near, this.far);
        }
        else {
            const dy = this.near * Math.tan(THREE.Math.DEG2RAD * 0.5 * this.fov) / this.zoom;
            const dx = dy * this.aspect;

            // var skew = this.filmOffset;
            // if (skew !== 0) {
            //     left += near * skew / this.getFilmWidth();
            // }

            this.projectionMatrix.makePerspective(-dx, dx, dy, -dy, this.near, this.far);
        }

        (this as any).projectionMatrixInverse.getInverse(this.projectionMatrix);
    }

    copy(source: this, recursive: boolean)
    {
        super.copy(source, recursive);

        this.type = source.type;
        this.isOrthographicCamera = source.isOrthographicCamera;
        this.isPerspectiveCamera = source.isPerspectiveCamera;

        this.fov = source.fov;
        this.size = source.size;
        this.aspect = source.aspect;
        this.zoom = source.zoom;
        this.near = source.near;
        this.far = source.far;

        this.focus = source.focus;
        this.filmGauge = source.filmGauge;
        this.filmOffset = source.filmOffset;

        return this;
    }

    clone(): this
    {
        return new (this.constructor as any)().copy(this);
    }

    toJSON(meta)
    {
        const data = super.toJSON(meta);

        data.object.fov = this.fov;
        data.object.size = this.size;
        data.object.aspect = this.aspect;
        data.object.zoom = this.zoom;
        data.object.near = this.near;
        data.object.far = this.far;

        data.object.focus = this.focus;
        data.object.filmGauge = this.filmGauge;
        data.object.filmOffset = this.filmOffset;

        return data;
    }
}