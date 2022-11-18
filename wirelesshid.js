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
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const UPower = imports.gi.UPowerGlib;
const Clutter = imports.gi.Clutter;

const { loadInterfaceXML } = imports.misc.fileUtils;
const DisplayDeviceInterface = loadInterfaceXML('org.freedesktop.UPower.Device');
const PowerManagerProxy = Gio.DBusProxy.makeProxyWrapper(DisplayDeviceInterface);

var HID = GObject.registerClass({
    Signals: {
        "update": {},
        "destroy": {}
    }
}, class HID extends GObject.Object {
    _init(device) {
        super._init();

        this.device = device;
        this.model = device.model;
        this.kind = device.kind;
        this.nativePath = device.native_path;
        this.icon = null;
        this.label = null;
        this._proxy = null;

        this._createProxy();
    }

    _createProxy() {
        this._proxy = new PowerManagerProxy(
            Gio.DBus.system,
            'org.freedesktop.UPower',
            this.device.get_object_path(),
            (p, error) => {
                if (error) {
                    log(`${Me.metadata.name} error: ${error.message}`);
                    return;
                }

                this._proxy.connect(
                    'g-properties-changed',
                    this._update.bind(this)
                );

                this._update();
            }
        );
    }

    getBattery() {
        return this.device.percentage;
    }

    getColorEffect(percentage) {
        let r;
        let g;
        let b;

        if (percentage <= 10) {
            r = 255;
            g = 0;
            b = 0;
        } else if (percentage <= 30) {
            r = 255;
            g = 165;
            b = 0;
        } else {
            return null;
        }

        let color = new Clutter.Color({
            red: r,
            green: g,
            blue: b,
            alpha: 255
        });

        return new Clutter.ColorizeEffect({tint: color});
    }

    _update() {
        this.percentage = this.getBattery();

        if (this.label !== null) {
            this.label.text = `${this.percentage}%`;
        }

        if (this.icon !== null) {
            this.icon.clear_effects();

            let colorEffect = this.getColorEffect(this.percentage);
            if (colorEffect) {
                this.icon.add_effect(colorEffect);
            }
        }

        this.emit('update');
    }

    createIcon() {
        let iconName;

        switch (this.kind) {
            //case UPower.DeviceKind.BATTERY:
            //case UPower.DeviceKind.BLUETOOTH_GENERIC:
            case UPower.DeviceKind.CAMERA: iconName = 'camera-photo'; break;
            case UPower.DeviceKind.COMPUTER: iconName = 'computer'; break;
            case UPower.DeviceKind.GAMING_INPUT: iconName = 'input-gaming'; break;
            case UPower.DeviceKind.HEADPHONES: iconName = 'audio-headphones'; break;
            case UPower.DeviceKind.HEADSET: iconName = 'audio-headset'; break;
            case UPower.DeviceKind.KEYBOARD: iconName = 'input-keyboard'; break;
            case UPower.DeviceKind.LINE_POWER: iconName = 'battery-full-charged'; break;
            case UPower.DeviceKind.MEDIA_PLAYER: iconName = 'multimedia-player'; break;
            case UPower.DeviceKind.MODEM: iconName = 'modem'; break;
            case UPower.DeviceKind.MONITOR: iconName = 'video-display'; break;
            case UPower.DeviceKind.MOUSE: iconName = 'input-mouse'; break;
            case UPower.DeviceKind.NETWORK: iconName = 'network-workgroup'; break;
            case UPower.DeviceKind.OTHER_AUDIO: iconName = 'audio-card'; break;
            case UPower.DeviceKind.PDA: iconName = 'pda'; break;
            case UPower.DeviceKind.PEN: iconName = 'document-edit'; break;
            case UPower.DeviceKind.PHONE: iconName = 'phone'; break;
            case UPower.DeviceKind.PRINTER: iconName = 'printer'; break;
            case UPower.DeviceKind.REMOTE_CONTROL: iconName = 'accessories-calculator'; break;
            case UPower.DeviceKind.SCANNER: iconName = 'scanner'; break;
            case UPower.DeviceKind.SPEAKERS: iconName = 'audio-speakers'; break;
            case UPower.DeviceKind.TABLET: iconName = 'input-tablet'; break;
            case UPower.DeviceKind.TOUCHPAD: iconName = 'input-touchpad'; break;
            case UPower.DeviceKind.TOY: iconName = 'applications-games'; break;
            //case UPower.DeviceKind.UNKNOWN:
            case UPower.DeviceKind.UPS: iconName = 'uninterruptible-power-supply'; break;
            case UPower.DeviceKind.VIDEO: iconName = 'camera-video'; break;
            //case UPower.DeviceKind.WEARABLE:
            default: iconName = 'battery';
        }

        // Workaround for mouse recognized as keyboard
        if (this.model.includes('Mouse'))
            iconName = 'input-mouse';

        this.icon = new St.Icon({
            icon_name: iconName+'-symbolic',
            style_class: 'system-status-icon'
        });

        this._update();

        return this.icon;
    }

    createLabel() {
        this.label = new St.Label({
            text: _('%'),
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.END
        });

        this.label.set_x_expand(false);

        this._update();

        return this.label;
    }

    destroy() {
        this.emit('destroy');
    }
});

