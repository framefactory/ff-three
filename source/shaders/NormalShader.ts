/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

////////////////////////////////////////////////////////////////////////////////

export default class NormalShader extends THREE.ShaderMaterial
{
    isNormalShader = true;

    uniforms = {
        index: { value: 0 }
    };

    vertexShader = [
        "varying vec3 vLocalNormal;",

        "void main() {",
        "  #include <beginnormal_vertex>",
        "  #include <begin_vertex>",
        "  #include <project_vertex>",
        "  vLocalNormal = vec3(normal);",
        "}",
    ].join("\n");

    fragmentShader = [
        "uniform vec3 index;",
        "varying vec3 vLocalNormal;",

        "void main() {",
        "  vec3 normal = normalize(vLocalNormal);",
        "  gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);",
        "}"
    ].join("\n");
}