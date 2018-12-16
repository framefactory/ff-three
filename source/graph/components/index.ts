/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Registry } from "@ff/graph";

import BasicMaterial from "./BasicMaterial";
import Box from "./Box";
import Camera from "./Camera";
import DirectionalLight from "./DirectionalLight";
import Mesh from "./Mesh";
import PhongMaterial from "./PhongMaterial";
import PointLight from "./PointLight";
import Scene from "./Scene";
import SpotLight from "./SpotLight";
import Torus from "./Torus";
import Transform from "./Transform";

////////////////////////////////////////////////////////////////////////////////

export {
    BasicMaterial,
    Box,
    Camera,
    DirectionalLight,
    Mesh,
    PhongMaterial,
    PointLight,
    Scene,
    SpotLight,
    Torus,
    Transform
};

export function registerComponents(registry: Registry)
{
    registry.registerComponentType([
        BasicMaterial,
        Box,
        Camera,
        DirectionalLight,
        Mesh,
        PhongMaterial,
        PointLight,
        Scene,
        SpotLight,
        Torus,
        Transform
    ]);
};