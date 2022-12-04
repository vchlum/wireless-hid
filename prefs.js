const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const ShellVersion = parseFloat(imports.misc.config.PACKAGE_VERSION);

const { Gtk, Gio } = imports.gi;
const Adw = ShellVersion >= 42 ? imports.gi.Adw : null;

var PrefsPages = class PrefsPages {
  constructor() {
    this._settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.wireless-hid');

    this._builder = new Gtk.Builder();
    this._builder.set_translation_domain(Me.metadata.uuid);

    this.createPreferences();
  }

  createPreferences() {
    //Use different UI file for GNOME 40+ and 3.38
    if (ShellVersion >= 40) {
      this._builder.add_from_file(Me.path + '/ui/prefs-gtk4.ui');
    } else {
      this._builder.add_from_file(Me.path + '/ui/prefs.ui');
    }

    //Get the settings container widget
    this.preferencesWidget = this._builder.get_object('main-prefs');

    this.settingElements = {
      'hide-unknown-states-switch': {
        'settingKey': 'hide-unknown-battery-state',
        'bindProperty': 'active'
      }
    }

    //Loop through settings toggles and dropdowns and bind together
    Object.keys(this.settingElements).forEach((element) => {
      this._settings.bind(
        this.settingElements[element].settingKey, //GSettings key to bind to
        this._builder.get_object(element), //GTK UI element to bind to
        this.settingElements[element].bindProperty, //The property to share
        Gio.SettingsBindFlags.DEFAULT
      );
    });
  }
}

function init() {
  ExtensionUtils.initTranslations();
}

//Create preferences window for GNOME 42+
function fillPreferencesWindow(window) {
  //Create page and widget
  let prefsPages = new PrefsPages();
  let settingsPage = new Adw.PreferencesPage();
  let settingsGroup = new Adw.PreferencesGroup();

  //Build the settings page and add to window
  settingsPage.set_title('Settings');
  settingsPage.set_icon_name('preferences-system-symbolic');
  settingsGroup.add(prefsPages.preferencesWidget);
  settingsPage.add(settingsGroup);
  window.add(settingsPage);
}

//Create preferences window for GNOME 3.38-41
function buildPrefsWidget() {
  let prefsPages = new PrefsPages();
  let settingsWindow = new Gtk.ScrolledWindow();

  //Use a stack to store pages
  let pageStack = new Gtk.Stack();
  pageStack.add_titled(prefsPages.preferencesWidget, 'settings', 'Settings');

  let pageSwitcher = new Gtk.StackSwitcher();
  pageSwitcher.set_stack(pageStack);

  //Add the stack to the scrolled window
  if (ShellVersion >= 40) {
    settingsWindow.set_child(pageStack);
  } else {
    settingsWindow.add(pageStack);
  }

  //Enable all elements differently for GNOME 40+ and 3.38
  if (ShellVersion >= 40) {
    settingsWindow.show();
  } else {
    settingsWindow.show_all();
  }

  //Modify top bar to add a page menu, when the window is ready
  settingsWindow.connect('realize', () => {
    let window = ShellVersion >= 40 ? settingsWindow.get_root() : settingsWindow.get_toplevel();
    let headerBar = window.get_titlebar();

    //Add page switching menu to header
    if (ShellVersion >= 40) {
      headerBar.set_title_widget(pageSwitcher);
    } else {
      headerBar.set_custom_title(pageSwitcher);
    }
    pageSwitcher.show();
  });

  return settingsWindow;
}
