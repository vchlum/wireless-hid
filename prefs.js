'use strict';

/**
 * extension wireless-hid
 * JavaScript Gnome extension for wireless keyboards and mice.
 *
 * @author Václav Chlumský
 * @copyright Copyright 2021, Václav Chlumský.
 */

 /**
 * @license
 * The MIT License (MIT)
 *
 * Copyright (c) 2021 Václav Chlumský
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

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const ShellVersion = parseFloat(imports.misc.config.PACKAGE_VERSION);

const { Gdk, Gtk, Gio } = imports.gi;
const Adw = ShellVersion >= 42 ? imports.gi.Adw : null;

var PrefsPage = class PrefsPage {
    constructor() {
        this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.wireless-hid');

        // Load css style for Gnome < 42
        const cssProvider = new Gtk.CssProvider();
        cssProvider.load_from_path(Me.path + '/prefs.css');

        if (ShellVersion >= 40 && ShellVersion < 42 ) {
            Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(),
                cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        } else if (ShellVersion < 40) {
            Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(),
                cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
        }

        // Create a new Builder to load UI
        this._builder = new Gtk.Builder();
        // this._builder.set_translation_domain(Me.metadata.uuid);

        this.createPreferences();
    }

    createPreferences() {
        // Use different UI file for GNOME 42+, 40+ and 3.36+
        if (ShellVersion >= 42) {
            this._builder.add_from_file(Me.path + '/ui/prefs-adw1.ui');
        } else if (ShellVersion >= 40) {
            this._builder.add_from_file(Me.path + '/ui/prefs-gtk4.ui');
        } else {
            this._builder.add_from_file(Me.path + '/ui/prefs-gtk3.ui');
        }

        // Get the settings container widget
        this.preferencesWidget = this._builder.get_object('main-prefs');

        this.settingElements = {
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

function init() {
  // ExtensionUtils.initTranslations();
}

//Create preferences window for GNOME 42+
function fillPreferencesWindow(window) {
    let prefsPage = new PrefsPage();
    window.set_default_size(600, 435);
    window.add(prefsPage.preferencesWidget);
}

//Create preferences window for GNOME 3.38 to 41
function buildPrefsWidget() {
    let prefsPage = new PrefsPage();

    if (prefsPage.preferencesWidget.show_all) {
        prefsPage.preferencesWidget.show_all();
    }

    prefsPage.preferencesWidget.connect('realize', () => {
        let window = ShellVersion >= 40 ? prefsPage.preferencesWidget.get_root() :
            prefsPage.preferencesWidget.get_toplevel();
        if (ShellVersion >= 40) {
            window.set_default_size(600, 435);
        } else {
            window.resize(600, 435);
        }
    });

    return prefsPage.preferencesWidget;
}

