/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import {
    Entity,
    Module,
    Hierarchy
} from "@ff/core/ecs";

import {
    BasicMaterial,
    Box,
    Camera,
    DirectionalLight,
    Mesh,
    Oscillator,
    PhongMaterial,
    PointLight,
    Scene,
    SpotLight,
    Torus,
    Transform
} from "./components";

////////////////////////////////////////////////////////////////////////////////

const createScene = function(module: Module, name?: string): Entity
{
    const entity = module.createEntity(name);
    entity.createComponent(Scene);
    return entity;
};

const createTransform = function(parent: Entity, name?: string): Entity
{
    const hierarchy = parent.components.get(Hierarchy);
    if (!hierarchy) {
        throw new Error("can't attach to parent; missing a hierarchy component");
    }

    const entity = parent.module.createEntity(name);
    hierarchy.addChild(entity.createComponent(Transform));
    return entity;
};

const createCamera = function(parent: Entity, name?: string): Entity
{
    const entity = createTransform(parent, name);
    entity.createComponent(Camera);
    return entity;
};

const createDirectionalLight = function(parent: Entity, name?: string): Entity
{
    const entity = createTransform(parent, name);
    entity.createComponent(DirectionalLight);
    return entity;
};

const createPointLight = function(parent: Entity, name?: string): Entity
{
    const entity = createTransform(parent, name);
    entity.createComponent(PointLight);
    return entity;
};

const createSpotLight = function(parent: Entity, name?: string): Entity
{
    const entity = createTransform(parent, name);
    entity.createComponent(SpotLight);
    return entity;
};

const createBox = function(parent: Entity, name?: string): Entity
{
    const entity = createTransform(parent, name);
    entity.createComponent(Mesh);
    entity.createComponent(Box);
    entity.createComponent(PhongMaterial);
    return entity;
};

const createTorus = function(parent: Entity, name?: string): Entity
{
    const entity = createTransform(parent, name);
    entity.createComponent(Mesh);
    entity.createComponent(Torus);
    entity.createComponent(PhongMaterial);
    return entity;
};

export {
    createScene,
    createTransform,
    createCamera,
    createDirectionalLight,
    createPointLight,
    createSpotLight,
    createBox,
    createTorus
};
