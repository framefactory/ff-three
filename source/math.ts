/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import * as THREE from "three";

////////////////////////////////////////////////////////////////////////////////

const _euler = new THREE.Euler();
const _vec4 = new THREE.Vector4();
const _mat4 = new THREE.Matrix4();

////////////////////////////////////////////////////////////////////////////////

export type Matrix4 = Float32Array | number[];

const _math = {
    PI: 3.1415926535897932384626433832795,
    DOUBLE_PI: 6.283185307179586476925286766559,
    HALF_PI: 1.5707963267948966192313216916398,
    QUARTER_PI: 0.78539816339744830961566084581988,
    DEG2RAD: 0.01745329251994329576923690768489,
    RAD2DEG: 57.295779513082320876798154814105,

    composeOrbitMatrix: function(orientation: THREE.Vector3, offset: THREE.Vector3, result?: THREE.Matrix4): THREE.Matrix4
    {
        const pitch = -orientation.x;
        const head = -orientation.y;
        const roll = -orientation.z;

        const ox = offset.x;
        const oy = offset.y;
        const oz = offset.z;

        const sinX = Math.sin(pitch);
        const cosX = Math.cos(pitch);
        const sinY = Math.sin(head);
        const cosY = Math.cos(head);
        const sinZ = Math.sin(roll);
        const cosZ = Math.cos(roll);

        const m00 = cosY * cosZ;
        const m01 = cosZ * sinY * sinX - sinZ * cosX;
        const m02 = cosZ * sinY * cosX + sinZ * sinX;
        const m10 = cosY * sinZ;
        const m11 = sinX * sinY * sinZ + cosZ * cosX;
        const m12 = sinZ * sinY * cosX - cosZ * sinX;
        const m20 = -sinY;
        const m21 = cosY * sinX;
        const m22 = cosY * cosX;

        //const m00 = cosZ * cosY + sinZ * sinX * sinY;
        //const m01 = -sinZ * cosY + cosZ * sinX * sinY;
        //const m02 = cosX * sinY;
        //const m10 = sinZ * cosX;
        //const m11 = cosZ * cosX;
        //const m12 = -sinX;
        //const m20 = -cosZ * sinY + sinZ * sinX * cosY;
        //const m21 = sinZ * sinY + cosZ * sinX * cosY;
        //const m22 = cosX * cosY;

        result = result || new THREE.Matrix4();
        const e = result.elements;

        e[0] = m00;
        e[1] = m10;
        e[2] = m20;
        e[3] = 0;
        e[4] = m01;
        e[5] = m11;
        e[6] = m21;
        e[7] = 0;
        e[8] = m02;
        e[9] = m12;
        e[10] = m22;
        e[11] = 0;

        e[12] = ox * m00 + oy * m01 + oz * m02;
        e[13] = ox * m10 + oy * m11 + oz * m12;
        e[14] = ox * m20 + oy * m21 + oz * m22;
        e[15] = 1;

        return result;
    },

    decomposeOrbitMatrix: function(matrix: THREE.Matrix4, orientationOut: THREE.Vector3, offsetOut: THREE.Vector3)
    {
        _euler.setFromRotationMatrix(matrix, "ZYX" /* "YXZ" */);
        _euler.toVector3(orientationOut);

        _mat4.getInverse(matrix);
        _vec4.set(0, 0, 0, 1);
        _vec4.applyMatrix4(_mat4);

        offsetOut.x = -_vec4.x;
        offsetOut.y = -_vec4.y;
        offsetOut.z = -_vec4.z;
    },

    isMatrix4Identity: function(matrix: THREE.Matrix4)
    {
        const e = matrix.elements;
        return e[0]  === 1 && e[1]  === 0 && e[2]  === 0 && e[3]  === 0
            && e[4]  === 0 && e[5]  === 1 && e[6]  === 0 && e[7]  === 0
            && e[8]  === 0 && e[9]  === 0 && e[10] === 1 && e[11] === 0
            && e[12] === 0 && e[13] === 0 && e[14] === 0 && e[15] === 1;
    }
};

export default _math;
