/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { types } from "@ff/core/ecs";

import UniversalCamera, { EProjection } from "../../UniversalCamera";
import Object3D from "./Object3D";

////////////////////////////////////////////////////////////////////////////////

export default class Camera extends Object3D
{
    static readonly type: string = "Camera";

    ins = this.ins.append({
        projection: types.Enum("Projection.Type", EProjection, EProjection.Perspective),
        fov: types.Number("Projection.FovY", 50),
        size: types.Number("Projection.Size", 20),
        zoom: types.Number("Projection.Zoom", 1),
        near: types.Number("Frustum.ZNear", 0.01),
        far: types.Number("Frustum.ZFar", 10000)
    });

    get camera() {
        return this.object3D as UniversalCamera;
    }

    create()
    {
        super.create();
        this.object3D = new UniversalCamera();
    }

    update()
    {
        const ins = this.ins;
        const camera = this.camera;

        if (ins.projection.changed) {
            camera.setType(types.getEnumIndex(EProjection, ins.projection.value));
        }

        camera.fov = ins.fov.value;
        camera.size = ins.size.value;
        camera.zoom = ins.zoom.value;
        camera.near = ins.near.value;
        camera.far = ins.far.value;

        camera.updateProjectionMatrix();
        return true;
    }
}