/*
Total Workflow of using the Schulrechner:

UI loads -> pointer_events assigned to keys -> 
pointerdown event on key -> key input_code sent to handle function of input_handler -> input_handler builds math.js string -> 
math.js evaluates string -> input_handler creates rendered_input and rendered_output -> set as innerHTML of display elements ->
CSS styles input and results

What does this test test?
Everything from the call of the handle function of the input_handler to setting the innerHTML of the display
*/

const { test, describe } = require('node:test');
const assert = require('node:assert');
const math = require('../www/js/math.js');
const mode_maps = require('../www/img/gui/Classic_by_Joris Yidong Scholl.json').mode_maps
const fs = require('fs');

function read_test_json_dir(test_json_dir){
    let out = []
    fs.readdirSync(test_json_dir).forEach(file => {
        if(file.endsWith(".json")){
            file_content = fs.readFileSync(test_json_dir + "/" + file)
            const test_json = JSON.parse(file_content); 
            if(Array.isArray(test_json)){
                out = out.concat(test_json)
            }else{
                out.push(test_json)
            }
        }
    });
    return(out)
}

const { VoidInputHandler, EquationSelectInputHandler, import_custom_math } = require('../www/js/logic')

import_custom_math(math)

class Dummy_Element{
    constructor(){
        this.innerHTML = ""
    }
    scroll(x,y){}
}

class Dummy_UI{
    constructor(global_logic_vars,userLang){
        this.global_logic_vars = global_logic_vars
        this.userLang = userLang
    }
    async fetchChangelog(fdroid){}
    toggle_changelog(){}
    setRootFontSize(size){}
    handle_resize(){}
    reload_app(){
        this.global_logic_vars.active_input_handler = init_test_input_handler(this.global_logic_vars, this, this.userLang)
    }
    close_app(){
        this.global_logic_vars.active_input_handler = init_test_input_handler(this.global_logic_vars, this, this.userLang, true)
    }
    vertical_align_elements() {}
    toggle_indicators(modes){}
    scroll_element(this_element){}
    align_element(displayElement, mathElement){}
}

function init_test_input_handler(global_logic_vars, dummy_ui, userLang, app_closed = false){
    let dummy_display_input_element = new Dummy_Element()
    let dummy_math_input_element = new Dummy_Element()
    let dummy_display_output_element = new Dummy_Element()
    let dummy_math_output_element = new Dummy_Element()

    if(app_closed){
        return new VoidInputHandler(dummy_display_input_element, dummy_math_input_element, dummy_display_output_element, dummy_math_output_element, global_logic_vars, dummy_ui, userLang)
    }else{
        return new EquationSelectInputHandler(dummy_display_input_element, dummy_math_input_element, dummy_display_output_element, dummy_math_output_element, global_logic_vars, dummy_ui, userLang)
    }
}

function eval_input_history(input_history,userLang,prefer_decimals=false,calc_mode="COMP",rounding_mode="Norm_1",angle_mode="Deg",turn_off_close=false){
    let global_logic_vars = {
        "active_input_handler": undefined,
        "next_align_id": 0,
        "next_subres_id": 0,
        "math_engine": math,
        "mode_maps": mode_maps,
        "prefer_decimals": prefer_decimals,
        "calc_mode": calc_mode,
        "rounding_mode": rounding_mode,
        "angle_mode": angle_mode,
        "subres_functions": {},
        "turn_off_close": turn_off_close
    }

    let dummy_ui = new Dummy_UI(global_logic_vars,userLang)

    global_logic_vars.active_input_handler = init_test_input_handler(global_logic_vars, dummy_ui, userLang)

    for(input_index = 0; input_index < input_history.length; input_index++){
        const input_code = input_history[input_index]

        global_logic_vars.active_input_handler.handle(input_code)
    }

    return [
        global_logic_vars.active_input_handler.math_input_element.innerHTML,
        global_logic_vars.active_input_handler.math_output_element.innerHTML
    ]
}

// You can get the expected test results and inputs by running:
// {"name":"INSERT_TEST_NAME","input_history":global_logic_vars.active_input_handler.equations[global_logic_vars.active_input_handler.equations.length - 1].input_code_history,"rendered_input":global_logic_vars.active_input_handler.math_input_element.innerHTML,"rendered_output":global_logic_vars.active_input_handler.math_output_element.innerHTML}
// in the developer console of the browser version of the Schulrechner.

const tests = read_test_json_dir("tests/input_to_output_jsons")
const known_to_fail_tests = read_test_json_dir("tests/input_to_output_jsons/known_to_fail")

function run_test_json(this_test){
    let this_userLang = this_test.userLang
    let this_prefer_decimals = false
    if("prefer_decimals" in this_test){
        this_prefer_decimals = this_test.prefer_decimals
    }
    let this_turn_off_close = false
    if("turn_off_close" in this_test){
        this_turn_off_close = this_test.turn_off_close
    }

    let this_calc_mode = "COMP"
    if("calc_mode" in this_test){
        this_calc_mode = this_test.calc_mode
    }

    let this_rounding_mode = "Norm_1"
    if("rounding_mode" in this_test){
        this_rounding_mode = this_test.rounding_mode
    }

    let this_angle_mode = "Deg"
    if("angle_mode" in this_test){
        this_angle_mode = this_test.angle_mode
    }

    let rendered_input = this_test.rendered_input.replaceAll("\"","'").replace(/\s*style='[^']*'/g, '')
    let rendered_output = this_test.rendered_output.replaceAll("\"","'").replace(/\s*style='[^']*'/g, '')

    return(
        assert.deepStrictEqual(
            eval_input_history(this_test.input_history,this_userLang,this_prefer_decimals,this_calc_mode,this_rounding_mode,this_angle_mode,this_turn_off_close),
            [rendered_input,rendered_output]
        )
    )
}

describe(`⚙️ Automated Tests`, () => {
    for(let test_index = 0; test_index < tests.length; test_index++){
        let this_test = tests[test_index]

        test(this_test.name, (t) => {
            run_test_json(this_test)
        })
    }
    for(let test_index = 0; test_index < known_to_fail_tests.length; test_index++){
        let this_test = known_to_fail_tests[test_index]

        test.todo(this_test.name, (t) => {
            run_test_json(this_test)
        })
    }
})