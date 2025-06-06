let changelog_visible = false
let version;
let versionCode;
let userLang = navigator.language || navigator.userLanguage;

let global_logic_vars = {
    "active_input_handler": undefined,
    "next_align_id": 0,
    "next_subres_id": 0,
    "math_engine": math
}

class UI{
    constructor(global_logic_vars){
        this.global_logic_vars = global_logic_vars
    }

    async fetchChangelog(fdroid) {
        const langsToTry = [];
        if(fdroid){
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
        }else{
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
        this.setRootFontSize(document.getElementById("layer1").getBoundingClientRect().height * 0.034506)
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
}

let ui = new UI(global_logic_vars)

fetch("version.txt")
    .then((res) => res.text())
    .then((text) => {
        version = text.trim()

        document.getElementById("version").innerText = "What's new in " + version + "?";
        document.getElementById("version-small").innerText = version;
        ui.fetchChangelog(version.endsWith(".0"))
    })
    .catch((e) => console.error(e));

fetch("versionCode.txt")
    .then((res) => res.text())
    .then((text) => {
        versionCode = text.trim()

        const lastSeenVersionCode = localStorage.getItem("lastSeenVersionCode");
        if (lastSeenVersionCode !== versionCode) {
            ui.toggle_changelog(); // Show changelog automatically
            localStorage.setItem("lastSeenVersionCode", versionCode);
        }
    })
    .catch((e) => console.error(e));

document.addEventListener("DOMContentLoaded", () => {
    let expression = "";
    
    const display = document.getElementById("display");
    const svgContainer = document.getElementById("svg-container");

    // Load the SVG dynamically
    fetch("img/gui.svg")
        .then(response => response.text())
        .then(data => {
            svgContainer.innerHTML = data;

            new EquationSelectInputHandler(
                document.querySelector('[inkscape\\3a label="display_input"]'),
                document.getElementById("math-input"),
                document.querySelector('[inkscape\\3a label="display_output"]'),
                document.getElementById("math-output"),
                global_logic_vars,
                ui
            );
            ui.handle_resize()
            attachEventListeners();
        })
        .catch(error => console.error("Error loading SVG:", error));

    function attachEventListeners() {
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
            
                global_logic_vars.active_input_handler.handle(input_code);
            });
        });
        window.addEventListener('resize', ui.handle_resize)
        document.getElementById("changelog").addEventListener('pointerdown', ui.toggle_changelog)
        document.getElementById("version-small").addEventListener('pointerdown', ui.toggle_changelog)
    }
});

function decodeHTMLEntities(str) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
}

function log_calculation(){
    console.log({
        "name":"INSERT_TEST_NAME",
        "input_history":global_logic_vars.active_input_handler.equations[global_logic_vars.active_input_handler.equations.length - 1].input_code_history,
        "rendered_input":decodeHTMLEntities(global_logic_vars.active_input_handler.math_input_element.innerHTML),
        "rendered_output":decodeHTMLEntities(global_logic_vars.active_input_handler.math_output_element.innerHTML)
    })
}