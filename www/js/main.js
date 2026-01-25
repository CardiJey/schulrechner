let changelog_visible = false
let version;
let versionCode;
let selected_design
let design_list
let userLang = navigator.language || navigator.userLanguage;
let is_electron = isElectron()
let shell
if(is_electron){
    shell = require("electron").shell;
}

import_custom_math(math)

let global_logic_vars = {
    "active_input_handler": undefined,
    "next_align_id": 0,
    "next_subres_id": 0,
    "math_engine": math,
    "input_history": [],
    "mode_maps": {},
    "prefer_decimals": false,
    "calc_mode": "COMP",
    "rounding_mode": "Norm_1",
    "angle_mode": "Deg",
    "subres_functions" : {},
    "turn_off_close": false
}

class UI{
    constructor(global_logic_vars){
        this.global_logic_vars = global_logic_vars
        this.userLang = userLang
    }

    async fetchChangelog(fdroid) {
        const langsToTry = [];
        // Normalize language code (e.g., en_US → en-US)
        const normalizedLang = userLang.replace('_', '-');
        
        // Break apart lang subtags (e.g., 'en-GB' → ['en-GB', 'en'])
        if (normalizedLang.includes('-')) {
            langsToTry.push(normalizedLang);
            langsToTry.push(normalizedLang.split('-')[0]);
        } else {
            langsToTry.push(normalizedLang);
        }
        
        // Always fall back to 'en-US'
        if (!langsToTry.includes('en-US')) {
            langsToTry.push('en-US');
        }
        if(!fdroid){
            langsToTry.push("commit_messages")
        }
        
        for (const lang of langsToTry) {
            const url = `changelog/${lang}.txt`;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    let text = await response.text();

                    const lines = text.trim().split("\n");
            
                    const changelog_content = document.getElementById("changelog-content")
                    for(let line_index = 0; line_index < lines.length; line_index++){
                        let line = lines[line_index]
                        line = line.replaceAll("- - ","- ")
                        let line_class;

                        if(line.startsWith("- Feature: ")){
                            line_class = "changelog-feature"
                        }else if(line.startsWith("- Bugfix: ")){
                            line_class = "changelog-bugfix"
                        }else if(line.startsWith("- Tweak: ")){
                            line_class = "changelog-tweak"
                        }

                        let line_element = document.createElement("span")
                        if(line_class){
                            line_element.classList.add(line_class)
                        }
                        line_element.innerText = line
                        changelog_content.appendChild(line_element)
                    }
                    return
                }
            } catch (err) {
            // ignore and try next
            }
        }
        
        throw new Error('No changelog available in any language.');
    }

    toggle_changelog(){
        changelog_visible = !changelog_visible
        if(changelog_visible){
            document.getElementById("changelog").style.visibility = "visible"
        }else{
            document.getElementById("changelog").style.visibility = "hidden"
        }
    }

    setRootFontSize(size) {
        document.documentElement.style.fontSize = size + 'px';
    }

    handle_resize(){
        this.setRootFontSize(document.querySelector('[inkscape\\3a label="display_output"]').getBoundingClientRect().height * 0.034506 * 16.91331 / 2)
        this.global_logic_vars.active_input_handler.update_position()
    }

    vertical_align_elements() {
        // Step 1: Collect all the elements
        let alignRightElements = [...document.querySelectorAll('[class*="alignRight"]')];

        // Step 2: Sort them based on the 'align_id' in descending order
        alignRightElements.sort((a, b) => {
            const aId = a.className.match(/alignRight(\d+)/)[1];
            const bId = b.className.match(/alignRight(\d+)/)[1];
            return bId - aId;  // Sorting in descending order
        });

        // Step 3: Process each element after sorting
        alignRightElements.forEach(el => {
            let align_id = el.className.match(/alignRight(\d+)/)[1];
            let align_left_el = document.getElementsByClassName("alignLeft" + align_id)[0];
            let align_left_rect = align_left_el.getBoundingClientRect()

            let right_y = el.getBoundingClientRect().top;
            let left_y = align_left_rect.top + align_left_rect.height / 2;

            let y_shift = right_y - left_y;

            el.parentElement.style.verticalAlign = `calc(${y_shift}px + 0.06rem)`;
        });

        this.scale_height_elements()
    }

    scale_height_elements() {
        let scale_height_elements = [...document.querySelectorAll('[class*="scale_height"]')];

        scale_height_elements.forEach(el => {
            let parent_element = el.parentElement
            let parent_rect = parent_element.getBoundingClientRect()
            let this_rect = el.getBoundingClientRect()

            let factor = parent_rect.height / this_rect.height

            el.style.transform = "scaleY(" + factor + ")";
        });
    }

    toggle_indicators(modes){
        for(let mode in modes){
            if(modes[mode]){
                document.querySelector('[inkscape\\3a label="indicator_' + mode + '"]').style.visibility = "visible"
            }else{
                document.querySelector('[inkscape\\3a label="indicator_' + mode + '"]').style.visibility = "hidden"
            }
        }
    }

    scroll_element(this_element){
        let cursor_x = document.getElementsByClassName("cursor")[0].getBoundingClientRect().right
        let scroll_border_x = document.querySelector('[inkscape\\3a label="scroll_x_border"]').getBoundingClientRect().left
        let x_dist_to_scroll_border = cursor_x - scroll_border_x

        let cursor_y_bot = document.getElementsByClassName("cursor")[0].getBoundingClientRect().bottom
        let scroll_border_y = document.querySelector('[inkscape\\3a label="scroll_y_border"]').getBoundingClientRect().top
        let y_dist_to_scroll_border = cursor_y_bot - scroll_border_y

        this_element.scrollBy(x_dist_to_scroll_border,y_dist_to_scroll_border)
    }

    align_element(displayElement, mathElement) {
        const rect = displayElement.getBoundingClientRect();
        mathElement.style.position = "absolute";
        mathElement.style.left = `${rect.left}px`;
        mathElement.style.top = `${rect.top}px`;
        mathElement.style.width = `${rect.width}px`;
        mathElement.style.height = `${rect.height}px`;
    }

    set_calc_mode(calc_mode){
        localStorage.setItem("calcMode", calc_mode);
        location.reload();
    }

    set_setup_setting(setting){
        switch(setting){
            case "Fix_0":
            case "Fix_1":
            case "Fix_2":
            case "Fix_3":
            case "Fix_4":
            case "Fix_5":
            case "Fix_6":
            case "Fix_7":
            case "Fix_8":
            case "Fix_9":
            case "Norm_1":
            case "Norm_2":
                localStorage.setItem("roundingMode", setting);
                location.reload();
            break;

            case "Deg":
            case "Rad":
            case "Gra":
                localStorage.setItem("angleMode", setting);
                location.reload();
            break;
        }
        
    }

    reload_app(){
        location.reload();
    }

    close_app(){
        window.close()
    }
}

