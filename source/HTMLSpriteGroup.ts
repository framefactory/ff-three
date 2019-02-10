/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import HTMLSprite from "./HTMLSprite";

////////////////////////////////////////////////////////////////////////////////

export { HTMLSprite };


export default class HTMLSpriteGroup extends THREE.Object3D
{
    readonly isHTMLSpriteGroup = true;

    private _visible = true;

    get visible() {
        return this._visible;
    }
    set visible(visible: boolean) {
        if (visible !== this._visible) {
            this._visible = visible;

            const children = this.children as HTMLSprite[];
            for (let i = 0, n = children.length; i < n; ++i) {
                children[i].visible = visible;
            }
        }
    }

    dispose()
    {
        const children = this.children as HTMLSprite[];
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].dispose();
        }
    }

    disposeHTMLContainer(container: HTMLElement)
    {
        const children = this.children as HTMLSprite[];
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].disposeHTMLElement(container);
        }
    }

    render(container: HTMLElement, camera: THREE.Camera)
    {
        if (!this.visible) {
            return;
        }

        const children = this.children as HTMLSprite[];
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].renderHTMLElement(container, camera);
        }
    }

    update()
    {
        const children = this.children as HTMLSprite[];
        for (let i = 0, n = children.length; i < n; ++i) {
            children[i].update();
        }
    }
}