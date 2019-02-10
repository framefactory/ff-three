/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

import { Dictionary } from "@ff/core/types";

import Viewport, { IViewportDisposeEvent } from "./Viewport";
import HTMLSprite from "./HTMLSprite";

////////////////////////////////////////////////////////////////////////////////

export { HTMLSprite };


export default class HTMLSpriteGroup extends THREE.Object3D
{
    readonly isHTMLSpriteGroup = true;

    protected viewports = new Map<Viewport, Dictionary<HTMLElement>>();
    private _visible = true;

    get visible() {
        return this._visible;
    }
    set visible(visible: boolean) {
        if (visible !== this._visible && this.viewports) {
            this._visible = visible;

            const children = this.children;
            this.viewports.forEach((elements, viewport) => {
                for (let i = 0, n = children.length; i < n; ++i) {
                    const sprite = children[i] as HTMLSprite;
                    const element = elements[sprite.uuid] as HTMLElement;
                    if (element) {
                        element.style.display = visible ? "block" : "none";
                    }
                }
            });
        }
    }

    dispose()
    {
        const children = this.children;
        this.viewports.forEach((elements, viewport) => {
            for (let i = 0, n = children.length; i < n; ++i) {
                const sprite = children[i] as HTMLSprite;
                const element = elements[sprite.uuid] as HTMLElement;
                if (element) {
                    viewport.overlay.removeChild(element);
                }
            }
        })
    }

    render(viewport: Viewport, camera: THREE.Camera)
    {
        if (!viewport.overlay) {
            console.warn("viewport missing overlay element");
            return;
        }

        if (!this.visible) {
            return;
        }

        const elements = this.viewports.get(viewport) || this.registerViewport(viewport);
        const children = this.children;

        for (let i = 0, n = children.length; i < n; ++i) {
            const sprite = children[i] as HTMLSprite;
            const element = elements[sprite.uuid] as HTMLElement;
            if (element) {
                sprite.renderHTMLElement(element, viewport, camera);
            }
        }
    }

    update(sprite: HTMLSprite)
    {
        sprite.update();

        this.viewports.forEach((elements, viewport) => {
            const element = elements[sprite.uuid];
            if (element) {
                sprite.updateHTMLElement(element, viewport);
            }
        });
    }

    add(sprite: HTMLSprite)
    {
        this.viewports.forEach((elements, viewport) => {
            const element = sprite.createHTMLElement();
            if (element) {
                elements[sprite.uuid] = element;
                viewport.overlay.appendChild(element);
            }
        });

        return super.add(sprite);
    }

    remove(sprite: HTMLSprite)
    {
        this.viewports.forEach((elements, viewport) => {
            const element = elements[sprite.uuid];
            if (element) {
                viewport.overlay.removeChild(element);
                elements[sprite.uuid] = undefined;
            }
        });

        return super.remove(sprite);
    }

    protected registerViewport(viewport: Viewport): Dictionary<HTMLElement>
    {
        const elements = {};
        this.viewports.set(viewport, elements);

        const children = this.children;
        for (let i = 0, n = children.length; i < n; ++i) {
            const sprite = children[i] as HTMLSprite;
            const element = sprite.createHTMLElement();
            if (element) {
                elements[sprite.uuid] = element;
                viewport.overlay.appendChild(element);
            }
        }

        viewport.on<IViewportDisposeEvent>("dispose", this.onViewportDispose, this);

        return elements;
    }

    protected onViewportDispose(event: IViewportDisposeEvent)
    {
        const overlay = event.viewport.overlay;
        const elements  = this.viewports.get(event.viewport);
        const children = this.children;

        for (let i = 0, n = children.length; i < n; ++i) {
            const sprite = children[i] as HTMLSprite;
            overlay.removeChild(elements[sprite.uuid]);
        }

        this.viewports.delete(event.viewport);
    }
}