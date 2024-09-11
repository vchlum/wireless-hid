'use strict';

/**
 * extension wireless-hid
 * JavaScript Gnome extension for wireless keyboards and mice.
 *
 * @author Václav Chlumský, Stuart Hayhurst
 * @copyright Copyright 2023, Václav Chlumský.
 */

 /**
 * @license
 * The MIT License (MIT)
 *
 * Copyright (c) 2023 Václav Chlumský
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import * as WirelessHID from './wirelesshid.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class WirelessHIDExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._hid = new WirelessHID.WirelessHID(this.metadata.name, this._settings);

        // Add indicator to correct position in the panel
        this._hid.updatePanelPosition();
        this._hid.updateVisibility();

        // Reload the extension when settings change
        this._settingsChangedId = this._settings.connect(
            'changed', () => {
                this._hid.destroy();
                this._hid = new WirelessHID.WirelessHID(this.metadata.name, this._settings);
                this._hid.updatePanelPosition();
                this._hid.updateVisibility();
            }
        );
    }

    disable() {
        this._settings.disconnect(this._settingsChangedId);
        this._hid.destroy();
        this._hid = null;
        this._settings = null;
    }
}
