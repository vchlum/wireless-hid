#!/bin/bash

#Requires libgtk-4-bin
#Converts GTK 3 UI files to GTK 4

gtk4-builder-tool simplify --3to4 ui/prefs-gtk3.ui > ui/prefs-gtk4.ui
