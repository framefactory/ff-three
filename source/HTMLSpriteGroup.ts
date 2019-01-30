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

interface IHTMLViewportEntry
{
    container: HTMLElement;
    elements: Dictionary<HTMLElement>;
}

export default class HTMLSpriteGroup extends THREE.Object3D
{
    readonly isHTMLSpriteGroup = true;

    protected viewports = new Map<Viewport, IHTMLViewportEntry>();


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

    renderHTML(viewport: Viewport, container: HTMLElement)
    {
        const entry = this.viewports.get(viewport);
        const elements = entry ? entry.elements : this.registerViewport(viewport, container);
        const children = this.children;

        for (let i = 0, n = children.length; i < n; ++i) {
            const sprite = children[i] as HTMLSprite;
            const element = elements[sprite.uuid];
            if (element) {
                sprite.updateHTML(elements[sprite.uuid], viewport);
            }
        }
    }

    add(sprite: HTMLSprite)
    {
        this.viewports.forEach((entry, viewport) => {
            const { container, elements } = entry;
            const element = sprite.createHTML();
            if (element) {
                elements[sprite.uuid] = element;
                container.appendChild(element);
            }
        });

        return super.add(sprite);
    }

    remove(sprite: HTMLSprite)
    {
        this.viewports.forEach((entry, viewport) => {
            const { container, elements } = entry;
            const element = elements[sprite.uuid];
            container.removeChild(element);
            elements[sprite.uuid] = undefined;
        });

        return super.remove(sprite);
    }

    protected registerViewport(viewport: Viewport, container: HTMLElement)
    {
        const elements = {};
        this.viewports.set(viewport, { container, elements });

        this.children.forEach((sprite: HTMLSprite) => {
            if (sprite.isHTMLSprite) {
                const element = sprite.createHTML();
                if (element) {
                    elements[sprite.uuid] = element;
                    container.appendChild(element);
                }
            }
        });

        viewport.on<IViewportDisposeEvent>("dispose", this.onViewportDispose, this);

        return elements;
    }

    protected onViewportDispose(event: IViewportDisposeEvent)
    {
        const { container, elements }  = this.viewports.get(event.viewport);
        const children = this.children;

        for (let i = 0, n = children.length; i < n; ++i) {
            const sprite = children[i] as HTMLSprite;
            container.removeChild(elements[sprite.uuid]);
        }

        this.viewports.delete(event.viewport);
    }
}