let ui = new UI(global_logic_vars)

async function fetch_version(){
    let res = await fetch("version.txt")
    let text = await res.text()
    version = text.trim()

    document.getElementById("version").innerText = "What's new in " + version + "?";
    document.getElementById("version-small").innerText = version;
    ui.fetchChangelog(version.endsWith(".0"))
}

async function fetch_versionCode(){
    let res = await fetch("versionCode.txt")
    let text = await res.text()
    versionCode = text.trim()

    const lastSeenVersionCode = localStorage.getItem("lastSeenVersionCode");
    if (lastSeenVersionCode !== versionCode) {
        ui.toggle_changelog(); // Show changelog automatically
        localStorage.setItem("lastSeenVersionCode", versionCode);
    }
}

async function fetch_design_list(){
    let res = await fetch("img/gui/list.json")
    let text = await res.text()
    design_list = JSON.parse(text)

    if(design_list.length > 1){
        design_list.forEach(design => {
            const design_option_div = document.createElement("div")
            design_option_div.classList.add("design-option")
            design_option_div.id = "design_" + design
            const preview_img = document.createElement("img")
            preview_img.src = "img/gui/" + design + ".svg"
            design_option_div.appendChild(preview_img)
            const name_label_div = document.createElement("div")
            name_label_div.classList.add("design-name-label")
            let design_name = design.split("_by_")[0]
            name_label_div.innerText = design_name
            design_option_div.appendChild(name_label_div)
            const author_label_div = document.createElement("div")
            author_label_div.classList.add("design-author-label")
            let design_author_name = design.split("_by_")[1]
            author_label_div.innerText = "by " + design_author_name
            design_option_div.appendChild(author_label_div)
            document.getElementById("design-select").appendChild(design_option_div)
        });
    }else{
        document.getElementById("design-select-label").style.display = "none"
        document.getElementById("design-select").style.display = "none"
    }
}

async function fetch_mode_maps(design){
    let res = await fetch("img/gui/" + design + ".json")
    let text = await res.text()
    let json_res = JSON.parse(text)
    global_logic_vars.mode_maps = json_res.mode_maps
    document.getElementById("math-input").style.color = json_res.font_color
    document.getElementById("math-output").style.color = json_res.font_color
}

