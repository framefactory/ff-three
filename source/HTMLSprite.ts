/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import Viewport from "./Viewport";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _vec3c = new THREE.Vector3();
const _vec3d = new THREE.Vector3();
const _vec2a = new THREE.Vector2();
const _vec2b = new THREE.Vector2();

export enum EQuadrant { TopRight, TopLeft, BottomLeft, BottomRight }


export default class HTMLSprite extends THREE.Object3D
{
    readonly isHTMLSprite = true;

    viewAngle = 0;
    orientationAngle = 0;
    orientationQuadrant: EQuadrant = EQuadrant.TopLeft;

    createHTML(): HTMLElement
    {
        const element = document.createElement("div");
        element.innerText = "HTML Sprite";
        element.classList.add("ff-html-sprite");
        return element;
    }

    updateHTML(element: HTMLElement, viewport: Viewport)
    {
        _vec3a.set(0, 0, 0);
        _vec3a.applyMatrix4(this.modelViewMatrix);

        _vec3b.set(0, 1, 0);
        _vec3b.applyMatrix4(this.modelViewMatrix);

        _vec3c.copy(_vec3b).sub(_vec3a).normalize();
        _vec3d.set(0, 0, 1);

        this.viewAngle = _vec3c.angleTo(_vec3d);

        const camera = viewport.camera;
        _vec3a.applyMatrix4(camera.projectionMatrix);
        _vec3b.applyMatrix4(camera.projectionMatrix);

        _vec2b.set(_vec3b.x, _vec3b.y);
        _vec2a.set(_vec3a.x, _vec3a.y);
        _vec2b.sub(_vec2a);

        const x = viewport.left + (_vec3b.x + 1) * 0.5 * viewport.width;
        const y = viewport.top + (1 - _vec3b.y) * 0.5 * viewport.height;

        element.style.left = x.toString() + "px";
        element.style.top = y.toString() + "px";

        const angle = this.orientationAngle = _vec2b.angle();
        this.orientationQuadrant = Math.floor(2 * angle / Math.PI);
    }
}