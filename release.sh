#!/bin/bash

#Requires libglib2.0-bin
glib-compile-schemas schemas

#Build and rename the zip
gnome-extensions pack --force --extra-source=LICENSE --extra-source=README.md --extra-source=CHANGELOG.md --extra-source=ui --extra-source=wirelesshid.js --extra-source=prefs.css
mv "wireless-hid@chlumskyvaclav.gmail.com.shell-extension.zip" "wireless-hid@chlumskyvaclav.gmail.com.zip"
