# wireless-hid
![screenshot](https://github.com/vchlum/wireless-hid/blob/main/screenshot.png)

## GNOME Shell extension
  - wireless-hid shows the battery of the wireless keyboards, mice, and game controllers
    - Displays battery percentage with coloured status indicators
    - Supports multiple devices
  - Supports GNOME 45+
  - Inspired by the Keyboard battery extension on e.g.o

## Troubleshooting
  - This extension simply displays information from `upower`
  - If you have a problem, please check `upower -d`
    - If the information there matches the extension, the extension is behaving correctly
    - If the information and extension don't match, report an issue [here](https://github.com/vchlum/wireless-hid/issues)
  - If your device isn't recognised by `upower`, there's nothing the extension can do

## Installation from e.g.o
  - Install from [here](https://extensions.gnome.org/extension/4228/wireless-hid/)

## Manual installation
  - `git clone https://github.com/vchlum/wireless-hid.git`
  - `cd wireless-hid`
  - `make build`
  - `make install`
  - Log out & log in
  - `gnome-extensions enable wireless-hid@chlumskyvaclav.gmail.com`

## Install dependencies
  - These are only required to install from source
  - `make`
  - `gnome-shell` (`gnome-extensions` command)

## Extension settings:
  > Use device reported warning levels:
  - Some devices report low battery warnings, others don't
    - This setting tells the extension to use these for warnings, instead of a percentage
  > Hide unknown battery states:
  - Some devices misreport disconnected batteries as connected
    - To work around this, devices with un unknown battery state can optionally be hidden
    - This is off by default, as it can cause issues and hide some working devices
  > Hide ELAN devices:
  - Some ELAN devices don't report a charge
    - This setting hides these devices
  > Hide old devices after a timeout
  - Some devices don't disconnect correctly
    - This setting hides devices that don't update after a length of time
  > Position in top panel:
  - Manually change the position in the top panel
