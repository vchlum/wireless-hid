## Version 22
 * Gnome 49 support
 * Show fully charged batteries in green
## Version 21
 * Gnome 48 support
## Version 20
 * null out this._settings when extension is disabled
## Version 19
 - (Thx to @stuarthayhurst)
 * add support for GNOME 47
 * add setting to toggle device reported warning levels
 * reload entire extension when settings change
## Version 18
 - (Thx to @stuarthayhurst)
 * refactor getColorEffect()
 * don't duplicate this.device.percentage, drop getBattery()
 * remove _getPrefs()
 * rename exposed methods of extension indicator class
 * change low and critical percentages to 20 and 5 to match UPower defaults
 * use the warning level from UPower, instead of hardcoding percentages
 * drop local hacks to override the panel box, use the upstream methods
## Version 17
 * Gnome 46 support - (Thx to @stuarthayhurst)
## Version 16
 * Fix warnings when disabling extension
## Version 15
 * GNOME 45 porting
## Version 14
 * remove instances in global scope
## Version 13
 * change to Makefile build system
 * replace DBus with UPower clients
 * fixed a race condition that lead to duplicate devices
 * fixed devices that initially appear as a generic battery then get a device type
 * added a workaround for headsets appearing as keyboards or other devices
 * added an icon name for generic Bluetooth devices
## Version 12
 * fix destroying of devices on disabling (thx to @stuarthayhurst)
## Version 11
 * add Gnome 44 support
## Version 10
 * feature to change the position in top panel
 * improved preferences UI
## Version 9
 * add posibility to hide ELAN devices
 * hide tray icon fix
## Version 8
 * add preferences dialog (Big thx to @stuarthayhurst)
## Version 7
 * add gnome 43 as supported
## Version 6
 * fix battery sync
## Version 5
 * add multiple devices
 * add gnome 42 support
## Version 4
 * hide panel icon without devices
 * ignore ELAN devices
## Version 3
 * fix refreshing percentage
## Version 2
 * remove green color
 * add game controller support
## Version 1
 * initial version