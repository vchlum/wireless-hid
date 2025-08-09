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

import St from 'gi://St';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import UPowerGlib from 'gi://UPowerGlib';
import Clutter from 'gi://Clutter';
import Cogl from 'gi://Cogl';

import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const ShellVersion = parseFloat(Config.PACKAGE_VERSION);

var HID = GObject.registerClass({
    Signals: {
        'update': {},
        'show': {},
        'hide': {},
        'destroy': {}
    }
}, class HID extends GObject.Object {
    _init(device, settings) {
        super._init();

        this.device = device;
        this.nativePath = device.native_path;
        this.icon = null;
        this.item = null;
        this.label = null;
        this.visible = false;
        this._signals = {};
        this._timeoutUpdateTimeoutId = null;

        this._settings = settings;

        this._connectSignals();
    }

    _connectSignals() {
        let signal;

        signal = this.device.connect(
            'notify::update-time',
            this.refresh.bind(this)
        );
        this._signals[signal] = this.device;
    }

    _getColorEffect() {
        // Decide the level
        let level = 'normal';
        if (this._settings.get_boolean('use-device-levels')) {
            if (this.device.warning_level === UPowerGlib.DeviceLevel.CRITICAL) {
                level = 'critical';
            } else if (this.device.warning_level === UPowerGlib.DeviceLevel.LOW) {
                level = 'low';
            }
        } else {
            if (this.device.percentage <= 5) {
                level = 'critical';
            } else if (this.device.percentage <= 20) {
                level = 'low';
            }
        }

        // Decide low battery colour
        let color = null;
        if (level === 'critical') {
            if (ShellVersion >= 47) {
                color = Cogl.Color.from_string('#ff0000ff')[1];
            } else {
                color = Clutter.Color.new(255, 0, 0, 255);
            }
        } else if (level === 'low') {
            if (ShellVersion >= 47) {
                color = Cogl.Color.from_string('#ffa500ff')[1];
            } else {
                color = Clutter.Color.new(255, 165, 0, 255);
            }
        }

        // Decide fully charged colour
        if (this._settings.get_boolean('highlight-charged-devices')) {
          if (this.device.state === UPowerGlib.DeviceState.FULLY_CHARGED) {
            if (ShellVersion >= 47) {
                color = Cogl.Color.from_string('#00ff00ff')[1];
            } else {
                color = Clutter.Color.new(0, 255, 0, 255);
            }
          }
        }

        // Use the colour if we have one
        if (color !== null) {
            return Clutter.ColorizeEffect.new(color);
        } else {
            return null;
        }
    }

    _shouldBatteryVisible() {
        let shouldBeVisible = true;
        if (this.device.is_present === false) {
            return false;
        }

        // Hide devices without model names
        if (this.device.model === null) {
            return false;
        } else if (this.device.model.length === 0) {
            return false;
        }

        // Hide system batteries
        if (this.device.kind == UPowerGlib.DeviceKind.BATTERY) {
          return false;
        }

        // Some devices report 'present' as true, even if no battery is present
        // To try work-around this, hide devices with an unknown battery state if enabled
        if (this._settings.get_boolean('hide-unknown-battery-state')) {
            if (this.device.state === UPowerGlib.DeviceState.UNKNOWN) {
                return false;
            }
        }

        if (this._settings.get_boolean('hide-elan')) {
            if (this.device.model.startsWith('ELAN')) {
                return false;
            }
        }

        return true;
    }

    _updateLabel() {
        if (this.label !== null) {
            this.label.text = `${this.device.percentage}%`;
        }
    }

    refresh() {
        // If a timeout is already set, remove it
        if (this._timeoutUpdateTimeoutId != null) {
            GLib.Source.remove(this._timeoutUpdateTimeoutId);
            this._timeoutUpdateTimeoutId = null;
        }

        // If enabled, create a timer to hide the device if it's not cancelled by an update
        let deviceTimeoutLength = this._settings.get_int('device-update-timeout') * 1000;
        if (deviceTimeoutLength != 0) {
            this._timeoutUpdateTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, deviceTimeoutLength, () => {
                this.emit('hide')
                this._timeoutUpdateTimeoutId = null;
                return GLib.SOURCE_REMOVE;
            });
        }

        this._update();
    }

    _update() {
        this._updateLabel();

        if (this.icon !== null) {
            this.icon.clear_effects();

            let colorEffect = this._getColorEffect();
            if (colorEffect) {
                this.icon.add_effect(colorEffect);
            }
        }

        let shouldBeVisible = this._shouldBatteryVisible();

        if (shouldBeVisible && !this.visible) {
            this.emit('show');
        } else if (!shouldBeVisible && this.visible){
            this.emit('hide');
        }

        this.emit('update');
    }

    createIcon() {
        let iconName;

        switch (this.device.kind) {
            //case UPowerGlib.DeviceKind.BATTERY:
            case UPowerGlib.DeviceKind.BLUETOOTH_GENERIC: iconName = 'bluetooth-active-symbolic'; break;
            case UPowerGlib.DeviceKind.CAMERA: iconName = 'camera-photo'; break;
            case UPowerGlib.DeviceKind.COMPUTER: iconName = 'computer'; break;
            case UPowerGlib.DeviceKind.GAMING_INPUT: iconName = 'input-gaming'; break;
            case UPowerGlib.DeviceKind.HEADPHONES: iconName = 'audio-headphones'; break;
            case UPowerGlib.DeviceKind.HEADSET: iconName = 'audio-headset'; break;
            case UPowerGlib.DeviceKind.KEYBOARD: iconName = 'input-keyboard'; break;
            case UPowerGlib.DeviceKind.LINE_POWER: iconName = 'battery-full-charged'; break;
            case UPowerGlib.DeviceKind.MEDIA_PLAYER: iconName = 'multimedia-player'; break;
            case UPowerGlib.DeviceKind.MODEM: iconName = 'modem'; break;
            case UPowerGlib.DeviceKind.MONITOR: iconName = 'video-display'; break;
            case UPowerGlib.DeviceKind.MOUSE: iconName = 'input-mouse'; break;
            case UPowerGlib.DeviceKind.NETWORK: iconName = 'network-workgroup'; break;
            case UPowerGlib.DeviceKind.OTHER_AUDIO: iconName = 'audio-card'; break;
            case UPowerGlib.DeviceKind.PDA: iconName = 'pda'; break;
            case UPowerGlib.DeviceKind.PEN: iconName = 'document-edit'; break;
            case UPowerGlib.DeviceKind.PHONE: iconName = 'phone'; break;
            case UPowerGlib.DeviceKind.PRINTER: iconName = 'printer'; break;
            case UPowerGlib.DeviceKind.REMOTE_CONTROL: iconName = 'accessories-calculator'; break;
            case UPowerGlib.DeviceKind.SCANNER: iconName = 'scanner'; break;
            case UPowerGlib.DeviceKind.SPEAKERS: iconName = 'audio-speakers'; break;
            case UPowerGlib.DeviceKind.TABLET: iconName = 'input-tablet'; break;
            case UPowerGlib.DeviceKind.TOUCHPAD: iconName = 'input-touchpad'; break;
            case UPowerGlib.DeviceKind.TOY: iconName = 'applications-games'; break;
            //case UPowerGlib.DeviceKind.UNKNOWN:
            case UPowerGlib.DeviceKind.UPS: iconName = 'uninterruptible-power-supply'; break;
            case UPowerGlib.DeviceKind.VIDEO: iconName = 'camera-video'; break;
            //case UPowerGlib.DeviceKind.WEARABLE:
            default: iconName = 'battery';
        }

        // Workarounds for incorrectly identified devices
        if (this.device.model !== null) {
            if (this.device.model.includes('Mouse')) {
                iconName = 'input-mouse';
            } else if (this.device.model.includes('Controller')) {
                iconName = 'input-gaming';
            } else if (this.device.model.includes('Headset')) {
                iconName = 'audio-headset';
            }
        }

        this.icon = new St.Icon({
            icon_name: iconName + '-symbolic',
            style_class: 'system-status-icon'
        });

        return this.icon;
    }

    createItem() {
        this.item = new PopupMenu.PopupMenuItem(
            _('N/A')
        );

        this.item.remove_child(this.item.label);

        let model = this.device.model;
        let name = new St.Label({
            text: model !== null ? `${model}:` : 'Unknown:',
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.START
        });
        name.set_x_expand(true);
        this.item.add_child(name);

        this.item.add_child(this.createLabel());

        return this.item;
    }

    createLabel() {
        this.label = new St.Label({
            text: _('%'),
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.END
        });

        this.label.set_x_expand(false);

        return this.label;
    }

    clean() {
        this.icon.destroy();
        this.item.destroy();
        this.icon = null;
        this.item = null;
        this.label = null;
        this.visible = false;
    }

    destroy() {
        if (this._timeoutUpdateTimeoutId != null) {
            GLib.Source.remove(this._timeoutUpdateTimeoutId);
        }

        for (let signal in this._signals) {
            this._signals[signal].disconnect(signal);
        }

        this._signals = {};

        this.emit('destroy');
    }
});