/**
 * WirelessHID class. Provides widget.
 * 
 * @class PhueMenu
 * @constructor
 * @return {Object} menu widget instance
 */
var WirelessHID = GObject.registerClass({
    GTypeName: 'WirelessHID'
}, class WirelessHID extends PanelMenu.Button {

    /**
     * WirelessHID class initialization
     *  
     * @method _init
     * @private
     */
    _init() {

        super._init(0.0, Me.metadata.name, false);

        this._devices = {};

        this._panelBox = new St.BoxLayout();
        this._panelBox.horizontal = true;

        this.add_child(this._panelBox);

        let uPowerProxy = new PowerManagerProxy(
            Gio.DBus.system,
            'org.freedesktop.UPower',
            '/org/freedesktop/UPower',
            (proxy,error)=>{
                    if (error) {
                        log(`${Me.metadata.name} error: ${error.message}`);
                    }
            }
        );

        let dbusCon = uPowerProxy.get_connection();

        this._subscribeAdd = dbusCon.signal_subscribe(
            'org.freedesktop.UPower',
            'org.freedesktop.UPower',
            'DeviceAdded',
            null,
            null,
            0,
            this.discoverDevices.bind(this)
        );

        this._subscribeRemove = dbusCon.signal_subscribe(
            'org.freedesktop.UPower',
            'org.freedesktop.UPower',
            'DeviceRemoved',
            null,
            null,
            0,
            this.discoverDevices.bind(this)
        );

        this.discoverDevices();
    }

    newDevice(device) {

        this._devices[device.native_path] = new HID(device);

        let icon = this._devices[device.native_path].createIcon();
        this._panelBox.add(icon);

        let item = new PopupMenu.PopupMenuItem(
            _("N/A")
        );

        item.remove_child(item.label);

        let name = new St.Label({
            text: `${this._devices[device.native_path].model}:`,
            y_align: Clutter.ActorAlign.CENTER,
            x_align: Clutter.ActorAlign.START
        });
        name.set_x_expand(true);
        item.add(name);

        let label = this._devices[device.native_path].createLabel()
        item.add(label);

        this.menu.addMenuItem(item);

        this._devices[device.native_path].connect("destroy",
            () => {
                this._panelBox.remove_child(icon);
                icon.destroy();
                item.destroy();
            }
        );
    }

    discoverDevices() {
        let upowerClient = UPower.Client.new_full(null);
        let devices = upowerClient.get_devices();

        /**
         * remove old devices
         */
        for (let j in this._devices) {
            let found = false;
            for (let i = 0; i < devices.length; i++) {
                if (this._devices[j].nativePath === devices[i].native_path) {
                    found = true;
                }
            }

            if (!found) {
                this._devices[j].destroy();
                delete(this._devices[j]);
            }
        }

        /**
         * discover new devices
         */
        for (let i = 0; i < devices.length; i++) {
            if (devices[i].model.startsWith("ELAN")) {
                continue;
            }

            if (devices[i].kind === UPower.DeviceKind.BATTERY) {
                continue;
            }

            if (devices[i].model.length === 0) {
                continue;
            }

            if (devices[i].is_present === false) {
                continue;
            }

            //Some devices report 'present' as true, even if no battery is present
            //Instead, check the state and icon name to try and find these
            if (devices[i].state === UPower.DeviceState.UNKNOWN && devices[i].iconName === "battery-missing-symbolic") {
                continue;
            }

            let exist = false;
            for (let j in this._devices) {
                if (this._devices[j].nativePath === devices[i].native_path) {
                    exist = true;
                }
            }

            if (!exist) {
                this.newDevice(devices[i]);
            }
        }

        this.checkVisibility();
    }

    checkVisibility() {
        if (Main.panel.statusArea["wireless-hid"] === undefined) {
            return;
        }

        if (Object.keys(this._devices).length === 0) {
            Main.panel.statusArea["wireless-hid"].visible = false;
        } else {
            Main.panel.statusArea["wireless-hid"].visible = true;
        }
    }
});
