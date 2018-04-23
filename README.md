# El terminador

EL-Term is an Electron-based Terminal Emulator. Because I'm sure I'll be the only user, I've taken the liberty of dubbing it _El terminador_. I built it primarily because I didn't like any of the emulators I saw when I moved from using my Mac for development to Linux. None I thought were as complete as iTerm2 and even that venerable too, with its layers of profile-setting dialogs, can be difficult to set up.

<!-- toc -->

<!-- tocstop -->

## Highlights

![Overview](4k.png)

* Arbitrary splits, both horizontal and vertical
* Multiple tabs, each with their own split arrangement
* Customizable badges visually identify sessions
* [Powerline](https://wiki.archlinux.org/index.php/Powerline)-ready, built-in [Roboto Mono](https://github.com/powerline) font
* All customizations (splits, tabs and so on) are automatically persisted
* Looks great on a 4k monitor!

## How to Run in Development Mode

> This is the only way for now, until I package EL-3270 properly as a standalone desktop app -- which is after all the point of Electron.

One time only, you'll need to grab the code:

```
git clone https://github.com/mflorence99/el-term.git
cd el-term
npm install
```

Next, start the app.

```
npm run live
```

## Customization

I wanted to move away from the way most terminal emulators use profiles for customization. For me, the added layer of indirection is cumbersome and their huge number of customization combinations all but define the [Paradox of Choice](https://en.wikipedia.org/wiki/The_Paradox_of_Choice).

So in _El terminador_ you can't pick a font, or a font size, or change background or text colors. Instead:

* You associate an icon and a color to each tab
* Both identify each split under that tab
* An individual split can be given badge text to further visually identify it

### Customizing Tabs

Click on the tab's icon.

![Customizing Tabs](tab.png)

### Customizing Splits

Right-click the split to be customized and select `Preferences...`.

<img src="menu.png">
<img src="split.png">

## Search and Highlight

Right-click the split to be searched and select `Search...`. The search string is remembered and text containing it will be highlighted as it is shown. This feature is very useful, for example, when a session produces stack traces. You can specify a search string that picks out your application's stack trace entries for easier visual parsing.

<img src="menu.png">
<img src="search.png">

## Tips

* The `Broadcast...` facility is very handy for dealing with multiple sessions at once.
* `Swap with...` is invaluable when rearranging a complex layout of splits
