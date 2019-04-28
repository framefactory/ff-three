/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

////////////////////////////////////////////////////////////////////////////////

export interface IGridProps
{
    size: number;
    mainDivisions: number;
    subDivisions: number;
    mainColor: THREE.Color | string | number;
    subColor: THREE.Color | string | number;
}

export default class Grid extends THREE.LineSegments
{
    constructor(props: IGridProps)
    {
        const geometry = Grid.generate(props);
        const material = new THREE.LineBasicMaterial({
            vertexColors: THREE.VertexColors
        });

        super(geometry, material);
    }

    update(props: IGridProps)
    {
        if (this.geometry) {
            this.geometry.dispose();
        }

        this.geometry = Grid.generate(props);
    }

    protected static generate(props: IGridProps): THREE.BufferGeometry
    {
        const mainColor = new THREE.Color(props.mainColor as any);
        const subColor = new THREE.Color(props.subColor as any);

        const divisions = props.mainDivisions * props.subDivisions;
        const step = props.size / divisions;
        const halfSize = props.size * 0.5;

        const vertices = [];
        const colors = [];

        for (let i = 0, j = 0, k = -halfSize; i <= divisions; ++i, k += step) {
            vertices.push(-halfSize, 0, k, halfSize, 0, k);
            vertices.push(k, 0, -halfSize, k, 0, halfSize);

            const color = i % props.subDivisions === 0 ? mainColor : subColor;

            color.toArray(colors, j); j += 3;
            color.toArray(colors, j); j += 3;
            color.toArray(colors, j); j += 3;
            color.toArray(colors, j); j += 3;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.addAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
        geometry.addAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

        return geometry;
    }
}