document.addEventListener("DOMContentLoaded", async () => {    
    await fetch_version()
    await fetch_versionCode()
    await fetch_design_list()

    const display = document.getElementById("display");
    const svgContainer = document.getElementById("svg-container");

    selected_design = localStorage.getItem("selectedDesign")
    if (!selected_design || !design_list.includes(selected_design)) {
        selected_design = "Classic_by_Joris Yidong Scholl"
    }

    await fetch_mode_maps(selected_design)

    // Load the SVG dynamically
    fetch("img/gui/" + selected_design + ".svg")
        .then(response => response.text())
        .then(data => {
            svgContainer.innerHTML = data;

            let decimal_separator = localStorage.getItem("decimalFormat")
            if (!decimal_separator) {
                decimal_separator = getDecimalSeparator()
            }
            document.getElementById("decimal-format-select").value = decimal_separator;

            global_logic_vars.prefer_decimals = (localStorage.getItem("preferDecimal") === "true")
            document.getElementById("prefer-decimal-input").checked = (localStorage.getItem("preferDecimal") === "true")

            global_logic_vars.turn_off_close = (localStorage.getItem("turnOffClose") === "true")
            document.getElementById("turn-off-close").checked = (localStorage.getItem("turnOffClose") === "true")

            let calc_mode = localStorage.getItem("calcMode")
            if (calc_mode) {
                global_logic_vars.calc_mode = calc_mode
            }
            switch(calc_mode){
                case "CMPLX":
                    document.querySelector('[inkscape\\3a label="indicator_cmplx"]').style.visibility = "visible"
                break
            }

            let rounding_mode = localStorage.getItem("roundingMode")
            if (rounding_mode) {
                global_logic_vars.rounding_mode = rounding_mode
            }
            switch(rounding_mode){
                case "Fix_0":
                case "Fix_1":
                case "Fix_2":
                case "Fix_3":
                case "Fix_4":
                case "Fix_5":
                case "Fix_6":
                case "Fix_7":
                case "Fix_8":
                case "Fix_9":
                    document.querySelector('[inkscape\\3a label="indicator_fix"]').style.visibility = "visible"
                break
            }

            let angle_mode = localStorage.getItem("angleMode")
            if (angle_mode) {
                global_logic_vars.angle_mode = angle_mode
            }
            switch(angle_mode){
                case "Deg":
                    document.querySelector('[inkscape\\3a label="indicator_deg"]').style.visibility = "visible"
                break

                case "Rad":
                    document.querySelector('[inkscape\\3a label="indicator_rad"]').style.visibility = "visible"
                break

                case "Gra":
                    document.querySelector('[inkscape\\3a label="indicator_gra"]').style.visibility = "visible"
                break
            }

            if(design_list.length > 1){
                document.getElementById("design_" + selected_design).classList.add("design-selected")
            }

            if(decimal_separator == "."){
                userLang = "en-US"
            }else{
                userLang = "de-DE"
            }

            const lang_specific_elements = document.querySelectorAll('[inkscape\\3a label$="' + userLang + '"]');

            lang_specific_elements.forEach(element => {
                element.style.display = "inline"
            });

            new EquationSelectInputHandler(
                document.querySelector('[inkscape\\3a label="display_input"]'),
                document.getElementById("math-input"),
                document.querySelector('[inkscape\\3a label="display_output"]'),
                document.getElementById("math-output"),
                global_logic_vars,
                ui,
                userLang
            );
            ui.handle_resize()
            setTimeout(ui.handle_resize.bind(ui),1000)
            attachEventListeners();
        })
        .catch(error => console.error("Error loading SVG:", error));

    function attachEventListeners() {
        const designElements = document.querySelectorAll('.design-option')

        designElements.forEach(element => {
            element.addEventListener("pointerdown", function (e) {
                const design = e.currentTarget.id.substring("design_".length);
                localStorage.setItem("selectedDesign", design);
                location.reload();
            });
        });
        
        const keyElements = document.querySelectorAll('[inkscape\\3a label^="key_"]');

        keyElements.forEach(element => {
            element.addEventListener("pointerdown", function () {
                let input_code = this.getAttribute('inkscape:label')
                let key_code = input_code.substring("key_".length)
                let label_background_name = "label_background_" + key_code
                let label_background = document.querySelectorAll('[inkscape\\3a label="' + label_background_name + '"]');
                if(label_background.length != 0){
                    label_background[0].classList.add("pressed");
                    setTimeout(() => label_background[0].classList.remove("pressed"), 150);
                }
                global_logic_vars.input_history.push(input_code)
                global_logic_vars.active_input_handler.handle(input_code);
            });
        });
        window.addEventListener('resize', ui.handle_resize.bind(ui))
        document.getElementById("changelog").addEventListener('pointerdown', ui.toggle_changelog.bind(ui))
        document.getElementById("version-small").addEventListener('pointerdown', ui.toggle_changelog.bind(ui))
        document.getElementById("open-settings-btn").addEventListener('pointerdown', () => {
            document.getElementById("settings-menu").classList.toggle("hidden");
        })
        document.getElementById("close-settings-btn").addEventListener('pointerdown', () => {
            document.getElementById("settings-menu").classList.toggle("hidden");
        })
        document.getElementById("decimal-format-select").addEventListener("change", () => {
            const format = document.getElementById("decimal-format-select").value;
            localStorage.setItem("decimalFormat", format);
            location.reload();
        });
        document.getElementById("prefer-decimal-input").addEventListener("change", () => {
            global_logic_vars.prefer_decimals = document.getElementById("prefer-decimal-input").checked
            localStorage.setItem("preferDecimal", global_logic_vars.prefer_decimals);
        });
        document.getElementById("turn-off-close").addEventListener("change", () => {
            global_logic_vars.turn_off_close = document.getElementById("turn-off-close").checked
            localStorage.setItem("turnOffClose", global_logic_vars.turn_off_close);
        });
        if("cordova" in window){
            let a_elements = document.querySelectorAll("a")
            a_elements.forEach(a_element => {
                a_element.addEventListener("pointerdown", function (e) {
                    var url = e.currentTarget.href;
                    if (url.indexOf('http://') !== -1 || url.indexOf('https://') !== -1) {
                        e.preventDefault();
                        cordova.InAppBrowser.open(url, '_system', 'hidden=yes,location=no');
                        return false
                    }
                });
                a_element.addEventListener("click", function (e) {
                    e.preventDefault();
                });
            });
        }else if(is_electron){
            let a_elements = document.querySelectorAll("a")
            a_elements.forEach(a_element => {
                a_element.addEventListener("pointerdown", function (e) {
                    var url = e.currentTarget.href;
                    if (url.indexOf('http://') !== -1 || url.indexOf('https://') !== -1) {
                        e.preventDefault();
                        shell.openExternal(url, '_blank');
                        return false
                    }
                });
                a_element.addEventListener("click", function (e) {
                    e.preventDefault();
                });
            });
        }
        document.addEventListener("keydown",function(e){
            let key = e.key
            switch(key){
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                case "+":
                case "-":
                case "(":
                case ")":
                    global_logic_vars.active_input_handler.handle("key_" + key)
                    break;

                case "*":
                    global_logic_vars.active_input_handler.handle("key_x")
                    break;

                case "/":
                    global_logic_vars.active_input_handler.handle("key_÷")
                    break;

                case "Enter":
                    global_logic_vars.active_input_handler.handle("key_=")
                    break;

                case "Delete":
                case "Backspace":
                    global_logic_vars.active_input_handler.handle("key_del")
                    break;

                case "Dead":
                    global_logic_vars.active_input_handler.handle("key_pown")
                    break;

                case "Tab":
                case " ":
                    e.preventDefault()
                    global_logic_vars.active_input_handler.handle("key_ac")
                    break;

                case "x":
                case "X":
                    global_logic_vars.active_input_handler.handle("key_uservar_X")
                    break;

                case ".":
                case ",":
                    global_logic_vars.active_input_handler.handle("key_comma")
                    break;

                case "ArrowLeft":
                    global_logic_vars.active_input_handler.handle("key_dir0")
                    break;

                case "ArrowDown":
                    global_logic_vars.active_input_handler.handle("key_dir1")
                    break;

                case "ArrowRight":
                    global_logic_vars.active_input_handler.handle("key_dir2")
                    break;

                case "ArrowUp":
                    global_logic_vars.active_input_handler.handle("key_dir3")
                    break;

                case "Home":
                    global_logic_vars.active_input_handler.handle("key_mode")
                    break;

                case "F1":
                    global_logic_vars.active_input_handler.handle("key_shift")
                    break;

                case "F2":
                    global_logic_vars.active_input_handler.handle("key_alpha")
                    break;

                case "F3":
                    global_logic_vars.active_input_handler.handle("key_mode")
                    break;

                case "F4":
                    global_logic_vars.active_input_handler.handle("key_on")
                    break;
            }
        })
    }
});

function decodeHTMLEntities(str) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
}

function log_calculation(){
    console.log({
        "userLang":userLang,
        "name":"INSERT_TEST_NAME",
        "input_history":global_logic_vars.input_history,
        "rendered_input":decodeHTMLEntities(global_logic_vars.active_input_handler.math_input_element.innerHTML),
        "rendered_output":decodeHTMLEntities(global_logic_vars.active_input_handler.math_output_element.innerHTML),
        "calc_mode": global_logic_vars.calc_mode,
        "rounding_mode": global_logic_vars.rounding_mode,
        "turn_off_close": global_logic_vars.turn_off_close
    })
}

function isElectron() {
    // Renderer process
    if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
        return true;
    }

    // Main process
    if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
        return true;
    }

    // Detect the user agent when the `nodeIntegration` option is set to true
    if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
        return true;
    }

    return false;
}