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

import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

var PrefsPage = class PrefsPage {
    constructor(settings, path) {
        this._settings = settings;
        this._path = path;

        // Create a new Builder to load UI
        this._builder = new Gtk.Builder();

        this.createPreferences();
    }

    createPreferences() {
        // Load libadwaita UI file
        this._builder.add_from_file(this._path + '/prefs-adw1.ui');

        // Get the settings container widget
        this.preferencesWidget = this._builder.get_object('main-prefs');

        this.settingElements = {
            'use-device-levels-switch': {
                'settingKey': 'use-device-levels',
                'bindProperty': 'active'
            },
            'highlight-charged-devices-switch': {
                'settingKey': 'highlight-charged-devices',
                'bindProperty': 'active'
            },
            'hide-unknown-states-switch': {
                'settingKey': 'hide-unknown-battery-state',
                'bindProperty': 'active'
            },
            'hide-elan-switch': {
                'settingKey': 'hide-elan',
                'bindProperty': 'active'
            },
            'device-timeout-adjustment': {
                'settingKey': 'device-update-timeout',
                'bindProperty': 'value'
            },
            'panel-position-selector': {
                'settingKey': 'position-in-panel',
                'bindProperty': 'active-id'
            },
            'panel-box-index': {
                'settingKey': 'panel-box-index',
                'bindProperty': 'value'
            }
        }

        // Loop through settings toggles and dropdowns and bind together
        Object.keys(this.settingElements).forEach((element) => {
            this._settings.bind(
                this.settingElements[element].settingKey,   // GSettings key to bind to
                this._builder.get_object(element),          // GTK UI element to bind to
                this.settingElements[element].bindProperty, // The property to share
                Gio.SettingsBindFlags.DEFAULT
            );
        });
    }
}

export default class WirelessHIDPrefs extends ExtensionPreferences {
    //Create preferences window
    fillPreferencesWindow(window) {
        let prefsPage = new PrefsPage(this.getSettings(), this.path);
        window.set_default_size(600, 435);
        window.add(prefsPage.preferencesWidget);
    }
}
