# wireless-hid
![screenshot](https://github.com/vchlum/wireless-hid/blob/main/screenshot.png)

## Gnome Shell extension
wireless-hid shows the battery of the wireless keyboards and mice both in percentage and colors. Multiple devices are supported. This extension is inspired by the Keyboard battery extension on e.g.o.

## Troubleshoots 
 * Experiencing a problem, please check the tool upower -d. If you do not see the data/device with power, this extension will not recognize your device too.

## Manual installation

 1. `git clone https://github.com/vchlum/wireless-hid.git`
 1. `cd wireless-hid`
 1. `./release.sh`
 1. `gnome-extensions install wireless-hid@chlumskyvaclav.gmail.com.zip`
 1. Log out & Log in
 1. `gnome-extensions enable wireless-hid@chlumskyvaclav.gmail.com`
