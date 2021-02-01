# Keyiano

### A system for typing English words on a piano

## Background

This was something I originally made back in May of 2018 just as a quick project. I spent about 6 hours designing and implementing the core system. After that, I thought it would be funny to get _really fast_ at the system, so I made some minor improvements and practiced for hours. I eventually got to about 72 WPM and shared some videos around April Fool's Day, 2019:

- [Here's an overview video talking about the design and showing off a typing test](https://www.youtube.com/watch?v=MAYlMcyVZ2k)
- [Here's the April Fool's Day video where I live-streamed typing tests with proper capitalization and punctuation](https://youtu.be/aL-RxFCNwi4)
- [Here's the original design document](https://goo.gl/U1HnMu)

## Keyiano design

As mentioned earlier, there was [a design document](https://goo.gl/U1HnMu) behind all of this, but I'll sum up the high-level design here:

- English-optimized: this system is not meant for coding or for non-English languages. The layout of the piano is based on letter frequencies in English.
- Speed-optimized: this system is designed for typing speed over musicality.
- "Shift" key: in order to input any special commands like changing modes or using intervals, you would hold a "shift" key on the piano (F2 by default in the code).
- Modal typing: you can play a major, minor, or augmented chord anywhere on the keyboard to change modes. That would switch between typing letters, commands, or numbers.
- Velocity-sensitive typing: typically, pressing a key harder will act as though you'd held shift on the computer keyboard, so `1` becomes `!` and `a` becomes `A`. There are some exceptions, e.g. a `/` becoming a `\` or `backspace` becoming `ctrl+backspace`.
- Interval keys: some punctuation and special commands can be invoked via holding the "shift" key and pressing an interval anywhere on the keyboard. For example, a perfect fourth will input a comma.
- Dedicated keys for space and backspace: you press these more frequently than almost anything else, so they get their own keys in addition to having intervals assigned.
- Non-steno: I assume it's pretty easy to map [stenotyping](https://en.wikipedia.org/wiki/Stenotype) to a piano, so I specifically did not want to pursue that for the design since I wanted to explore the problem space myself.

## Shortcomings

Because of how little time I spent coding this, there are many pieces of the code that could be much better. I'd also intended on having UI and overlays to make it easier to learn the system, but I never got around to doing that.

## How do I use this?

### Technical aspect

- Make sure you have [Node](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/) installed
- Clone this repo
- If you're on Linux, do these steps:
  - `sudo apt install libasound2-dev`
  - Make sure you have gcc and Python.
  - For robotjs, I needed [these dependencies](https://github.com/octalmage/robotjs#building)
  - `sudo apt-get install libxtst-dev libpng++-dev`
  - For Electron, I hit [this issue](https://github.com/electron/electron/issues/1518) and needed to run this command too: `sudo apt install libgconf-2.4`
- From the root directory...
- Run `yarn`. If you get an error on Linux about npm being "npm-6.5.0-next" or something and not passing the semver check, just go into the script that is complaining about it and delete the asserts.
- `cd app`
- `yarn`
- `cd ..`
- Run with `yarn dev`
- If it doesn't detect your MIDI device, you'll likely need to modify `midiwrapper.js`'s `portToGet`; I didn't write any smart code around selecting a device or ensuring that it works.

### Piano mappings

After the program starts, you should just be able to type on your MIDI keyboard and have English letters pop out. Put your pinky fingers on the L and the H of Letter Mode for the optimal setup.

#### Letter Mode mappings (low F + major chord to enter):

![image](https://user-images.githubusercontent.com/7192897/90675146-ee151500-e20e-11ea-94be-7d6811ad2f41.png)

Special keys:

- Low F#: space
- High A: backspace

#### Number Mode mappings (low F + augmented chord to enter):

![image](https://user-images.githubusercontent.com/7192897/90676172-70ea9f80-e210-11ea-8ba7-8e9d0ce2940d.png)

Colors:

- Red: low-velocity press
- Pink: high-velocity press

#### Command Mode mapping (low F + minor chord to enter):

![image](https://user-images.githubusercontent.com/7192897/90677327-13efe900-e212-11ea-8451-a990b4f3840a.png)

Commands:

| Number in picture | Low-velocity press | High-velocity press         |
| ----------------- | ------------------ | --------------------------- |
| 1                 | Up arrow           | Up arrow                    |
| 2                 | Down arrow         | Down arrow                  |
| 3                 | Home               | Delete to beginning of line |
| 4                 | Go back by word    | Delete last word            |
| 5                 | Left arrow         | Backspace                   |
| 6                 | Right arrow        | Delete                      |
| 7                 | Go forward by word | Delete next word            |
| 8                 | End                | Delete to end of line       |
| 9                 | Undo               | Undo                        |
| 10                | Redo               | Redo                        |

#### Using chords and intervals

The "shift" key mapped to the lowest F in the picture is how you'll use intervals and modes. **You have to hold F before any of the following chords or intervals**:

- Chords
  - Any major chord (e.g. C-E-G): change to Letter Mode.
  - Any minor chord (e.g. C-E♭-G): change to Command Mode.
  - Any augmented chord (e.g. C-E-G#): change to Number Mode.
- Intervals
  - Minor or major second: space
  - Minor or major third: enter
  - Perfect fourth: comma + space
  - Tritone: backspace
  - Perfect fifth: period + space
  - Minor sixth: hyphen
  - Major sixth: apostrophe
  - Minor seventh: question mark + space
  - Major seventh: exclamation mark + space
  - Perfect octave: backspace previous word
  - Major ninth: temporarily enter Number Mode for a single keypress (e.g. if you want to type a single "@" symbol or something)

### Playing sounds

There are no sound files included in this repo. If you want sounds to play, then the easiest thing to do is to connect a MIDI cable to your MIDI device and run it to a system that can play sounds. I know this seems like a cop-out, but that was my setup, so that's all I was trying to support.

## Troubleshooting

I'm including some problems/solutions that I ran into while testing everything, but this was back in 2018 or 2019, so it may not be relevant anymore.

### Can't install the `midi` library on Windows

For me, Yarn wasn't using the right registry, so I had to use NPM.

Try running these commands:

- `npm config set registry https://registry.npmjs.org/`
- `cd app`
- `npm install --save midi`
- `..\node_modules\.bin\electron-rebuild.cmd`

#### Related: cannot find module "midi"

This was a problem on Windows where I would get an error like this:

`c:\users\agd13_000\.node-gyp\10.15.0\include\node\v8.h(2570): error C2144: syntax error : 'int' should be preceded by ';' (..\src\node-midi.cpp) [B:\Code\JavaScript\keyiano\app\node_modules\midi\build\midi.vcxproj]`

I opened the `.sln` and `.vcxproj` files in Visual Studio Express 2013 to figure out what line was wrong:

```c++
  static constexpr int kMaxLength =
	      sizeof(void*) == 4 ? (1 << 28) - 16 : (1 << 30) - 1 - 24;
```

Turns out VSE2013 doesn't know about certain C++11 features like `constexpr`. I downloaded Visual Studio 2017 Community. It was roughly a 6GB download and took maybe 8 minutes to download/install (and then I had to restart). After the restart, I did `yarn add midi` in the `app` folder and it all worked.

### Can't send unshifted characters via `robot` ([reference](https://github.com/octalmage/robotjs/issues/81))

If you find `robot.typeString("!");` not working, try `robot.keyTap("1", "shift");` instead.

Keep in mind that if you go this route, the modifier is REQUIRED, so if you just want to type a "1", then you need to do `robot.keyTap("1", "none");`.

### Everything starts, but the output from the console says the MIDI device is "MIDI Through"

Just open `./app/mainprocess_src/midiwrapper.js` and try changing the MIDI port to use from 0 to something else. Eventually, it will say "Novation Impulse" or whatever the device is that you're using.

### Can't find MIDI device on Windows

My USB has been flaky, so if Device Manager doesn't show the Impulse under "Other devices", then try a different port or not having an extension cord.
