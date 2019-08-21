/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

////////////////////////////////////////////////////////////////////////////////

const _vec3a = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _vec3c = new THREE.Vector3();
const _vec3d = new THREE.Vector3();
const _vec2a = new THREE.Vector2();
const _vec2b = new THREE.Vector2();

export enum EQuadrant { TopRight, TopLeft, BottomLeft, BottomRight }

/**
 * A Three.js Object representing a 3D renderable part and a 2D (HTML) part.
 * HTML sprites should have a [[HTMLSpriteGroup]] as their parent.
 */
export default class HTMLSprite extends THREE.Object3D
{
    readonly isHTMLSprite = true;

    viewAngle = 0;
    orientationAngle = 0;
    orientationQuadrant: EQuadrant = EQuadrant.TopLeft;

    private _elements = new Map<HTMLElement, HTMLElement>();
    private _visible = true;

    constructor()
    {
        super();
        this.frustumCulled = false;
    }

    get visible() {
        return this._visible;
    }
    set visible(visible: boolean) {
        if (visible !== this._visible && this._elements) {
            this._visible = visible;
            this._elements.forEach(element => {
                if (element) {
                    this.setHTMLElementVisible(element, visible)
                }
            });
        }
    }

    dispose()
    {
        this._elements.forEach((element, container) => {
            if (element) {
                container.removeChild(element);
            }
        });

        this._elements.clear();
    }

    disposeHTMLElement(container: HTMLElement)
    {
        const element = this._elements.get(container);

        if (element) {
            this._elements.delete(container);
            container.removeChild(element);
        }
    }

    /**
     * Called when the 3D parts of the sprite should be updated because
     * the underlying data has been changed.
     */
    update()
    {
        this._elements.forEach(element => {
            if (element) {
                this.updateHTMLElement(element)
            }
        });
    }

    /**
     * Called when the model-view of the sprite has changed.
     * This updates the position and orientation of the HTML element.
     * @param container
     * @param camera
     * @param anchor
     * @param offset
     */
    renderHTMLElement(container: HTMLElement, camera: THREE.Camera, anchor?: THREE.Object3D, offset?: THREE.Vector3): HTMLElement | null
    {
        anchor = anchor || this;

        let element = this._elements.get(container);

        if (!element) {
            element = this.createHTMLElement();
            if (element) {
                container.appendChild(element);
                this._elements.set(container, element);
            }
        }

        if (!element) {
            return null;
        }

        _vec3a.set(0, 0, 0);
        _vec3a.applyMatrix4(anchor.modelViewMatrix);

        offset ? _vec3b.copy(offset) : _vec3b.set(0, 1, 0);
        _vec3b.applyMatrix4(anchor.modelViewMatrix);

        _vec3c.copy(_vec3b).sub(_vec3a).normalize();
        _vec3d.set(0, 0, 1);

        this.viewAngle = _vec3c.angleTo(_vec3d);

        _vec3a.applyMatrix4(camera.projectionMatrix);
        _vec3b.applyMatrix4(camera.projectionMatrix);

        _vec2b.set(_vec3b.x, _vec3b.y);
        _vec2a.set(_vec3a.x, _vec3a.y);
        _vec2b.sub(_vec2a);

        const x = (_vec3b.x + 1) * 0.5 * container.clientWidth;
        const y = (1 - _vec3b.y) * 0.5 * container.clientHeight;

        element.style.left = x.toString() + "px";
        element.style.top = y.toString() + "px";

        const angle = this.orientationAngle = _vec2b.angle();
        this.orientationQuadrant = Math.floor(2 * angle / Math.PI);

        return element;
    }

    /**
     * Called when the sprite becomes visible in a viewport.
     * Returns a HTML element to visualize the 2D part of the sprite in the viewport.
     */
    protected createHTMLElement(): HTMLElement
    {
        return null;
    }

    /**
     * Called when the HTML parts of the sprite should be updated because
     * the underlying data has been changed. This is called once for each viewport
     * the sprite is represented in with a HTML element.
     * @param element The HTML element that should be updated.
     */
    protected updateHTMLElement(element: HTMLElement)
    {
    }

    /**
     * Called when the visibility of the sprite changes.
     * @param element The HTML element whose visibility should be changed.
     * @param visible true if the sprite is currently visible.
     */
    protected setHTMLElementVisible(element: HTMLElement, visible: boolean)
    {
        element.style.display = visible ? "block" : "none";
    }
}