/*
 * WirelessHID class. Provides widget.
 * 
 * @class PhueMenu
 * @constructor
 * @return {Object} menu widget instance
 */
export var WirelessHID = GObject.registerClass({
    GTypeName: 'WirelessHID'
}, class WirelessHID extends PanelMenu.Button {

    /*
     * WirelessHID class initialization
     *
     * @method _init
     * @private
     */
    _init(name, settings) {

        super._init(0.0, name, false);

        // Get saved settings
        this._settings = settings;



        this._upowerClient = UPowerGlib.Client.new_full(null);
        this._devices = {};
        this._updatingDevices = false;

        this._panelBox = new St.BoxLayout({style_class: 'panel-status-menu-box'});
        this._panelBox.horizontal = true;

        this.style = `-natural-hpadding: 6px; -minimum-hpadding: 6px;`;

        this.add_child(this._panelBox);

        this._deviceAddedSignal = this._upowerClient.connect(
            'device-added',
            this.discoverDevices.bind(this)
        );

        this._deviceRemovedSignal = this._upowerClient.connect(
            'device-removed',
            this.discoverDevices.bind(this)
        );

        this.discoverDevices();
    }

    newDevice(device) {
        this._devices[device.native_path] = new HID(device, this._settings);

        this._panelBox.add_child(this._devices[device.native_path].createIcon());

        this.menu.addMenuItem(this._devices[device.native_path].createItem());
        this._devices[device.native_path].visible = true;

        this._devices[device.native_path].connect('show',
            () => {
                if (!this._devices[device.native_path].visible) {
                    this._panelBox.add_child(this._devices[device.native_path].createIcon());
                    this.menu.addMenuItem(this._devices[device.native_path].createItem());
                    this._devices[device.native_path].visible = true;
                }
                // Uses _update() to avoid cutting timeout short
                this._devices[device.native_path]._update();
                this.updateVisibility();
            }
        );

        this._devices[device.native_path].connect('hide',
            () => {
                this._panelBox.remove_child(this._devices[device.native_path].icon);
                this._devices[device.native_path].clean();
                this.updateVisibility();
            }
        );

        // Refresh device with signals now connected
        this._devices[device.native_path].refresh();

        this._devices[device.native_path].connect('destroy',
            () => {
                if (this._devices[device.native_path].visible) {
                    this._panelBox.remove_child(this._devices[device.native_path].icon);
                    this._devices[device.native_path].clean();
                    this.updateVisibility();
                }
            }
        );
    }

    discoverDevices() {
        if (!this._updatingDevices) {
            this._updatingDevices = true;
            let freshDevices = this._upowerClient.get_devices();

            // Remove disconnected devices
            for (let j in this._devices) {
                let found = false;
                for (let i = 0; i < freshDevices.length; i++) {
                    if (this._devices[j].nativePath === freshDevices[i].native_path) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    this._devices[j].destroy();
                    delete(this._devices[j]);
                }
            }

            // Add new devices
            for (let i = 0; i < freshDevices.length; i++) {
                let found = false;
                for (let j in this._devices) {
                    if (this._devices[j].nativePath === freshDevices[i].native_path) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    this.newDevice(freshDevices[i]);
                }
            }

            this._updatingDevices = false;
            this.updateVisibility();
        }
    }

    updateVisibility() {
        if (Main.panel.statusArea['wireless-hid'] === undefined) {
            return;
        }

        let showDevices = false;
        for (let id in this._devices) {
            if (this._devices[id].visible) {
              showDevices = true;
              break;
            }
        }

        Main.panel.statusArea['wireless-hid'].visible = showDevices;
    }

    updatePanelPosition() {
        // Add the container to the correct box
        let position = this._settings.get_string('position-in-panel').toLowerCase();
        let index = this._settings.get_int('panel-box-index');
        Main.panel.addToStatusArea('wireless-hid', this, index, position);
    }

    _onDestroy() {
        this._upowerClient.disconnect(this._deviceAddedSignal);
        this._upowerClient.disconnect(this._deviceRemovedSignal);

        for (let deviceId in this._devices) {
            this._devices[deviceId].destroy();
        }

        super._onDestroy();
    }
});
