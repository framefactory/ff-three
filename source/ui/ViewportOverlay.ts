/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import CustomElement, { customElement, property, PropertyValues } from "@ff/ui/CustomElement";
import CameraControls from "./CameraControls";

////////////////////////////////////////////////////////////////////////////////

@customElement("ff-viewport-overlay")
export default class ViewportOverlay extends CustomElement
{
    protected firstConnected()
    {
        this.classList.add("ff-viewport-overlay");
    }
}