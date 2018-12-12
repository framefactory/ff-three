/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Component, Entity } from "@ff/core/ecs";

////////////////////////////////////////////////////////////////////////////////

export default class Geometry extends Component
{
    static readonly type: string = "Geometry";

    static readonly geometryEvent = "geometry";

    private _geometry: THREE.BufferGeometry = null;

    constructor(entity: Entity, id?: string)
    {
        super(entity, id);
        this.addEvent(Geometry.geometryEvent);
    }

    get geometry() {
        return this._geometry;
    }

    set geometry(value: THREE.BufferGeometry) {
        this._geometry = value;
        this.emitAny(Geometry.geometryEvent, value);
    }
}