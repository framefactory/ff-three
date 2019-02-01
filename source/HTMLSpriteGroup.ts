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

    dispose()
    {
        const children = this.children;

        this.viewports.forEach((entry, viewport) => {
            const { container, elements } = entry;

            for (let i = 0, n = children.length; i < n; ++i) {
                const sprite = children[i] as HTMLSprite;
                container.removeChild(elements[sprite.uuid]);
            }
        })
    }

    render(viewport: Viewport, camera: THREE.Camera)
    {
        if (!viewport.overlay) {
            console.warn("viewport missing overlay element");
            return;
        }

        const elements = this.viewports.get(viewport) || this.registerViewport(viewport);
        const children = this.children;

        for (let i = 0, n = children.length; i < n; ++i) {
            const sprite = children[i] as HTMLSprite;
            const element = elements[sprite.uuid];
            if (element) {
                sprite.renderHTMLElement(elements[sprite.uuid], viewport, camera);
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
        const overlay = viewport.overlay;
        const elements = {};
        this.viewports.set(viewport, elements);

        this.children.forEach((sprite: HTMLSprite) => {
            if (sprite.isHTMLSprite) {
                const element = sprite.createHTMLElement();
                if (element) {
                    elements[sprite.uuid] = element;
                    overlay.appendChild(element);
                }
            }
        });

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