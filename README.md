# wireless-hid
![screenshot](https://github.com/vchlum/wireless-hid/blob/main/screenshot.png)

## Gnome Shell extension
wireless-hid shows the battery of the wireless keyboards, mice, and game controllers in percentage and colors. Multiple devices are supported. This extension is inspired by the Keyboard battery extension on e.g.o.

## Troubleshoots 
 * Experiencing a problem, please check the tool upower -d. If you do not see the data/device with power, this extension will not recognize your device too.

## Supported Gnome Shell version
This extension supports Gnome Shell verison 3.36 and above.

## Installation from e.g.o
https://extensions.gnome.org/extension/4228/wireless-hid/

## Manual installation

 1. `git clone https://github.com/vchlum/wireless-hid.git`
 1. `cd wireless-hid`
 1. `./release.sh`
 1. `gnome-extensions install wireless-hid@chlumskyvaclav.gmail.com.zip`
 1. Log out & Log in
 1. `gnome-extensions enable wireless-hid@chlumskyvaclav.gmail.com`

## Install dependencies:
  - gnome-shell (`gnome-extensions` command)
  - libglib2.0-bin

## Development dependencies: (Only required for `make gtk4`)
  - libgtk-4-bin

## Extension settings:
  > Hide unknown battery states:
  - Some devices misreport disconnected batteries as connected
    - To work around this, devices with un unknown battery state can optionally be hidden
    - This is off by default, as it can cause issues and hide some worknig devices
