[![Check Fastlane](https://github.com/CardiJey/schulrechner/actions/workflows/fastlane.yml/badge.svg)](https://github.com/CardiJey/schulrechner/actions/workflows/fastlane.yml)
[![NPM Tests](https://github.com/CardiJey/schulrechner/actions/workflows/npm_tests.yml/badge.svg)](https://github.com/CardiJey/schulrechner/actions/workflows/npm_tests.yml)

<table>
    <tr>
        <td>
            <a href='https://cardijey.github.io/schulrechner' class="badge-link">
                <img height='54' alt='Open in Browser' src='https://cardijey.github.io/assets/img/web_badge.png'/>
            </a> 
        </td>
        <td>
            <a href="https://f-droid.org/packages/io.cardijey.schulrechner" class="badge-link">
                <img src="https://f-droid.org/badge/get-it-on.png"
                alt="Get it on F-Droid"
                height="80">
            </a>
        </td>
        <td>
            <a href='https://flathub.org/apps/io.github.CardiJey.schulrechner' class="badge-link">
                <img height='54' alt='Get it on Flathub' src='https://flathub.org/api/badge?locale=en'/>
            </a> 
        </td>
    </tr>
</table>

# SCHULRECHNER

This is the repository for the Schulrechner App.
You can get the APK directly from the [releases](https://github.com/CardiJey/schulrechner/releases/latest/) or from [F-Droid](https://f-droid.org/packages/io.cardijey.schulrechner). You can also install the Linux-desktop version from [Flathub](https://flathub.org/apps/io.github.CardiJey.schulrechner) or just open the [web version](https://cardijey.github.io/schulrechner).
Alternatively you can build it yourself by installing [Cordova](https://cordova.apache.org/) and then running the steps in the [Github CI](https://github.com/CardiJey/schulrechner/blob/main/.github/workflows/main.yml).

# Contributing

If you want to contribute, just fork this repo and create a merge request. Please also create a quick issue with the label "Feature Request" where you describe what you plan to contribute. Maybe someone is already working on that.

For contributing new calculator designs please read the following:

### Adding New GUI Designs

This project supports multiple GUI designs, which can be switched dynamically.

To add a new GUI design:

1. **Create your SVG file**  
   - Design your GUI as a `plain` SVG file, ensuring it meets the following requirements:  
     - Use proper element `id`s matching the `id`s found in `www/img/gui/Classic_by_Joris Yidong Scholl.svg`.
     - Include polygon elements named `display_input` and `display_output`.  
     - Include elements `scroll_x_border` and `scroll_y_border` to define scrolling behavior.
     - Include the `indicator_*` elements found in `www/img/gui/Classic_by_Joris Yidong Scholl.svg`.
     - For each key element (`key_*`), include a corresponding `label_background_*` element for button press animations (these are handled by CSS).  
     - Optionally, add locale-specific labels by appending locale codes like `label_comma_de_DE` or `label_comma_en_US`. Only `de_DE` and `en_US` are supported for now.
     - Safe your SVG as a `plain` SVG. You can place your source files (for example the Inkscape SVG) in the `assets/svg-src` folder.
   - Add SVG metadata specifying **author**, **date**, and an **open-source license** (e.g., CC0, CC-BY, CC-BY-SA) for compatibility with this GPL3 project.
   - Your design should be functionally complete with all buttons drawn and given the proper `id`, even if the button in questions is not implemented in the Schulrechner yet. I'll toggle them visible once the feature is implemented.

2. **Create your JSON file**  
   - There are some additional settings needed for a working calculator design
   - Please take a look at `www/img/gui/Classic_by_Joris Yidong Scholl.json` to see what these are

3. **Create a pull request to add your SVG file to the repository**  
   - Place your GUI SVG and JSON in the `www/img/gui/` folder in a pull request. They should be named "Design Name\_by\_Author Name.svg" and ".json"

4. **I'll come test it then and we'll fix any possible errors together**

# Copyright

    https://github.com/CardiJey/schulrechner

    Copyright (C) 2026 Joris Yidong Scholl <joris.scholl@posteo.de>

    This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>. 

# Dependencies

This project uses math.js
    https://github.com/josdejong/mathjs

    Copyright (C) 2013-2026 Jos de Jong <wjosdejong@gmail.com>

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.